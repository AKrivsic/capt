import "server-only";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import { mlEnsureUsersGroup } from "@/lib/mailerlite";
import { sendTransactionalEmail } from "@/lib/email/sendTransactional";
import { authMagicLinkHtml, authMagicLinkText } from "@/lib/email/templates/authMagicLink";

// Narrow plan type (bez závislosti na @prisma/client type exportech)
type PlanEnum = "FREE" | "STARTER" | "PRO" | "PREMIUM";

function required(name: string, val: string | undefined | null): string {
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  pages: {
    // Vlastní "check your email" stránka (ponech, nebo změň dle projektu)
    verifyRequest: "/verify-request",
  },

  providers: [
    GoogleProvider({
      clientId: required("GOOGLE_CLIENT_ID", process.env.GOOGLE_CLIENT_ID),
      clientSecret: required("GOOGLE_CLIENT_SECRET", process.env.GOOGLE_CLIENT_SECRET),
      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),

    EmailProvider({
      from: required("EMAIL_FROM", process.env.EMAIL_FROM), // např. "Captioni <no-reply@auth.captioni.com>"
      maxAge: 15 * 60, // 15 minut
      async sendVerificationRequest({ identifier, url, provider }) {
        // Anti-spam: jednoduchý idempotentní lock na 30s
        type LockMap = Map<string, number>;
        const g = globalThis as unknown as { __mlock?: LockMap };
        if (!g.__mlock) g.__mlock = new Map<string, number>();
        const now = Date.now();
        const last = g.__mlock.get(identifier) ?? 0;
        if (now - last < 30_000) {
          if (process.env.NODE_ENV !== "production") {
            console.log("[EmailProvider] Skipping duplicate magic-link within 30s for", identifier);
          }
          return;
        }
        g.__mlock.set(identifier, now);

        // Odeslání přes náš Resend helper (s volitelným `from`)
        await sendTransactionalEmail({
          to: identifier,
          subject: "Your Captioni magic link ✨",
          html: authMagicLinkHtml(url),
          text: authMagicLinkText(url),
          replyTo: "support@captioni.com",
          from: provider.from, // použije EMAIL_FROM z env
        });

        if (process.env.NODE_ENV !== "production") {
          console.log("[EmailProvider] Magic link sent →", { to: identifier, from: provider.from });
        }
      },
    }),
  ],

  // Pozn.: se zapnutým PrismaAdapterem je "database" strategy OK
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        // Rozšíříme session.user o id a plan (bez any)
        type SessUser = typeof session.user & { id: string; plan: PlanEnum | null };
        const su = session.user as SessUser;
        su.id = user.id;
        su.plan = (user as { plan?: PlanEnum | null }).plan ?? null;
      }
      return session;
    },

    // Oprava double-encodingu callbackUrl v magic linku
    async redirect({ url, baseUrl }) {
      try {
        const base = new URL(baseUrl);
        const u = new URL(url, baseUrl);

        if (u.pathname.startsWith("/api/aut/callback/")) {
          return `${base.origin}/?consent=1`;
        }

        const cbRaw = u.searchParams.get("callbackUrl");
        if (cbRaw) {
          // jednorázově decode → validní absolutní URL v rámci stejného originu
          const cbOnce = decodeURIComponent(cbRaw);
          const target = new URL(cbOnce, baseUrl);
          if (target.origin === base.origin) return target.toString();
        }

        if (u.origin === base.origin) return u.toString();
        return baseUrl;
      } catch {
        return baseUrl;
      }
    },
  },

  // NextAuth events – arrow funkce kvůli parsování SWC
  events: {
    createUser: async ({ user }) => {
      try {
        if (user?.email) {
          await mlEnsureUsersGroup(user.email, user.name ?? null);
        }
      } catch (e) {
        console.error("[ML createUser]", e);
      }
    },
  },

  debug: process.env.NODE_ENV === "development",

  logger: {
    error: (...args) => console.error("[NextAuth][error]", ...args),
    warn:  (...args) => console.warn("[NextAuth][warn]", ...args),
    debug: (...args) => console.debug("[NextAuth][debug]", ...args),
  },

  secret: required("NEXTAUTH_SECRET", process.env.NEXTAUTH_SECRET),
};

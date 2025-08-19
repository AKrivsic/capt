// src/lib/auth.ts
import "server-only";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import { mlEnsureUsersGroup } from "@/lib/mailerlite";
import { sendTransactionalEmail } from "@/lib/email/sendTransactional";
import { authMagicLinkHtml, authMagicLinkText } from "@/lib/email/templates/authMagicLink";

// ✅ vlastní úzký typ pro plán (bez závislosti na @prisma/client type exportech)
type PlanEnum = "FREE" | "STARTER" | "PRO" | "PREMIUM";

function required(name: string, val: string | undefined | null): string {
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  pages: {
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
      from: required("EMAIL_FROM", process.env.EMAIL_FROM),
      maxAge: 15 * 60, // 15 minutes
      async sendVerificationRequest({ identifier, url, provider }) {
        // — Idempotentní zámek: 30 s anti-spam —
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

        await sendTransactionalEmail({
          to: identifier,
          subject: "Your Captioni magic link ✨",
          html: authMagicLinkHtml(url),
          text: authMagicLinkText(url),
          replyTo: "support@captioni.com",
        });

        if (process.env.NODE_ENV !== "production") {
          console.log("[EmailProvider] Magic link sent →", { to: identifier, from: provider.from });
        }
      },
    }),
  ],

  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        // typově bezpečně rozšíříme session.user o id a plan (bez any, bez Prisma importu)
        type SessUser = typeof session.user & { id: string; plan: PlanEnum | null };
        const su = session.user as SessUser;
        su.id = user.id;
        su.plan = (user as { plan?: PlanEnum | null }).plan ?? null;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      try {
        const base = new URL(baseUrl);
        const u = new URL(url, baseUrl);
        const cb = u.searchParams.get("callbackUrl");
        if (cb) {
          const cbUrl = new URL(cb, baseUrl);
          if (cbUrl.origin === base.origin) return cbUrl.toString();
        }
        if (u.origin === base.origin) return u.toString();
        return baseUrl;
      } catch {
        return baseUrl;
      }
    },
  },

  events: {
    async createUser({ user }) {
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

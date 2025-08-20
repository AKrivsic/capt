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

// Narrow plan type (bez závislosti na @prisma/client type exportech)
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
      from: required("EMAIL_FROM", process.env.EMAIL_FROM), // např. "Captioni <no-reply@auth.captioni.com>"
      maxAge: 30 * 60, // prodloužíme platnost na 30 min
      /**
       * Kritická část: sjednotíme identifikátor.
       * NextAuth to zavolá při CREATE i při VERIFY, takže se vždy uloží/čte totéž.
       */
      normalizeIdentifier(identifier: string) {
        try {
          // dekódujeme případné %40 apod., ořízneme, sjednotíme case
          const dec = decodeURIComponent(identifier);
          return dec.trim().toLowerCase();
        } catch {
          return identifier.trim().toLowerCase();
        }
      },

      async sendVerificationRequest({ identifier, url, provider }) {
        // ---- Idempotentní anti-spam lock (30s) ----
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

        // ---- Sanitizace magic linku: VŽDY odstraníme callbackUrl, email NEPŘEPISUJEME ----
        let safeUrl = url;
        try {
          const u = new URL(url);
          u.searchParams.delete("callbackUrl"); // eliminace INVALID_CALLBACK_URL_ERROR
          // DŮLEŽITÉ: NEPŘEPISUJ "email" – necháme hodnotu, kterou NextAuth vložil
          safeUrl = u.toString();
        } catch {
          // fallback: pošleme původní url, když by parser selhal
        }

        // ---- Odeslání e-mailu přes Resend helper ----
        await sendTransactionalEmail({
          to: identifier, // už normalizeIdentifier → lowercased/decoded
          subject: "Your Captioni magic link ✨",
          html: authMagicLinkHtml(safeUrl),
          text: authMagicLinkText(safeUrl),
          replyTo: "support@captioni.com",
          from: provider.from, // = EMAIL_FROM z env (ověřený sender v Resend)
        });

        if (process.env.NODE_ENV !== "production") {
          console.log("[EmailProvider] Magic link sent →", { to: identifier, from: provider.from, safeUrl });
        }
      },
    }),
  ],

  // Database sessions (PrismaAdapter)
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        type SessUser = typeof session.user & { id: string; plan: PlanEnum | null };
        const su = session.user as SessUser;
        su.id = user.id;
        su.plan = (user as { plan?: PlanEnum | null }).plan ?? null;
      }
      return session;
    },

    // Centrální redirect – po úspěšném callbacku vždy na "/?consent=1"
    async redirect({ url, baseUrl }) {
      try {
        const base = new URL(baseUrl);
        const u = new URL(url, baseUrl);

        if (u.pathname.startsWith("/api/auth/callback/")) {
          return `${base.origin}/?consent=1`;
        }

        if (u.origin === base.origin) return u.toString();
        return base.origin;
      } catch {
        return baseUrl;
      }
    },
  },

  // Events (arrow funkce – lepší kompatibilita se SWC)
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
    error: (...args: unknown[]) => console.error("[NextAuth][error]", ...args),
    warn:  (...args: unknown[]) => console.warn("[NextAuth][warn]", ...args),
    debug: (...args: unknown[]) => console.debug("[NextAuth][debug]", ...args),
  },

  secret: required("NEXTAUTH_SECRET", process.env.NEXTAUTH_SECRET),
};

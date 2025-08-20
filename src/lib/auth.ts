// src/lib/auth.ts
import "server-only";
import type { NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
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

// --- jednotná normalizace identifikátorů (email/identifier) ---
function normalizeId(id: string): string {
  try {
    return decodeURIComponent(id).trim().toLowerCase();
  } catch {
    return id.trim().toLowerCase();
  }
}

// --- Prisma adapter s ochranou na enkódovaný identifier ---
const base = PrismaAdapter(prisma) as Adapter;

const adapter: Adapter = {
  ...base,

  // NextAuth si ukládá verifikační token – zajistíme, že identifier je již normalized
  createVerificationToken: async (token) => {
    const t = { ...token, identifier: normalizeId(token.identifier) };
    try {
      // Bezpečné logování (neukazujeme celý token)
      console.debug("[auth][createVerificationToken]", {
        identifierRaw: token.identifier,
        identifierNorm: t.identifier,
        tokenPreview: String(token.token).slice(0, 8),
        expires: token.expires,
      });
    } catch {}
    // @ts-expect-error – typ v adapters může být volitelný, ale v PrismaAdapter je k dispozici
    return base.createVerificationToken(t);
  },

  // Při použití tokenu (klik v e-mailu) normalizeIdentifier předáme adapteru
  useVerificationToken: async (params) => {
    const p = { ...params, identifier: normalizeId(params.identifier) };
    try {
      console.debug("[auth][useVerificationToken]", {
        identifierRaw: params.identifier,
        identifierNorm: p.identifier,
        tokenPreview: String(params.token).slice(0, 8),
      });
    } catch {}
    try {
      // @ts-expect-error viz výše
      const res = await base.useVerificationToken(p);
      try {
        console.debug("[auth][useVerificationToken][result]", { found: Boolean(res) });
      } catch {}
      return res;
    } catch (e) {
      // Fallback: když by DB měla uložený už enkódovaný identifikátor (edge case)
      try {
        // @ts-expect-error viz výše
        const res2 = await base.useVerificationToken(params);
        try {
          console.debug("[auth][useVerificationToken][fallback-result]", { found: Boolean(res2) });
        } catch {}
        return res2;
      } catch {
        throw e;
      }
    }
  },

  // Pro jistotu sjednotíme i dotaz na uživatele dle e‑mailu
  getUserByEmail: async (email) => {
    const norm = normalizeId(email);
    const user = await prisma.user.findFirst({
      where: { email: { equals: norm, mode: "insensitive" } },
    });
    return user as unknown as Awaited<ReturnType<NonNullable<typeof base.getUserByEmail>>>;
  },
};

export const authOptions: NextAuthOptions = {
  adapter,
  // @ts-expect-error: available at runtime in next-auth v4, not present in our TS types
  trustHost: true,

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
      maxAge: 30 * 60, // 30 min – méně citlivé na prodlevy / link‑scannery

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

        // ---- Vytvoření BOT‑SAFE mezipřistání: místo přímého callbacku pošleme odkaz na /auth/magic ----
        // Link‑scannery často otevřou GET, čímž by spotřebovaly token. Stránka /auth/magic vyžaduje POST, který roboti typicky nespustí.
        let safeUrl = url;
        try {
          const u = new URL(url);

          // 1) Vyčistíme nepodstatné parametry
          const token = u.searchParams.get("token");
          const email = u.searchParams.get("email");
          const origin = `${u.protocol}//${u.host}`;

          // (callbackUrl případně zahodíme – redirect řešíme v NextAuth callbacks.redirect)
          u.searchParams.delete("callbackUrl");

          // 2) Sestavíme odkaz na interstitial stránku, která provede POST na NextAuth callback
          if (token && email) {
            const interstitial = new URL("/auth/magic", origin);
            interstitial.searchParams.set("token", token);
            interstitial.searchParams.set("email", email);
            safeUrl = interstitial.toString();
          } else {
            // fallback: pošleme původní url (nemělo by nastat)
            safeUrl = u.toString();
          }
        } catch {
          // fallback: pošleme původní url
        }

        // ---- Odeslání e-mailu přes Resend helper ----
        await sendTransactionalEmail({
          to: normalizeId(identifier), // posíláme už normalizovaný e‑mail
          subject: "Your Captioni magic link ✨",
          html: authMagicLinkHtml(safeUrl),
          text: authMagicLinkText(safeUrl),
          replyTo: "support@captioni.com",
          from: provider.from, // = EMAIL_FROM z env (ověřený sender v Resend)
        });

        if (process.env.NODE_ENV !== "production") {
          console.log("[EmailProvider] Magic link sent →", { to: normalizeId(identifier), from: provider.from, safeUrl });
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
    signIn: async (message) => {
      try {
        const u = message.user as { id?: string; email?: string | null };
        console.log("[NextAuth][event][signIn]", { userId: u?.id, email: u?.email, account: message.account?.provider });
      } catch {}
    },
    session: async ({ session }) => {
      try {
        console.log("[NextAuth][event][session]", { hasUser: Boolean(session?.user), userEmail: session?.user?.email ?? null });
      } catch {}
    },
  },

  // Umožní zapnout debug logy i v produkci nastavením ENABLE_AUTH_DEBUG=1
  debug: process.env.ENABLE_AUTH_DEBUG === "1" || process.env.NODE_ENV === "development",

  logger: {
    error: (...args: unknown[]) => console.error("[NextAuth][error]", ...args),
    warn:  (...args: unknown[]) => console.warn("[NextAuth][warn]", ...args),
    debug: (...args: unknown[]) => console.debug("[NextAuth][debug]", ...args),
  },

  secret: required("NEXTAUTH_SECRET", process.env.NEXTAUTH_SECRET),
};

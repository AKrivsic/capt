// src/lib/auth.ts
import "server-only";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { $Enums } from "@prisma/client";
import { prisma } from "./prisma";
import nodemailer from "nodemailer";

// Lokální typ pro sendVerificationRequest (bez implicit-any)
type VerificationParams = {
  identifier: string;
  url: string;
  provider: { from: string };
};

function required(name: string, val: string | undefined | null): string {
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  pages: {
    // signIn necháváme default (/api/auth/signin)
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
      server: {
        host: required("EMAIL_SERVER_HOST", process.env.EMAIL_SERVER_HOST),
        port: Number(process.env.EMAIL_SERVER_PORT || 2525),
        secure: false, // Mailtrap / sandbox
        auth: {
          user: required("EMAIL_SERVER_USER", process.env.EMAIL_SERVER_USER),
          pass: required("EMAIL_SERVER_PASSWORD", process.env.EMAIL_SERVER_PASSWORD),
        },
      },
      from: required("EMAIL_FROM", process.env.EMAIL_FROM), // např. no-reply@captioni.com
      maxAge: 15 * 60, // 15 min

      async sendVerificationRequest({ identifier, url, provider }: VerificationParams) {
         // --- Idempotentní zámek (60 s) pro stejný e-mail ---
  type LockMap = Map<string, number>;
  const g = globalThis as unknown as { __mlock?: LockMap };
  if (!g.__mlock) g.__mlock = new Map<string, number>();
  const now = Date.now();
  const last = g.__mlock.get(identifier) ?? 0;

  // pokud jsme posílali během posledních 60 s, přeskočíme
  if (now - last < 30_000) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[EmailProvider] Skipping duplicate magic-link within 60s for", identifier);
    }
    return;
  }
  g.__mlock.set(identifier, now);
  const { host } = new URL(url);
  const safeUrl = url.toString();

  if (process.env.NODE_ENV !== "production") {
    console.log("[EmailProvider] Preparing magic-link →", {
      to: identifier,
      url: safeUrl,
      host,
      from: provider.from,
    });
  }

  const transport = nodemailer.createTransport({
    host: required("EMAIL_SERVER_HOST", process.env.EMAIL_SERVER_HOST),
    port: Number(process.env.EMAIL_SERVER_PORT || 2525),
    secure: false,
    auth: {
      user: required("EMAIL_SERVER_USER", process.env.EMAIL_SERVER_USER),
      pass: required("EMAIL_SERVER_PASSWORD", process.env.EMAIL_SERVER_PASSWORD),
    },
  });

  await transport.verify();

  const subject = "Your Captioni magic link ✨";

  const text = [
    "Sign in to Captioni",
    "",
    "Click the link below to sign in (valid for 15 minutes):",
    safeUrl,
    "",
    "If you didn’t request this, you can ignore this email.",
    "— The Captioni Team",
  ].join("\n");

  // Brand barvy dle tvého UI: emerald #34D399, violet #8B5CF6, světle šedá #f9fafb
  const html = `
  <!doctype html>
  <html lang="en">
    <body style="margin:0;padding:24px;background:#f9fafb;color:#111;font-family:Arial,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
      <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;">
        <!-- preheader (skryté) -->
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
          Your Captioni magic link — valid for 15 minutes.
        </div>

        <div style="padding:28px 28px 20px;border-bottom:4px solid #8B5CF6;">
          <h1 style="margin:0;font-size:20px;line-height:1.3;color:#111;text-align:center;">
            ✨ Sign in to <span style="color:#8B5CF6;">Captioni</span>
          </h1>
        </div>

        <div style="padding:24px 28px 8px;">
          <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">
            Hi there 👋<br/>
            Click the button below to sign in. This link works once and expires in 15 minutes.
          </p>

          <div style="text-align:center;margin:28px 0 8px;">
            <a href="${safeUrl}" style="background:#34D399;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:8px;font-weight:700;font-size:16px;display:inline-block;">
              Sign in to Captioni
            </a>
          </div>

          <p style="margin:16px 0 0;font-size:13px;color:#555;word-break:break-all;">
            Or paste this link into your browser:<br/>
            <a href="${safeUrl}" style="color:#8B5CF6;text-decoration:underline;">${safeUrl}</a>
          </p>
        </div>

        <div style="padding:20px 28px 28px;border-top:1px solid #eee;">
          <p style="margin:0 0 8px;font-size:13px;color:#555;">
            Didn’t request this? You can safely ignore this email.
          </p>
          <p style="margin:0;font-size:13px;color:#555;">
            ❤️ The Captioni Team
          </p>
        </div>
      </div>

      <div style="text-align:center;margin-top:12px;font-size:12px;color:#888;">
        Sent to ${identifier} • ${host}
      </div>
    </body>
  </html>
  `;

  const result = await transport.sendMail({
    to: identifier,
    from: provider.from, // např. "Captioni <no-reply@captioni.com>"
    subject,
    html,
    text,
    headers: {
      "X-Entity-Ref-ID": "captioni-magic-link",
    },
    // volitelné:
    replyTo: "support@captioni.com",
  });

  if (!result.accepted || result.accepted.length === 0) {
    throw new Error("SMTP did not accept any recipients");
  }
  if (process.env.NODE_ENV !== "production") {
    console.log("[EmailProvider] Magic-link sent →", {
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
    });
  }
}

    }),
  ],

  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 dní
    updateAge: 24 * 60 * 60,   // 24 h
  },

  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        // Typy sjednocené s Prismou: plan = $Enums.Plan | null
        type SessUser = typeof session.user & { id: string; plan: $Enums.Plan | null };
        const su = session.user as SessUser;

        su.id = user.id;
        su.plan = (user as { plan?: $Enums.Plan | null }).plan ?? null;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      try {
        const base = new URL(baseUrl);
        const u = new URL(url, baseUrl);

        // 1) Respektuj callbackUrl v query (např. "/?consent=1")
        const cb = u.searchParams.get("callbackUrl");
        if (cb) {
          const cbUrl = new URL(cb, baseUrl);
          if (cbUrl.origin === base.origin) return cbUrl.toString();
        }

        // 2) Povolit jen stejné origin
        if (u.origin === base.origin) return u.toString();

        // 3) Fallback
        return baseUrl;
      } catch {
        return baseUrl;
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

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
        const { host } = new URL(url);

        if (process.env.NODE_ENV !== "production") {
          console.log("[EmailProvider] Preparing message →", {
            to: identifier,
            url,
            host,
            from: provider.from,
            smtp: {
              host: process.env.EMAIL_SERVER_HOST,
              port: Number(process.env.EMAIL_SERVER_PORT || 2525),
              secure: false,
              user: process.env.EMAIL_SERVER_USER ? "SET" : "MISSING",
            },
          });
        }

        const transport = nodemailer.createTransport({
          host: process.env.EMAIL_SERVER_HOST,
          port: Number(process.env.EMAIL_SERVER_PORT || 2525),
          secure: false,
          auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
          },
        });

        await transport.verify().then(
          () => {
            if (process.env.NODE_ENV !== "production") {
              console.log("[EmailProvider] SMTP verify → OK");
            }
          },
          (e) => {
            console.error("[EmailProvider] SMTP verify → FAILED", e);
            throw e;
          }
        );

        const result = await transport.sendMail({
          to: identifier,
          from: provider.from,
          subject: `Sign in to ${host}`,
          text: `Sign in to ${host}\n${url}\n`,
          html: `
            <div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial">
              <p>Click to sign in to <b>${host}</b>:</p>
              <p><a href="${url}">${url}</a></p>
            </div>
          `,
        });

        if (process.env.NODE_ENV !== "production") {
          console.log("[EmailProvider] Sent result →", {
            messageId: result.messageId,
            accepted: result.accepted,
            rejected: result.rejected,
            response: result.response,
          });
        }
        if (!result.accepted || result.accepted.length === 0) {
          throw new Error("SMTP did not accept any recipients");
        }
      },
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

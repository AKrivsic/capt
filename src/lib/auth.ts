// lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import nodemailer from "nodemailer";

// Lokální typ pro sendVerificationRequest (aby nebyly implicit-any chyby)
type VerificationParams = {
  identifier: string;
  url: string;
  provider: { from: string };
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  pages: {
    // signIn stránku nechávám na default (/api/auth/signin), ať nepadáš na 404
    verifyRequest: "/verify-request",
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
        host: process.env.EMAIL_SERVER_HOST!,                 // sandbox.smtp.mailtrap.io
        port: Number(process.env.EMAIL_SERVER_PORT || 2525),  // Mailtrap preferuje 2525
        secure: false,                                        // důležité pro sandbox
        auth: {
          user: process.env.EMAIL_SERVER_USER!,
          pass: process.env.EMAIL_SERVER_PASSWORD!,
        },
      },
      from: process.env.EMAIL_FROM!,                          // např. no-reply@captioni.com
      maxAge: 15 * 60,

      async sendVerificationRequest({
        identifier,
        url,
        provider,
      }: VerificationParams) {
        const { host } = new URL(url);

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

        const transport = nodemailer.createTransport({
          host: process.env.EMAIL_SERVER_HOST,
          port: Number(process.env.EMAIL_SERVER_PORT || 2525),
          secure: false,
          auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
          },
        });

        // Ověř SMTP spojení – když selže, hned uvidíš důvod v konzoli
        await transport.verify().then(
          () => console.log("[EmailProvider] SMTP verify → OK"),
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

        console.log("[EmailProvider] Sent result →", {
          messageId: result.messageId,
          accepted: result.accepted,
          rejected: result.rejected,
          response: result.response,
        });

        if (!result.accepted || result.accepted.length === 0) {
          throw new Error("SMTP did not accept any recipients");
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
      session.user.id = user.id;
      session.user.plan = user.plan ?? null;
    }
    return session;
  },
  async redirect({ url, baseUrl }) {
    if (url.startsWith(baseUrl)) return "/"; // 👈 sem
    if (url.startsWith("/")) return "/";     // 👈 sem
    return baseUrl;
  },
},

  debug: process.env.NODE_ENV === "development",
  logger: {
    error: (...args) => console.error("[NextAuth][error]", ...args),
    warn:  (...args) => console.warn("[NextAuth][warn]", ...args),
    debug: (...args) => console.debug("[NextAuth][debug]", ...args),
  },

  secret: process.env.NEXTAUTH_SECRET,
};

import crypto from "crypto";
import { prisma } from "@/lib/prisma";

function nowPlusHours(h: number): Date {
  return new Date(Date.now() + h * 60 * 60 * 1000);
}

export async function issueEmailChangeToken(userId: string, newEmail: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const identifier = `email-change:${userId}:${newEmail}`;
  await prisma.verificationToken.create({
    data: {
      identifier,
      token,
      expires: nowPlusHours(24),
    },
  });
  return token;
}

export type ConsumedEmailChange = { userId: string; newEmail: string };

export async function consumeEmailChangeToken(token: string): Promise<ConsumedEmailChange | null> {
  const rec = await prisma.verificationToken.findUnique({ where: { token } });
  if (!rec || rec.expires < new Date()) return null;

  // rozparsovat identifier
  const [scope, userId, newEmail] = rec.identifier.split(":");
  if (scope !== "email-change" || !userId || !newEmail) return null;

  await prisma.verificationToken.delete({ where: { token } });
  return { userId, newEmail };
}

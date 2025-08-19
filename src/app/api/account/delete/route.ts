// src/app/api/account/delete/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendAccountDeletionConfirm } from "@/lib/email/senders";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !session.user.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // soft-delete flag
  await prisma.user.update({
    where: { id: session.user.id },
    data: { deletedAt: new Date() },
  });

  await sendAccountDeletionConfirm(session.user.email, new Date().toISOString());
  return NextResponse.json({ ok: true });
}

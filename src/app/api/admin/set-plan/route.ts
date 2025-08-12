import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function POST(req: Request) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId, plan } = await req.json();
  if (!userId || !plan) {
    return NextResponse.json({ error: "Missing userId or plan" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { plan },
    select: { id: true, email: true, plan: true },
  });

  return NextResponse.json({ ok: true, user: updated });
}

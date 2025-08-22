import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { mlEnsureUsersGroup, mlSetPlanGroup } from "@/lib/mailerlite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({ select: { email: true, name: true } });
  let ok = 0;
  const errors: Array<{ email: string | null; error: string }> = [];

  for (const u of users) {
    try {
      if (!u.email) continue;
      await mlEnsureUsersGroup(u.email, u.name ?? null);
      try { await mlSetPlanGroup(u.email, "free"); } catch {}
      ok++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push({ email: u.email ?? null, error: msg });
    }
  }

  return NextResponse.json({ ok: true, processed: users.length, succeeded: ok, failed: errors.length, errors });
}



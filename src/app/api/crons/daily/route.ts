import { NextResponse } from "next/server";
import { runNoGen24h } from "@/server/cron/noGen24h";
import { runResetUsage } from "@/server/cron/resetUsage";
import { runCleanupR2 } from "@/server/cron/cleanupR2";

/**
 * Daily cron job orchestrator
 * 
 * Spouští se denně v 07:00 UTC přes Vercel cron
 * Provádí tři hlavní úkoly:
 * 1. noGen24h - Označí uživatele bez aktivity 24h pro MailerLite
 * 2. resetUsage - Resetuje denní limity pro FREE plán
 * 3. cleanupR2 - Maže staré soubory a joby z databáze
 * 
 * Authorization: Bearer token s CRON_SECRET
 */
function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // Development fallback
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  return token === secret;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};
  let ok = true;

  console.info("[cron:daily] start");

  try {
    const r1 = await runNoGen24h();
    results["noGen24h"] = r1;
    if (!r1.ok) ok = false;
  } catch (err) {
    console.error("[cron:daily] noGen24h error:", err);
    results["noGen24h"] = { ok: false, meta: { error: String(err) } };
    ok = false;
  }

  try {
    const r2 = await runResetUsage();
    results["resetUsage"] = r2;
    if (!r2.ok) ok = false;
  } catch (err) {
    console.error("[cron:daily] resetUsage error:", err);
    results["resetUsage"] = { ok: false, meta: { error: String(err) } };
    ok = false;
  }

  try {
    const r3 = await runCleanupR2();
    results["cleanupR2"] = r3;
    if (!r3.ok) ok = false;
  } catch (err) {
    console.error("[cron:daily] cleanupR2 error:", err);
    results["cleanupR2"] = { ok: false, meta: { error: String(err) } };
    ok = false;
  }

  console.info("[cron:daily] done", { ok });

  return NextResponse.json({ ok, results }, { status: ok ? 200 : 207 });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";



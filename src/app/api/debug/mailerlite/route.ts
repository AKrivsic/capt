export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

function mask(s: string | null | undefined, visible = 6): string | null {
  if (!s) return null;
  const head = s.slice(0, visible);
  return `${head}…(${s.length})`;
}

export async function GET() {
  const key = process.env.MAILERLITE_API_KEY || null;
  const usersGroup = process.env.ML_GROUP_USERS || null;
  const marketingGroup = process.env.ML_GROUP_MARKETING || null;
  const freeGroup = process.env.ML_GROUP_PLAN_FREE || null;

  if (!key) {
    return NextResponse.json(
      {
        ok: false,
        reason: "missing_api_key",
        apiBase: "https://connect.mailerlite.com/api",
        tokenPreview: null,
      },
      { status: 200 }
    );
  }

  try {
    const res = await fetch("https://connect.mailerlite.com/api/groups", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
      // short timeout via AbortController
      cache: "no-store",
    });

    const status = res.status;
    let bodyText = "";
    let groups: Array<{ id: string; name?: string | null }> | null = null;
    try {
      const parsed = (await res.json()) as Array<{ id: string; name?: string | null }>;
      if (Array.isArray(parsed)) {
        groups = parsed.map((g) => ({ id: String(g?.id), name: g?.name ?? null }));
      }
    } catch {
      try { bodyText = await res.text(); } catch { bodyText = ""; }
    }

    const usersConfigured = usersGroup ? Boolean(groups?.some((g) => g.id === usersGroup)) : null;
    const marketingConfigured = marketingGroup ? Boolean(groups?.some((g) => g.id === marketingGroup)) : null;
    const freeConfigured = freeGroup ? Boolean(groups?.some((g) => g.id === freeGroup)) : null;

    return NextResponse.json(
      {
        ok: status >= 200 && status < 300,
        status,
        tokenPreview: mask(key),
        apiBase: "https://connect.mailerlite.com/api",
        groups,
        usersGroup,
        usersConfigured,
        marketingGroup,
        marketingConfigured,
        freeGroup,
        freeConfigured,
        raw: groups ?? bodyText,
      },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        reason: "fetch_failed",
        tokenPreview: mask(key),
        error: (e as Error)?.message ?? "",
      },
      { status: 200 }
    );
  }
}



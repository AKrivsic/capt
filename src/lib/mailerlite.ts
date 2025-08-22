// src/lib/mailerlite.ts
import "server-only";

const ML_BASE = "https://connect.mailerlite.com/api";

// ===== Typy =====
type GroupId = string;
export type PlanSlug = "free" | "starter" | "pro" | "premium";

type UpsertParams = {
  email: string;
  name?: string | null;
  groups?: GroupId[];
  resubscribe?: boolean;
};

// ===== Helpers =====
function mlDebugEnabled(): boolean {
  return process.env.ML_DEBUG === "1" || process.env.NODE_ENV === "development";
}

function mlLog(label: string, payload?: unknown): void {
  if (!mlDebugEnabled()) return;
  try { console.debug(`[ML] ${label}`, payload ?? ""); } catch {}
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function apiKey(): string {
  const k = process.env.MAILERLITE_API_KEY;
  if (!k) throw new Error("Missing MAILERLITE_API_KEY");
  return k;
}

async function mlFetch(path: string, init: RequestInit & { body?: string }): Promise<Response> {
  mlLog("fetch", { path, method: init.method });
  return fetch(`${ML_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.headers || {}),
    },
  });
}

async function findSubscriberIdByEmail(email: string): Promise<string | null> {
  const url = `/subscribers?filter[email]=${encodeURIComponent(email)}`;
  // Retry a few times in case of eventual consistency (202 Accepted on upsert)
  const delays = [0, 200, 400, 800, 1200, 1600];
  for (let attempt = 0; attempt < delays.length; attempt++) {
    if (delays[attempt] > 0) await sleep(delays[attempt]);
    const res = await mlFetch(url, { method: "GET", body: undefined as unknown as string });
    mlLog("findSubscriberIdByEmail.status", { status: res.status, attempt });
    if (!res.ok) continue;
    try {
      const json = (await res.json()) as { data?: Array<{ id?: string | number; email?: string }> };
      const list = Array.isArray(json?.data) ? json.data : [];
      const found = list.find((s) => (s?.email ?? "").toLowerCase() === email.toLowerCase()) || list[0];
      const id = found?.id;
      if (id != null) return String(id);
    } catch (e) {
      mlLog("findSubscriberIdByEmail.jsonError", String(e));
    }
  }
  return null;
}

async function assignSubscriberToGroup(subscriberId: string, groupId: string): Promise<void> {
  // Primary path per docs: POST /subscribers/{subscriber_id}/groups/{group_id}
  let res = await mlFetch(`/subscribers/${subscriberId}/groups/${groupId}`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  mlLog("assignGroup.primary", { status: res.status, subscriberId, groupId });
  if (res.ok || [200, 201, 204].includes(res.status)) return;
  const primaryErr = await res.text().catch(() => "");

  // Fallback path some accounts expose: POST /groups/{group_id}/subscribers/{subscriber_id}
  res = await mlFetch(`/groups/${groupId}/subscribers/${subscriberId}`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  mlLog("assignGroup.fallback", { status: res.status, subscriberId, groupId });
  if (res.ok || [200, 201, 204].includes(res.status)) return;
  const fallbackErr = await res.text().catch(() => "");
  throw new Error(`Assign group failed: primary=${primaryErr} fallback=${fallbackErr}`);
}

// ===== API funkce =====

/**
 * Vytvoří/aktualizuje odběratele a ADITIVNĚ přidá do skupin (neodstraňuje jiné).
 */
export async function mlUpsertSubscriber(p: UpsertParams): Promise<void> {
  const body: Record<string, unknown> = {
    email: p.email,
  };
  if (p.name) {
    body.fields = { name: p.name };
  }
  // Groups will be assigned explicitly after upsert (Connect API assigns via dedicated endpoint)
  if (p.resubscribe) {
    body.resubscribe = true;
  }

  const res = await mlFetch("/subscribers", {
    method: "POST",
    body: JSON.stringify(body),
  });

  mlLog("upsert.status", { status: res.status });
  if (!res.ok) {
    const t = await res.text();
    mlLog("upsert.error", t);
    throw new Error(`MailerLite upsert failed: ${res.status} ${t}`);
  }

  // Assign groups explicitly if requested
  if (p.groups && p.groups.length > 0) {
    let subscriberId: string | null = null;
    try {
      const json = (await res.json()) as
        | { data?: { id?: string | number } }
        | { id?: string | number };
      const id = (json as { data?: { id?: string | number } })?.data?.id ?? (json as { id?: string | number })?.id;
      subscriberId = id != null ? String(id) : null;
      mlLog("upsert.jsonId", { subscriberId });
    } catch {
      subscriberId = null;
    }
    if (!subscriberId) {
      subscriberId = await findSubscriberIdByEmail(p.email);
      mlLog("upsert.lookupId", { subscriberId });
    }
    if (subscriberId) {
      for (const gid of p.groups) {
        try {
          await assignSubscriberToGroup(subscriberId, gid);
          mlLog("assignGroup.ok", { subscriberId, groupId: gid });
        } catch (e) {
          // Log and continue with other groups
          console.error("[MailerLite] assign group error", { email: p.email, groupId: gid, error: e });
        }
      }
    } else {
      mlLog("assignGroup.noSubscriberId", { email: p.email, groups: p.groups });
    }
  }
}

/** Bezpečné „přidej do skupin“ (aditivní), neodstraňuje z jiných skupin. */
export async function mlAddToGroups(email: string, groupIds: GroupId[]): Promise<void> {
  if (groupIds.length === 0) return;
  await mlUpsertSubscriber({ email, groups: groupIds });
}

/**
 * Jen zajistí zařazení do hlavní skupiny „Captioni Users“ (bez plánu).
 * Voláme po vytvoření účtu (NextAuth events.createUser).
 */
export async function mlEnsureUsersGroup(email: string, name?: string | null): Promise<void> {
  const usersId = process.env.ML_GROUP_USERS;
  if (!usersId) return;
  const freeId = process.env.ML_GROUP_PLAN_FREE;
  const groups: string[] = [usersId];
  if (freeId) groups.push(freeId);
  mlLog("ensureUsersGroup", { email, groups });
  await mlUpsertSubscriber({ email, name: name ?? null, groups });
}

/**
 * Nastaví plánovou skupinu aditivně (Starter/Pro/Premium/Free).
 * Současně vždy přidá i „Captioni Users“, aby pokryla i nákup bez Free.
 * Voláme po platbě (Stripe webhook) nebo změně plánu.
 */
export async function mlSetPlanGroup(email: string, plan: PlanSlug): Promise<void> {
  const id = {
    free: process.env.ML_GROUP_PLAN_FREE,
    starter: process.env.ML_GROUP_PLAN_STARTER,
    pro: process.env.ML_GROUP_PLAN_PRO,
    premium: process.env.ML_GROUP_PLAN_PREMIUM,
  }[plan];
  if (!id) throw new Error(`Missing ML_GROUP for plan=${plan}`);

  const usersId = process.env.ML_GROUP_USERS;
  const groups: string[] = usersId ? [id, usersId] : [id];
  mlLog("setPlanGroup", { email, plan, groups });
  await mlAddToGroups(email, groups);
}

/**
 * Eventové (usage) skupiny – jednoduchý helper.
 * NO_GEN_24H: žádná generace do 24 h od registrace
 * LOW_LEFT: zbývají <2 free generace dnes
 * LIMIT_REACHED: dosažen denní limit free
 */
export async function mlMarkEvent(
  email: string,
  key: "NO_GEN_24H" | "LOW_LEFT" | "LIMIT_REACHED"
): Promise<void> {
  const id = {
    NO_GEN_24H: process.env.ML_GROUP_EV_NO_GEN_24H,
    LOW_LEFT: process.env.ML_GROUP_EV_LOW_LEFT,
    LIMIT_REACHED: process.env.ML_GROUP_EV_LIMIT_REACHED,
  }[key];
  if (!id) return;
  await mlAddToGroups(email, [id]);
}

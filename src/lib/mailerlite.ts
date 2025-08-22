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
function apiKey(): string {
  const k = process.env.MAILERLITE_API_KEY;
  if (!k) throw new Error("Missing MAILERLITE_API_KEY");
  return k;
}

async function mlFetch(path: string, init: RequestInit & { body?: string }): Promise<Response> {
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
  if (p.groups && p.groups.length > 0) {
    body.groups = p.groups;
  }
  if (p.resubscribe) {
    body.resubscribe = true;
  }

  const res = await mlFetch("/subscribers", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`MailerLite upsert failed: ${res.status} ${t}`);
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
  await mlUpsertSubscriber({ email, name: name ?? null, groups: [usersId] });
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

  await mlAddToGroups(email, [id]);
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

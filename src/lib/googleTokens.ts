// src/lib/googleTokens.ts
import "server-only";
import { prisma } from "./prisma";

type GoogleAccount = {
  access_token: string | null;
  refresh_token: string | null;
  expires_at: number | null; // sekundy od epochy
  id_token: string | null;
};

type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  id_token?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
};

export async function getGoogleAccountByUserId(userId: string): Promise<GoogleAccount | null> {
  const acc = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: {
      access_token: true,
      refresh_token: true,
      expires_at: true,
      id_token: true,
    },
  });

  if (!acc) return null;

  // Prisma vrací přesně stejná pole jako GoogleAccount (subset), takže jen vrátíme.
  return {
    access_token: acc.access_token,
    refresh_token: acc.refresh_token,
    expires_at: acc.expires_at,
    id_token: acc.id_token,
  };
}

function readString(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key];
  return typeof v === "string" ? v : undefined;
}
function readNumber(obj: Record<string, unknown>, key: string): number | undefined {
  const v = obj[key];
  return typeof v === "number" ? v : undefined;
}

async function refreshGoogleAccessToken(refreshToken: string) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error("Missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET");
  }

  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 8000);
  let res: Response;
  try {
    res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(t);
  }

  // Bez `any`: načti jako unknown a bezpečně vyzob klíče
  let dataUnknown: unknown = null;
  try {
    dataUnknown = await res.json();
  } catch {
    // ignore
  }
  const dataObj = (dataUnknown && typeof dataUnknown === "object" ? (dataUnknown as Record<string, unknown>) : {}) as Record<string, unknown>;

  // Chybová hláška (když status != 2xx)
  if (!res.ok) {
    const err =
      readString(dataObj, "error") ||
      readString(dataObj, "error_description") ||
      `Google ${res.status}`;
    throw new Error(err);
  }

  // Úspěšná odpověď
  const access_token = readString(dataObj, "access_token");
  const id_token = readString(dataObj, "id_token") ?? null;
  const refresh_token = readString(dataObj, "refresh_token") ?? null;
  const expires_in = readNumber(dataObj, "expires_in") ?? 3600;

  if (!access_token) {
    throw new Error("Google token response missing access_token");
  }

  return {
    access_token,
    expires_at: Math.floor(Date.now() / 1000) + expires_in, // sekundy
    id_token,
    // Google obvykle refresh_token při renew neposílá – ale pokud dorazí, uložíme
    refresh_token,
  } satisfies Required<Pick<GoogleTokenResponse, "access_token">> & {
    expires_at: number;
    id_token: string | null;
    refresh_token: string | null;
  };
}

/**
 * Vrátí platný access token (auto-refreshne, uloží do DB, vrátí nový).
 */
export async function getValidGoogleAccessToken(userId: string): Promise<{
  accessToken: string;
  idToken: string | null;
}> {
  const acc = await getGoogleAccountByUserId(userId);
  if (!acc) throw new Error("Google account not linked");

  const now = Math.floor(Date.now() / 1000);
  const notExpired = !!acc.access_token && !!acc.expires_at && acc.expires_at - 60 > now;

  if (notExpired) {
    return { accessToken: acc.access_token!, idToken: acc.id_token ?? null };
  }

  if (!acc.refresh_token) {
    throw new Error("Missing refresh_token; re-consent required");
  }

  const refreshed = await refreshGoogleAccessToken(acc.refresh_token);

  await prisma.account.updateMany({
    where: { provider: "google", userId },
    data: {
      access_token: refreshed.access_token,
      expires_at: refreshed.expires_at,
      id_token: refreshed.id_token,
      ...(refreshed.refresh_token ? { refresh_token: refreshed.refresh_token } : {}),
    },
  });

  return { accessToken: refreshed.access_token, idToken: refreshed.id_token };
}

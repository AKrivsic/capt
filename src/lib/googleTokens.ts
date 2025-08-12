// lib/googleTokens.ts
import { prisma } from "./prisma";

type GoogleAccount = {
  access_token: string | null;
  refresh_token: string | null;
  expires_at: number | null; // sekundy od epochy
  id_token: string | null;
};

export async function getGoogleAccountByUserId(userId: string) {
  return prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: {
      id: true,
      provider: true,
      access_token: true,
      refresh_token: true,
      expires_at: true,
      id_token: true,
    },
  });
}

async function refreshGoogleAccessToken(refreshToken: string) {
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to refresh Google token");
  }

  return {
    access_token: data.access_token as string,
    expires_at: Math.floor(Date.now() / 1000) + Number(data.expires_in || 3600), // sekundy
    id_token: (data.id_token as string) || null,
    refresh_token: (data.refresh_token as string) || null, // většinou nedorazí při refreshi
  };
}

/**
 * Vrátí platný access token (auto-refreshne, uloží do DB, vrátí nový).
 */
export async function getValidGoogleAccessToken(userId: string): Promise<{
  accessToken: string;
  idToken: string | null;
}> {
  const acc = (await getGoogleAccountByUserId(userId)) as unknown as GoogleAccount | null;
  if (!acc) throw new Error("Google account not linked");

  const now = Math.floor(Date.now() / 1000);
  const notExpired = acc.access_token && acc.expires_at && acc.expires_at - 60 > now;

  if (notExpired) {
    return { accessToken: acc.access_token!, idToken: acc.id_token ?? null };
  }

  if (!acc.refresh_token) throw new Error("Missing refresh_token; re-consent required");

  const refreshed = await refreshGoogleAccessToken(acc.refresh_token);

  // Ulož nové hodnoty do DB
  await prisma.account.updateMany({
    where: { provider: "google", userId },
    data: {
      access_token: refreshed.access_token,
      expires_at: refreshed.expires_at,
      id_token: refreshed.id_token,
      // pokud Google pošle nový refresh_token, přepíšeme ho
      ...(refreshed.refresh_token ? { refresh_token: refreshed.refresh_token } : {}),
    },
  });

  return { accessToken: refreshed.access_token, idToken: refreshed.id_token };
}

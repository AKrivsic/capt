import { headers } from "next/headers";
import crypto from "crypto";

/** Vytáhne IP z už dostupných headers (sync) */
export function getClientIpFrom(h: Headers): string {
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "0.0.0.0"
  );
}

/** Hash IP — async, protože next/headers je teď asynchronní v Next 15 */
export async function getClientIpHash(): Promise<string> {
  const h = await headers();
  const ip = getClientIpFrom(h);

  const salt = process.env.IP_HASH_SALT ?? "";
  return crypto.createHash("sha256").update(ip + salt).digest("hex");
}


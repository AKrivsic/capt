import "server-only";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export function getSessionServer() {
  return getServerSession(authOptions);
}

export async function getSessionUser() {
  const s = await getServerSession(authOptions);
  return s?.user ?? null; // id, plan – dle type augmentation
}

export async function requireUser() {
  const u = await getSessionUser();
  if (!u?.id) throw new Error("UNAUTHORIZED");
  return u;
}
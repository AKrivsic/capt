import "server-only";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export async function getSessionServer() {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    console.error("[session][getSessionServer] Error:", error);
    return null;
  }
}

export async function getSessionUser() {
  try {
    const s = await getServerSession(authOptions);
    return s?.user ?? null; // id, plan – dle type augmentation
  } catch (error) {
    console.error("[session][getSessionUser] Error:", error);
    return null;
  }
}

export async function requireUser() {
  const u = await getSessionUser();
  if (!u?.id) throw new Error("UNAUTHORIZED");
  return u;
}
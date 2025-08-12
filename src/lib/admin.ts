import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const email = session?.user?.email?.toLowerCase();
  const isAdmin = !!email && adminEmails.includes(email);

  return { session, isAdmin };
}


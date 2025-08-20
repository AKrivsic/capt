import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

// Ensure Node.js runtime (Prisma/NextAuth not supported on Edge)
export const runtime = "nodejs";
// Avoid any static optimization/caching of the auth route
export const dynamic = "force-dynamic";


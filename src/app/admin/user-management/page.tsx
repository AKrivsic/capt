/**
 * Admin User Management - Správa uživatelských tarifů a kreditů
 */

export const dynamic = "force-dynamic";

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import UserManagementTable from "./user-management-table";
import type { Metadata } from "next";

type AdminUserDTO = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  plan: "FREE" | "TEXT_STARTER" | "TEXT_PRO" | "VIDEO_LITE" | "VIDEO_PRO" | "VIDEO_UNLIMITED";
  videoCredits: number;
  createdAt: string;
  updatedAt: string;
  // Video subtitle stats
  totalVideos: number;
  totalJobs: number;
  totalPurchases: number;
};

export const metadata: Metadata = {
  title: "User Management | Captioni Admin",
  description: "Manage user plans, credits, and video subtitle usage.",
  robots: { index: false, follow: false },
};

export default async function UserManagementPage() {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p>Forbidden.</p>
      </main>
    );
  }

  // Získej uživatele s jejich statistikami
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      plan: true,
      videoCredits: true,
      createdAt: true,
      updatedAt: true,
      image: true,
      _count: {
        select: {
          videoFiles: true,
          subtitleJobs: true,
          purchases: true,
        }
      }
    },
  });

  const usersWithStats: AdminUserDTO[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    plan: user.plan,
    videoCredits: user.videoCredits,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    totalVideos: user._count.videoFiles,
    totalJobs: user._count.subtitleJobs,
    totalPurchases: user._count.purchases,
  }));

  return (
    <main className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-gray-600">
          Manage user plans, video credits, and monitor usage statistics
        </p>
      </div>

      <UserManagementTable initialUsers={usersWithStats} />
    </main>
  );
}

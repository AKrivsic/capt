/**
 * Test Admin - Dočasná admin stránka pro testování bez autentizace
 */

export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import UserManagementTable from "../user-management/user-management-table";
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
  totalVideos: number;
  totalJobs: number;
  totalPurchases: number;
};

export const metadata: Metadata = {
  title: "Test Admin | Captioni",
  description: "Test admin panel without authentication.",
  robots: { index: false, follow: false },
};

export default async function TestAdminPage() {
  // Získej uživatele s jejich statistikami
  let users: Array<{
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    plan: AdminUserDTO["plan"];
    videoCredits: number;
    createdAt: Date | string;
    updatedAt: Date | string;
    _count?: { videoFiles: number; subtitleJobs: number; purchases: number };
  }> = [];
  try {
    users = await prisma.user.findMany({
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
  } catch {
    // Silent guard for build/dev without DB
    users = [];
  }

  const usersWithStats: AdminUserDTO[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    plan: user.plan,
    videoCredits: user.videoCredits,
    createdAt: typeof user.createdAt === 'string' ? user.createdAt : user.createdAt.toISOString(),
    updatedAt: typeof user.updatedAt === 'string' ? user.updatedAt : user.updatedAt.toISOString(),
    totalVideos: user._count?.videoFiles ?? 0,
    totalJobs: user._count?.subtitleJobs ?? 0,
    totalPurchases: user._count?.purchases ?? 0,
  }));

  return (
    <main className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Admin Panel</h1>
        <p className="text-gray-600">
          ⚠️ This is a test admin panel without authentication. Use for development only.
        </p>
        <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
          <p className="text-yellow-800">
            <strong>Note:</strong> This page bypasses admin authentication for testing purposes.
            In production, use the regular admin panel at <code>/admin</code>.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="mb-8">
        <nav className="flex space-x-4">
          <a 
            href="/admin/test-admin" 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
          >
            Test Admin
          </a>
          <a 
            href="/admin" 
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Real Admin
          </a>
        </nav>
      </div>

      <UserManagementTable initialUsers={usersWithStats} />
    </main>
  );
}

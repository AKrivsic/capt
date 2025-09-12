// src/app/admin/page.tsx
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import AdminUsersTable from "./users-table";
import type { Metadata } from "next";

type AdminUserDTO = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  plan: "FREE" | "TEXT_STARTER" | "TEXT_PRO" | "VIDEO_LITE" | "VIDEO_PRO" | "VIDEO_UNLIMITED";
  createdAt: string;
};

export const metadata: Metadata = {
  title: "Admin Dashboard | Captioni",
  description: "Administrative area for managing Captioni users and plans.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/admin" },
  openGraph: {
    title: "Admin Dashboard | Captioni",
    description: "Administrative area for managing Captioni users and plans.",
    url: "/admin",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Admin Dashboard | Captioni",
    description: "Administrative area for managing Captioni users and plans.",
  },
};

export default async function AdminPage() {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p>Forbidden.</p>
      </main>
    );
  }

  const raw = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, plan: true, createdAt: true, image: true },
  });

  const users: AdminUserDTO[] = raw.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <main className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">
          Manage users, plans, and monitor system usage
        </p>
      </div>

      {/* Navigation */}
      <div className="mb-8">
        <nav className="flex space-x-4">
          <a 
            href="/admin" 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
          >
            Overview
          </a>
          <a 
            href="/admin/user-management" 
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            User Management
          </a>
          <a 
            href="/admin/quick-actions" 
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Quick Actions
          </a>
        </nav>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Total Users</h3>
          <p className="text-3xl font-bold text-blue-600">{users.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Paid Users</h3>
          <p className="text-3xl font-bold text-green-600">
            {users.filter(u => u.plan !== 'FREE').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Free Users</h3>
          <p className="text-3xl font-bold text-gray-600">
            {users.filter(u => u.plan === 'FREE').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">New This Week</h3>
          <p className="text-3xl font-bold text-purple-600">
            {users.filter(u => {
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return new Date(u.createdAt) > weekAgo;
            }).length}
          </p>
        </div>
      </div>

      <AdminUsersTable initialUsers={users} />
    </main>
  );
}

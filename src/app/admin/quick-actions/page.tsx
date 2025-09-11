/**
 * Quick Actions - Rychlé admin akce pro testování
 */

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import QuickActionsPanel from "./quick-actions-panel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quick Actions | Captioni Admin",
  description: "Quick admin actions for testing and promotions.",
  robots: { index: false, follow: false },
};

export default async function QuickActionsPage() {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p>Forbidden.</p>
      </main>
    );
  }

  // Získej statistiky pro quick actions
  const stats = await prisma.user.aggregate({
    _count: {
      id: true,
    },
    _avg: {
      videoCredits: true,
    },
  });

  const recentUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      plan: true,
      videoCredits: true,
      createdAt: true,
    },
  });

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quick Actions</h1>
        <p className="text-gray-600">
          Quick admin actions for testing, promotions, and user management
        </p>
      </div>

      {/* Navigation */}
      <div className="mb-8">
        <nav className="flex space-x-4">
          <a 
            href="/admin" 
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
          >
            Quick Actions
          </a>
        </nav>
      </div>

      <QuickActionsPanel 
        totalUsers={stats._count.id}
        avgCredits={stats._avg.videoCredits || 0}
        recentUsers={recentUsers.map(user => ({
          ...user,
          createdAt: user.createdAt.toISOString()
        }))}
      />
    </main>
  );
}

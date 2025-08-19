// src/app/admin/page.tsx
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import AdminUsersTable from "./users-table";
import type { Metadata } from "next";

type AdminUserDTO = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  plan: "FREE" | "STARTER" | "PRO" | "PREMIUM";
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
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Admin Dashboard</h1>
      <AdminUsersTable initialUsers={users} />
    </main>
  );
}

// app/admin/users-table.tsx
"use client";
import { useEffect, useState } from "react";

type Plan = "FREE" | "STARTER" | "PRO" | "PREMIUM";

type User = {
  id: string;
  name: string | null;
  email: string | null;
  plan: Plan;
  createdAt: string;      // ISO string
  image: string | null;
};

type UsageKind = "GENERATION" | "DEMO";

type UsageRow = {
  id: string;
  userId: string | null;
  ip: string | null;
  ipHash: string | null;
  date: string;           // např. 2025-08-13
  kind: UsageKind;
  count: number;
  updatedAt: string;      // ISO string
  createdAt: string;      // ISO string
};

type UsersApiResponse = { users: User[] };
type UsageApiResponse = { rows: UsageRow[] };

export default function AdminUsersTable({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [usage, setUsage] = useState<UsageRow[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);

  async function refreshUsers() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      const data: UsersApiResponse = await res.json();
      setUsers(Array.isArray(data.users) ? data.users : []);
    } finally {
      setLoading(false);
    }
  }

  async function changePlan(userId: string, plan: User["plan"]) {
    await fetch("/api/admin/set-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, plan }),
    });
    await refreshUsers();
  }

  async function loadUsage(userId: string) {
    try {
      setUsageLoading(true);
      const res = await fetch(`/api/admin/usage?userId=${encodeURIComponent(userId)}`, { cache: "no-store" });
      const data: UsageApiResponse = await res.json();
      setUsage(Array.isArray(data.rows) ? data.rows : []);
    } finally {
      setUsageLoading(false);
    }
  }

  async function resetUsage(userId: string) {
    await fetch("/api/admin/reset-usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    await loadUsage(userId);
  }

  useEffect(() => {
    if (selectedUser?.id) loadUsage(selectedUser.id);
  }, [selectedUser?.id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">Users</h2>
        <button onClick={refreshUsers} disabled={loading} className="px-3 py-1 border rounded">
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">User</th>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Plan</th>
              <th className="text-left p-2">Created</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-2">{u.name || "-"}</td>
                <td className="p-2">{u.email || "-"}</td>
                <td className="p-2 font-mono">{u.plan}</td>
                <td className="p-2">{new Date(u.createdAt).toLocaleString()}</td>
                <td className="p-2 space-x-2">
                  <select
                    defaultValue={u.plan}
                    onChange={(e) => changePlan(u.id, e.target.value as Plan)}
                    className="border rounded px-2 py-1"
                    disabled={loading}
                  >
                    <option value="FREE">FREE</option>
                    <option value="STARTER">STARTER</option>
                    <option value="PRO">PRO</option>
                    <option value="PREMIUM">PREMIUM</option>
                  </select>
                  <button
                    className="px-2 py-1 border rounded"
                    onClick={() => setSelectedUser(u)}
                  >
                    View usage
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td className="p-3" colSpan={5}>No users yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div className="border rounded p-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Today usage — {selectedUser.email || selectedUser.id}</h3>
            <div className="space-x-2">
              <button className="px-2 py-1 border rounded" onClick={() => loadUsage(selectedUser.id)} disabled={usageLoading}>
                {usageLoading ? "Loading..." : "Reload"}
              </button>
              <button className="px-2 py-1 border rounded" onClick={() => resetUsage(selectedUser.id)} disabled={usageLoading}>
                Reset Today
              </button>
            </div>
          </div>
          <div className="mt-3">
            {usage.length === 0 ? (
              <p>No usage rows for today.</p>
            ) : (
              <ul className="list-disc ml-5">
                {usage.map((r) => (
                  <li key={r.id}>
                    kind: <b>{r.kind}</b> • count: <b>{r.count}</b> • updated: {new Date(r.updatedAt).toLocaleTimeString()}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

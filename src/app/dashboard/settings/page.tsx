// src/app/dashboard/settings/page.tsx
import { getSessionServer } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export default async function SettingsPage() {
  const session = await getSessionServer();
  if (!session?.user) redirect("/api/auth/signin?callbackUrl=/dashboard/settings");

  return (
    <form className="space-y-4 max-w-lg">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <div>
        <label className="block text-sm mb-1">Name</label>
        <input className="w-full border rounded-md px-3 py-2" defaultValue={session.user?.name ?? ""} />
      </div>
      <div>
        <label className="block text-sm mb-1">Email</label>
        <input className="w-full border rounded-md px-3 py-2" defaultValue={session.user?.email ?? ""} disabled />
      </div>
      <div className="flex gap-3">
        <button className="btn" type="submit">Save changes</button>
      </div>
    </form>
  );
}

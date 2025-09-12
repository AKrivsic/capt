// src/app/dashboard/saved/page.tsx
import { getSessionServer } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export default async function SavedPage() {
  const session = await getSessionServer();
  if (!session?.user) redirect("/api/auth/signin?callbackUrl=/dashboard/saved");

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Saved</h1>
      <p className="text-sm text-gray-500">Your favorites and collections will appear here.</p>
      <div className="rounded-xl border p-6 text-center">
        <div className="mb-2 font-medium">Nothing saved yet</div>
              <Link href="/#generator" className="btn">
                  Generate now
              </Link>
      </div>
    </div>
  );
}

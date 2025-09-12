import { getSessionServer } from "@/lib/session";
import { redirect } from "next/navigation";
import HistoryList from "@/components/HistoryList/HistoryList";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export const metadata = {
  title: "My History • Captioni",
  description: "Your generated content history.",
};

export default async function MyHistoryPage() {
  const session = await getSessionServer();
  if (!session?.user) redirect("/api/auth/signin?callbackUrl=/my/history");

  return (
    <main className="container mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My History</h1>
        <div className="text-sm text-gray-500">
          Signed in as <span className="font-medium">{session.user?.email}</span>
        </div>
      </div>
      <HistoryList />
    </main>
  );
}

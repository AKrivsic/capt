// src/app/dashboard/history/page.tsx
import { getSessionServer } from "@/lib/session";
import { redirect } from "next/navigation";
import HistoryList from "@/components/HistoryList/HistoryList";

export const metadata = {
  title: "History • Captioni",
  description: "Your generated content history.",
};

export default async function DashboardHistoryPage() {
  const session = await getSessionServer();
  if (!session?.user) redirect("/api/auth/signin?callbackUrl=/dashboard/history");

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">History</h1>
        <div className="text-sm text-gray-500">
          Signed in as <span className="font-medium">{session.user?.email}</span>
        </div>
      </div>
      <HistoryList />
    </div>
  );
}

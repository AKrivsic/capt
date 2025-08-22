import type { Metadata } from "next";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BRAND } from "@/lib/email/branding";

export const metadata: Metadata = {
  title: "Dashboard – Captioni",
  description: "Your Captioni space",
};

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const planSuccess = sp?.plan === "success";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  return (
    <>
      <Header />
      {planSuccess && (
        <div style={{ background: BRAND.colors.bg, borderBottom: `1px solid ${BRAND.colors.border}` }}>
          <div style={{ maxWidth: 960, margin: "0 auto", padding: "12px 16px", color: BRAND.colors.sub }}>
            Payment successful. Welcome aboard! {email ? `Signed in as ${email}.` : ""}
          </div>
        </div>
      )}

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 16px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Dashboard</h1>
        <p style={{ color: BRAND.colors.sub }}>Start generating your content below.</p>
        <div style={{ marginTop: 24 }}>
          <Link href="/" style={{ textDecoration: "underline" }}>Go to generator</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}

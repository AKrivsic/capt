import type { Metadata } from "next";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import Pricing from "@/components/Pricing/Pricing";
import { BRAND } from "@/lib/email/branding";

export const metadata: Metadata = {
  title: "Pricing – Captioni",
  description: "Choose a plan that fits your vibe.",
  alternates: { canonical: "/pricing" },
};

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function PricingPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const isCancel = sp?.cancel === "1";

  return (
    <>
      <Header />
      {isCancel && (
        <div
          style={{
            background: BRAND.colors.bg,
            borderBottom: `1px solid ${BRAND.colors.border}`,
          }}
        >
          <div style={{ maxWidth: 960, margin: "0 auto", padding: "12px 16px", color: BRAND.colors.sub }}>
            Checkout was canceled. You can try again below.
          </div>
        </div>
      )}

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 16px" }}>
        <Pricing />
      </main>

      <Footer />
    </>
  );
}



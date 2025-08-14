import PostSignInConsent from "@/components/marketing/PostSignInConsent";

export const dynamic = "force-dynamic"; // ať se vždy vykreslí čerstvé

export default function OnboardingPage() {
  return (
    <main style={{ padding: "24px 16px", maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
        Welcome to Captioni
      </h1>
      <p style={{ opacity: 0.8, marginBottom: 16 }}>
        You’re all set. One more thing — want to receive exclusive deals and tips?
      </p>

      {/* Otevře modal hned po příchodu */}
      <PostSignInConsent openOnMount />
    </main>
  );
}

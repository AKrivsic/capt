"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { BRAND } from "@/lib/email/branding";

function SignInForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!executeRecaptcha) {
      setError("reCAPTCHA not loaded. Please refresh the page.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const recaptchaToken = await executeRecaptcha("signin");
      
      // Verify reCAPTCHA token on server
      const recaptchaResponse = await fetch("/api/auth/recaptcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: recaptchaToken }),
      });
      
      const recaptchaData = await recaptchaResponse.json();
      if (!recaptchaData.success) {
        setError("Security check failed. Please try again.");
        return;
      }
      
      const result = await signIn("email", {
        email,
        redirect: false,
        callbackUrl: "/",
      });

      if (result?.error) {
        setError("Failed to send magic link. Please try again.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: `linear-gradient(135deg, ${BRAND.colors.accent} 0%, ${BRAND.colors.cta} 100%)`, padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 560, background: BRAND.colors.card, borderRadius: 16, border: `1px solid ${BRAND.colors.border}`, boxShadow: "0 10px 30px rgba(0,0,0,0.08)", padding: 28, textAlign: "center" }}>
          <div style={{ fontSize: 14, color: BRAND.colors.sub, marginBottom: 8 }}>Captioni</div>
          <h1 style={{ margin: 0, marginBottom: 10, fontSize: 24, color: BRAND.colors.text }}>Check your email</h1>
          <p style={{ color: BRAND.colors.sub, margin: 0 }}>We sent you a sign‑in link. Open it in this browser to finish signing in.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: `linear-gradient(135deg, ${BRAND.colors.accent} 0%, ${BRAND.colors.cta} 100%)`, padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 560, background: BRAND.colors.card, borderRadius: 16, border: `1px solid ${BRAND.colors.border}`, boxShadow: "0 10px 30px rgba(0,0,0,0.08)", padding: 28 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 14, color: BRAND.colors.sub, marginBottom: 8 }}>Captioni</div>
          <h1 style={{ margin: 0, marginBottom: 10, fontSize: 24, color: BRAND.colors.text }}>Sign in</h1>
          <p style={{ color: BRAND.colors.sub, margin: 0 }}>Enter your email to receive a magic link</p>
        </div>

        <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="email" style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500, color: BRAND.colors.text }}>Email address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: `1px solid ${error ? "#ef4444" : BRAND.colors.border}`, fontSize: 16, outline: "none", transition: "border-color 0.2s" }}
              disabled={isLoading}
            />
            {error && <div style={{ marginTop: 8, fontSize: 14, color: "#ef4444" }}>{error}</div>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{ width: "100%", padding: "12px 16px", borderRadius: 8, background: BRAND.colors.accent, color: "#fff", border: "none", fontSize: 16, fontWeight: 600, cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.7 : 1, transition: "opacity 0.2s" }}
          >
            {isLoading ? "Sending..." : "Send magic link"}
          </button>
        </form>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, color: BRAND.colors.sub, marginBottom: 16 }}>Or sign in with</div>
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            style={{ width: "100%", padding: "12px 16px", borderRadius: 8, background: "#fff", color: BRAND.colors.text, border: `1px solid ${BRAND.colors.border}`, fontSize: 16, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  
  if (!recaptchaSiteKey) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <h1>Configuration Error</h1>
        <p>reCAPTCHA is not configured. Please contact support.</p>
      </div>
    );
  }

  return (
    <GoogleReCaptchaProvider reCaptchaKey={recaptchaSiteKey}>
      <SignInForm />
    </GoogleReCaptchaProvider>
  );
}

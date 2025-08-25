import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ success: false, error: "Missing token" }, { status: 400 });
    }

    const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!recaptchaSecretKey) {
      console.error("RECAPTCHA_SECRET_KEY not configured");
      return NextResponse.json({ success: false, error: "Server configuration error" }, { status: 500 });
    }

    // Verify reCAPTCHA token with Google
    const verificationResponse = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: recaptchaSecretKey,
        response: token,
      }),
    });

    const verificationData = await verificationResponse.json();

    if (!verificationData.success) {
      console.error("reCAPTCHA verification failed:", verificationData["error-codes"]);
      return NextResponse.json({ success: false, error: "reCAPTCHA verification failed" }, { status: 400 });
    }

    // Check score (v3 returns a score between 0.0 and 1.0)
    const score = verificationData.score;
    const minScore = 0.5; // Adjust this threshold as needed

    if (score < minScore) {
      console.warn("reCAPTCHA score too low:", score);
      return NextResponse.json({ success: false, error: "Suspicious activity detected" }, { status: 400 });
    }

    return NextResponse.json({ success: true, score });
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}


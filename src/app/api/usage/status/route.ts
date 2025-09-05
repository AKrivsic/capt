import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { peekUsageForUser, getUsageForStarterPlan, isStarterPlanValid, planDailyLimit } from "@/lib/limits";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const userId = session.user.id;
    const plan = session.user.plan as "FREE" | "STARTER" | "PRO" | "PREMIUM";
    const limit = planDailyLimit(plan);

    if (limit === null) {
      // Neomezené plány (PRO, PREMIUM)
      return NextResponse.json({
        ok: true,
        data: {
          plan,
          limit: null,
          used: 0,
          remaining: null,
          isUnlimited: true,
          windowType: "unlimited"
        }
      });
    }

    let used: number;
    let windowType: string;

    if (plan === "STARTER") {
      // Pro STARTER plán počítáme od data nákupu
      const isValid = await isStarterPlanValid(userId);
      if (!isValid) {
        // STARTER plán vypršel (3 dny od nákupu)
        used = 15; // Limit je vyčerpán
        windowType = "expired";
      } else {
        used = await getUsageForStarterPlan(userId, "GENERATION");
        windowType = "3 days from purchase";
      }
    } else {
      // Pro FREE plán počítáme denní limit
      used = await peekUsageForUser(userId, "GENERATION");
      windowType = "daily";
    }

    const remaining = Math.max(0, limit - used);

    return NextResponse.json({
      ok: true,
      data: {
        plan,
        limit,
        used,
        remaining,
        isUnlimited: false,
        windowType
      }
    });
  } catch (error) {
    console.error("[usage/status]", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

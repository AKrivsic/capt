import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { espSubscribe, espUnsubscribe } from "@/lib/esp";
import { mlUpsertSubscriber } from "@/lib/mailerlite";

type ConsentBody = {
  marketing: boolean;
  sourceUrl?: string;
};

export async function POST(req: Request) {
  try {
    const { marketing, sourceUrl }: ConsentBody = await req.json();

    // vezmeme email ze session (typově bezpečné, bez any)
    const session = await getServerSession(authOptions);
    const email = session?.user?.email ?? null;
    const name = session?.user?.name ?? null;

    if (!email) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    // najdeme uživatele podle e-mailu a získáme jeho id
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "user_not_found" }, { status: 404 });
    }

    // volání ESP (NO-OP, pokud není nakonfigurováno)
    if (marketing) {
      await espSubscribe({ email, name, source: sourceUrl });
    } else {
      await espUnsubscribe(email);
    }

    // Přímý zápis do MailerLite (pokud je ML nakonfigurován). Přidáme do marketingové skupiny + USERS, když jsou k dispozici.
    try {
      const marketingGroup = process.env.ML_GROUP_MARKETING;
      const usersGroup = process.env.ML_GROUP_USERS;
      if (marketing && (marketingGroup || usersGroup)) {
        const groups = [marketingGroup, usersGroup].filter(Boolean) as string[];
        await mlUpsertSubscriber({ email, name, groups, resubscribe: true });
      }
    } catch (e) {
      console.error("[ML consent]", e);
    }

    // zápis consentu a audit log
    await prisma.user.update({
      where: { id: user.id },
      data: { marketingConsent: marketing, marketingConsentAt: new Date() },
    });

    const ipHeader = req.headers.get("x-forwarded-for") || "";
    const ip = ipHeader.split(",")[0]?.trim() || undefined;

    await prisma.consentLog.create({
      data: {
        userId: user.id,
        scope: "marketing",
        value: marketing,
        ip,
        userAgent: req.headers.get("user-agent") || undefined,
        sourceUrl,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    // ať je něco vidět v devu, ale v prod to ticho nevadí
    if (process.env.NODE_ENV !== "production") {
      console.error("[api/consent] error:", err);
    }
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

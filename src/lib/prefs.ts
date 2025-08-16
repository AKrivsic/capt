// src/lib/prefs.ts
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type PrefSummary = {
  topStyles: Array<{ style: string; count: number }>;
  avgCaptionLen: number | null; // průměrná délka oblíbených captionů
  emojiRatio: number | null;    // podíl oblíbených textů, které obsahují emoji (0..1)
};

function hasEmoji(s: string): boolean {
  // zjednodušená detekce emoji (bezpečná a rychlá)
  return /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u.test(s);
}

function extractStyle(outputs: unknown): string | null {
  // očekáváme JSON podobný { style: string, type: string, text: string, ... }
  if (outputs && typeof outputs === "object") {
    const o = outputs as Record<string, unknown>;
    const v = o["style"];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return null;
}

export async function getUserPreferences(userId: string): Promise<PrefSummary | null> {
  // NEvybíráme 'style' ani 'type' – nejsou v DB schématu
  const rows = await prisma.history.findMany({
    where: { userId, liked: true },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      prompt: true,       // uložený text varianty
      outputs: true,      // JSON, ze kterého si vytáhneme style
    },
  });

  if (rows.length === 0) return null;

  const styleCount = new Map<string, number>();
  let lenSum = 0;
  let lenCnt = 0;
  let emojiCnt = 0;
  let emojiTot = 0;

  for (const r of rows) {
    const style = extractStyle((r as { outputs: Prisma.JsonValue }).outputs as unknown);
    if (style) styleCount.set(style, (styleCount.get(style) || 0) + 1);

    const text = (r as { prompt: string | null }).prompt;
    if (typeof text === "string" && text.length > 0) {
      lenSum += text.length;
      lenCnt += 1;
      emojiTot += 1;
      if (hasEmoji(text)) emojiCnt += 1;
    }
  }

  const topStyles = Array.from(styleCount.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([style, count]) => ({ style, count }));

  return {
    topStyles,
    avgCaptionLen: lenCnt ? Math.round(lenSum / lenCnt) : null,
    emojiRatio: emojiTot ? emojiCnt / emojiTot : null,
  };
}

// src/lib/platformConstraints.ts (NOVÝ)
import { collapseForTwitter } from "./validators";
import type { PlatformKey } from "@/constants/platformNotes";

export function applyPlatformConstraints(platform: PlatformKey, type: string, text: string) {
  let out = text;
  
  if (platform === "X/Twitter") {
    // Odstraň generické follow-CTA na konci
    out = out.replace(/.*follow for more fun!?$/gim, "").trim();
    out = out.replace(/.*follow for more!?$/gim, "").trim();
    out = out.replace(/.*follow me!?$/gim, "").trim();
    // Zruš prázdné odstavce
    out = collapseForTwitter(out);
  }
  
  if (platform === "Instagram" || platform === "TikTok") {
    // Micro-CTA povolena (1), ale žádné automatické přilepování
    // Žádné změny - necháme jak je
  }
  
  if (platform === "OnlyFans") {
    // Brand-safe, přátelské; bez explicitního obsahu
    // Žádné změny - necháme jak je
  }
  
  return out;
}

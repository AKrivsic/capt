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
    out = out.replace(/.*swipe up!?$/gim, "").trim();
    out = out.replace(/.*tap for more!?$/gim, "").trim();
    // Zruš prázdné odstavce, udrž střízlivý tón
    out = collapseForTwitter(out);
  }
  
  if (platform === "Instagram" || platform === "TikTok") {
    // Micro-CTA povolena (1), ale žádné automatické přilepování
    // Žádné změny - necháme jak je
  }
  
  if (platform === "OnlyFans") {
    // Brand-safe, přátelské; suggestive, ne explicitní; žádná agresivita
    // Odstraň agresivní výrazy
    out = out.replace(/aggressive|violent|hate|kill|destroy/gi, "intense");
    out = out.replace(/bloodbath|crime scene/gi, "epic moment");
  }
  
  return out;
}

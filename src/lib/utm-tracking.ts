// src/lib/utm-tracking.ts
import "server-only";
import { prisma } from "./prisma";

/**
 * Aktualizuje UTM a affiliate tracking data pro uživatele
 * Načte data z cookie a uloží do DB
 */
export async function updateUserUTM(userId: string): Promise<void> {
  try {
    // Tato funkce bude volána z NextAuth events
    // Cookie data budou dostupná v request context
    // Pro jednoduchost zatím jen logujeme
    console.debug("[UTM tracking] User signed in:", { userId });
    
    // TODO: Implementovat načtení cookie dat a uložení do DB
    // Potřebujeme přístup k request cookies v NextAuth context
    
  } catch (error) {
    console.error("[UTM tracking] Error updating user UTM:", error);
  }
}

/**
 * Načte UTM data z cookie string
 */
export function parseUTMCookie(cookieValue: string): Record<string, string> {
  try {
    return JSON.parse(cookieValue);
  } catch {
    return {};
  }
}

/**
 * Uloží UTM data do DB pro uživatele
 */
export async function saveUserUTM(
  userId: string, 
  utmData: Record<string, string>
): Promise<void> {
  if (Object.keys(utmData).length === 0) return;
  
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        utmSource: utmData.utm_source || null,
        utmMedium: utmData.utm_medium || null,
        utmCampaign: utmData.utm_campaign || null,
        utmContent: utmData.utm_content || null,
        affiliateId: utmData.affiliate_id || utmData.ref || utmData.referral || null,
      },
    });
    
    console.debug("[UTM tracking] Saved UTM data:", { userId, utmData });
  } catch (error) {
    console.error("[UTM tracking] Error saving UTM data:", error);
  }
}


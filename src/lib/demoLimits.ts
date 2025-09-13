// src/lib/demoLimits.ts
"use client";

import { fingerprint } from "./fingerprint";

export interface DemoLimitResult {
  allowed: boolean;
  reason?: string;
  remaining: number;
  resetTime?: number;
  fingerprint?: string;
}

type StoredEntry = { count: number; resetTime: number };
type StoreMap = Record<string, StoredEntry>;

export class DemoLimits {
  private static instance: DemoLimits;
  private static readonly STORAGE_KEY = "captioni_demo_limits";
  private static readonly DEMO_LIMIT = 2; // 2 generations per day
  private static readonly RESET_HOURS = 24; // Reset every 24 hours

  static getInstance(): DemoLimits {
    if (!DemoLimits.instance) {
      DemoLimits.instance = new DemoLimits();
    }
    return DemoLimits.instance;
  }

  /** Dříve getResetTime(): number – přejmenováno kvůli kolizi s public metodou */
  private computeResetTime(): number {
    return Date.now() + DemoLimits.RESET_HOURS * 60 * 60 * 1000;
  }

  private getStorageData(): StoreMap {
    try {
      const stored = typeof window !== "undefined"
        ? localStorage.getItem(DemoLimits.STORAGE_KEY)
        : null;

      if (stored) {
        const data = JSON.parse(stored) as StoreMap;

        // Clean up expired entries
        const now = Date.now();
        const cleanedEntries = (Object.entries(data) as Array<[string, StoredEntry]>)
          .filter(([, value]) => value.resetTime > now);

        const cleaned: StoreMap = Object.fromEntries(cleanedEntries);

        if (Object.keys(cleaned).length !== Object.keys(data).length) {
          localStorage.setItem(DemoLimits.STORAGE_KEY, JSON.stringify(cleaned));
        }
        return cleaned;
      }
    } catch (error) {
      console.error("Failed to parse demo limits storage:", error);
    }
    return {};
  }

  private setStorageData(data: StoreMap): void {
    try {
      localStorage.setItem(DemoLimits.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save demo limits storage:", error);
    }
  }

  async checkLimit(): Promise<DemoLimitResult> {
    try {
      const fp = await fingerprint.getFingerprint();
      const storage = this.getStorageData();

      const now = Date.now();
      const userData = storage[fp];

      if (!userData || userData.resetTime <= now) {
        // No data or expired - allow and set new limit
        const resetTime = this.computeResetTime();
        const newData: StoredEntry = { count: 1, resetTime };

        this.setStorageData({
          ...storage,
          [fp]: newData,
        });

        return {
          allowed: true,
          remaining: DemoLimits.DEMO_LIMIT - 1,
          resetTime,
          fingerprint: fp,
        };
      }

      if (userData.count >= DemoLimits.DEMO_LIMIT) {
        // Limit reached
        const timeLeftHours = Math.ceil((userData.resetTime - now) / (1000 * 60 * 60));

        return {
          allowed: false,
          reason: `Demo limit reached. You can generate ${DemoLimits.DEMO_LIMIT} captions per day. Try again in ${timeLeftHours} hours or register for unlimited access.`,
          remaining: 0,
          resetTime: userData.resetTime,
          fingerprint: fp,
        };
      }

      // Increment count
      const newData: StoredEntry = { ...userData, count: userData.count + 1 };
      this.setStorageData({
        ...storage,
        [fp]: newData,
      });

      return {
        allowed: true,
        remaining: DemoLimits.DEMO_LIMIT - newData.count,
        resetTime: userData.resetTime,
        fingerprint: fp,
      };
    } catch (error) {
      console.error("Demo limit check failed:", error);
      // Fail open - allow request if fingerprinting fails
      return {
        allowed: true,
        remaining: DemoLimits.DEMO_LIMIT - 1,
        fingerprint: "fallback",
      };
    }
  }

  async getRemaining(): Promise<number> {
    try {
      const fp = await fingerprint.getFingerprint();
      const storage = this.getStorageData();
      const userData = storage[fp];

      if (!userData || userData.resetTime <= Date.now()) {
        return DemoLimits.DEMO_LIMIT;
      }

      return Math.max(0, DemoLimits.DEMO_LIMIT - userData.count);
    } catch (error) {
      console.error("Failed to get remaining demo limit:", error);
      return DemoLimits.DEMO_LIMIT;
    }
  }

  /** Public API – vrací čas resetu (ms) nebo null */
  async getResetTime(): Promise<number | null> {
    try {
      const fp = await fingerprint.getFingerprint();
      const storage = this.getStorageData();
      const userData = storage[fp];

      if (!userData || userData.resetTime <= Date.now()) {
        return null;
      }
      return userData.resetTime;
    } catch (error) {
      console.error("Failed to get demo limit reset time:", error);
      return null;
    }
  }

  async formatTimeLeft(): Promise<string> {
    const resetTime = await this.getResetTime();
    if (!resetTime) return "";

    const now = Date.now();
    const diff = resetTime - now;
    if (diff <= 0) return "";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  // For debugging - get all stored data
  getDebugInfo(): Record<string, { count: number; resetTime: number; timeLeft: string }> {
    const storage = this.getStorageData();
    const now = Date.now();

    const entries = (Object.entries(storage) as Array<[string, StoredEntry]>).map(
      ([fp, data]) => [
        fp,
        {
          ...data,
          timeLeft:
            data.resetTime > now
              ? `${Math.ceil((data.resetTime - now) / (1000 * 60 * 60))}h`
              : "expired",
        },
      ]
    );

    return Object.fromEntries(entries);
  }
}

// Export singleton instance
export const demoLimits = DemoLimits.getInstance();


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

type StoredEntry = { 
  textCount: number; 
  videoCount: number; 
  textResetTime: number; 
  videoResetTime: number; 
};
type StoreMap = Record<string, StoredEntry>;

export class DemoLimits {
  private static instance: DemoLimits;
  private static readonly STORAGE_KEY = "captioni_demo_limits";
  private static readonly DEMO_LIMIT = 2; // 2 text generations per day
  private static readonly DEMO_VIDEO_LIMIT = 1; // 1 video per month
  private static readonly RESET_HOURS = 24; // Reset every 24 hours for text
  private static readonly VIDEO_RESET_DAYS = 30; // Reset every 30 days for video

  static getInstance(): DemoLimits {
    if (!DemoLimits.instance) {
      DemoLimits.instance = new DemoLimits();
    }
    return DemoLimits.instance;
  }

  /** Compute reset time for text generations (24 hours) */
  private computeTextResetTime(): number {
    return Date.now() + DemoLimits.RESET_HOURS * 60 * 60 * 1000;
  }

  /** Compute reset time for video generations (30 days) */
  private computeVideoResetTime(): number {
    return Date.now() + DemoLimits.VIDEO_RESET_DAYS * 24 * 60 * 60 * 1000;
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
          .filter(([, value]) => value.textResetTime > now || value.videoResetTime > now);

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

  async checkLimit(type: 'text' | 'video' = 'text'): Promise<DemoLimitResult> {
    try {
      const fp = await fingerprint.getFingerprint();
      const storage = this.getStorageData();

      const now = Date.now();
      const userData = storage[fp];

      if (!userData) {
        // No data - create new entry
        const textResetTime = this.computeTextResetTime();
        const videoResetTime = this.computeVideoResetTime();
        const newData: StoredEntry = { 
          textCount: type === 'text' ? 1 : 0, 
          videoCount: type === 'video' ? 1 : 0,
          textResetTime,
          videoResetTime
        };

        this.setStorageData({
          ...storage,
          [fp]: newData,
        });

        const limit = type === 'text' ? DemoLimits.DEMO_LIMIT : DemoLimits.DEMO_VIDEO_LIMIT;
        const resetTime = type === 'text' ? textResetTime : videoResetTime;

        return {
          allowed: true,
          remaining: limit - 1,
          resetTime,
          fingerprint: fp,
        };
      }

      // Check if reset time has passed
      const resetTime = type === 'text' ? userData.textResetTime : userData.videoResetTime;
      const count = type === 'text' ? userData.textCount : userData.videoCount;
      const limit = type === 'text' ? DemoLimits.DEMO_LIMIT : DemoLimits.DEMO_VIDEO_LIMIT;

      if (resetTime <= now) {
        // Reset time passed - reset count
        const newResetTime = type === 'text' ? this.computeTextResetTime() : this.computeVideoResetTime();
        const newData: StoredEntry = { 
          ...userData,
          [type === 'text' ? 'textCount' : 'videoCount']: 1,
          [type === 'text' ? 'textResetTime' : 'videoResetTime']: newResetTime
        };

        this.setStorageData({
          ...storage,
          [fp]: newData,
        });

        return {
          allowed: true,
          remaining: limit - 1,
          resetTime: newResetTime,
          fingerprint: fp,
        };
      }

      if (count >= limit) {
        // Limit reached
        const timeLeft = type === 'text' 
          ? Math.ceil((resetTime - now) / (1000 * 60 * 60)) // hours
          : Math.ceil((resetTime - now) / (1000 * 60 * 60 * 24)); // days

        const timeUnit = type === 'text' ? 'hours' : 'days';
        const contentType = type === 'text' ? 'captions' : 'videos';

        return {
          allowed: false,
          reason: `Demo limit reached. You can generate ${limit} ${contentType} per ${type === 'text' ? 'day' : 'month'}. Try again in ${timeLeft} ${timeUnit} or register for unlimited access.`,
          remaining: 0,
          resetTime,
          fingerprint: fp,
        };
      }

      // Increment count
      const newData: StoredEntry = { 
        ...userData, 
        [type === 'text' ? 'textCount' : 'videoCount']: count + 1
      };
      this.setStorageData({
        ...storage,
        [fp]: newData,
      });

      return {
        allowed: true,
        remaining: limit - (count + 1),
        resetTime,
        fingerprint: fp,
      };
    } catch (error) {
      console.error("Demo limit check failed:", error);
      // Fail open - allow request if fingerprinting fails
      const limit = type === 'text' ? DemoLimits.DEMO_LIMIT : DemoLimits.DEMO_VIDEO_LIMIT;
      return {
        allowed: true,
        remaining: limit - 1,
        fingerprint: "fallback",
      };
    }
  }

  async getRemaining(type: 'text' | 'video' = 'text'): Promise<number> {
    try {
      const fp = await fingerprint.getFingerprint();
      const storage = this.getStorageData();
      const userData = storage[fp];

      if (!userData) {
        const limit = type === 'text' ? DemoLimits.DEMO_LIMIT : DemoLimits.DEMO_VIDEO_LIMIT;
        return limit;
      }

      const resetTime = type === 'text' ? userData.textResetTime : userData.videoResetTime;
      const count = type === 'text' ? userData.textCount : userData.videoCount;
      const limit = type === 'text' ? DemoLimits.DEMO_LIMIT : DemoLimits.DEMO_VIDEO_LIMIT;

      if (resetTime <= Date.now()) {
        return limit;
      }

      return Math.max(0, limit - count);
    } catch (error) {
      console.error("Failed to get remaining demo limit:", error);
      const limit = type === 'text' ? DemoLimits.DEMO_LIMIT : DemoLimits.DEMO_VIDEO_LIMIT;
      return limit;
    }
  }

  /** Public API – vrací čas resetu (ms) nebo null */
  async getResetTime(type: 'text' | 'video' = 'text'): Promise<number | null> {
    try {
      const fp = await fingerprint.getFingerprint();
      const storage = this.getStorageData();
      const userData = storage[fp];

      if (!userData) {
        return null;
      }

      const resetTime = type === 'text' ? userData.textResetTime : userData.videoResetTime;
      if (resetTime <= Date.now()) {
        return null;
      }
      return resetTime;
    } catch (error) {
      console.error("Failed to get demo limit reset time:", error);
      return null;
    }
  }

  async formatTimeLeft(type: 'text' | 'video' = 'text'): Promise<string> {
    const resetTime = await this.getResetTime(type);
    if (!resetTime) return "";

    const now = Date.now();
    const diff = resetTime - now;
    if (diff <= 0) return "";

    if (type === 'text') {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    } else {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
    }
  }

  // For debugging - get all stored data
  getDebugInfo(): Record<string, { textCount: number; videoCount: number; textResetTime: number; videoResetTime: number; textTimeLeft: string; videoTimeLeft: string }> {
    const storage = this.getStorageData();
    const now = Date.now();

    const entries = (Object.entries(storage) as Array<[string, StoredEntry]>).map(
      ([fp, data]) => [
        fp,
        {
          ...data,
          textTimeLeft:
            data.textResetTime > now
              ? `${Math.ceil((data.textResetTime - now) / (1000 * 60 * 60))}h`
              : "expired",
          videoTimeLeft:
            data.videoResetTime > now
              ? `${Math.ceil((data.videoResetTime - now) / (1000 * 60 * 60 * 24))}d`
              : "expired",
        },
      ]
    );

    return Object.fromEntries(entries);
  }
}

// Export singleton instance
export const demoLimits = DemoLimits.getInstance();


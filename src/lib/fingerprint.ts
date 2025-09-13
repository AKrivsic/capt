// src/lib/fingerprint.ts
"use client";

/**
 * Browser fingerprinting for demo limits
 * Combines multiple browser characteristics to create a unique identifier
 */

export interface FingerprintData {
  canvas: string;
  webgl: string;
  audio: string;
  fonts: string;
  screen: string;
  timezone: string;
  language: string;
  platform: string;
  hardware: string;
  userAgent: string;
}

type NavigatorConn = { effectiveType?: string; downlink?: number };
type NavigatorWithMemory = Navigator & { deviceMemory?: number; connection?: NavigatorConn };

type WebGLDebugInfo = {
  UNMASKED_VENDOR_WEBGL: number;
  UNMASKED_RENDERER_WEBGL: number;
};

export class BrowserFingerprint {
  private static instance: BrowserFingerprint;
  private fingerprint: string | null = null;
  private fingerprintData: FingerprintData | null = null;

  static getInstance(): BrowserFingerprint {
    if (!BrowserFingerprint.instance) {
      BrowserFingerprint.instance = new BrowserFingerprint();
    }
    return BrowserFingerprint.instance;
  }

  private async generateCanvasFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return "no-canvas";

      // Draw text with various fonts and styles
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.font = "11px Arial";
      ctx.fillText("Browser fingerprint test 🔒", 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.font = "18px Arial";
      ctx.fillText("Browser fingerprint test 🔒", 4, 45);

      return canvas.toDataURL();
    } catch {
      return "canvas-error";
    }
  }

  private async generateWebGLFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        (canvas.getContext("webgl") as WebGLRenderingContext | null) ||
        (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
      if (!gl) return "no-webgl";

      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info") as WebGLDebugInfo | null;
      if (!debugInfo) return "no-debug-info";

      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) as string;
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string;

      return `${vendor}|${renderer}`;
    } catch {
      return "webgl-error";
    }
  }

  private async generateAudioFingerprint(): Promise<string> {
    try {
      // Handle prefixed AudioContext without using `any`
      const maybePrefixed = (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
      const AC = window.AudioContext || maybePrefixed;
      if (!AC) return "no-audioctx";

      const audioContext = new AC();
      const oscillator = audioContext.createOscillator();
      const analyser = audioContext.createAnalyser();
      const gainNode = audioContext.createGain();
      const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(10000, audioContext.currentTime);

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();

      return await new Promise<string>((resolve) => {
        scriptProcessor.onaudioprocess = (event: AudioProcessingEvent) => {
          const buffer = event.inputBuffer.getChannelData(0);
          // Take first N samples, convert to a compact base36-ish string
          const hash = Array.from(buffer.slice(0, 30))
            .map((x) => {
              // normalize to 0..1, then to 0..35
              const v = Math.max(0, Math.min(1, (x + 1) / 2));
              return Math.floor(v * 35).toString(36);
            })
            .join("");
          resolve(hash);
          oscillator.stop();
          audioContext.close();
        };
      });
    } catch {
      return "audio-error";
    }
  }

  private getInstalledFonts(): string {
    const testFonts = [
      "Arial",
      "Helvetica",
      "Times New Roman",
      "Courier New",
      "Verdana",
      "Georgia",
      "Palatino",
      "Garamond",
      "Bookman",
      "Comic Sans MS",
      "Trebuchet MS",
      "Arial Black",
      "Impact",
      "Lucida Console",
      "Monaco",
      "Consolas",
      "Liberation Mono",
      "DejaVu Sans Mono",
    ];

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return "no-context";

    const baseFonts = ["monospace", "sans-serif", "serif"];
    const testString = "abcdefghijklmnopqrstuvwxyz0123456789";
    const testSize = "72px";

    const detectedFonts: string[] = [];

    for (const font of testFonts) {
      let detected = false;
      for (const baseFont of baseFonts) {
        ctx.font = `${testSize} ${font}, ${baseFont}`;
        const metrics1 = ctx.measureText(testString);

        ctx.font = `${testSize} ${baseFont}`;
        const metrics2 = ctx.measureText(testString);

        if (metrics1.width !== metrics2.width) {
          detected = true;
          break;
        }
      }
      if (detected) detectedFonts.push(font);
    }

    return detectedFonts.join(",");
  }

  private getScreenInfo(): string {
    return [
      screen.width,
      screen.height,
      screen.colorDepth,
      // `pixelDepth` existuje v lib.dom
      screen.pixelDepth,
      window.devicePixelRatio,
      window.innerWidth,
      window.innerHeight,
    ].join("|");
  }

  private getHardwareInfo(): string {
    const nav = navigator as NavigatorWithMemory;
    const parts = [
      nav.hardwareConcurrency ?? 0,
      nav.maxTouchPoints ?? 0,
      nav.deviceMemory ?? 0,
      nav.connection?.effectiveType ?? "unknown",
      nav.connection?.downlink ?? 0,
    ];
    return parts.join("|");
  }

  private async collectFingerprintData(): Promise<FingerprintData> {
    const [canvas, webgl, audio] = await Promise.all([
      this.generateCanvasFingerprint(),
      this.generateWebGLFingerprint(),
      this.generateAudioFingerprint(),
    ]);

    return {
      canvas,
      webgl,
      audio,
      fonts: this.getInstalledFonts(),
      screen: this.getScreenInfo(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      hardware: this.getHardwareInfo(),
      userAgent: navigator.userAgent,
    };
  }

  private hashFingerprint(data: FingerprintData): string {
    const combined = Object.values(data).join("|");

    // Simple non-crypto hash (for demo). Prefer crypto.subtle.digest in production if available.
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // force 32-bit
    }
    return Math.abs(hash).toString(36);
  }

  async getFingerprint(): Promise<string> {
    if (this.fingerprint) return this.fingerprint;

    try {
      this.fingerprintData = await this.collectFingerprintData();
      this.fingerprint = this.hashFingerprint(this.fingerprintData);

      // Store in localStorage for persistence
      if (typeof window !== "undefined") {
        localStorage.setItem("captioni_fingerprint", this.fingerprint);
        localStorage.setItem("captioni_fingerprint_data", JSON.stringify(this.fingerprintData));
      }

      return this.fingerprint;
    } catch {
      // Fallback to a simple hash of available data
      const fallback = this.hashFingerprint({
        canvas: "fallback",
        webgl: "fallback",
        audio: "fallback",
        fonts: this.getInstalledFonts(),
        screen: this.getScreenInfo(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        platform: navigator.platform,
        hardware: this.getHardwareInfo(),
        userAgent: navigator.userAgent,
      });

      this.fingerprint = fallback;
      if (typeof window !== "undefined") {
        localStorage.setItem("captioni_fingerprint", fallback);
      }
      return fallback;
    }
  }

  getStoredFingerprint(): string | null {
    if (this.fingerprint) return this.fingerprint;

    const stored = typeof window !== "undefined" ? localStorage.getItem("captioni_fingerprint") : null;
    if (stored) {
      this.fingerprint = stored;
      return stored;
    }
    return null;
  }

  async validateFingerprint(): Promise<boolean> {
    const stored = this.getStoredFingerprint();
    if (!stored) return false;

    const current = await this.getFingerprint();
    return stored === current;
  }

  getFingerprintData(): FingerprintData | null {
    if (this.fingerprintData) return this.fingerprintData;

    const stored =
      typeof window !== "undefined" ? localStorage.getItem("captioni_fingerprint_data") : null;
    if (stored) {
      try {
        this.fingerprintData = JSON.parse(stored) as FingerprintData;
        return this.fingerprintData;
      } catch (err) {
        console.error("Failed to parse stored fingerprint data:", err);
      }
    }
    return null;
  }
}

// Export singleton instance
export const fingerprint = BrowserFingerprint.getInstance();

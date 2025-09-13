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
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return 'no-canvas';

      // Draw text with various fonts and styles
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.font = '11px Arial';
      ctx.fillText('Browser fingerprint test 🔒', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.font = '18px Arial';
      ctx.fillText('Browser fingerprint test 🔒', 4, 45);

      return canvas.toDataURL();
    } catch (error) {
      return 'canvas-error';
    }
  }

  private async generateWebGLFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return 'no-webgl';

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) return 'no-debug-info';

      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      
      return `${vendor}|${renderer}`;
    } catch (error) {
      return 'webgl-error';
    }
  }

  private async generateAudioFingerprint(): Promise<string> {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const analyser = audioContext.createAnalyser();
      const gainNode = audioContext.createGain();
      const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(10000, audioContext.currentTime);

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(0);

      return new Promise((resolve) => {
        scriptProcessor.onaudioprocess = (event) => {
          const buffer = event.inputBuffer.getChannelData(0);
          const hash = Array.from(buffer.slice(0, 30))
            .map(x => x.toString(36))
            .join('');
          resolve(hash);
          oscillator.stop();
          audioContext.close();
        };
      });
    } catch (error) {
      return 'audio-error';
    }
  }

  private getInstalledFonts(): string {
    const testFonts = [
      'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana',
      'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
      'Trebuchet MS', 'Arial Black', 'Impact', 'Lucida Console',
      'Monaco', 'Consolas', 'Liberation Mono', 'DejaVu Sans Mono'
    ];

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-context';

    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    const testString = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const testSize = '72px';
    
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
      if (detected) {
        detectedFonts.push(font);
      }
    }

    return detectedFonts.join(',');
  }

  private getScreenInfo(): string {
    return [
      screen.width,
      screen.height,
      screen.colorDepth,
      screen.pixelDepth,
      window.devicePixelRatio,
      window.innerWidth,
      window.innerHeight
    ].join('|');
  }

  private getHardwareInfo(): string {
    const info = [
      navigator.hardwareConcurrency || 0,
      navigator.maxTouchPoints || 0,
      navigator.deviceMemory || 0,
      navigator.connection?.effectiveType || 'unknown',
      navigator.connection?.downlink || 0
    ];
    return info.join('|');
  }

  private async collectFingerprintData(): Promise<FingerprintData> {
    const [canvas, webgl, audio] = await Promise.all([
      this.generateCanvasFingerprint(),
      this.generateWebGLFingerprint(),
      this.generateAudioFingerprint()
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
      userAgent: navigator.userAgent
    };
  }

  private hashFingerprint(data: FingerprintData): string {
    const combined = Object.values(data).join('|');
    
    // Simple hash function (in production, use crypto.subtle.digest)
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  async getFingerprint(): Promise<string> {
    if (this.fingerprint) {
      return this.fingerprint;
    }

    try {
      this.fingerprintData = await this.collectFingerprintData();
      this.fingerprint = this.hashFingerprint(this.fingerprintData);
      
      // Store in localStorage for persistence
      localStorage.setItem('captioni_fingerprint', this.fingerprint);
      localStorage.setItem('captioni_fingerprint_data', JSON.stringify(this.fingerprintData));
      
      return this.fingerprint;
    } catch (error) {
      console.error('Fingerprint generation failed:', error);
      // Fallback to a simple hash of available data
      const fallback = this.hashFingerprint({
        canvas: 'fallback',
        webgl: 'fallback',
        audio: 'fallback',
        fonts: this.getInstalledFonts(),
        screen: this.getScreenInfo(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        platform: navigator.platform,
        hardware: this.getHardwareInfo(),
        userAgent: navigator.userAgent
      });
      
      this.fingerprint = fallback;
      localStorage.setItem('captioni_fingerprint', fallback);
      return fallback;
    }
  }

  getStoredFingerprint(): string | null {
    if (this.fingerprint) {
      return this.fingerprint;
    }
    
    const stored = localStorage.getItem('captioni_fingerprint');
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
    if (this.fingerprintData) {
      return this.fingerprintData;
    }

    const stored = localStorage.getItem('captioni_fingerprint_data');
    if (stored) {
      try {
        this.fingerprintData = JSON.parse(stored);
        return this.fingerprintData;
      } catch (error) {
        console.error('Failed to parse stored fingerprint data:', error);
      }
    }

    return null;
  }
}

// Export singleton instance
export const fingerprint = BrowserFingerprint.getInstance();

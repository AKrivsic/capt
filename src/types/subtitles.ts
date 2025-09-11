/**
 * Unified types for subtitle system - single source of truth
 */

// Core subtitle style types
export type SubtitleStyle = 'BARBIE' | 'BADDIE' | 'INNOCENT' | 'FUNNY' | 'GLAMOUR' | 'EDGY' | 'RAGE' | 'MEME' | 'STREAMER';

export type AnimationType = 'fade' | 'bounce' | 'pop' | 'glitch';

export type SubtitleMode = 'TALKING_HEAD' | 'CINEMATIC_CLIP';

export type CaptionPosition = 'TOP' | 'MIDDLE' | 'BOTTOM';

// Style preset interface
export interface StylePreset {
  name: SubtitleStyle;
  fontFamily: string;
  primaryHex: `#${string}`;
  secondaryHex: `#${string}`;
  highlightHex: `#${string}`;
  emojiSet: string[];
  animation: AnimationType;
  fontSize?: { mobile: number; desktop: number };
  defaultPosition?: CaptionPosition;
  paddingPx?: number;
  safeAreaPx?: { top: number; bottom: number };
  strokePx?: number;
  shadow?: { x: number; y: number; blur: number; color: `#${string}` } | null;
}

// Mode preset interface
export interface ModePreset {
  mode: SubtitleMode;
  maxCharsPerLine: number;
  maxLines: 1 | 2;
  targetCPS: { min: number; max: number };
  defaultPosition: CaptionPosition;
  fontSizeFromHeightCoeff: number;
  safeTopCoeff: number;
  safeBottomCoeff: number;
  baseStyle: Omit<StylePreset, 'name'>; // neutral base without name
}

// Transcript and timing types
export interface WordTimestamp {
  text: string;
  start: number; // seconds
  end: number;   // seconds
  confidence?: number; // 0-1
}

export interface Transcript {
  words: WordTimestamp[];
  language: string;
  confidence?: number;
}

// Video metadata
export interface VideoMeta {
  width: number;   // e.g. 1080
  height: number;  // e.g. 1920
  fps: number;
  durationSec: number;
}

// Layout and rendering types
export interface LayoutInput {
  video: VideoMeta;
  position: CaptionPosition;
  avoidOverlays: boolean;
  mode: SubtitleMode;
  linesCount: number;     // 1–2
  lineHeightPx: number;   // calculated from font-size
}

export interface SubtitleChunk {
  textLines: [string] | [string, string];
  startSec: number;
  endSec: number;
}

export interface DecorationToken {
  kind: 'WORD' | 'EMOJI';
  lineIndex: 0 | 1;         // which line to draw on
  text: string;             // original word text OR emoji
  startSec: number;
  endSec: number;
  highlight?: boolean;      // for KEYWORD highlight
  emoji?: boolean;          // true if this is an emoji token
}

export interface Decorations {
  tokens: DecorationToken[]; // order = drawing order (layers)
}

export interface FeatureFlags {
  highlightKeywords: boolean;
  emojiAugment: boolean;
  microAnimations: boolean;
}

// Render input/output types
export interface RenderInput {
  videoPath: string;
  outPath: string;
  video: VideoMeta;
  chunks: SubtitleChunk[];
  position: CaptionPosition;
  mode: SubtitleMode;
  avoidOverlays: boolean;
  style: StylePreset;
  featureFlags: FeatureFlags;
  fontFilePath?: string;
}

export interface RenderResult {
  storageKey: string;
  durationSec: number;
  fileSizeBytes: number;
  mimeType: string;
}

export interface RenderProgress {
  phase: string;
  progress: number; // 0-100
}

// Job and status types
export type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface SubtitleJob {
  id: string;
  userId: string;
  videoFileId: string;
  style: SubtitleStyle;
  status: JobStatus;
  progress: number; // 0-100
  resultStorageKey: string | null;
  errorMessage: string | null;
  transcriptJson: Transcript | null;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
}

// Video file type
export interface VideoFile {
  id: string;
  userId: string;
  storageKey: string;
  originalName: string;
  durationSec: number | null;
  fileSizeBytes: number | null;
  mimeType: string | null;
  createdAt: Date;
}

// Pricing types (in cents)
export type SkuCode = 'PACK_STARTER_3' | 'PACK_CREATOR_10' | 'PACK_PRO_30' | 'ADMIN_CREDITS' | 'EXTRA_10_VIDEOS' | 'EXTRA_25_VIDEOS' | 'EXTRA_50_VIDEOS';

export interface CreditPack {
  sku: SkuCode;
  name: string;
  credits: number;
  priceCents: number; // in cents
  popular?: boolean;
}

export interface Purchase {
  id: string;
  userId: string;
  sku: SkuCode;
  creditsDelta: number;
  amountCents: number; // in cents
  stripePaymentIntentId: string;
  createdAt: Date;
}

export const CREDIT_PACKS: Record<SkuCode, CreditPack> = {
  PACK_STARTER_3: {
    sku: 'PACK_STARTER_3',
    name: 'StartCreator',
    credits: 3,
    priceCents: 600, // $6.00
  },
  PACK_CREATOR_10: {
    sku: 'PACK_CREATOR_10', 
    name: 'Creator',
    credits: 10,
    priceCents: 1500, // $15.00
    popular: true,
  },
  PACK_PRO_30: {
    sku: 'PACK_PRO_30',
    name: 'ProCreator', 
    credits: 30,
    priceCents: 3900, // $39.00
  },
  ADMIN_CREDITS: {
    sku: 'ADMIN_CREDITS',
    name: 'Admin Credits',
    credits: 100,
    priceCents: 0, // Free for admin
  },
  EXTRA_10_VIDEOS: {
    sku: 'EXTRA_10_VIDEOS',
    name: 'Extra 10 Videos',
    credits: 10,
    priceCents: 2000, // $20.00
  },
  EXTRA_25_VIDEOS: {
    sku: 'EXTRA_25_VIDEOS',
    name: 'Extra 25 Videos',
    credits: 25,
    priceCents: 4500, // $45.00
  },
  EXTRA_50_VIDEOS: {
    sku: 'EXTRA_50_VIDEOS',
    name: 'Extra 50 Videos',
    credits: 50,
    priceCents: 8000, // $80.00
  },
};
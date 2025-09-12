/**
 * Typy pro video a subtitle funkcionality
 */

export type SubtitleStyle = 'BARBIE' | 'BADDIE' | 'INNOCENT' | 'FUNNY' | 'GLAMOUR' | 'EDGY' | 'RAGE' | 'MEME' | 'STREAMER';
export type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type SkuCode = 'PACK_STARTER_3' | 'PACK_CREATOR_10' | 'PACK_PRO_30';

// Video soubor
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

// Subtitle job
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

// Nákup balíčku
export interface Purchase {
  id: string;
  userId: string;
  sku: SkuCode;
  creditsDelta: number;
  amountCents: number; // v centech
  stripePaymentIntentId: string;
  createdAt: Date;
}

// STT transkripce
export interface WordTimestamp {
  text: string;
  start: number; // sekundy
  end: number;   // sekundy
  confidence?: number; // 0-1
}

export interface Transcript {
  words: WordTimestamp[];
  language: string;
  confidence?: number;
}

// Balíčky kreditů
export interface CreditPack {
  sku: SkuCode;
  name: string;
  credits: number;
  priceCents: number; // v centech
  popular?: boolean;
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
};

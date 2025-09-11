/**
 * API kontrakty pro video subtitle endpointy
 */

import { z } from 'zod';
import type { JobStatus } from './video';

// Validační schémata
export const SubtitleStyleSchema = z.enum(['BARBIE', 'BADDIE', 'INNOCENT', 'FUNNY', 'GLAMOUR', 'EDGY', 'RAGE', 'MEME', 'STREAMER']);
export const JobStatusSchema = z.enum(['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED']);

// POST /api/video/upload-init
export const UploadInitRequestSchema = z.object({
  fileName: z.string().min(1),
  fileSize: z.number().positive(),
  mimeType: z.string().min(1),
});

export type UploadInitRequest = z.infer<typeof UploadInitRequestSchema>;

export interface UploadInitResponse {
  uploadUrl: string;
  fileId: string;
  expiresAt: string; // ISO timestamp
}

// POST /api/video/process
export const ProcessRequestSchema = z.object({
  fileId: z.string().cuid(),
  style: SubtitleStyleSchema,
});

export type ProcessRequest = z.infer<typeof ProcessRequestSchema>;

export interface ProcessResponse {
  jobId: string;
}

// GET /api/video/job/:id
export interface JobStatusResponse {
  id: string;
  status: JobStatus;
  progress: number; // 0-100
  downloadUrl?: string;
  errorMessage?: string;
  createdAt: string; // ISO timestamp
  estimatedTimeRemaining?: number; // sekundy
}

// GET /api/video/file/:id  
export interface FileDownloadResponse {
  downloadUrl: string;
  expiresAt: string; // ISO timestamp
  fileName: string;
  fileSizeBytes?: number;
}

// POST /api/billing/create-intent
export const CreatePaymentIntentRequestSchema = z.object({
  sku: z.enum(['PACK_STARTER_3', 'PACK_CREATOR_10', 'PACK_PRO_30']),
});

export type CreatePaymentIntentRequest = z.infer<typeof CreatePaymentIntentRequestSchema>;

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  amount: number; // v centech
  currency: string;
}

// Error response
export interface ApiErrorResponse {
  error: string;
  message?: string;
  details?: Record<string, unknown>;
}

// Upload progress callback
export interface UploadProgressEvent {
  loaded: number;
  total: number;
  percentage: number;
}

export type UploadProgressCallback = (event: UploadProgressEvent) => void;

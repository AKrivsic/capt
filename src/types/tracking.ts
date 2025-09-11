/**
 * Typy pro Plausible event tracking
 */

// Všechny trackované eventy
export type PlausibleEvent =
  | 'upload_started'
  | 'upload_completed'
  | 'upload_failed'
  | 'job_started'
  | 'job_completed'
  | 'job_failed'
  | 'preview_played'
  | 'download_clicked'
  | 'share_used'
  | 'pack_purchased'
  | 'video_credits_balance'
  | 'style_selected'
  | 'page_view';

// Props pro eventy
export interface TrackingProps {
  // Obecné
  userId?: string;
  path?: string;
  
  // Upload eventy
  fileSize?: number;
  fileDuration?: number;
  fileType?: string;
  
  // Job eventy
  jobId?: string;
  style?: string;
  processingTime?: number;
  
  // Share eventy
  shareMethod?: 'web_share' | 'download' | 'qr_code';
  
  // Purchase eventy
  sku?: string;
  amount?: number;
  credits?: number;
  
  // Obecné metrics
  credits_balance?: number;
  plan?: string;
  error?: string;
}

// Plausible funkce interface
declare global {
  interface Window {
    plausible?: (event: PlausibleEvent, options?: { props?: TrackingProps }) => void;
  }
}

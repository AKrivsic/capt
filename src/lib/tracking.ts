/**
 * Typovaný wrapper pro Plausible event tracking
 */

import type { PlausibleEvent, TrackingProps } from '@/types/tracking';

/**
 * Trackuje event pomocí Plausible Analytics
 * @param event - Název eventu (musí být z definovaného seznamu)
 * @param props - Volitelné props pro event
 */
export function track(event: PlausibleEvent, props?: TrackingProps): void {
  try {
    if (typeof window !== 'undefined' && window.plausible) {
      window.plausible(event, props ? { props } : undefined);
    } else if (process.env.NODE_ENV === 'development') {
      console.log(`[TRACKING] ${event}`, props);
    }
  } catch (error) {
    console.error('Tracking error:', error);
  }
}

/**
 * Trackuje page view s dodatečnými props
 */
export function trackPageView(path: string, props?: TrackingProps): void {
  track('page_view', { ...props, path });
}

/**
 * Trackuje upload flow eventy
 */
export const uploadTracking = {
  started: (props?: Pick<TrackingProps, 'fileSize' | 'fileDuration' | 'fileType'>) => 
    track('upload_started', props),
    
  completed: (props?: Pick<TrackingProps, 'fileSize' | 'fileDuration' | 'fileType'>) => 
    track('upload_completed', props),
    
  failed: (error?: string) => 
    track('upload_failed', { error }),
};

/**
 * Trackuje subtitle job eventy
 */
export const jobTracking = {
  started: (props?: Pick<TrackingProps, 'jobId' | 'style'>) => 
    track('job_started', props),
    
  completed: (props?: Pick<TrackingProps, 'jobId' | 'style' | 'processingTime'>) => 
    track('job_completed', props),
    
  failed: (error?: string, props?: Pick<TrackingProps, 'jobId' | 'style'>) => 
    track('job_failed', { ...props, error }),
};

/**
 * Trackuje share a download eventy
 */
export const shareTracking = {
  download: (props?: Pick<TrackingProps, 'jobId' | 'style'>) => 
    track('download_clicked', props),
    
  share: (method: TrackingProps['shareMethod'], props?: Pick<TrackingProps, 'jobId' | 'style'>) => 
    track('share_used', { ...props, shareMethod: method }),
    
  preview: (props?: Pick<TrackingProps, 'jobId' | 'style'>) => 
    track('preview_played', props),
};

/**
 * Trackuje purchase eventy
 */
export const purchaseTracking = {
  started: (props: Pick<TrackingProps, 'sku' | 'amount' | 'credits'>) => 
    track('pack_purchased', props),
    
  creditsBalance: (balance: number) => 
    track('video_credits_balance', { credits_balance: balance }),
};

/**
 * Trackuje style selection
 */
export const styleTracking = {
  selected: (style: string) => 
    track('style_selected', { style }),
};

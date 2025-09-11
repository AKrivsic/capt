/**
 * ShareActions - Sharing and downloading completed video
 * Web Share API + QR fallback + download
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import styles from './ShareActions.module.css';
import { shareTracking } from '@/lib/tracking';

interface Props {
  jobId: string | null;
  fileName?: string;
}

interface DownloadInfo {
  url: string;
  fileName: string;
  size?: number;
}

export default function ShareActions({ jobId, fileName }: Props) {
  const [downloadInfo, setDownloadInfo] = useState<DownloadInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  // Získání download linku
  useEffect(() => {
    if (!jobId) return;

    const fetchDownloadInfo = async () => {
      try {
        const response = await fetch(`/api/video/job/${jobId}`);
        
        if (!response.ok) {
          throw new Error('Failed to get download info');
        }

        const data = await response.json();
        
        if (data.downloadUrl) {
          setDownloadInfo({
            url: data.downloadUrl,
            fileName: fileName || 'video-with-subtitles.mp4'
          });
        } else {
          throw new Error('Download URL not available');
        }
        
      } catch (error) {
        console.error('Download info error:', error);
        setError('Error getting download link');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDownloadInfo();
  }, [jobId, fileName]);

  // Web Share API
  const handleWebShare = useCallback(async () => {
    if (!downloadInfo) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My video with subtitles',
          text: 'Check out my video with AI subtitles from Captioni!',
          url: downloadInfo.url
        });
        
        shareTracking.share('web_share', { jobId: jobId || '' });
      } else {
        // Fallback - copy to clipboard
        await navigator.clipboard.writeText(downloadInfo.url);
        // TODO: Show toast "Link copied"
        shareTracking.share('web_share', { jobId: jobId || '' });
      }
    } catch (error) {
      console.error('Share error:', error);
      // Fallback to QR code
      setShowQR(true);
    }
  }, [downloadInfo, jobId]);

  // Přímé stažení
  const handleDownload = useCallback(async () => {
    if (!downloadInfo) return;

    try {
      // Vytvoření invisible link pro download
      const link = document.createElement('a');
      link.href = downloadInfo.url;
      link.download = downloadInfo.fileName;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      shareTracking.download({ jobId: jobId || '' });
      
    } catch (error) {
      console.error('Download error:', error);
      // Fallback - open in new window
      window.open(downloadInfo.url, '_blank');
    }
  }, [downloadInfo, jobId]);

  // QR kód toggle
  const handleToggleQR = useCallback(() => {
    setShowQR(!showQR);
    if (!showQR) {
      shareTracking.share('qr_code', { jobId: jobId || '' });
    }
  }, [showQR, jobId]);

  // Vytvoření nového videa
  const handleCreateNew = useCallback(() => {
    window.location.reload(); // Jednoduchý restart pro MVP
  }, []);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Preparing for download...</p>
        </div>
      </div>
    );
  }

  if (error || !downloadInfo) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <div className={styles.errorIcon}>❌</div>
          <h3>Preparation Error</h3>
          <p>{error || 'Video is not available for download'}</p>
          <button 
            className={styles.retryButton}
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      
      {/* Success header */}
      <div className={styles.successHeader}>
        <div className={styles.successIcon}>🎉</div>
        <h2 className={styles.successTitle}>Video is ready!</h2>
        <p className={styles.successDescription}>
          Your video with AI subtitles is complete and ready to share.
        </p>
      </div>

      {/* Action buttons */}
      <div className={styles.actions}>
        
        {/* Primary actions */}
        <div className={styles.primaryActions}>
          <button 
            className={styles.downloadButton}
            onClick={handleDownload}
          >
            <span className={styles.buttonIcon}>📱</span>
            Download to Phone
          </button>

          {/* Web Share API nebo copy link */}
          <button 
            className={styles.shareButton}
            onClick={handleWebShare}
          >
            <span className={styles.buttonIcon}>📤</span>
            {typeof window !== 'undefined' && 'navigator' in window && 'share' in navigator ? 'Share' : 'Copy link'}
          </button>
        </div>

        {/* Secondary actions */}
        <div className={styles.secondaryActions}>
          <button 
            className={styles.qrButton}
            onClick={handleToggleQR}
          >
            <span className={styles.buttonIcon}>📱</span>
            {showQR ? 'Hide QR Code' : 'Show QR Code'}
          </button>
        </div>

      </div>

      {/* QR Code */}
      {showQR && (
        <div className={styles.qrSection}>
          <h3 className={styles.qrTitle}>QR Code for Quick Download</h3>
          <div className={styles.qrContainer}>
            <QRCodeComponent url={downloadInfo.url} />
          </div>
          <p className={styles.qrDescription}>
            Scan the QR code with your phone for direct download
          </p>
        </div>
      )}

      {/* File info */}
      <div className={styles.fileInfo}>
        <h4>File Information:</h4>
        <div className={styles.fileDetails}>
          <div className={styles.fileDetail}>
            <span className={styles.fileLabel}>Name:</span>
            <span className={styles.fileValue}>{downloadInfo.fileName}</span>
          </div>
          {downloadInfo.size && (
            <div className={styles.fileDetail}>
              <span className={styles.fileLabel}>Size:</span>
              <span className={styles.fileValue}>
                {(downloadInfo.size / (1024 * 1024)).toFixed(1)} MB
              </span>
            </div>
          )}
          <div className={styles.fileDetail}>
            <span className={styles.fileLabel}>Expires:</span>
            <span className={styles.fileValue}>in 7 days</span>
          </div>
        </div>
      </div>

      {/* Create new video */}
      <div className={styles.newVideoSection}>
        <button 
          className={styles.newVideoButton}
          onClick={handleCreateNew}
        >
          <span className={styles.buttonIcon}>➕</span>
          Create Another Video
        </button>
      </div>

    </div>
  );
}

// Simple QR code component for MVP
function QRCodeComponent({ url }: { url: string }) {
  // For MVP we use external service for QR generation
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  
  return (
    <img 
      src={qrUrl} 
      alt="QR code for video download"
      className={styles.qrImage}
      loading="lazy"
    />
  );
}

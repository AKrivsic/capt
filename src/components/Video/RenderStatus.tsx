/**
 * RenderStatus - Sledování stavu subtitle jobu s polling
 * Exponential backoff, haptics, toast notifikace
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './RenderStatus.module.css';
import { jobTracking } from '@/lib/tracking';
import type { JobStatus } from '@/types/subtitles';

interface Props {
  jobId: string;
  onComplete: (downloadUrl: string) => void;
}

interface JobStatusData {
  id: string;
  status: JobStatus;
  progress: number;
  downloadUrl?: string;
  errorMessage?: string;
  estimatedTimeRemaining?: number;
}

export default function RenderStatus({ jobId, onComplete }: Props) {
  const [jobStatus, setJobStatus] = useState<JobStatusData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  // Polling s exponential backoff
  const pollJobStatus = useCallback(async (attempt: number = 1): Promise<void> => {
    try {
      const response = await fetch(`/api/video/job/${jobId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: JobStatusData = await response.json();
      setJobStatus(data);
      setError(null);

      // Dokončení nebo chyba
      if (data.status === 'COMPLETED') {
        setIsPolling(false);
        
        // Haptic feedback na úspěch
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
        
        jobTracking.completed({
          jobId: data.id,
          style: undefined, // TODO: získat z API
          processingTime: undefined // TODO: vypočítat
        });

        if (data.downloadUrl) {
          onComplete(data.downloadUrl);
        }
        return;
      }

      if (data.status === 'FAILED') {
        setIsPolling(false);
        setError(data.errorMessage || 'Processing failed');
        
        jobTracking.failed(data.errorMessage || 'Unknown error', {
          jobId: data.id
        });
        return;
      }

      // Pokračování v pollingu pro QUEUED/PROCESSING
      if (data.status === 'QUEUED' || data.status === 'PROCESSING') {
        const delay = Math.min(1000 * Math.pow(1.5, attempt - 1), 10000); // Max 10s
        setTimeout(() => {
          if (isPolling) {
            pollJobStatus(attempt + 1);
          }
        }, delay);
      }

    } catch (error) {
      console.error('Polling error:', error);
      
      // Retry s exponential backoff při chybách
      if (attempt < 10) {
        const delay = Math.min(2000 * Math.pow(2, attempt - 1), 30000); // Max 30s
        setTimeout(() => {
          if (isPolling) {
            pollJobStatus(attempt + 1);
          }
        }, delay);
      } else {
        setIsPolling(false);
        setError('Error tracking status. Please refresh the page.');
      }
    }
  }, [jobId, onComplete, isPolling]);

  // Začínáme polling při mount
  useEffect(() => {
    pollJobStatus();
    
    // Cleanup při unmount
    return () => {
      setIsPolling(false);
    };
  }, [pollJobStatus]);

  // Retry funkcionalita
  const handleRetry = useCallback(() => {
    setError(null);
    setIsPolling(true);
    pollJobStatus();
  }, [pollJobStatus]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  }, []);

  const getStatusMessage = useCallback((status: JobStatus, progress: number): string => {
    switch (status) {
      case 'QUEUED':
        return 'Waiting in queue...';
      case 'PROCESSING':
        if (progress < 20) return 'Processing audio...';
        if (progress < 60) return 'Generating subtitles...';
        if (progress < 90) return 'Rendering video...';
        return 'Finalizing...';
      case 'COMPLETED':
        return 'Video is ready!';
      case 'FAILED':
        return 'Processing failed';
      default:
        return 'Unknown status';
    }
  }, []);

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>❌</div>
          <h3 className={styles.errorTitle}>Processing Error</h3>
          <p className={styles.errorMessage}>{error}</p>
          <button 
            className={styles.retryButton}
            onClick={handleRetry}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!jobStatus) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.statusCard}>
        
        {/* Status header */}
        <div className={styles.statusHeader}>
          <h2 className={styles.statusTitle}>
            {getStatusMessage(jobStatus.status, jobStatus.progress)}
          </h2>
          <div className={styles.statusBadge} data-status={jobStatus.status}>
            {jobStatus.status}
          </div>
        </div>

        {/* Progress bar */}
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ 
                width: `${jobStatus.progress}%`,
                background: jobStatus.status === 'FAILED' ? '#ef4444' : undefined
              }}
            />
          </div>
          <div className={styles.progressText}>
            {jobStatus.progress}%
          </div>
        </div>

        {/* Estimated time remaining */}
        {jobStatus.estimatedTimeRemaining && jobStatus.status === 'PROCESSING' && (
          <div className={styles.timeRemaining}>
            <span className={styles.timeIcon}>⏱️</span>
            Approximately {formatTime(jobStatus.estimatedTimeRemaining)} remaining
          </div>
        )}

        {/* Processing phases */}
        <div className={styles.phases}>
          <div className={`${styles.phase} ${jobStatus.progress >= 1 ? styles.phaseActive : ''}`}>
            <span className={styles.phaseIcon}>🎵</span>
            <span className={styles.phaseText}>Audio Analysis</span>
          </div>
          <div className={`${styles.phase} ${jobStatus.progress >= 30 ? styles.phaseActive : ''}`}>
            <span className={styles.phaseIcon}>📝</span>
            <span className={styles.phaseText}>Transcription</span>
          </div>
          <div className={`${styles.phase} ${jobStatus.progress >= 60 ? styles.phaseActive : ''}`}>
            <span className={styles.phaseIcon}>🎨</span>
            <span className={styles.phaseText}>Subtitle Styling</span>
          </div>
          <div className={`${styles.phase} ${jobStatus.progress >= 90 ? styles.phaseActive : ''}`}>
            <span className={styles.phaseIcon}>🎬</span>
            <span className={styles.phaseText}>Final Render</span>
          </div>
        </div>

        {/* Tips během čekání */}
        {jobStatus.status === 'PROCESSING' && (
          <div className={styles.tips}>
            <h4 className={styles.tipsTitle}>💡 Tip:</h4>
            <p className={styles.tipsText}>
              {getTipForProgress(jobStatus.progress)}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

// Tips během zpracování
function getTipForProgress(progress: number): string {
  if (progress < 25) {
    return "We are analyzing your audio and preparing transcription. This usually takes 1-2 minutes.";
  }
  if (progress < 50) {
    return "Converting speech to text with precise timestamps for each word.";
  }
  if (progress < 75) {
    return "Applying selected style to subtitles and preparing animations.";
  }
  return "Rendering final video with burned-in subtitles. Almost done!";
}

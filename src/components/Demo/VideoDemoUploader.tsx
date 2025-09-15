'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import styles from '../Generator/NewGenerator.module.css';
import MobileUploadCard from '../Video/MobileUploadCard';
import { useVideoSelectionStore } from '@/store/videoSelection';

interface Props {
  onUploaded: (data: { videoId: string; previewUrl: string }) => void;
  onLimitReached?: (reason: string) => void;
}

interface UploadResult {
  id: string;
  name: string;
  size: number;
  file?: File;
  previewUrl?: string;
}

export default function VideoDemoUploader({ onUploaded, onLimitReached }: Props) {
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const blobUrlRef = useRef<string | null>(null);

  // Cleanup blob URL on unmount or new upload
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  const handleUploadComplete = useCallback(
    (result: UploadResult) => {
      try {
        const videoId = result.id;
        const previewUrl = result.previewUrl ?? `/api/demo/preview/${result.id}`;
        
        // ulož do store
        useVideoSelectionStore.getState().setSelection(videoId, previewUrl);
        
        setUploadState('success');
        onUploaded({ videoId, previewUrl });
      } catch (error) {
        console.error('Error creating preview URL:', error);
        setUploadState('error');
        setErrorMessage('Failed to create video preview');
      }
    },
    [onUploaded]
  );

  const handleUploadError = useCallback(
    (error: string) => {
      setUploadState('error');
      setErrorMessage(error);
      
      if (error.toLowerCase().includes('limit') || error.toLowerCase().includes('quota')) {
        onLimitReached?.(error);
      }
    },
    [onLimitReached]
  );

  return (
    <div className={styles.uploadContainer}>
      <MobileUploadCard
        onUploadComplete={handleUploadComplete}
        onError={handleUploadError}
      />

      {uploadState === 'error' && (
        <div className={styles.errorMessage}>
          <p>❌ {errorMessage}</p>
          <button
            className={styles.retryButton}
            onClick={() => {
              setUploadState('idle');
              setErrorMessage('');
            }}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

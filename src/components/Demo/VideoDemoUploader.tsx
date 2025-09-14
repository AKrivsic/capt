'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import styles from '../Generator/NewGenerator.module.css';
import MobileUploadCard from '../Video/MobileUploadCard';

interface Props {
  onUploaded: (previewUrl: string) => void;
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
        let previewUrl: string;

        if (result.file) {
          // Create blob URL from file
          if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current);
          }
          blobUrlRef.current = URL.createObjectURL(result.file);
          previewUrl = blobUrlRef.current;
        } else if (result.previewUrl) {
          previewUrl = result.previewUrl;
        } else {
          // Fallback to mock URL (but this should be avoided)
          previewUrl = `https://demo-preview.captioni.com/${result.id}`;
        }

        setUploadState('success');
        onUploaded(previewUrl);
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

'use client';

import { useState, useCallback } from 'react';
import styles from '../Generator/NewGenerator.module.css';
import MobileUploadCard from '../Video/MobileUploadCard';

interface Props {
  onUploaded: (previewUrl: string) => void;
  onLimitReached?: (reason: string) => void;
}

export default function VideoDemoUploader({ onUploaded /*, onLimitReached*/ }: Props) {
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleUploadComplete = useCallback(
    (file: { id: string; name: string; size: number }) => {
      // For demo, create a mock preview URL
      const mockPreviewUrl = `https://demo-preview.captioni.com/${file.id}`;
      setUploadState('success');
      onUploaded(mockPreviewUrl);
    },
    [onUploaded]
  );

  return (
    <div className={styles.uploadContainer}>
      <MobileUploadCard
        onUploadComplete={handleUploadComplete}
        // Pokud MobileUploadCard podporuje onError/onFail, můžeš doplnit a případně volat onLimitReached:
        // onError={(err) => {
        //   setUploadState('error');
        //   setErrorMessage(err);
        //   if (err.toLowerCase().includes('limit') || err.toLowerCase().includes('quota')) {
        //     onLimitReached?.(err);
        //   }
        // }}
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

'use client';

import { useState, useRef, useCallback } from 'react';
import styles from '../Generator/NewGenerator.module.css';
import MobileUploadCard from '../Video/MobileUploadCard';

interface Props {
  onUploaded: (previewUrl: string) => void;
  onLimitReached?: (reason: string) => void;
}

export default function VideoDemoUploader({ onUploaded, onLimitReached }: Props) {
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleUploadComplete = useCallback((file: { id: string; name: string; size: number }) => {
    // For demo, we'll create a mock preview URL
    // In real implementation, this would trigger video processing
    const mockPreviewUrl = `https://demo-preview.captioni.com/${file.id}`;
    setUploadState('success');
    onUploaded(mockPreviewUrl);
  }, [onUploaded]);

  const handleUploadError = useCallback((error: string) => {
    setUploadState('error');
    setErrorMessage(error);
    
    // Check if it's a limit error
    if (error.includes('limit') || error.includes('quota')) {
      onLimitReached?.(error);
    }
  }, [onLimitReached]);

  return (
    <div className={styles.uploadContainer}>
      <MobileUploadCard 
        onUploadComplete={handleUploadComplete}
      />
      
      {uploadState === 'error' && (
        <div className={styles.errorMessage}>
          <p>❌ {errorMessage}</p>
          <button 
            className={styles.retryButton}
            onClick={() => setUploadState('idle')}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}



/**
 * MobileUploadCard - Upload komponenta optimalizovaná pro mobil
 * Bottom CTA, progress bar, drag & drop + file picker
 */

'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import styles from './MobileUploadCard.module.css';
import { uploadTracking } from '@/lib/tracking';
import type { UploadProgressCallback } from '@/types/api';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  url?: string;
  file?: File;
  previewUrl?: string;
}

interface Props {
  onUploadComplete: (file: UploadedFile) => void;
  onError?: (error: string) => void;
}

type UploadState = 'idle' | 'preparing' | 'uploading' | 'success' | 'error';

export default function MobileUploadCard({ onUploadComplete, onError }: Props) {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Podporované formáty
  const acceptedTypes = useMemo(() => ['video/mp4', 'video/mov', 'video/quicktime', 'video/webm'], []);
  const maxSizeBytes = useMemo(() => 4 * 1024 * 1024, []); // 4MB - Vercel Free limit

  const validateFile = useCallback((file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return 'Unsupported format. Use MP4, MOV or WebM.';
    }
    
    if (file.size > maxSizeBytes) {
      return 'File is too large. Maximum is 100MB.';
    }
    
    return null;
  }, [acceptedTypes, maxSizeBytes]);

  const uploadFile = useCallback(async (file: File) => {
    setUploadState('preparing');
    setUploadProgress(0);
    setErrorMessage('');

    try {
      uploadTracking.started({
        fileSize: file.size,
        fileType: file.type,
        fileDuration: undefined // TODO: detekovat délku videa
      });

      // 1. Získej presigned upload URL
      const initResponse = await fetch('/api/video/upload-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type
        })
      });

      if (!initResponse.ok) {
        const error = await initResponse.json();
        throw new Error(error.message || 'Failed to initialize upload');
      }

      const { uploadUrl, fileId } = await initResponse.json();

      // 2. Upload souboru s progress tracking
      setUploadState('uploading');
      await uploadToPresignedUrl(file, uploadUrl, (progress) => {
        setUploadProgress(progress.percentage);
      });

      // 3. Úspěšné dokončení
      setUploadState('success');
      setUploadProgress(100);

      const uploadedFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        file: file, // Pass the original file for blob URL creation
        previewUrl: URL.createObjectURL(file) // Create preview URL
      };

      onUploadComplete(uploadedFile);

    } catch (error) {
      console.error('Upload error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Upload error';
      setUploadState('error');
      setErrorMessage(errorMsg);
      uploadTracking.failed(errorMsg);
      onError?.(errorMsg);
    }
  }, [onUploadComplete, onError]);

  const uploadToPresignedUrl = async (
    file: File, 
    url: string, 
    onProgress: UploadProgressCallback
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress({
            loaded: e.loaded,
            total: e.total,
            percentage: Math.round((e.loaded / e.total) * 100)
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('PUT', url);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  };

  const handleFileSelect = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      setUploadState('error');
      return;
    }

    await uploadFile(file);
  }, [validateFile, uploadFile]);

  // Event handlers
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  }, []);

  return (
    <div className={styles.container}>
      <div 
        className={`${styles.uploadArea} ${dragActive ? styles.dragActive : ''} ${uploadState === 'uploading' ? styles.uploading : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {uploadState === 'idle' && (
          <>
            <div className={styles.uploadIcon}>📹</div>
            <h3 className={styles.uploadTitle}>Upload Video</h3>
            <p className={styles.uploadDescription}>
              Drag video here or click to select
            </p>
            <p className={styles.uploadHint}>
              MP4, MOV, WebM • Max {formatFileSize(maxSizeBytes)} • Do 60 sekund
            </p>
          </>
        )}

        {uploadState === 'preparing' && (
          <>
            <div className={styles.progressContainer}>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: '10%' }} />
              </div>
              <div className={styles.progressText}>
                <div className={styles.uploadingSpinner} />
                Preparing upload...
              </div>
            </div>
          </>
        )}

        {uploadState === 'uploading' && (
          <>
            <div className={styles.progressContainer}>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className={styles.progressText}>
                <div className={styles.uploadingSpinner} />
                Uploading... {uploadProgress}%
              </div>
            </div>
          </>
        )}

        {uploadState === 'success' && (
          <>
            <div className={styles.successIcon}>✅</div>
            <h3 className={styles.successTitle}>Video uploaded!</h3>
            <p className={styles.successDescription}>
              Continue by selecting subtitle style
            </p>
          </>
        )}

        {uploadState === 'error' && (
          <>
            <div className={styles.errorIcon}>❌</div>
            <h3 className={styles.errorTitle}>Upload Error</h3>
            <p className={styles.errorDescription}>{errorMessage}</p>
            <button 
              className={styles.retryButton}
              onClick={() => setUploadState('idle')}
            >
              Try Again
            </button>
          </>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileInputChange}
        className={styles.hiddenInput}
      />

      {/* Bottom CTA button */}
      {uploadState === 'idle' && (
        <button 
          className={styles.bottomCTA}
          onClick={handleButtonClick}
        >
          <span className={styles.ctaIcon}>📱</span>
          Select video from phone
        </button>
      )}
    </div>
  );
}

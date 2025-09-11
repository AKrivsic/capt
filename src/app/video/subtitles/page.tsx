/**
 * /video/subtitles - Hlavní stránka pro tvorbu video titulků
 * Mobile-first UX s bottom CTA
 */

'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import styles from './subtitles.module.css';
import MobileUploadCard from '@/components/Video/MobileUploadCard';
import StylePicker from '@/components/Video/StylePicker';
import RenderStatus from '@/components/Video/RenderStatus';
import ShareActions from '@/components/Video/ShareActions';
import CreditsBar from '@/components/Video/CreditsBar';
import { uploadTracking, styleTracking } from '@/lib/tracking';
import type { SubtitleStyle } from '@/types/subtitles';

type FlowStep = 'upload' | 'style' | 'processing' | 'share';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  url?: string;
}

export default function VideoSubtitlesPage() {
  const { status } = useSession();
  const [currentStep, setCurrentStep] = useState<FlowStep>('upload');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<SubtitleStyle | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);

  // Handlery pro jednotlivé kroky - MUSÍ být před podmíněnými returny
  const handleUploadComplete = useCallback((file: UploadedFile) => {
    setUploadedFile(file);
    setCurrentStep('style');
    
    uploadTracking.completed({
      fileSize: file.size,
      fileType: 'video' // TODO: detekovat z MIME type
    });
  }, []);

  const handleStyleSelect = useCallback((style: SubtitleStyle) => {
    setSelectedStyle(style);
    styleTracking.selected(style);
  }, []);

  const handleStartProcessing = useCallback(async () => {
    if (!uploadedFile || !selectedStyle) return;

    try {
      const response = await fetch('/api/video/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: uploadedFile.id,
          style: selectedStyle
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start processing');
      }

      const data = await response.json();
      setJobId(data.jobId);
      setCurrentStep('processing');
      
    } catch (error) {
      console.error('Processing error:', error);
      // TODO: Zobrazit error toast
    }
  }, [uploadedFile, selectedStyle]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleProcessingComplete = useCallback((_downloadUrl: string) => {
    setCurrentStep('share');
  }, []);

  const handleCreditsUpdate = useCallback((newCredits: number) => {
    setCredits(newCredits);
  }, []);

  // Redirect pokud není přihlášený - PO všech hooks
  if (status === 'loading') {
    return <div className={styles.loading}>Načítání...</div>;
  }

  if (status === 'unauthenticated') {
    redirect('/auth/signin?callbackUrl=/video/subtitles');
  }

  return (
    <div className={styles.container}>
      {/* Header s credits */}
      <div className={styles.header}>
        <h1 className={styles.title}>AI Video Titulky</h1>
        <CreditsBar 
          credits={credits} 
          onCreditsUpdate={handleCreditsUpdate}
        />
      </div>

      {/* Hlavní obsah */}
      <main className={styles.main}>
        {currentStep === 'upload' && (
          <MobileUploadCard onUploadComplete={handleUploadComplete} />
        )}

        {currentStep === 'style' && uploadedFile && (
          <div className={styles.styleSection}>
            <div className={styles.filePreview}>
              <h3>Nahraný soubor:</h3>
              <p className={styles.fileName}>{uploadedFile.name}</p>
            </div>
            
            <StylePicker
              onStyleSelect={handleStyleSelect}
              selectedStyle={selectedStyle}
              videoUrl={uploadedFile.url}
            />
            
            {selectedStyle && (
              <button 
                className={styles.startButton}
                onClick={handleStartProcessing}
              >
                Začít zpracování
              </button>
            )}
          </div>
        )}

        {currentStep === 'processing' && jobId && (
          <RenderStatus 
            jobId={jobId}
            onComplete={handleProcessingComplete}
          />
        )}

        {currentStep === 'share' && (
          <ShareActions 
            jobId={jobId}
            fileName={uploadedFile?.name}
          />
        )}
      </main>

      {/* Step indicator */}
      <div className={styles.stepIndicator}>
        <div className={`${styles.step} ${currentStep === 'upload' ? styles.active : ''}`}>1</div>
        <div className={`${styles.step} ${currentStep === 'style' ? styles.active : ''}`}>2</div>
        <div className={`${styles.step} ${currentStep === 'processing' ? styles.active : ''}`}>3</div>
        <div className={`${styles.step} ${currentStep === 'share' ? styles.active : ''}`}>4</div>
      </div>
    </div>
  );
}

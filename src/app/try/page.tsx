/**
 * /try - Demo stránka pro nepřihlášené uživatele
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Montserrat } from 'next/font/google';
import { trackDemoTextStart, trackDemoVideoUpload, trackVisitTry } from '@/utils/tracking';
import DemoModeSelector from '@/components/Demo/DemoModeSelector';
import TextDemo from '@/components/Demo/TextDemo';
import VideoDemoModal from '@/components/Demo/VideoDemoModal';
import styles from './try.module.css';

const mont = Montserrat({ subsets: ["latin"], weight: ["600", "700", "800"] });

export default function TryPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [demoMode, setDemoMode] = useState<'text' | 'video' | null>(null);
  const [showModeSelector, setShowModeSelector] = useState(false);


  // Track visit to try page
  useEffect(() => {
    trackVisitTry();
  }, []);

  // Redirect if already logged in
  if (session) {
    router.push('/dashboard');
    return null;
  }

  const handleTextDemo = () => {
    trackDemoTextStart();
    setDemoMode('text');
  };

  const handleVideoDemo = () => {
    trackDemoVideoUpload();
    setDemoMode('video');
  };

  const handleModeSelect = (mode: 'text' | 'video') => {
    setShowModeSelector(false);
    if (mode === 'text') {
      handleTextDemo();
    } else {
      handleVideoDemo();
    }
  };

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={`${styles.title} ${mont.className}`}>
            Try Captioni for Free
          </h1>
          <p className={styles.subtitle}>
            Experience AI-powered captions and video subtitles in seconds. 
            No signup required for demo.
          </p>
          
          <div className={styles.demoButtons}>
            <button 
              className={`${styles.demoButton} ${styles.textDemo}`}
              onClick={handleTextDemo}
            >
              <div className={styles.buttonIcon}>📝</div>
              <div className={styles.buttonContent}>
                <div className={styles.buttonTitle}>Text Demo</div>
                <div className={styles.buttonSubtitle}>Generate captions, bios, hashtags</div>
                <div className={styles.buttonLimit}>2 free generations / day</div>
              </div>
            </button>

            <button 
              className={`${styles.demoButton} ${styles.videoDemo}`}
              onClick={handleVideoDemo}
            >
              <div className={styles.buttonIcon}>🎥</div>
              <div className={styles.buttonContent}>
                <div className={styles.buttonTitle}>Video Demo</div>
                <div className={styles.buttonSubtitle}>Upload video, get subtitles</div>
                <div className={styles.buttonLimit}>1 free video / day (≤15s)</div>
              </div>
            </button>
          </div>

          <div className={styles.ctaSection}>
            <p className={styles.ctaText}>
              Want unlimited access? 
              <button 
                className={styles.signupLink}
                onClick={() => router.push('/auth/signin')}
              >
                Sign up for free
              </button>
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <h2 className={`${styles.featuresTitle} ${mont.className}`}>
          What you can try today
        </h2>
        
        <div className={styles.featuresGrid}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>📝</div>
            <h3 className={styles.featureTitle}>Text Generation</h3>
            <p className={styles.featureDescription}>
              Generate captions, bios, hashtags, and more for Instagram, TikTok, X, and OnlyFans
            </p>
            <ul className={styles.featureList}>
              <li>6 different styles (Barbie, Edgy, Glamour, etc.)</li>
              <li>Multiple platforms support</li>
              <li>Custom vibe and tone</li>
            </ul>
          </div>

          <div className={styles.feature}>
            <div className={styles.featureIcon}>🎥</div>
            <h3 className={styles.featureTitle}>Video Subtitles</h3>
            <p className={styles.featureDescription}>
              Upload a video and get professional subtitles with custom styling
            </p>
            <ul className={styles.featureList}>
              <li>Automatic transcription</li>
              <li>9 subtitle styles</li>
              <li>3 position options (top/middle/bottom)</li>
            </ul>
          </div>

          <div className={styles.feature}>
            <div className={styles.featureIcon}>⚡</div>
            <h3 className={styles.featureTitle}>Lightning Fast</h3>
            <p className={styles.featureDescription}>
              Get results in seconds, not minutes. Perfect for content creators on the go
            </p>
            <ul className={styles.featureList}>
              <li>Text generation in 3-5 seconds</li>
              <li>Video processing in 30-60 seconds</li>
              <li>No waiting, no queues</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Demo Components */}
      {demoMode === 'text' && (
        <TextDemo onClose={() => setDemoMode(null)} />
      )}

      {demoMode === 'video' && (
        <VideoDemoModal 
          onClose={() => setDemoMode(null)}
          onSuccess={(result) => {
            // Handle successful video demo
            console.log('Video demo completed:', result);
          }}
        />
      )}

      {/* Mode Selector Modal */}
      <DemoModeSelector
        open={showModeSelector}
        onClose={() => setShowModeSelector(false)}
        onSelect={handleModeSelect}
      />
    </div>
  );
}

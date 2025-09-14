/**
 * VideoDemoModal - Modal wrapper pro VideoDemoUploader
 */

'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import VideoDemoUploader from './VideoDemoUploader';
import VideoDemoPreview from './VideoDemoPreview';
import { STYLE_PRESETS } from '@/constants/subtitleStyles';
import type { SubtitleStyle } from '@/types/subtitles';
import CaptionPositionSelector from '@/components/CaptionPositionSelector/CaptionPositionSelector';
import { useCaptionPosition } from '@/hooks/useCaptionPosition';
import SubtitleModeSelector from '@/components/SubtitleModeSelector';
import type { SubtitleMode } from '@/subtitles/types';
import FeatureFlagsToggle from '@/components/FeatureFlagsToggle';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { styleMeta } from '@/constants/styleMeta';
import styles from './VideoDemoModal.module.css';

interface VideoDemoModalProps {
  onClose: () => void;
  onSuccess?: (result: { previewUrl: string }) => void;
}

export default function VideoDemoModal({ onClose, onSuccess }: VideoDemoModalProps) {
  const [mounted, setMounted] = useState(false);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [selectedStyle, setSelectedStyle] = useState<SubtitleStyle>('BARBIE');
  const { position, setPosition } = useCaptionPosition({ initialPosition: 'BOTTOM' });
  const [subtitleMode, setSubtitleMode] = useState<SubtitleMode>('TALKING_HEAD');
  const [featureFlags, setFeatureFlags] = useState({ highlightKeywords: true, emojiAugment: true, microAnimations: true });

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  const modalContent = (
    <div 
      className={styles.overlay} 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
        width: '100vw',
        height: '100vh',
        margin: 0
      }}
    >
      <div 
        className={styles.modal} 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          borderRadius: '16px',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          margin: 0,
          position: 'relative',
          padding: '2rem'
        }}
      >
        <div className={styles.header}>
          <h3>Video Demo</h3>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className={styles.content}>
          {!videoPreviewUrl ? (
            <div>
              <h4>Upload a 15s vertical video to preview AI subtitles</h4>
              <VideoDemoUploader 
                onUploaded={(previewUrl) => {
                  console.log('Video uploaded:', previewUrl);
                  setVideoPreviewUrl(previewUrl);
                }}
                onLimitReached={(reason) => {
                  console.log('Limit reached:', reason);
                  alert(`Limit reached: ${reason}`);
                }}
              />
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <VideoDemoPreview src={videoPreviewUrl} />
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem 1rem',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  borderRadius: '0.5rem',
                  textAlign: 'center',
                  fontWeight: '500'
                }}>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>
                    Video uploaded! Continue by selecting subtitle style below.
                  </p>
                </div>
              </div>

              {/* Style Selection */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Choose subtitle style
                </label>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                  gap: '0.5rem' 
                }}>
                  {Object.entries(STYLE_PRESETS).map(([key, preset]) => {
                    const displayName = preset.name.charAt(0) + preset.name.slice(1).toLowerCase();
                    const meta = styleMeta[displayName] || null;
                    const shownEmoji =
                      displayName === 'Meme' ? '🤣' :
                      displayName === 'Rage' ? '💢' :
                      (preset.emojiSet?.[0] ?? '✨');
                    return (
                      <Tippy key={key} content={meta?.tooltip || displayName} placement="top">
                        <button
                          style={{
                            padding: '0.75rem',
                            border: selectedStyle === key ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                            borderRadius: '0.5rem',
                            background: selectedStyle === key ? '#eff6ff' : 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                          onClick={() => setSelectedStyle(key as SubtitleStyle)}
                        >
                          <span style={{ fontSize: '1.5rem' }}>{shownEmoji}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: '500' }}>{displayName}</span>
                        </button>
                      </Tippy>
                    );
                  })}
                </div>
              </div>

              {/* Position and Mode */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Caption position
                  </label>
                  <CaptionPositionSelector value={position} onChange={setPosition} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Subtitle mode
                  </label>
                  <SubtitleModeSelector value={subtitleMode} onChange={setSubtitleMode} />
                </div>
              </div>

              {/* Effects */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Effects
                </label>
                <FeatureFlagsToggle mode={subtitleMode} value={featureFlags} onChange={setFeatureFlags} />
              </div>

              {/* Generate Button */}
              <button
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  opacity: isGenerating ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
                onClick={async () => {
                  setIsGenerating(true);
                  setErrorMsg(null);
                  
                  try {
                    // Demo video processing
                    const res = await fetch('/api/video/generate', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        videoFileId: 'demo',
                        style: STYLE_PRESETS[selectedStyle].name,
                        durationSec: 15,
                        isDemo: true,
                      }),
                    });

                    const payload = await res.json();

                    if (!res.ok) {
                      throw new Error(payload.error || 'Video processing failed');
                    }

                    if (payload.ok) {
                      console.log('Demo video processing started:', payload.jobId);
                      if (onSuccess) onSuccess({ previewUrl: videoPreviewUrl });
                    } else {
                      throw new Error(payload.error || 'Video processing failed');
                    }
                  } catch (e) {
                    const msg = e instanceof Error ? e.message : 'Video processing failed. Please try again.';
                    setErrorMsg(msg);
                  } finally {
                    setIsGenerating(false);
                  }
                }}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <span>⏳</span>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>🎬</span>
                    <span>Generate Subtitles</span>
                  </>
                )}
              </button>

              {errorMsg && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem', 
                  background: '#fef2f2', 
                  color: '#dc2626', 
                  borderRadius: '0.5rem',
                  border: '1px solid #fecaca'
                }}>
                  ⚠️ {errorMsg}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

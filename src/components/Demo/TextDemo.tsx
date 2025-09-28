/**
 * TextDemo - Jednoduchý text generátor pro /try stránku
 */

'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { trackDemoTextStart, trackGenerationComplete } from '@/utils/tracking';
import styles from './TextDemo.module.css';

interface TextDemoProps {
  onClose: () => void;
}

export default function TextDemo({ onClose }: TextDemoProps) {
  const [vibe, setVibe] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [style, setStyle] = useState('Barbie');
  const [outputType, setOutputType] = useState('caption');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const platforms = ['Instagram', 'TikTok', 'X/Twitter', 'OnlyFans'];
  const styleOptions = ['Barbie', 'Edgy', 'Glamour', 'Baddie', 'Innocent', 'Funny'];
  const outputTypes = [
    { value: 'caption', label: 'Caption', icon: '📝' },
    { value: 'bio', label: 'Bio', icon: '👤' },
    { value: 'hashtags', label: 'Hashtags', icon: '🏷️' },
    { value: 'story', label: 'Story', icon: '📖' },
  ];

  const handleGenerate = async () => {
    if (!vibe.trim()) {
      setError('Please describe what you want to create');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      trackDemoTextStart();
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vibe: vibe.trim(),
          platform: platform.toLowerCase(),
          style,
          outputs: [outputType],
          demo: true,
        }),
      });

      const data = await response.json();
      console.log('[DEBUG] API Response:', data);
      console.log('[DEBUG] Output type:', outputType);
      console.log('[DEBUG] Data structure:', {
        ok: data.ok,
        hasData: !!data.data,
        dataKeys: data.data ? Object.keys(data.data) : 'no data',
        outputTypeData: data.data ? data.data[outputType] : 'no data for outputType'
      });

      if (!response.ok) {
        throw new Error(data.message || 'Generation failed');
      }

      if (data.ok && data.data && data.data[outputType] && data.data[outputType].length > 0) {
        console.log('[DEBUG] Setting result:', data.data[outputType][0]);
        setResult(data.data[outputType][0]);
        trackGenerationComplete('FREE');
      } else {
        console.log('[DEBUG] No result conditions failed:', {
          dataOk: data.ok,
          hasData: !!data.data,
          hasOutputType: !!(data.data && data.data[outputType]),
          outputTypeLength: data.data && data.data[outputType] ? data.data[outputType].length : 0
        });
        throw new Error('No result generated');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      // You could add a toast notification here
    }
  };

  if (!mounted) return null;

  const modalContent = (
    <div 
      className={styles.overlay} 
      onClick={onClose}
    >
      <div 
        className={styles.modal} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h3>Text Demo</h3>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.content}>
          {!result ? (
            <div className={styles.form}>
              <div className={styles.inputSection}>
                <label className={styles.label}>What do you want to create?</label>
                <textarea
                  value={vibe}
                  onChange={(e) => setVibe(e.target.value)}
                  placeholder="e.g., A post about my new fitness routine, motivational content for Monday morning..."
                  className={styles.textarea}
                  rows={3}
                />
              </div>

              <div className={styles.row}>
                <div className={styles.inputSection}>
                  <label className={styles.label}>Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className={styles.select}
                  >
                    {platforms.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.inputSection}>
                  <label className={styles.label}>Style</label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className={styles.select}
                  >
                    {styleOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.inputSection}>
                <label className={styles.label}>Output Type</label>
                <div className={styles.outputTypes}>
                  {outputTypes.map((type) => (
                    <button
                      key={type.value}
                      className={`${styles.outputType} ${
                        outputType === type.value ? styles.active : ''
                      }`}
                      onClick={() => setOutputType(type.value)}
                    >
                      <span className={styles.outputIcon}>{type.icon}</span>
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className={styles.error}>
                  {error}
                </div>
              )}

              <button
                className={styles.generateButton}
                onClick={handleGenerate}
                disabled={isGenerating || !vibe.trim()}
              >
                {isGenerating ? 'Generating...' : 'Generate Text'}
              </button>
            </div>
          ) : (
            <div className={styles.result}>
              <div className={styles.resultHeader}>
                <h4>Generated {outputTypes.find(t => t.value === outputType)?.label}</h4>
                <button className={styles.copyButton} onClick={handleCopy}>
                  📋 Copy
                </button>
              </div>
              <div className={styles.resultText}>
                {result}
              </div>
              <div className={styles.resultActions}>
                <button
                  className={styles.newButton}
                  onClick={() => {
                    setResult(null);
                    setError(null);
                  }}
                >
                  Generate New
                </button>
                <button
                  className={styles.signupButton}
                  onClick={() => window.location.href = '/auth/signin'}
                >
                  Sign Up for More
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

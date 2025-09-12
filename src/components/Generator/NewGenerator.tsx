/**
 * NewGenerator - Nový generator s tab switcherem pro Captions a Subtitles
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import styles from './NewGenerator.module.css';
import { STYLE_PRESETS } from '@/constants/subtitleStyles';
import type { SubtitleStyle } from '@/types/subtitles';
import CrossSellModals, { useCrossSellModal } from '@/components/CrossSell/CrossSellModals';
import CaptionPositionSelector from '@/components/CaptionPositionSelector/CaptionPositionSelector';
import { useCaptionPosition } from '@/hooks/useCaptionPosition';
import { createFFmpegCommand } from '@/lib/ffmpeg/captionRenderer';
import SubtitleModeSelector from '@/components/SubtitleModeSelector';
import type { SubtitleMode } from '@/subtitles/types';
import type { CSSProperties } from 'react';
// import removed: trackStyleUiMatch
import VideoDemoUploader from '@/components/Demo/VideoDemoUploader';
import VideoDemoPreview from '@/components/Demo/VideoDemoPreview';
import { platformMeta } from '@/constants/platformMeta';
import { outputMeta } from '@/constants/outputMeta';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { styleMeta } from '@/constants/styleMeta';
import { normalizePlatform } from '@/utils/normalizePlatform';
import FeatureFlagsToggle from '@/components/FeatureFlagsToggle';
import { VideoLimitModal } from '@/components/VideoLimitModal';
// import { useVideoLimits } from '@/hooks/useVideoLimits';

type CSSVarProps = CSSProperties & { [key: `--${string}`]: string };

type TabType = 'captions' | 'subtitles';


// Platform-output mapping
const platformOutputMap: Record<string, string[]> = {
  Instagram: ['caption', 'hashtags', 'bio', 'comments', 'story'],
  TikTok: ['caption', 'hashtags', 'bio', 'story', 'hook'],
  'X/Twitter': ['caption', 'bio', 'comments'],
  OnlyFans: ['caption', 'bio', 'dm', 'story', 'hook'],
};

const platformIcon: Record<string, string> = {
  Instagram: '📸',
  TikTok: '🎵',
  'X/Twitter': '🗨️',
  OnlyFans: '⭐',
};

export default function NewGenerator() {
  const [activeTab, setActiveTab] = useState<TabType>('captions');
  const { data: session } = useSession();
  const [isGenerating, setIsGenerating] = useState(false);
  const [genMap, setGenMap] = useState<Record<string, string[]>>({});
  const [usageCount, setUsageCount] = useState(0);
  // removed unused upgrade modal state
  
  const { modalType, showTextLimitModal, showVideoLimitModal, hideModal } = useCrossSellModal();

  // Form states
  const [captionInput, setCaptionInput] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<SubtitleStyle>('BARBIE');
  const [selectedPlatform, setSelectedPlatform] = useState('Instagram');
  const [selectedOutputs, setSelectedOutputs] = useState<string[]>(['caption']);
  const { position, avoidOverlays, setPosition } = useCaptionPosition({ initialPosition: 'BOTTOM' });
  const [subtitleMode, setSubtitleMode] = useState<SubtitleMode>('TALKING_HEAD');
  // Match UI to style toggle removed per request
  const [featureFlags, setFeatureFlags] = useState({ highlightKeywords: true, emojiAugment: true, microAnimations: true });
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitReason, setLimitReason] = useState('');
  
  // Video limits hook - currently unused but may be needed for future features
  // const { limits: videoLimits, checkDurationLimit, checkGenerationLimit } = useVideoLimits();

  // Derived state
  const platforms = Object.keys(platformMeta);
  const allowedOutputs = platformOutputMap[selectedPlatform] || [];

  // Helper functions
  const handleToggleOutput = (outputType: string) => {
    setSelectedOutputs(prev => 
      prev.includes(outputType) 
        ? prev.filter(o => o !== outputType)
        : [...prev, outputType]
    );
  };

  // Mock usage tracking
  useEffect(() => {
    setUsageCount(2); // Mock: 2/3 použito
  }, []);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    
    // Cross-sell modal vypnutý podle požadavku
    // if (activeTab === 'captions' && tab === 'subtitles') {
    //   showTextToVideoModal();
    // }
  };

  const handleGenerate = async () => {
    if (activeTab === 'captions' && !captionInput.trim()) return;
    if (usageCount >= 3) {
      if (activeTab === 'captions') {
        showTextLimitModal();
      } else {
        showVideoLimitModal();
      }
      return;
    }

    setIsGenerating(true);

    if (activeTab === 'captions') {
      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            style: STYLE_PRESETS[selectedStyle].name,
            platform: normalizePlatform(selectedPlatform),
            outputs: selectedOutputs,
            vibe: captionInput,
            variants: 3,
            demo: !session?.user,
          }),
        });
        const payload = await res.json();
        if (!payload?.ok) throw new Error(payload?.error || 'GENERATION_FAILED');
        const data: Record<string, string[]> = payload.data || {};
        setGenMap(data);
      } catch {
        alert('Generation failed. Please try again.');
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    // Subtitles demo mock
    setTimeout(() => {
      // Demo: sestavíme ukázkový FFmpeg command s aktuální volbou pozice
      try {
        const demoCmd = createFFmpegCommand(
          '/path/to/input.mp4',
          '/path/to/output.mp4',
          {
            videoWidth: 1080,
            videoHeight: 1920,
            position,
            avoidOverlays,
            fontSize: 48,
            fontFamily: '/path/to/font.ttf',
            textColor: 'white',
            backgroundColor: 'black@0.7',
            outlineColor: 'black',
            outlineWidth: 3,
            lineHeight: 1.2,
            maxWidth: 900,
            text: captionInput || 'Sample caption',
          }
        );
        // Pro ukázku výstup do konzole; v produkci použijeme renderer
        // demo log for dev build
        if (process.env.NODE_ENV !== 'production') {
          console.log('FFmpeg command with computed y (mode = ' + subtitleMode + '):', demoCmd);
        }
      } catch {}

      // no-op: results replaced by genMap for captions; subtitles keeps mock only
      setUsageCount(prev => prev + 1);
      setIsGenerating(false);
    }, 2000);
  };

  const remainingUsage = 3 - usageCount;
  const isLimitReached = usageCount >= 3;

  const stylePreset = STYLE_PRESETS[selectedStyle];
  const themedVars: CSSVarProps = {
    ['--accent']: stylePreset.highlightHex,
    ['--accent-2']: stylePreset.secondaryHex,
    ['--font-ui']: stylePreset.fontFamily,
    ['--emoji']: (stylePreset.emojiSet?.[0] ?? '✨'),
  };

  return (
    <section
      id="generator"
      className={styles.generator}
      data-style={selectedStyle}
      style={themedVars}
    >
      <div className={styles.container}>
        
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            <span className={styles.styleBadge} aria-hidden="true" />
            Create your content
          </h2>
          <p className={styles.subtitle}>
            Choose between text captions or video subtitles
          </p>
          
        </div>

        {/* Tab Switcher */}
        <div className={styles.tabSwitcher}>
          <button
            className={`${styles.tab} ${activeTab === 'captions' ? styles.active : ''}`}
            onClick={() => handleTabChange('captions')}
          >
            <span className={styles.tabIcon}>✨</span>
            Captions
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'subtitles' ? styles.active : ''}`}
            onClick={() => handleTabChange('subtitles')}
          >
            <span className={styles.tabIcon}>🎬</span>
            Subtitles
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          
          {/* Captions Tab */}
          {activeTab === 'captions' && (
            <div className={styles.captionsFlow}>
              <div className={styles.inputSection}>
                <label className={styles.label}>
                  What&apos;s your vibe? ✍️
                </label>
                <textarea
                  className={styles.textarea}
                  placeholder="Describe your post, mood, or what you want to say..."
                  value={captionInput}
                  onChange={(e) => setCaptionInput(e.target.value)}
                  rows={4}
                />
              </div>

              <div className={styles.styleSection}>
                <label className={styles.label}>Choose style</label>
                <div className={styles.styleGrid}>
                  {Object.entries(STYLE_PRESETS).map(([key, preset]) => {
                    const displayName = preset.name.charAt(0) + preset.name.slice(1).toLowerCase();
                    const meta = styleMeta[displayName] || null;
                    const shownEmoji = displayName === 'Meme' ? '🤣' : displayName === 'Rage' ? '💢' : (preset.emojiSet?.[0] ?? '✨');
                    return (
                      <Tippy key={key} content={meta?.tooltip || displayName} placement="top">
                        <button
                          className={`${styles.styleCard} ${selectedStyle === key ? styles.selected : ''}`}
                          onClick={() => setSelectedStyle(key as SubtitleStyle)}
                        >
                          <div className={styles.stylePreview}>
                            <span className={styles.styleEmoji}>{shownEmoji}</span>
                            <span className={styles.styleName}>{displayName}</span>
                          </div>
                        </button>
                      </Tippy>
                    );
                  })}
                </div>
              </div>

               {/* Platform Selector */}
              <div className={styles.styleSection}>
                <label className={styles.label}>Platform</label>
                <div className={styles.platformRow}>
                  {platforms.map((platform) => (
                    <Tippy key={platform} content={platformMeta[platform]?.tooltip || platform} placement="top">
                      <button
                        type="button"
                        onClick={() => setSelectedPlatform(platform)}
                        className={`${styles.platformBtn} ${selectedPlatform === platform ? styles.platformActive : ''}`}
                        aria-pressed={selectedPlatform === platform}
                      >
                        <span className={styles.platformIcon}>{platformIcon[platform] || '⭐'}</span>
                        <span className={styles.platformLabel}>{platform}</span>
                      </button>
                    </Tippy>
                  ))}
                </div>
              </div>


               <div className={styles.styleSection}>
                <label className={styles.label}>Select Outputs</label>
                <p className={styles.tooltipText}>
                  These are the most effective content types for{' '}
                  <strong>{selectedPlatform}</strong>. Click to select.
                </p>
                <div className={styles.cardGrid}>
                  {allowedOutputs.map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`${styles.outputCard} ${
                        selectedOutputs.includes(type) ? styles.outputSelected : ''
                      }`}
                      onClick={() => handleToggleOutput(type)}
                      aria-pressed={selectedOutputs.includes(type)}
                    >
                      <span className={styles.outputIcon}>{outputMeta[type].emoji}</span>
                      <span className={styles.outputName}>{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subtitle-specific controls are only in the Subtitles tab */}

              <button
                className={`${styles.generateButton} ${isGenerating ? styles.generating : ''}`}
                onClick={handleGenerate}
                disabled={!captionInput.trim() || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <span className={styles.spinner} />
                    Generating...
                  </>
                ) : (
                  'Generate Caption'
                )}
              </button>
            </div>
          )}

          {/* Subtitles Tab */}
          {activeTab === 'subtitles' && (
            <div className={styles.subtitlesFlow}>
              <div className={styles.uploadSection}>
                <label className={styles.label}>
                  Upload a 15s vertical video to preview AI subtitles.
                </label>
                {!videoPreviewUrl ? (
                  <VideoDemoUploader 
                    onUploaded={(url) => setVideoPreviewUrl(url)} 
                    onLimitReached={(reason) => {
                      setLimitReason(reason);
                      setShowLimitModal(true);
                    }}
                  />
                ) : (
                  <VideoDemoPreview src={videoPreviewUrl} />
                )}
              </div>

              <div className={styles.styleSection}>
                <label className={styles.label}>Choose subtitle style</label>
                <div className={styles.styleGrid}>
                  {Object.entries(STYLE_PRESETS).map(([key, preset]) => {
                    const displayName = preset.name.charAt(0) + preset.name.slice(1).toLowerCase();
                    const meta = styleMeta[displayName] || null;
                    const shownEmoji = displayName === 'Meme' ? '🤣' : displayName === 'Rage' ? '💢' : (preset.emojiSet?.[0] ?? '✨');
                    return (
                      <Tippy key={key} content={meta?.tooltip || displayName} placement="top">
                        <button
                          className={`${styles.styleCard} ${selectedStyle === key ? styles.selected : ''}`}
                          onClick={() => setSelectedStyle(key as SubtitleStyle)}
                        >
                          <div className={styles.stylePreview}>
                            <span className={styles.styleEmoji}>{shownEmoji}</span>
                            <span className={styles.styleName}>{displayName}</span>
                          </div>
                        </button>
                      </Tippy>
                    );
                  })}
                </div>
              </div>

              {/* Caption Position (alternate layout) */}

              {/* Caption Position + 9:16 Preview */}
              <div className={styles.row}>
                <div className={styles.styleSection}>
                  <label className={styles.label}>Caption position</label>
                  <CaptionPositionSelector
                    value={position}
                    onChange={setPosition}
                  />
                  {/* avoid overlays checkbox removed (always on) */}
                </div>
                <div className={styles.previewBox}>
                  <div className={styles.previewStage}>
                    <div className={styles.safeTop} />
                    <div className={styles.safeBottom} />
                    <div className={styles.captionSim} style={{ top: position === 'TOP' ? '10%' : position === 'MIDDLE' ? '45%' : 'auto', bottom: position === 'BOTTOM' ? '14%' : 'auto' }}>
                      Subtitle area
                    </div>
                  </div>
                </div>
              </div>

               {/* Subtitle Mode */}
              <div className={styles.styleSection}>
                <label className={styles.label}>Subtitle mode</label>
                <SubtitleModeSelector value={subtitleMode} onChange={setSubtitleMode} />
              </div>

              {/* Feature Flags */}
              <div className={styles.styleSection}>
                <label className={styles.label}>Effects</label>
                <FeatureFlagsToggle mode={subtitleMode} value={featureFlags} onChange={setFeatureFlags} />
              </div>

              <button
                className={`${styles.generateButton} ${isGenerating ? styles.generating : ''}`}
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <span className={styles.spinner} />
                    Processing...
                  </>
                ) : (
                  'Generate Subtitles'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Usage Limit */}
        <div className={styles.usageLimit}>
          <div className={styles.usageInfo}>
            <span className={styles.usageText}>
              Free = 3 text generations/month 💖
            </span>
            {remainingUsage > 0 && (
              <span className={styles.remainingUsage}>
                {remainingUsage} left this month
              </span>
            )}
          </div>
          
          {isLimitReached && (
            <div className={styles.upgradePrompt}>
              <p>You&apos;ve used all your free generations!</p>
              <Link href="#pricing" className={styles.upgradeButton}>
                Upgrade to keep creating →
              </Link>
            </div>
          )}
        </div>

        {/* Results */}
        {activeTab === 'captions' && Object.keys(genMap).length > 0 && (
          <div className={styles.results}>
            <h3 className={styles.resultsTitle}>Your creations</h3>
            {Object.entries(genMap).map(([type, variants]) => (
              <div key={type} className={styles.resultCard}>
                <div className={styles.resultHeader}>
                  <span className={styles.resultStyle}>{type}</span>
                  <span className={styles.resultTime}>{new Date().toLocaleTimeString()}</span>
                </div>
                <div className={styles.resultContent}>
                  {Array.isArray(variants) ? variants.join('\n\n') : String(variants)}
                </div>
                <div className={styles.resultActions}>
                  <button className={styles.copyButton}>Copy</button>
                  <button className={styles.shareButton}>Share</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cross-sell Modals */}
        <CrossSellModals 
          triggerModal={modalType ?? undefined} 
          onClose={hideModal}
        />

        {/* Video Limit Modal */}
        <VideoLimitModal
          isOpen={showLimitModal}
          onClose={() => setShowLimitModal(false)}
          onUpgrade={() => {
            // Navigate to pricing or handle upgrade
            window.location.href = '#pricing';
          }}
          currentPlan={session?.user?.plan || 'FREE'}
          reason={limitReason}
        />
      </div>
    </section>
  );
}

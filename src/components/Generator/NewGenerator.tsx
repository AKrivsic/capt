/**
 * NewGenerator - Nový generator s tab switcherem pro Captions a Subtitles
 * - Bez `any`, bez nepoužitých proměnných
 * - Filtr podporovaných outputs (caption, hashtags, bio, story)
 * - Mapování stylů na API hodnoty
 * - Přesné typy odpovědi a normalizace výsledků
 */

'use client';

import { useState, useEffect, type CSSProperties } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import styles from './NewGenerator.module.css';
import { useUsageInfo } from '@/hooks/useUsageInfo';
import { useDemoLimit } from '@/hooks/useDemoLimit';
import { incUsage } from '@/utils/usage';
import { STYLE_PRESETS } from '@/constants/subtitleStyles';
import type { SubtitleStyle } from '@/types/subtitles';
import CrossSellModals, { useCrossSellModal } from '@/components/CrossSell/CrossSellModals';
import CaptionPositionSelector from '@/components/CaptionPositionSelector/CaptionPositionSelector';
import { useCaptionPosition } from '@/hooks/useCaptionPosition';
// import { createFFmpegCommand } from '@/lib/ffmpeg/captionRenderer';
import SubtitleModeSelector from '@/components/SubtitleModeSelector';
import type { SubtitleMode } from '@/subtitles/types';
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

type CSSVarProps = CSSProperties & { [key: `--${string}`]: string };
type TabType = 'captions' | 'subtitles';
type OutputKey = 'caption' | 'hashtags' | 'bio' | 'story' | 'comments' | 'dm' | 'hook';
type FeedbackState = Record<string, Record<number, "like" | "dislike" | null>>;

const SUPPORTED_OUTPUTS: readonly OutputKey[] = ['caption', 'hashtags', 'bio', 'story', 'comments', 'dm', 'hook'] as const;

function isOutputKey(x: string): x is OutputKey {
  return (SUPPORTED_OUTPUTS as readonly string[]).includes(x);
}

const STYLE_MAP: Record<string, string> = {
  BARBIE: 'Barbie',
  EDGY: 'Edgy',
  GLAMOUR: 'Glamour',
  BADDIE: 'Baddie',
  INNOCENT: 'Innocent',
  FUNNY: 'Funny',
  RAGE: 'Rage',
  MEME: 'Meme',
  STREAMER: 'Streamer',
};

// UI doporučení (může obsahovat položky, které API neumí — do API je nepošleme)
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

/* ---------- API response typy + guardy ---------- */

type MixedValue = string | { text: string } | Array<string | { text: string }>;

interface ApiSuccess {
  ok: true;
  result?: Partial<Record<OutputKey, MixedValue>>;
  data?: Partial<Record<OutputKey, MixedValue>>;
}

interface ApiError {
  ok: false;
  error?: string;
  message?: string;
}

type ApiResponse = ApiSuccess | ApiError;

function isTextObj(v: unknown): v is { text: string } {
  return typeof v === 'object' && v !== null && 'text' in v && typeof (v as { text: unknown }).text === 'string';
}

function normalizeValue(v: unknown): string[] {
  if (typeof v === 'string') return [v];
  if (isTextObj(v)) return [v.text];
  if (Array.isArray(v)) {
    const out: string[] = [];
    for (const el of v as unknown[]) {
      if (typeof el === 'string') out.push(el);
      else if (isTextObj(el)) out.push(el.text);
      else out.push(JSON.stringify(el));
    }
    return out;
  }
  return [JSON.stringify(v)];
}

function normalizeResult(raw: unknown): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  if (raw && typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      map[k] = normalizeValue(v);
    }
  }
  return map;
}

/* ---------- Komponent ---------- */

export default function NewGenerator() {
  const [activeTab, setActiveTab] = useState<TabType>('captions');
  const { data: session } = useSession();
  const [isGenerating, setIsGenerating] = useState(false);
  const [genMap, setGenMap] = useState<Record<string, string[]>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [likes, setLikes] = useState<FeedbackState>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Usage tracking hooks
  const { plan, limit, left, windowLabel, leftLabel, resetHint } = useUsageInfo();
  const { uses: demoUses, canUse: canUseDemo, inc: incDemo } = useDemoLimit('captioni_demo_generator_v1', 2);
  const isTextUnlimited = limit === -1;

  const { modalType, showTextLimitModal, hideModal } = useCrossSellModal();

  // Form states
  const [captionInput, setCaptionInput] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<SubtitleStyle>('BARBIE');
  const [selectedPlatform, setSelectedPlatform] = useState('Instagram');
  const [selectedOutputs, setSelectedOutputs] = useState<string[]>(['caption']);
  const { position, setPosition } = useCaptionPosition({ initialPosition: 'BOTTOM' });
  const [subtitleMode, setSubtitleMode] = useState<SubtitleMode>('TALKING_HEAD');
  const [featureFlags, setFeatureFlags] = useState({ highlightKeywords: true, emojiAugment: true, microAnimations: true });
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitReason, setLimitReason] = useState('');

  // Derived state
  const platforms = Object.keys(platformMeta);
  const allowedOutputs = platformOutputMap[selectedPlatform] || [];

  // Load feedback state from localStorage
  useEffect(() => {
    try {
      const likesRaw = localStorage.getItem('captioni_likes_v1');
      if (likesRaw) setLikes(JSON.parse(likesRaw));
    } catch {
      // ignore
    }
  }, []);

  // Feedback functions
  async function saveHistoryFeedback(params: {
    type: string;
    index: number;
    text: string;
    feedback: "like" | "dislike" | null;
  }) {
    try {
      await fetch('/api/history/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: normalizePlatform(selectedPlatform),
          style: STYLE_MAP[selectedStyle] ?? STYLE_PRESETS[selectedStyle].name,
          type: params.type,
          index: params.index,
          text: params.text,
          feedback: params.feedback,
        }),
      });
    } catch {
      // no-op
    }
  }

  function persistLikes(next: FeedbackState) {
    try {
      localStorage.setItem('captioni_likes_v1', JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  function toggleFeedback(key: string, idx: number, val: "like" | "dislike") {
    setLikes((prev) => {
      const cur = prev[key] || {};
      const nextVal = cur[idx] === val ? null : val; // toggle
      const next: FeedbackState = { ...prev, [key]: { ...cur, [idx]: nextVal } };
      persistLikes(next);
      const text = (Array.isArray(genMap[key]) ? genMap[key][idx] : genMap[key]) ?? "";
      void saveHistoryFeedback({
        type: key,
        index: idx,
        text: String(text ?? ""),
        feedback: nextVal,
      });
      return next;
    });
  }

  const handleCopy = async (text: string, key?: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    } finally {
      if (key) {
        setCopiedKey(key);
        window.setTimeout(() => setCopiedKey(null), 1500);
      }
    }
  };

  const handleGenerate = async () => {
    setErrorMsg(null);

    if (activeTab === 'captions' && !captionInput.trim()) return;

    // limity
    if (session?.user) {
      if (!isTextUnlimited && (left === null || left <= 0)) {
        showTextLimitModal();
        return;
      }
    } else {
      if (!canUseDemo) {
        showTextLimitModal();
        return;
      }
    }

    setIsGenerating(true);

    if (activeTab === 'captions') {
      try {
        // vyřadíme nepodporované outputy
        const safeOutputs = selectedOutputs.filter(isOutputKey);
        if (safeOutputs.length === 0) {
          setErrorMsg('Select at least one supported output (caption, hashtags, bio, story).');
          return;
        }

        const styleForApi = STYLE_MAP[selectedStyle] ?? STYLE_PRESETS[selectedStyle].name;
        const platformSlug = normalizePlatform(selectedPlatform);

        // Validate inputs before sending
        console.log('[NewGenerator] Sending request:', {
          style: styleForApi,
          platform: platformSlug,
          outputs: safeOutputs,
          vibe: captionInput.trim(),
          vibeLength: captionInput.trim().length,
          variants: 3,
          demo: !session?.user,
        });

        // Check for common issues
        if (!styleForApi) {
          console.error('[NewGenerator] Style mapping failed:', { selectedStyle, STYLE_MAP, STYLE_PRESETS });
          throw new Error('Invalid style selected');
        }
        if (!platformSlug) {
          console.error('[NewGenerator] Platform normalization failed:', selectedPlatform);
          throw new Error('Invalid platform selected');
        }
        if (captionInput.trim().length < 2) {
          console.error('[NewGenerator] Vibe too short:', captionInput.trim().length);
          throw new Error('Vibe must be at least 2 characters');
        }
        if (captionInput.trim().length > 600) {
          console.error('[NewGenerator] Vibe too long:', captionInput.trim().length);
          throw new Error('Vibe must be less than 600 characters');
        }

        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            style: styleForApi,
            platform: platformSlug,
            outputs: safeOutputs,
            vibe: captionInput.trim(),
            // Remove variants parameter - let API use DEFAULT_VARIANTS
            demo: !session?.user,
          }),
        });

        let payload: ApiResponse | null = null;
        try {
          payload = (await res.json()) as unknown as ApiResponse;
        } catch {
          // mohla přijít prázdná/HTML odpověď
        }

        if (!res.ok) {
          const msg = (payload as ApiError | null)?.message || (payload as ApiError | null)?.error || `HTTP ${res.status}`;
          throw new Error(msg);
        }
        if (!payload || payload.ok !== true) {
          const msg = (payload as ApiError | null)?.message || (payload as ApiError | null)?.error || 'GENERATION_FAILED';
          throw new Error(msg);
        }

        const raw = payload.result ?? payload.data ?? {};
        const normalized = normalizeResult(raw);
        setGenMap(normalized);

        // Automatically save to history for authenticated users
        if (session?.user && normalized) {
          for (const [type, variants] of Object.entries(normalized)) {
            if (Array.isArray(variants)) {
              for (let i = 0; i < variants.length; i++) {
                const text = variants[i];
                if (typeof text === 'string' && text.trim()) {
                  try {
                    await fetch('/api/history/save', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        platform: platformSlug,
                        style: styleForApi,
                        type,
                        index: i,
                        text,
                        feedback: null, // no feedback on auto-save
                      }),
                    });
                  } catch {
                    // ignore history save errors
                  }
                }
              }
            }
          }
        }

        if (!session?.user) {
          incDemo();
        } else {
          // Update localStorage usage for authenticated users (FREE plan)
          incUsage('gen');
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Generation failed. Please try again.';
        setErrorMsg(msg);
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    // ----- Subtitles (real processing) -----
    if (activeTab === 'subtitles') {
      try {
        // Check if we have a video file
        if (!videoPreviewUrl) {
          setErrorMsg('Please upload a video first');
          setIsGenerating(false);
          return;
        }

        // Get video ID from store or extract from preview URL
        const { useVideoSelectionStore } = await import('@/store/videoSelection');
        const { extractVideoIdFromPreviewUrl } = await import('@/utils/video/extractId');
        
        const { videoId, previewUrl } = useVideoSelectionStore.getState();
        const effectiveVideoId = videoId ?? (previewUrl ? extractVideoIdFromPreviewUrl(previewUrl) : null);

        if (!effectiveVideoId) {
          throw new Error('Missing videoId. Re-upload the video to continue.');
        }

        // Get video duration (estimate or from metadata)
        // const durationSec = 15; // Demo videos are limited to 15s

        const styleForApi = STYLE_MAP[selectedStyle] ?? STYLE_PRESETS[selectedStyle].name;

        const res = await fetch('/api/video/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileId: effectiveVideoId,
            style: styleForApi,
          }),
        });

        const payload = await res.json();

        if (!res.ok) {
          throw new Error(payload.error || 'Video processing failed');
        }

        if (payload.ok) {
          // Success - show processing status
          console.log('Video processing started:', payload.jobId);
          // TODO: Implement real-time status updates
          setErrorMsg(null);
        } else {
          throw new Error(payload.error || 'Video processing failed');
        }

        if (!session?.user) {
          incDemo();
        }

      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Video processing failed. Please try again.';
        setErrorMsg(msg);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const stylePreset = STYLE_PRESETS[selectedStyle];
  const themedVars: CSSVarProps = {
    ['--accent']: stylePreset.highlightHex,
    ['--accent-2']: stylePreset.secondaryHex,
    ['--font-ui']: stylePreset.fontFamily,
    ['--emoji']: stylePreset.emojiSet?.[0] ?? '✨',
  };

  // helper pro čtení plánu ze session.user bez `any`
  // interface UserWithPlan { plan?: string }
  // const currentPlan = (session?.user as UserWithPlan | undefined)?.plan ?? 'FREE';

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
            onClick={() => setActiveTab('captions')}
          >
            <span className={styles.tabIcon}>✨</span>
            Captions
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'subtitles' ? styles.active : ''}`}
            onClick={() => setActiveTab('subtitles')}
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
                    const shownEmoji =
                      displayName === 'Meme' ? '🤣' :
                      displayName === 'Rage' ? '💢' :
                      (preset.emojiSet?.[0] ?? '✨');
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
                      onClick={() =>
                        setSelectedOutputs(prev =>
                          prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                        )
                      }
                      aria-pressed={selectedOutputs.includes(type)}
                    >
                      <span className={styles.outputIcon}>{outputMeta[type]?.emoji ?? '✨'}</span>
                      <span className={styles.outputName}>{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {errorMsg && <div className={styles.errorBox}>{errorMsg}</div>}

              {session?.user ? (
                <button
                  className={`${styles.generateButton} ${isGenerating ? styles.generating : ''}`}
                  onClick={handleGenerate}
                  disabled={!captionInput.trim() || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <div className={styles.loadingContainer}>
                        <div className={styles.progressBar}>
                          <div className={styles.progressFill} />
                        </div>
                        <span className={styles.spinner} />
                        <span>Generating...</span>
                      </div>
                    </>
                  ) : (
                    'Generate Caption'
                  )}
                </button>
              ) : (
                <div className={styles.demoButtons}>
                  <Link href="/try" className={styles.demoButton}>
                    🎯 Try Demo
                  </Link>
                  <Link href="/api/auth/signin" className={styles.freeButton}>
                    Free
                  </Link>
                </div>
              )}
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
                    onUploaded={(data) => setVideoPreviewUrl(data.previewUrl)}
                    onLimitReached={(reason) => {
                      setLimitReason(reason);
                      setShowLimitModal(true);
                    }}
                  />
                ) : (
                  <div className={styles.uploadContainer}>
                    <VideoDemoPreview src={videoPreviewUrl} />
                    <div className={styles.uploadSuccess}>
                      <p>Video uploaded! Continue by selecting subtitle style below.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.styleSection}>
                <label className={styles.label}>Choose subtitle style</label>
                <div className={styles.styleGrid}>
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

              <div className={styles.row}>
                <div className={styles.styleSection}>
                  <label className={styles.label}>Caption position</label>
                  <CaptionPositionSelector value={position} onChange={setPosition} />
                </div>
                <div className={styles.previewBox}>
                  <div className={styles.previewStage}>
                    <div className={styles.safeTop} />
                    <div className={styles.safeBottom} />
                    <div
                      className={styles.captionSim}
                      style={{
                        top: position === 'TOP' ? '10%' : position === 'MIDDLE' ? '45%' : 'auto',
                        bottom: position === 'BOTTOM' ? '14%' : 'auto'
                      }}
                    >
                      Subtitle area
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.styleSection}>
                <label className={styles.label}>Subtitle mode</label>
                <SubtitleModeSelector value={subtitleMode} onChange={setSubtitleMode} />
              </div>

              <div className={styles.styleSection}>
                <label className={styles.label}>Effects</label>
                <FeatureFlagsToggle mode={subtitleMode} value={featureFlags} onChange={setFeatureFlags} />
              </div>

              {session?.user ? (
                <button
                  className={`${styles.generateButton} ${isGenerating ? styles.generating : ''}`}
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <div className={styles.loadingContainer}>
                        <div className={styles.progressBar}>
                          <div className={styles.progressFill} />
                        </div>
                        <span className={styles.spinner} />
                        <span>Processing...</span>
                      </div>
                    </>
                  ) : (
                    'Generate Subtitles'
                  )}
                </button>
              ) : (
                <div className={styles.demoButtons}>
                  <Link href="/try" className={styles.demoButton}>
                    🎯 Try Demo
                  </Link>
                  <Link href="/api/auth/signin" className={styles.freeButton}>
                    Free
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Usage Limit - show for all users */}
        <div className={styles.usageLimit}>
          <div className={styles.usageInfo}>
            {session?.user ? (
              <>
                <span className={styles.usageText}>
                  {plan} = {isTextUnlimited ? 'Unlimited' : `${limit} text generations/${windowLabel}`} 💖
                </span>
                {!isTextUnlimited && left !== null && left > 0 && (
                  <span className={styles.remainingUsage}>
                    {leftLabel} {resetHint}
                  </span>
                )}
              </>
            ) : (
              <>
                <span className={styles.usageText}>
                  Demo = 2 text generations/month 🎯
                </span>
                {canUseDemo && (
                  <span className={styles.remainingUsage}>
                    {2 - demoUses} left this month
                  </span>
                )}
              </>
            )}
          </div>

          {((session?.user && !isTextUnlimited && left !== null && left <= 0) || (!session?.user && !canUseDemo)) && (
            <div className={styles.upgradePrompt}>
              <p>{session?.user ? `You've used all your ${plan.toLowerCase()} generations!` : "You've used all your demo generations!"}</p>
              <Link href="#pricing" className={styles.upgradeButton}>
                {session?.user ? 'Upgrade to keep creating' : 'Sign up for more generations'} →
              </Link>
            </div>
          )}
        </div>

        {/* Results */}
        {activeTab === 'captions' && Object.keys(genMap).length > 0 && (
          <div className={styles.results}>
            <h3 className={styles.resultsTitle}>Your creations</h3>
            {Object.entries(genMap).map(([type, variants]) => {
              const meta = outputMeta[type] || {
                emoji: "✨",
                color: "#6B7280",
                description: "Generated text for your selected option.",
              };
              const list = Array.isArray(variants) ? variants : [String(variants)];

              return (
                <div key={type} className={styles.resultCard}>
                  <div className={styles.resultHeader}>
                    <span className={styles.resultStyle} style={{ color: meta.color }}>
                      {meta.emoji} {type.toUpperCase()}
                    </span>
                    <span className={styles.resultTime}>{new Date().toLocaleTimeString()}</span>
                  </div>
                  <p className={styles.resultDescription}>{meta.description}</p>

                  {list.map((text, idx) => {
                    const status = likes[type]?.[idx] ?? null;
                    const copyId = `${type}-${idx}`;
                    return (
                      <div key={copyId} className={styles.variantBlock}>
                        <pre className={styles.resultText}>{text}</pre>
                        <div className={styles.variantActions}>
                          <button
                            className={styles.copyButton}
                            onClick={() => handleCopy(text, copyId)}
                            aria-label="Copy text to clipboard"
                          >
                            {copiedKey === copyId ? "Copied!" : "Copy"}
                          </button>

                          <button
                            className={`${styles.feedbackButton} ${status === "like" ? styles.active : ""}`}
                            onClick={() => toggleFeedback(type, idx, "like")}
                            aria-pressed={status === "like"}
                            aria-label="Like this variant"
                            title="I like this"
                          >
                            👍
                          </button>

                          <button
                            className={`${styles.feedbackButton} ${status === "dislike" ? styles.active : ""}`}
                            onClick={() => toggleFeedback(type, idx, "dislike")}
                            aria-pressed={status === "dislike"}
                            aria-label="Dislike this variant"
                            title="Not for me"
                          >
                            👎
                          </button>

                          {!!status && (
                            <span className={styles.pickedLabel}>
                              {status === "like" ? "Liked" : "Disliked"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
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
          onUpgrade={() => { window.location.href = '#pricing'; }}
          currentPlan={plan}
          reason={limitReason}
        />
      </div>
    </section>
  );
}

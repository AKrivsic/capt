'use client';

import { useState, useEffect } from 'react';
import type { FeatureFlags, SubtitleMode } from '@/subtitles/types';

interface Props {
  mode: SubtitleMode;
  value?: FeatureFlags;
  onChange?: (flags: FeatureFlags) => void;
}

const DEFAULTS_BY_MODE: Record<SubtitleMode, FeatureFlags> = {
  TALKING_HEAD: { highlightKeywords: true, emojiAugment: true, microAnimations: true },
  CINEMATIC_CLIP: { highlightKeywords: true, emojiAugment: false, microAnimations: true },
};

export default function FeatureFlagsToggle({ mode, value, onChange }: Props) {
  const [flags, setFlags] = useState<FeatureFlags>(value ?? DEFAULTS_BY_MODE[mode]);

  useEffect(() => {
    if (!value) setFlags(DEFAULTS_BY_MODE[mode]);
  }, [mode, value]);

  useEffect(() => { onChange?.(flags); }, [flags, onChange]);

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }} title="Emphasize up to 2 words per line with your style’s highlight color.">
        <input
          type="checkbox"
          checked={flags.highlightKeywords}
          onChange={(e) => setFlags(prev => ({ ...prev, highlightKeywords: e.target.checked }))}
        />
        Keyword highlight
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }} title="Add a subtle emoji that matches the vibe. Mostly for Barbie/Baddie/Funny.">
        <input
          type="checkbox"
          checked={flags.emojiAugment}
          onChange={(e) => setFlags(prev => ({ ...prev, emojiAugment: e.target.checked }))}
        />
        Emoji augment
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }} title="Short intro effects (fade/bounce/pop/glitch). Keep it subtle.">
        <input
          type="checkbox"
          checked={flags.microAnimations}
          onChange={(e) => setFlags(prev => ({ ...prev, microAnimations: e.target.checked }))}
        />
        Micro animations
      </label>
    </div>
  );
}


























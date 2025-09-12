'use client';

import { useState } from 'react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import type { SubtitleMode } from '@/subtitles/types';

interface Props {
  value: SubtitleMode;
  onChange: (value: SubtitleMode) => void;
  disabled?: boolean;
}

const OPTIONS: Array<{ value: SubtitleMode; label: string; tooltip: string }> = [
  {
    value: 'TALKING_HEAD',
    label: 'Talking Head',
    tooltip: 'Big, fast, bottom – best for talking to camera.',
  },
  {
    value: 'CINEMATIC_CLIP',
    label: 'Cinematic Clip',
    tooltip: 'Clean, balanced, bottom/middle – best for film/dialog.',
  },
];

export default function SubtitleModeSelector({ value, onChange, disabled = false }: Props) {
  const [hover, setHover] = useState<SubtitleMode | null>(null);
  const [focus, setFocus] = useState<SubtitleMode | null>(null);
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <div key={opt.value} style={{ position: 'relative' }}>
            <Tippy
              content={opt.tooltip}
              appendTo={() => document.body}
              placement="bottom-start"
              maxWidth={280}
              offset={[0, 6]}
              interactive={false}
              animation="shift-away"
              disabled={disabled}
              visible={hover === opt.value || focus === opt.value}
              zIndex={9999}
            >
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: disabled ? 'not-allowed' : 'pointer' }}
              onMouseEnter={() => setHover(opt.value)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setFocus(opt.value)}
              onBlur={() => setFocus(null)}
            >
              <input
                type="radio"
                name="subtitle-mode"
                value={opt.value}
                checked={selected}
                onChange={() => !disabled && onChange(opt.value)}
                disabled={disabled}
              />
              {opt.label}
              </label>
            </Tippy>
          </div>
        );
      })}
    </div>
  );
}



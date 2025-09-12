/**
 * StylePicker - Výběr stylu titulků s náhledem
 * 6 presetů s vizuálními ukázkami
 */

'use client';

import { useState, useCallback } from 'react';
import styles from './StylePicker.module.css';
import { STYLE_PRESETS, getStyleCSSVars } from '@/constants/subtitleStyles';
import type { SubtitleStyle } from '@/types/subtitles';
import CaptionPositionSelector from '@/components/CaptionPositionSelector/CaptionPositionSelector';
import { useCaptionPosition } from '@/hooks/useCaptionPosition';
import type { CaptionPosition } from '@/types/captionPosition';

interface Props {
  onStyleSelect: (style: SubtitleStyle) => void;
  selectedStyle: SubtitleStyle | null;
  videoUrl?: string; // Pro náhled videa (budoucí feature)
  onPositionChange?: (position: CaptionPosition) => void;
}

export default function StylePicker({ onStyleSelect, selectedStyle, onPositionChange }: Props) {
  const [previewStyle, setPreviewStyle] = useState<SubtitleStyle | null>(null);
  const { position, setPosition } = useCaptionPosition({
    onPositionChange,
  });

  const handleStyleClick = useCallback((style: SubtitleStyle) => {
    onStyleSelect(style);
  }, [onStyleSelect]);

  const handleStyleHover = useCallback((style: SubtitleStyle | null) => {
    setPreviewStyle(style);
  }, []);

  const renderStyleCard = useCallback((style: SubtitleStyle) => {
    const preset = STYLE_PRESETS[style];
    const isSelected = selectedStyle === style;
    const isHovered = previewStyle === style;
    const cssVars = getStyleCSSVars(style);

    return (
      <div
        key={style}
        className={`${styles.styleCard} ${isSelected ? styles.selected : ''} ${isHovered ? styles.hovered : ''}`}
        onClick={() => handleStyleClick(style)}
        onMouseEnter={() => handleStyleHover(style)}
        onMouseLeave={() => handleStyleHover(null)}
        style={cssVars}
      >
        {/* Ukázka textu */}
        <div className={styles.previewContainer}>
          <div className={styles.previewText}>
            Ahoj světe! 👋
          </div>
          <div className={styles.previewSubtext}>
            {preset.emojiSet.join(' ')}
          </div>
        </div>

        {/* Informace o stylu */}
        <div className={styles.styleInfo}>
          <h3 className={styles.styleName}>
            {preset.name.charAt(0) + preset.name.slice(1).toLowerCase()}
          </h3>
          <p className={styles.styleDescription}>
            {getStyleDescription(style)}
          </p>
          <div className={styles.styleTags}>
            <span className={styles.tag}>{preset.animation}</span>
            <span className={styles.tag}>{preset.fontFamily.split(',')[0]}</span>
          </div>
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <div className={styles.selectedIndicator}>
            ✓
          </div>
        )}
      </div>
    );
  }, [selectedStyle, previewStyle, handleStyleClick, handleStyleHover]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Vyberte styl titulků</h2>
        <p className={styles.subtitle}>
          Každý styl má jedinečné písmo, barvy a animace
        </p>
      </div>

      <div className={styles.stylesGrid}>
        {Object.keys(STYLE_PRESETS).map((style) =>
          renderStyleCard(style as SubtitleStyle)
        )}
      </div>

      {/* Caption Position Selector */}
      <div className={styles.positionSection}>
        <CaptionPositionSelector
          value={position}
          onChange={setPosition}
        />
      </div>

      {/* Velký náhled */}
      {(selectedStyle || previewStyle) && (
        <div className={styles.bigPreview}>
          <h3 className={styles.previewTitle}>Náhled</h3>
          <div 
            className={styles.bigPreviewContent}
            style={getStyleCSSVars(selectedStyle || previewStyle!)}
          >
            <div className={styles.bigPreviewText}>
              Toto je ukázka titulků
            </div>
            <div className={styles.bigPreviewEmoji}>
              {STYLE_PRESETS[selectedStyle || previewStyle!].emojiSet.join(' ')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Popis jednotlivých stylů
function getStyleDescription(style: SubtitleStyle): string {
  const descriptions: Record<SubtitleStyle, string> = {
    BARBIE: 'Pink and purple colors with pop animations',
    BADDIE: 'Bold black and white design with glitch effects',
    INNOCENT: 'Clean minimal style with soft colors',
    FUNNY: 'Playful yellow colors with bounce animations',
    GLAMOUR: 'Elegant pink design with fade effects',
    EDGY: 'Dark modern style with green accents',
    RAGE: 'Aggressive red design with shake effects',
    MEME: 'Viral meme style with bold typography',
    STREAMER: 'Gaming streamer style with neon effects'
  };
  
  return descriptions[style];
}

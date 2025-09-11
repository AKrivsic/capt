/**
 * FormatSelector - Komponenta pro výběr výstupního formátu videa
 */

'use client';

import { useState } from 'react';
import type { VideoFormat } from '@/constants/videoFormats';
import { VIDEO_FORMATS, getRecommendedFormat } from '@/constants/videoFormats';
import styles from './FormatSelector.module.css';

interface FormatSelectorProps {
  value: VideoFormat;
  onChange: (format: VideoFormat) => void;
  platform?: string;
  disabled?: boolean;
  className?: string;
}

export default function FormatSelector({
  value,
  onChange,
  platform,
  disabled = false,
  className = '',
}: FormatSelectorProps) {
  const [hoveredFormat, setHoveredFormat] = useState<VideoFormat | null>(null);

  const handleFormatChange = (format: VideoFormat) => {
    if (!disabled) {
      onChange(format);
    }
  };

  // Get recommended format based on platform
  const recommendedFormat = platform ? getRecommendedFormat(platform) : null;

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.label}>
        <span className={styles.labelText}>Output Format</span>
        <span className={styles.labelIcon}>📐</span>
      </div>
      
      <div className={styles.formats}>
        {(Object.keys(VIDEO_FORMATS) as VideoFormat[]).map((format) => {
          const info = VIDEO_FORMATS[format];
          const isSelected = value === format;
          const isHovered = hoveredFormat === format;
          const isRecommended = format === recommendedFormat;
          
          return (
            <div
              key={format}
              className={`${styles.formatOption} ${
                isSelected ? styles.selected : ''
              } ${disabled ? styles.disabled : ''} ${
                isRecommended ? styles.recommended : ''
              }`}
              onClick={() => handleFormatChange(format)}
              onMouseEnter={() => setHoveredFormat(format)}
              onMouseLeave={() => setHoveredFormat(null)}
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-pressed={isSelected}
              aria-label={`Select ${info.name} format`}
            >
              <div className={styles.radioButton}>
                <div className={`${styles.radioCircle} ${isSelected ? styles.radioSelected : ''}`}>
                  {isSelected && <div className={styles.radioDot} />}
                </div>
              </div>
              
              <div className={styles.formatInfo}>
                <div className={styles.formatHeader}>
                  <span className={styles.formatEmoji}>{info.emoji}</span>
                  <span className={styles.formatName}>{info.name}</span>
                  {isRecommended && (
                    <span className={styles.recommendedBadge}>Recommended</span>
                  )}
                </div>
                <div className={styles.formatDescription}>{info.description}</div>
                <div className={styles.formatPlatforms}>
                  {info.platforms.join(', ')}
                </div>
              </div>
              
              {/* Tooltip: only on hover */}
              {isHovered && (
                <div className={styles.tooltip}>
                  <div className={styles.tooltipArrow} />
                  <div className={styles.tooltipContent}>
                    <strong>{info.name}</strong>
                    <p>{info.description}</p>
                    <p><strong>Platforms:</strong> {info.platforms.join(', ')}</p>
                    {info.aspectRatio && (
                      <p><strong>Aspect Ratio:</strong> {info.aspectRatio.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Preview area */}
      <div className={styles.preview}>
        <div className={styles.previewLabel}>Preview:</div>
        <div className={styles.previewVideo}>
          <div className={styles.previewOverlay}>
            {value === 'ORIGINAL' && <div className={`${styles.previewCaption} ${styles.original}`}>Original</div>}
            {value === '9:16' && <div className={`${styles.previewCaption} ${styles.vertical}`}>9:16</div>}
            {value === '1:1' && <div className={`${styles.previewCaption} ${styles.square}`}>1:1</div>}
            {value === '16:9' && <div className={`${styles.previewCaption} ${styles.landscape}`}>16:9</div>}
          </div>
        </div>
      </div>
    </div>
  );
}


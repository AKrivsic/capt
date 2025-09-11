/**
 * CaptionPositionSelector - Komponenta pro výběr pozice titulků
 */

'use client';

import { useState } from 'react';
import type { CaptionPosition } from '@/types/captionPosition';
import { getPositionInfo } from '@/utils/layout';
import styles from './CaptionPositionSelector.module.css';

interface CaptionPositionSelectorProps {
  value: CaptionPosition;
  onChange: (position: CaptionPosition) => void;
  disabled?: boolean;
  className?: string;
}

const POSITIONS: CaptionPosition[] = ['TOP', 'MIDDLE', 'BOTTOM'];

export default function CaptionPositionSelector({
  value,
  onChange,
  disabled = false,
  className = '',
}: CaptionPositionSelectorProps) {
  const [hoveredPosition, setHoveredPosition] = useState<CaptionPosition | null>(null);
  const [focusedPosition, setFocusedPosition] = useState<CaptionPosition | null>(null);

  const handlePositionChange = (position: CaptionPosition) => {
    if (!disabled) {
      onChange(position);
    }
  };

  return (
    <div className={`${styles.container} ${className}`}>
      {/* <div className={styles.label}>
        <span className={styles.labelText}>Caption Position</span>
        <span className={styles.labelIcon}>📍</span>
      </div> */}
      
      <div className={styles.positions}>
        {POSITIONS.map((position) => {
          const info = getPositionInfo(position);
          const isSelected = value === position;
          const isHovered = hoveredPosition === position;
          
          return (
            <div
              key={position}
              className={`${styles.positionOption} ${
                isSelected ? styles.selected : ''
              } ${disabled ? styles.disabled : ''}`}
              onClick={() => handlePositionChange(position)}
              onMouseEnter={() => setHoveredPosition(position)}
              onMouseLeave={() => setHoveredPosition(null)}
              onFocus={() => setFocusedPosition(position)}
              onBlur={() => setFocusedPosition(null)}
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-pressed={isSelected}
              aria-label={`Select ${info.label} position`}
            >
              <div className={styles.radioButton}>
                <div className={`${styles.radioCircle} ${isSelected ? styles.radioSelected : ''}`}>
                  {isSelected && <div className={styles.radioDot} />}
                </div>
              </div>
              
              <div className={styles.positionInfo}>
                <div className={styles.positionLabel}>{info.label}</div>
                <div className={styles.positionDescription}>{info.description}</div>
              </div>
              
              {/* Tooltip: only on hover or keyboard focus */}
              {(isHovered || focusedPosition === position) && (
                <div className={styles.tooltip}>
                  <div className={styles.tooltipArrow} />
                  <div className={styles.tooltipContent}>
                    {info.tooltip}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Preview area */}
      {/* <div className={styles.preview}>
        <div className={styles.previewLabel}>Preview:</div>
        <div className={styles.previewVideo}>
          <div className={styles.previewOverlay}>
            {value === 'TOP' && <div className={`${styles.previewCaption} ${styles.top}`}>Caption</div>}
            {value === 'MIDDLE' && <div className={`${styles.previewCaption} ${styles.middle}`}>Caption</div>}
            {value === 'BOTTOM' && <div className={`${styles.previewCaption} ${styles.bottom}`}>Caption</div>}
          </div>
        </div>
      </div> */}
    </div>
  );
}

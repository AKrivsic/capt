/**
 * Hook pro správu pozice titulků
 */

import { useState, useCallback } from 'react';
import type { CaptionPosition } from '@/types/captionPosition';

interface UseCaptionPositionOptions {
  initialPosition?: CaptionPosition;
  onPositionChange?: (position: CaptionPosition) => void;
}

export function useCaptionPosition(options: UseCaptionPositionOptions = {}) {
  const { initialPosition = 'BOTTOM', onPositionChange } = options;
  
  const [position, setPosition] = useState<CaptionPosition>(initialPosition);
  // avoidOverlays no longer exposed in UI; default true for TikTok/IG safe area
  const [avoidOverlays, setAvoidOverlays] = useState<boolean>(true);

  const handlePositionChange = useCallback((newPosition: CaptionPosition) => {
    setPosition(newPosition);
    onPositionChange?.(newPosition);
  }, [onPositionChange]);

  const handleAvoidOverlaysChange = useCallback((avoid: boolean) => {
    setAvoidOverlays(avoid);
  }, []);

  const reset = useCallback(() => {
    setPosition(initialPosition);
    setAvoidOverlays(true);
  }, [initialPosition]);

  return {
    position,
    avoidOverlays,
    setPosition: handlePositionChange,
    setAvoidOverlays: handleAvoidOverlaysChange,
    reset,
  };
}

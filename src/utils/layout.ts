/**
 * Utility funkce pro výpočet pozice titulků ve videu
 */

import type { 
  CaptionPosition, 
  LayoutInput, 
  CaptionLayout, 
  SafeAreaMargins 
} from '@/types/captionPosition';

/**
 * Konstanty pro bezpečné oblasti
 */
const SAFE_AREA_CONSTANTS = {
  TOP_MARGIN_PERCENT: 10,
  BOTTOM_MARGIN_PERCENT: 14,
  BOTTOM_MARGIN_WITH_OVERLAYS_PERCENT: 16,
} as const;

/**
 * Vypočítá bezpečné okraje podle nastavení
 */
function getSafeAreaMargins(avoidOverlays: boolean): SafeAreaMargins {
  return {
    topMarginPercent: SAFE_AREA_CONSTANTS.TOP_MARGIN_PERCENT,
    bottomMarginPercent: avoidOverlays 
      ? SAFE_AREA_CONSTANTS.BOTTOM_MARGIN_WITH_OVERLAYS_PERCENT
      : SAFE_AREA_CONSTANTS.BOTTOM_MARGIN_PERCENT,
  };
}

/**
 * Vypočítá y pozici pro TOP pozici
 */
function computeTopPosition(
  videoHeight: number, 
  lineHeightPx: number, 
  linesCount: number,
  safeArea: SafeAreaMargins
): number {
  const topMargin = (videoHeight * safeArea.topMarginPercent) / 100;
  const textHeight = lineHeightPx * linesCount;
  
  // Pozice je top margin + polovina výšky textu
  return topMargin + (textHeight / 2);
}

/**
 * Vypočítá y pozici pro MIDDLE pozici
 */
function computeMiddlePosition(
  videoHeight: number, 
  lineHeightPx: number, 
  linesCount: number
): number {
  const textHeight = lineHeightPx * linesCount;
  
  // Vycentrované podle počtu řádků
  return (videoHeight / 2) + (textHeight / 2);
}

/**
 * Vypočítá y pozici pro BOTTOM pozici
 */
function computeBottomPosition(
  videoHeight: number, 
  lineHeightPx: number, 
  linesCount: number,
  safeArea: SafeAreaMargins
): number {
  const bottomMargin = (videoHeight * safeArea.bottomMarginPercent) / 100;
  const textHeight = lineHeightPx * linesCount;
  
  // Pozice je od spodku mínus margin mínus polovina výšky textu
  return videoHeight - bottomMargin - (textHeight / 2);
}

/**
 * Zkontroluje, zda je pozice v bezpečné oblasti
 */
function isInSafeArea(
  y: number,
  videoHeight: number,
  lineHeightPx: number,
  linesCount: number,
  safeArea: SafeAreaMargins
): boolean {
  const textHeight = lineHeightPx * linesCount;
  const topMargin = (videoHeight * safeArea.topMarginPercent) / 100;
  const bottomMargin = (videoHeight * safeArea.bottomMarginPercent) / 100;
  
  const textTop = y - (textHeight / 2);
  const textBottom = y + (textHeight / 2);
  
  return textTop >= topMargin && textBottom <= (videoHeight - bottomMargin);
}

/**
 * Hlavní funkce pro výpočet y pozice titulků
 * 
 * @param input - Vstupní parametry pro výpočet pozice
 * @returns Objekt s y pozicí a informacemi o bezpečné oblasti
 */
export function computeY(input: LayoutInput): CaptionLayout {
  const { 
    videoWidth, 
    videoHeight, 
    position, 
    lineHeightPx, 
    linesCount, 
    avoidOverlays 
  } = input;

  // Validace vstupních parametrů
  if (videoWidth <= 0 || videoHeight <= 0) {
    throw new Error('Video dimensions must be greater than 0');
  }
  
  if (lineHeightPx <= 0) {
    throw new Error('Line height must be greater than 0');
  }
  
  if (linesCount <= 0) {
    throw new Error('Number of lines must be greater than 0');
  }

  const safeArea = getSafeAreaMargins(avoidOverlays);
  let y: number;

  // Výpočet pozice podle typu
  switch (position) {
    case 'TOP':
      y = computeTopPosition(videoHeight, lineHeightPx, linesCount, safeArea);
      break;
      
    case 'MIDDLE':
      y = computeMiddlePosition(videoHeight, lineHeightPx, linesCount);
      break;
      
    case 'BOTTOM':
      y = computeBottomPosition(videoHeight, lineHeightPx, linesCount, safeArea);
      break;
      
    default:
      throw new Error(`Unknown position: ${position}`);
  }

  // Kontrola, zda je pozice v bezpečné oblasti
  const isInSafe = isInSafeArea(y, videoHeight, lineHeightPx, linesCount, safeArea);

  return {
    y: Math.round(y), // Zaokrouhlíme na celé číslo
    safeArea,
    isInSafeArea: isInSafe,
  };
}

/**
 * Pomocná funkce pro získání informací o pozici
 */
export function getPositionInfo(position: CaptionPosition): {
  label: string;
  description: string;
  tooltip: string;
} {
  switch (position) {
    case 'TOP':
      return {
        label: 'Top',
        description: 'Safe area for titles, above main UI',
        tooltip: 'Safe area for titles, above main UI',
      };
      
    case 'MIDDLE':
      return {
        label: 'Middle',
        description: 'Center of video (good for dramatic styles)',
        tooltip: 'Center of video (good for dramatic styles)',
      };
      
    case 'BOTTOM':
      return {
        label: 'Bottom',
        description: 'Most common, under the visuals but above app overlays',
        tooltip: 'Most common, under the visuals but above app overlays',
      };
      
    default:
      throw new Error(`Unknown position: ${position}`);
  }
}

/**
 * Vypočítá optimální pozici pro dané video rozměry
 */
export function getOptimalPosition(
  videoWidth: number,
  videoHeight: number,
  aspectRatio: number
): CaptionPosition {
  // Pro vertikální videa (TikTok/IG Stories) doporučujeme BOTTOM
  if (aspectRatio < 1) {
    return 'BOTTOM';
  }
  
  // Pro horizontální videa můžeme použít MIDDLE nebo BOTTOM
  if (aspectRatio > 1.5) {
    return 'MIDDLE';
  }
  
  // Výchozí pozice
  return 'BOTTOM';
}

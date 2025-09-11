/**
 * Typy pro pozicování titulků ve videu
 */

export type CaptionPosition = 'TOP' | 'MIDDLE' | 'BOTTOM';

export interface LayoutInput {
  videoWidth: number;
  videoHeight: number;
  position: CaptionPosition;
  lineHeightPx: number;
  linesCount: number;
  avoidOverlays: boolean;
}

export interface SafeAreaMargins {
  topMarginPercent: number;
  bottomMarginPercent: number;
}

export interface CaptionLayout {
  y: number;
  safeArea: SafeAreaMargins;
  isInSafeArea: boolean;
}

export interface CaptionPositionInfo {
  position: CaptionPosition;
  label: string;
  description: string;
  tooltip: string;
}

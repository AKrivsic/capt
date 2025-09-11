import type { SubtitleChunk, Transcript } from './types';
import type { ModePreset } from './types';

function isSentenceBoundary(token: string): boolean {
  return /[\.!?]$/.test(token);
}

function clamp(min: number, val: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function buildSubtitleChunks(
  transcript: Transcript,
  preset: ModePreset
): SubtitleChunk[] {
  const chunks: SubtitleChunk[] = [];
  const words = transcript.words;
  if (words.length === 0) return chunks;

  // Rychlé limity
  const maxCharsPerLine = preset.maxCharsPerLine;
  const maxLines = preset.maxLines;
  const targetCpsMax = preset.targetCPS.max;

  let bufferText: string[] = [];
  let bufferStart = words[0].start;
  let lastEnd = words[0].end;

  const flushBuffer = () => {
    if (bufferText.length === 0) return;
    const full = bufferText.join(' ').trim().replace(/\s+/g, ' ');
    if (!full) {
      bufferText = [];
      return;
    }

    // Rozdělení na max 2 řádky, vyvážené
    const lines: string[] = [];
    if (full.length <= maxCharsPerLine || maxLines === 1) {
      lines.push(full);
    } else {
      // Najdi přirozený zlom co nejblíž půlce
      const mid = Math.floor(full.length / 2);
      let splitIdx = full.lastIndexOf(' ', mid);
      if (splitIdx < maxCharsPerLine / 2) {
        // fallback: první řádek co nejblíže limitu
        splitIdx = full.lastIndexOf(' ', maxCharsPerLine);
      }
      if (splitIdx === -1) splitIdx = Math.min(maxCharsPerLine, full.length - 1);
      const first = full.slice(0, splitIdx).trim();
      const second = full.slice(splitIdx).trim();
      lines.push(first);
      if (second) lines.push(second);
    }

    const duration = clamp(0.2, lastEnd - bufferStart, 10);
    // const _cps = full.length / Math.max(0.1, duration);

    // Úprava trvání dle režimu
    const minDur = 0.8;
    const maxDur = preset.mode === 'TALKING_HEAD' ? 4.0 : 5.0;
    const startSec = bufferStart;
    let endSec = lastEnd;
    if (duration < minDur) endSec = startSec + minDur;
    if (endSec - startSec > maxDur) endSec = startSec + maxDur;

    // Pokud je cps příliš vysoké, zkusíme rozdělit přísněji už při build loopu.
    // Zde jen vytváříme chunk.
    const textLines = (lines.length === 2)
      ? [lines[0], lines[1]] as [string, string]
      : [lines[0]] as [string];

    chunks.push({ textLines, startSec, endSec });
    bufferText = [];
  };

  for (let i = 0; i < words.length; i += 1) {
    const w = words[i];
    const gap = w.start - lastEnd;
    const token = w.text;

    // Pokud dlouhá pauza nebo větná hranice a už máme nějaký text → flush
    const shouldFlushByPause = gap > 0.25 && bufferText.length > 0;
    const tentative = [...bufferText, token].join(' ').trim();
    const wouldOverflow = tentative.length > maxCharsPerLine * (maxLines === 2 ? 2 : 1);

    if (shouldFlushByPause || wouldOverflow || (isSentenceBoundary(token) && bufferText.length > 0)) {
      flushBuffer();
      bufferStart = w.start;
    }

    bufferText.push(token);
    lastEnd = w.end;

    // Pokud je hustota znaků vysoká, pro jistotu uzavři chunk
    const currentDuration = clamp(0.1, lastEnd - bufferStart, 10);
    const currentCps = tentative.length / Math.max(0.1, currentDuration);
    if (currentCps > targetCpsMax) {
      flushBuffer();
    }
  }

  flushBuffer();
  return chunks;
}



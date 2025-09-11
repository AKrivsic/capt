import type { SubtitleChunk } from './types';

export function normalizeChunkTimings(chunks: SubtitleChunk[], mode: 'TALKING_HEAD' | 'CINEMATIC_CLIP'): SubtitleChunk[] {
  const minDur = 0.8;
  const maxDur = mode === 'TALKING_HEAD' ? 4.0 : 5.0;
  return chunks.map((c) => {
    const dur = c.endSec - c.startSec;
    const start = c.startSec;
    let end = c.endSec;
    if (dur < minDur) end = start + minDur;
    if (end - start > maxDur) end = start + maxDur;
    return { ...c, startSec: start, endSec: end };
  });
}



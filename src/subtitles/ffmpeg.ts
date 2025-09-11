import { computeFontSizePx, computeLineHeightPx, computeY } from './layout';
import { buildDecorations } from './decorate.js';
import { buildLineIntroFilters } from './animation';
import type { RenderInput, Decorations } from './types';

// RenderInput je definován v types.ts

function escapeTextForDrawtext(text: string): string {
  // escape ':' and quotes for drawtext
  return text.replace(/:/g, '\\:').replace(/'/g, "\\'");
}

export async function renderSubtitledVideo(input: RenderInput): Promise<void> {
  const { video, chunks, position, mode, avoidOverlays, style, featureFlags, fontFilePath, videoPath, outPath } = input;

  const fontSizePx = computeFontSizePx(video, mode);
  const lineHeightPx = computeLineHeightPx(fontSizePx, style);

  // Dekorace (keywords, emoji)
  const decorations: Decorations = buildDecorations(chunks, style, featureFlags);

  // Vygeneruj filtergraph vrstvy
  const layers: string[] = [];
  // Pomůcka: spočítat baseY pro daný chunk a použít pro obě řádky
  for (const chunk of chunks) {
    const linesCount = chunk.textLines.length;
    const yBase = computeY({ video, position, avoidOverlays, mode, linesCount, lineHeightPx });
    const baseX = '(w-text_w)/2';

    // Sestav baseline vrstvy pro každý řádek
    chunk.textLines.forEach((line, idx) => {
      const yExpr = idx === 0 ? `${yBase}` : `${yBase + lineHeightPx}`;
      const parts: string[] = [];
      if (fontFilePath) parts.push(`fontfile='${fontFilePath}'`);
      parts.push(`text='${escapeTextForDrawtext(line)}'`);
      parts.push(`fontcolor=${style.primaryHex}`);
      parts.push(`fontsize=${fontSizePx}`);
      parts.push('line_spacing=0');
      parts.push(`x=${baseX}`);
      parts.push(`y=${yExpr}`);
      if (typeof style.strokePx === 'number') {
        const strokeColor = style.secondaryHex || style.primaryHex;
        parts.push(`bordercolor=${strokeColor}`);
        parts.push(`borderw=${style.strokePx}`);
      }
      if (style.shadow) {
        parts.push(`shadowx=${style.shadow.x}`);
        parts.push(`shadowy=${style.shadow.y}`);
        parts.push(`shadowcolor=${style.shadow.color}`);
      }

      // Animace jen na baseline, pokud flag zapnut
      if (featureFlags.microAnimations && style.animation) {
        const anim = buildLineIntroFilters({
          styleAnimation: style.animation,
          startSec: chunk.startSec,
          endSec: chunk.endSec,
          baseXExpr: baseX,
          baseYExpr: yExpr,
          fontSize: fontSizePx,
        });
        for (const mod of anim.filters) parts.push(mod);
      }

      parts.push(`enable='between(t,${chunk.startSec.toFixed(2)},${chunk.endSec.toFixed(2)})'`);
      layers.push(`drawtext=${parts.join(':')}`);
    });

    // Přidej highlight a emoji vrstvy pro tento chunk a jeho řádky
    const lineTokens = decorations.tokens.filter(t => t.startSec === chunk.startSec && t.endSec === chunk.endSec);
    for (const token of lineTokens) {
      const isSecond = token.lineIndex === 1;
      const yExpr = isSecond ? `${yBase + lineHeightPx}` : `${yBase}`;
      const parts: string[] = [];
      if (fontFilePath) parts.push(`fontfile='${fontFilePath}'`);
      parts.push(`text='${escapeTextForDrawtext(token.text)}'`);
      const color = token.highlight ? (style.highlightHex || style.secondaryHex || style.primaryHex) : style.primaryHex;
      parts.push(`fontcolor=${color}`);
      parts.push(`fontsize=${fontSizePx}`);
      parts.push('line_spacing=0');
      // EMOJI umístíme mírně vpravo od středu; baseline je centrovaná, takže to vizuálně působí jako "na konci"
      const xExpr = token.emoji ? '(w+text_w)/2+10' : baseX;
      parts.push(`x=${xExpr}`);
      parts.push(`y=${yExpr}`);
      if (typeof style.strokePx === 'number' && !token.emoji) {
        const strokeColor = style.secondaryHex || style.primaryHex;
        parts.push(`bordercolor=${strokeColor}`);
        parts.push(`borderw=${style.strokePx}`);
      }
      if (style.shadow && !token.emoji) {
        parts.push(`shadowx=${style.shadow.x}`);
        parts.push(`shadowy=${style.shadow.y}`);
        parts.push(`shadowcolor=${style.shadow.color}`);
      }
      parts.push(`enable='between(t,${token.startSec.toFixed(2)},${token.endSec.toFixed(2)})'`);
      layers.push(`drawtext=${parts.join(':')}`);
    }
  }

  const filtergraph = layers.join(',');

  const args = [
    'ffmpeg',
    '-y',
    '-i', videoPath,
    '-vf', filtergraph,
    '-pix_fmt', 'yuv420p',
    '-c:v', 'libx264',
    '-crf', '18',
    '-preset', 'veryfast',
    outPath,
  ];

  // Spuštění přenecháváme okolní infrastruktuře (spawn). Zde jen vrátíme příkaz k logu.
  console.log('FFmpeg command:', args.join(' '));
}



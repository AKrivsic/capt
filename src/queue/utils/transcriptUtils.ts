import type { Transcript } from '@/types/subtitles';

export interface SubtitleChunk {
  textLines: string[];
  startSec: number;
  endSec: number;
}

/**
 * Convert transcript words to subtitle chunks for rendering
 */
export function transcriptToChunks(transcript: Transcript): SubtitleChunk[] {
  const words = transcript.words;
  if (!words || words.length === 0) {
    return [];
  }

  const chunks: SubtitleChunk[] = [];
  const maxWordsPerLine = 6; // Maximum words per subtitle line
  const maxLinesPerChunk = 2; // Maximum lines per subtitle chunk
  const minChunkDuration = 1.0; // Minimum duration in seconds
  const maxChunkDuration = 4.0; // Maximum duration in seconds

  let currentChunk: {
    words: typeof words;
    startTime: number;
    endTime: number;
  } | null = null;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    
    if (!currentChunk) {
      // Start new chunk
      currentChunk = {
        words: [word],
        startTime: word.start,
        endTime: word.end
      };
    } else {
      // Add word to current chunk
      currentChunk.words.push(word);
      currentChunk.endTime = word.end;
      
      // Check if we should finalize this chunk
      const chunkDuration = currentChunk.endTime - currentChunk.startTime;
      const shouldFinalize = 
        currentChunk.words.length >= maxWordsPerLine * maxLinesPerChunk ||
        chunkDuration >= maxChunkDuration ||
        i === words.length - 1; // Last word
      
      if (shouldFinalize && chunkDuration >= minChunkDuration) {
        // Convert words to lines
        const textLines = wordsToLines(currentChunk.words, maxWordsPerLine);
        
        chunks.push({
          textLines,
          startSec: currentChunk.startTime,
          endSec: currentChunk.endTime
        });
        
        currentChunk = null;
      }
    }
  }

  // Handle remaining chunk if any
  if (currentChunk) {
    const chunkDuration = currentChunk.endTime - currentChunk.startTime;
    if (chunkDuration >= minChunkDuration) {
      const textLines = wordsToLines(currentChunk.words, maxWordsPerLine);
      chunks.push({
        textLines,
        startSec: currentChunk.startTime,
        endSec: currentChunk.endTime
      });
    }
  }

  return chunks;
}

/**
 * Convert array of words to subtitle lines
 */
function wordsToLines(words: Transcript['words'], maxWordsPerLine: number): string[] {
  const lines: string[] = [];
  let currentLine: string[] = [];
  
  for (const word of words) {
    currentLine.push(word.text);
    
    if (currentLine.length >= maxWordsPerLine) {
      lines.push(currentLine.join(' '));
      currentLine = [];
    }
  }
  
  // Add remaining words as last line
  if (currentLine.length > 0) {
    lines.push(currentLine.join(' '));
  }
  
  return lines;
}


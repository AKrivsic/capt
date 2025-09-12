/**
 * Video output formats and aspect ratios
 */

export type VideoFormat = 'ORIGINAL' | '9:16' | '1:1' | '16:9';

export interface VideoFormatInfo {
  name: string;
  aspectRatio: number | null; // null = keep original
  description: string;
  platforms: string[];
  emoji: string;
}

export const VIDEO_FORMATS: Record<VideoFormat, VideoFormatInfo> = {
  ORIGINAL: {
    name: 'Original',
    aspectRatio: null,
    description: 'Keep original aspect ratio',
    platforms: ['All'],
    emoji: '📱'
  },
  '9:16': {
    name: '9:16 (Vertical)',
    aspectRatio: 9/16,
    description: 'Perfect for Instagram Stories, TikTok, YouTube Shorts',
    platforms: ['Instagram Stories', 'TikTok', 'YouTube Shorts', 'Snapchat'],
    emoji: '📱'
  },
  '1:1': {
    name: '1:1 (Square)',
    aspectRatio: 1,
    description: 'Great for Instagram posts, Facebook posts',
    platforms: ['Instagram Posts', 'Facebook', 'LinkedIn'],
    emoji: '⬜'
  },
  '16:9': {
    name: '16:9 (Landscape)',
    aspectRatio: 16/9,
    description: 'Perfect for YouTube, Twitter, LinkedIn videos',
    platforms: ['YouTube', 'Twitter', 'LinkedIn', 'Facebook'],
    emoji: '📺'
  }
};

export function getVideoFormatInfo(format: VideoFormat): VideoFormatInfo {
  return VIDEO_FORMATS[format];
}

export function getRecommendedFormat(platform: string): VideoFormat {
  const platformLower = platform.toLowerCase();
  
  if (platformLower.includes('tiktok') || platformLower.includes('story') || platformLower.includes('short')) {
    return '9:16';
  }
  
  if (platformLower.includes('instagram') && !platformLower.includes('story')) {
    return '1:1';
  }
  
  if (platformLower.includes('youtube') || platformLower.includes('twitter') || platformLower.includes('linkedin')) {
    return '16:9';
  }
  
  return 'ORIGINAL';
}

export function calculateOutputDimensions(
  inputWidth: number,
  inputHeight: number,
  targetFormat: VideoFormat
): { width: number; height: number } {
  if (targetFormat === 'ORIGINAL') {
    return { width: inputWidth, height: inputHeight };
  }
  
  const targetAspectRatio = VIDEO_FORMATS[targetFormat].aspectRatio!;
  const inputAspectRatio = inputWidth / inputHeight;
  
  if (inputAspectRatio > targetAspectRatio) {
    // Input is wider than target - crop width
    const newWidth = Math.round(inputHeight * targetAspectRatio);
    return { width: newWidth, height: inputHeight };
  } else {
    // Input is taller than target - crop height
    const newHeight = Math.round(inputWidth / targetAspectRatio);
    return { width: inputWidth, height: newHeight };
  }
}



// src/lib/openaiConfig.ts (NOVÝ)
export type GenParams = { 
  temperature: number; 
  top_p: number; 
  presence_penalty?: number; 
  frequency_penalty?: number;
  max_tokens?: number;
  n?: number;
};

export const perStyleParams: Record<string, GenParams> = {
  Rage:     { temperature: 0.95, top_p: 0.95, presence_penalty: 0.4, frequency_penalty: 0.2 },
  Meme:     { temperature: 0.95, top_p: 0.95, presence_penalty: 0.3, frequency_penalty: 0.2 },
  Funny:    { temperature: 0.9,  top_p: 0.95, presence_penalty: 0.3, frequency_penalty: 0.2 },
  Streamer: { temperature: 0.65, top_p: 0.9,  presence_penalty: 0.2, frequency_penalty: 0.1 },
  Edgy:     { temperature: 0.8,  top_p: 0.9  },
  Baddie:   { temperature: 0.8,  top_p: 0.9  },
  Glamour:  { temperature: 0.7,  top_p: 0.85 },
  Barbie:   { temperature: 0.8,  top_p: 0.9  },
  Innocent: { temperature: 0.65, top_p: 0.85 }
};

export const defaultParams: GenParams = {
  temperature: 0.8,
  top_p: 0.9,
  presence_penalty: 0.3,
  frequency_penalty: 0.2
};

export function getStyleParams(style: string): GenParams {
  return perStyleParams[style] || defaultParams;
}

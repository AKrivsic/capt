import { create } from "zustand";

type VideoSelectionState = {
  videoId: string | null;
  previewUrl: string | null;
  setSelection: (videoId: string, previewUrl: string) => void;
  clear: () => void;
};

export const useVideoSelectionStore = create<VideoSelectionState>((set) => ({
  videoId: null,
  previewUrl: null,
  setSelection: (videoId, previewUrl) => set({ videoId, previewUrl }),
  clear: () => set({ videoId: null, previewUrl: null }),
}));

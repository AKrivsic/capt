'use client';

import { useState, useRef } from 'react';
import styles from '../Generator/NewGenerator.module.css';

interface Props {
  onUploaded: (previewUrl: string) => void;
  onLimitReached?: (reason: string) => void;
}

export default function VideoDemoUploader({ onUploaded, onLimitReached }: Props) {
  const [, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.size > 100 * 1024 * 1024) {
      alert('Max file size is 100MB');
      return;
    }
    if (!file.type.startsWith('video/')) {
      alert('Please upload a video file (MP4 recommended)');
      return;
    }
    setIsUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/demo/video', { method: 'POST', body: fd });
      const json = await res.json();
      if (!json.ok) {
        if (json.limitReached && onLimitReached) {
          onLimitReached(json.error);
          return;
        }
        throw new Error(json.error || 'Upload failed');
      }
      onUploaded(json.preview.url as string);
    } catch {
      alert('Upload failed, please retry.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div
      className={styles.uploadArea}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
      style={dragOver ? { borderColor: 'var(--accent)', background: '#eff6ff' } : undefined}
    >
      <div className={styles.uploadIcon}>📹</div>
      <p className={styles.uploadText}>Upload a 15s vertical video to preview AI subtitles.</p>
      <p className={styles.uploadHint}>MP4 (H.264), ≤100MB • Watermark preview included</p>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/*"
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}



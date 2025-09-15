'use client';

import { useState } from 'react';
import styles from '../Generator/NewGenerator.module.css';

interface Props {
  src: string;
}

export default function VideoDemoPreview({ src }: Props) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  async function handleUnlock() {
    setMessage(null);
    const res = await fetch('/api/demo/video/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    if (json.ok) setMessage('Magic link sent. Check your inbox.');
    else setMessage(json.error || 'Failed to send link');
  }

  return (
    <div className={styles.subtitlesFlow}>
      <video src={src} controls playsInline style={{ width: '100%', borderRadius: 12, border: '2px solid var(--accent)' }} />
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <a className={styles.generateButton} href={src} download>
          Download with watermark
        </a>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="email"
            placeholder="Enter your email to unlock clean download"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.textarea}
            style={{ minHeight: 0, padding: '0.5rem 0.75rem' }}
          />
          <button className={styles.generateButton} onClick={handleUnlock} disabled={!email}>
            Get clean download
          </button>
        </div>
      </div>
      {message && <p style={{ color: '#16a34a', marginTop: 8 }}>{message}</p>}
    </div>
  );
}











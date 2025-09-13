'use client';

import { useEffect } from 'react';
import styles from '../Generator/NewGenerator.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (mode: 'text' | 'video') => void;
}

export default function DemoModeSelector({ open, onClose, onSelect }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>Choose your free demo</h3>
        <p>Select what you want to try today.</p>
        <div className={styles.modalActions}>
          <button className={styles.modalButton} onClick={() => onSelect('text')}>
            Text Demo (2/day)
          </button>
          <button className={styles.modalButton} onClick={() => onSelect('video')}>
            Video Demo (1/day, 15s clip)
          </button>
        </div>
        <button className={styles.modalClose} onClick={onClose} style={{ marginTop: 12 }}>Close</button>
      </div>
    </div>
  );
}








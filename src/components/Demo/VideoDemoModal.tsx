/**
 * VideoDemoModal - Modal wrapper pro VideoDemoUploader
 */

'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import VideoDemoUploader from './VideoDemoUploader';
import styles from './VideoDemoModal.module.css';

interface VideoDemoModalProps {
  onClose: () => void;
  onSuccess?: (result: { previewUrl: string }) => void;
}

export default function VideoDemoModal({ onClose, onSuccess }: VideoDemoModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  const modalContent = (
    <div 
      className={styles.overlay} 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
        width: '100vw',
        height: '100vh',
        margin: 0
      }}
    >
      <div 
        className={styles.modal} 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          borderRadius: '16px',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          margin: 0,
          position: 'relative',
          padding: '2rem'
        }}
      >
        <div className={styles.header}>
          <h3>Video Demo</h3>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className={styles.content}>
          <VideoDemoUploader 
            onUploaded={(previewUrl) => {
              console.log('Video uploaded:', previewUrl);
              if (onSuccess) onSuccess({ previewUrl });
            }}
            onLimitReached={(reason) => {
              console.log('Limit reached:', reason);
              alert(`Limit reached: ${reason}`);
            }}
          />
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

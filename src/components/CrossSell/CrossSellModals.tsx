/**
 * CrossSellModals - Modaly pro cross-sell mezi texty a videi
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './CrossSellModals.module.css';

type ModalType = 'text-to-video' | 'text-limit' | 'video-limit';

interface Props {
  triggerModal?: ModalType;
  onClose?: () => void;
}

export default function CrossSellModals({ triggerModal, onClose }: Props) {
  const [activeModal, setActiveModal] = useState<ModalType | null>(null);

  useEffect(() => {
    if (triggerModal) {
      setActiveModal(triggerModal);
    }
  }, [triggerModal]);

  const handleClose = () => {
    setActiveModal(null);
    onClose?.();
  };

  const handleAction = (action: string) => {
    console.log(`Cross-sell action: ${action}`);
    handleClose();
  };

  if (!activeModal) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        
        {/* Text to Video Modal */}
        {activeModal === 'text-to-video' && (
          <>
            <div className={styles.modalIcon}>🎬</div>
            <h3 className={styles.modalTitle}>Want to try video subtitles?</h3>
            <p className={styles.modalDescription}>
              First 3 videos free 🎬 → upgrade anytime.
            </p>
            <div className={styles.modalActions}>
              <Link 
                href="/video/subtitles-demo" 
                className={styles.primaryButton}
                onClick={() => handleAction('try-video')}
              >
                Try Video Subtitles
              </Link>
              <button 
                className={styles.secondaryButton}
                onClick={handleClose}
              >
                Maybe later
              </button>
            </div>
          </>
        )}

        {/* Text Limit Modal */}
        {activeModal === 'text-limit' && (
          <>
            <div className={styles.modalIcon}>✨</div>
            <h3 className={styles.modalTitle}>Need more magic?</h3>
            <p className={styles.modalDescription}>
              Upgrade to Text Pro for unlimited captions ✨
            </p>
            <div className={styles.modalActions}>
              <Link 
                href="#pricing" 
                className={styles.primaryButton}
                onClick={() => handleAction('upgrade-text')}
              >
                See Text Plans
              </Link>
              <button 
                className={styles.secondaryButton}
                onClick={handleClose}
              >
                Maybe later
              </button>
            </div>
          </>
        )}

        {/* Video Limit Modal */}
        {activeModal === 'video-limit' && (
          <>
            <div className={styles.modalIcon}>💎</div>
            <h3 className={styles.modalTitle}>Get more subtitle videos</h3>
            <p className={styles.modalDescription}>
              Get more subtitle videos with Video Pro or Unlimited 💎
            </p>
            <div className={styles.modalActions}>
              <Link 
                href="#pricing" 
                className={styles.primaryButton}
                onClick={() => handleAction('upgrade-video')}
              >
                See Video Plans
              </Link>
              <button 
                className={styles.secondaryButton}
                onClick={handleClose}
              >
                Maybe later
              </button>
            </div>
          </>
        )}

        {/* Close button */}
        <button 
          className={styles.closeButton}
          onClick={handleClose}
          aria-label="Close modal"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// Hook pro triggerování modálů
export function useCrossSellModal() {
  const [modalType, setModalType] = useState<ModalType | null>(null);

  const showTextToVideoModal = () => setModalType('text-to-video');
  const showTextLimitModal = () => setModalType('text-limit');
  const showVideoLimitModal = () => setModalType('video-limit');
  const hideModal = () => setModalType(null);

  return {
    modalType,
    showTextToVideoModal,
    showTextLimitModal,
    showVideoLimitModal,
    hideModal
  };
}

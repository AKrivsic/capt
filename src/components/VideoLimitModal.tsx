import React from 'react';
import { Plan } from '@prisma/client';
import { PLAN_INFO } from '@/constants/plans';
import styles from './VideoLimitModal.module.css';

interface VideoLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  currentPlan: Plan;
  reason: string;
}

export function VideoLimitModal({ 
  isOpen, 
  onClose, 
  onUpgrade, 
  currentPlan, 
  reason 
}: VideoLimitModalProps) {
  if (!isOpen) return null;

  const currentPlanInfo = PLAN_INFO[currentPlan];
  const upgradePlans = Object.entries(PLAN_INFO).filter(([plan]) => {
    // Show plans that support video generation
    return plan === 'VIDEO_LITE' || plan === 'VIDEO_PRO' || plan === 'VIDEO_UNLIMITED';
  });

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Video Limit Reached</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className={styles.content}>
          <p className={styles.reason}>{reason}</p>
          
          <div className={styles.currentPlan}>
            <h3>Your Current Plan: {currentPlanInfo.name}</h3>
            <ul className={styles.features}>
              {currentPlanInfo.features.map((feature, index) => (
                <li key={index} className={styles.feature}>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.upgradeSection}>
            <h3>Upgrade for More Videos</h3>
            <div className={styles.plans}>
              {upgradePlans.map(([plan, info]) => (
                <div key={plan} className={styles.planCard}>
                  <h4 className={styles.planName}>{info.name}</h4>
                  <div className={styles.planPrice}>${info.price}/month</div>
                  <p className={styles.planDescription}>{info.description}</p>
                  <ul className={styles.planFeatures}>
                    {info.features.map((feature, index) => (
                      <li key={index} className={styles.planFeature}>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button 
                    className={styles.upgradeButton}
                    onClick={() => {
                      onUpgrade();
                      onClose();
                    }}
                  >
                    {info.ctaText}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

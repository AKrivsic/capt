/**
 * QuickActionsPanel - Panel s rychlými admin akcemi
 */

'use client';

import { useState } from 'react';
import styles from './quick-actions-panel.module.css';

interface User {
  id: string;
  email: string | null;
  name: string | null;
  plan: string;
  videoCredits: number;
  createdAt: string;
}

interface Props {
  totalUsers: number;
  avgCredits: number;
  recentUsers: User[];
}

export default function QuickActionsPanel({ totalUsers, avgCredits, recentUsers }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleBulkAction = async (action: string, data: Record<string, unknown>) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/quick-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: result.message });
      } else {
        setMessage({ type: 'error', text: result.error || 'Action failed' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCreditsToAll = () => {
    if (confirm('Add 5 credits to all users?')) {
      handleBulkAction('add_credits_all', { credits: 5 });
    }
  };

  const handleUpgradeFreeUsers = () => {
    if (confirm('Upgrade all FREE users to STARTER plan?')) {
      handleBulkAction('upgrade_free_users', { newPlan: 'STARTER' });
    }
  };

  const handleResetUsage = () => {
    if (confirm('Reset usage for all users? This will reset their monthly limits.')) {
      handleBulkAction('reset_usage_all', {});
    }
  };

  const handlePromoCredits = () => {
    if (confirm('Give 10 credits to all users as promotion?')) {
      handleBulkAction('promo_credits', { credits: 10, reason: 'Promotion' });
    }
  };

  return (
    <div className={styles.container}>
      {/* Message */}
      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
          <button 
            className={styles.messageClose}
            onClick={() => setMessage(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{totalUsers}</div>
          <div className={styles.statLabel}>Total Users</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{Math.round(avgCredits)}</div>
          <div className={styles.statLabel}>Avg Credits</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>
            {recentUsers.filter(u => u.plan === 'FREE').length}
          </div>
          <div className={styles.statLabel}>Free Users</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>
            {recentUsers.reduce((sum, u) => sum + u.videoCredits, 0)}
          </div>
          <div className={styles.statLabel}>Total Credits</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.actionsGrid}>
        {/* Bulk Credit Actions */}
        <div className={styles.actionCard}>
          <h3 className={styles.actionTitle}>🎁 Credit Actions</h3>
          <div className={styles.actionButtons}>
            <button
              onClick={handleAddCreditsToAll}
              disabled={isLoading}
              className={styles.actionButton}
            >
              +5 Credits to All
            </button>
            <button
              onClick={handlePromoCredits}
              disabled={isLoading}
              className={styles.actionButton}
            >
              🎉 Promo Credits (+10)
            </button>
          </div>
        </div>

        {/* Plan Actions */}
        <div className={styles.actionCard}>
          <h3 className={styles.actionTitle}>📈 Plan Actions</h3>
          <div className={styles.actionButtons}>
            <button
              onClick={handleUpgradeFreeUsers}
              disabled={isLoading}
              className={styles.actionButton}
            >
              Upgrade Free → Starter
            </button>
            <button
              onClick={() => handleBulkAction('downgrade_to_free', {})}
              disabled={isLoading}
              className={styles.actionButton}
            >
              Downgrade All → Free
            </button>
          </div>
        </div>

        {/* System Actions */}
        <div className={styles.actionCard}>
          <h3 className={styles.actionTitle}>🔧 System Actions</h3>
          <div className={styles.actionButtons}>
            <button
              onClick={handleResetUsage}
              disabled={isLoading}
              className={styles.actionButton}
            >
              Reset All Usage
            </button>
            <button
              onClick={() => handleBulkAction('cleanup_old_data', {})}
              disabled={isLoading}
              className={styles.actionButton}
            >
              Cleanup Old Data
            </button>
          </div>
        </div>

        {/* Test Actions */}
        <div className={styles.actionCard}>
          <h3 className={styles.actionTitle}>🧪 Test Actions</h3>
          <div className={styles.actionButtons}>
            <button
              onClick={() => handleBulkAction('create_test_user', {})}
              disabled={isLoading}
              className={styles.actionButton}
            >
              Create Test User
            </button>
            <button
              onClick={() => handleBulkAction('simulate_usage', {})}
              disabled={isLoading}
              className={styles.actionButton}
            >
              Simulate Usage
            </button>
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className={styles.recentUsers}>
        <h3 className={styles.recentUsersTitle}>Recent Users</h3>
        <div className={styles.usersList}>
          {recentUsers.map((user) => (
            <div key={user.id} className={styles.userItem}>
              <div className={styles.userInfo}>
                <div className={styles.userName}>
                  {user.name || 'No name'}
                </div>
                <div className={styles.userEmail}>
                  {user.email}
                </div>
              </div>
              <div className={styles.userStats}>
                <span className={`${styles.planBadge} ${styles[`plan${user.plan}`]}`}>
                  {user.plan}
                </span>
                <span className={styles.credits}>
                  {user.videoCredits} credits
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

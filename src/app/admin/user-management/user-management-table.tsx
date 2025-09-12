/**
 * UserManagementTable - Tabulka pro správu uživatelů s možností editace tarifů a kreditů
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './user-management-table.module.css';

type Plan = "FREE" | "TEXT_STARTER" | "TEXT_PRO" | "VIDEO_LITE" | "VIDEO_PRO" | "VIDEO_UNLIMITED";

type User = {
  id: string;
  name: string | null;
  email: string | null;
  plan: Plan;
  videoCredits: number;
  createdAt: string;
  updatedAt: string;
  totalVideos: number;
  totalJobs: number;
  totalPurchases: number;
  image: string | null;
};

interface Props {
  initialUsers: User[];
}

export default function UserManagementTable({ initialUsers }: Props) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleEditUser = (user: User) => {
    setEditingUser(user.id);
    setEditForm({
      plan: user.plan,
      videoCredits: user.videoCredits,
    });
  };

  const handleSaveUser = async (userId: string) => {
    if (!editForm.plan || editForm.videoCredits === undefined) {
      setMessage({ type: 'error', text: 'Please fill all fields' });
      return;
    }

    setIsLoading(true);
    try {
      // Use test API if we're on test admin page
      const apiEndpoint = window.location.pathname.includes('test-admin') 
        ? '/api/admin/test-admin' 
        : '/api/admin/user-management';
        
      const response = await fetch(apiEndpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          plan: editForm.plan,
          videoCredits: editForm.videoCredits,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state
        setUsers(prev => prev.map(user => 
          user.id === userId 
            ? { ...user, plan: editForm.plan!, videoCredits: editForm.videoCredits! }
            : user
        ));
        
        setEditingUser(null);
        setEditForm({});
        setMessage({ type: 'success', text: 'User updated successfully' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update user' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({});
  };

  const handleAddCredits = async (userId: string, credits: number) => {
    setIsLoading(true);
    try {
      // Use test API if we're on test admin page
      const apiEndpoint = window.location.pathname.includes('test-admin') 
        ? '/api/admin/test-admin' 
        : '/api/admin/user-management';
        
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'add_credits',
          credits,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setUsers(prev => prev.map(user => 
          user.id === userId 
            ? { ...user, videoCredits: user.videoCredits + credits }
            : user
        ));
        setMessage({ type: 'success', text: `Added ${credits} credits to user` });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to add credits' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPlanColor = (plan: Plan) => {
    switch (plan) {
      case 'FREE': return styles.planFree;
      case 'TEXT_STARTER': return styles.planStarter;
      case 'TEXT_PRO': return styles.planPro;
      case 'VIDEO_LITE': return styles.planPremium;
      case 'VIDEO_PRO': return styles.planPro;
      case 'VIDEO_UNLIMITED': return styles.planPremium;
      default: return '';
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

      {/* Stats Summary */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{users.length}</div>
          <div className={styles.statLabel}>Total Users</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>
            {users.filter(u => u.plan !== 'FREE').length}
          </div>
          <div className={styles.statLabel}>Paid Users</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>
            {users.reduce((sum, u) => sum + u.videoCredits, 0)}
          </div>
          <div className={styles.statLabel}>Total Credits</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>
            {users.reduce((sum, u) => sum + u.totalJobs, 0)}
          </div>
          <div className={styles.statLabel}>Total Jobs</div>
        </div>
      </div>

      {/* Users Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>User</th>
              <th>Plan</th>
              <th>Credits</th>
              <th>Usage</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                {/* User Info */}
                <td>
                  <div className={styles.userInfo}>
                    {user.image && (
                      <Image 
                        src={user.image} 
                        alt={user.name || 'User'} 
                        width={40}
                        height={40}
                        className={styles.userAvatar}
                      />
                    )}
                    <div>
                      <div className={styles.userName}>
                        {user.name || 'No name'}
                      </div>
                      <div className={styles.userEmail}>
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Plan */}
                <td>
                  {editingUser === user.id ? (
                    <select
                      value={editForm.plan || user.plan}
                      onChange={(e) => setEditForm(prev => ({ ...prev, plan: e.target.value as Plan }))}
                      className={styles.select}
                    >
                      <option value="FREE">FREE</option>
                      <option value="TEXT_STARTER">TEXT_STARTER</option>
                      <option value="TEXT_PRO">TEXT_PRO</option>
                      <option value="VIDEO_LITE">VIDEO_LITE</option>
                      <option value="VIDEO_PRO">VIDEO_PRO</option>
                      <option value="VIDEO_UNLIMITED">VIDEO_UNLIMITED</option>
                    </select>
                  ) : (
                    <span className={`${styles.planBadge} ${getPlanColor(user.plan)}`}>
                      {user.plan}
                    </span>
                  )}
                </td>

                {/* Credits */}
                <td>
                  {editingUser === user.id ? (
                    <input
                      type="number"
                      value={editForm.videoCredits || user.videoCredits}
                      onChange={(e) => setEditForm(prev => ({ ...prev, videoCredits: parseInt(e.target.value) }))}
                      className={styles.input}
                      min="0"
                    />
                  ) : (
                    <div className={styles.creditsContainer}>
                      <span className={styles.creditsNumber}>{user.videoCredits}</span>
                      <div className={styles.quickActions}>
                        <button
                          onClick={() => handleAddCredits(user.id, 5)}
                          className={styles.quickButton}
                          disabled={isLoading}
                        >
                          +5
                        </button>
                        <button
                          onClick={() => handleAddCredits(user.id, 10)}
                          className={styles.quickButton}
                          disabled={isLoading}
                        >
                          +10
                        </button>
                      </div>
                    </div>
                  )}
                </td>

                {/* Usage Stats */}
                <td>
                  <div className={styles.usageStats}>
                    <div className={styles.usageItem}>
                      <span className={styles.usageLabel}>Videos:</span>
                      <span className={styles.usageValue}>{user.totalVideos}</span>
                    </div>
                    <div className={styles.usageItem}>
                      <span className={styles.usageLabel}>Jobs:</span>
                      <span className={styles.usageValue}>{user.totalJobs}</span>
                    </div>
                    <div className={styles.usageItem}>
                      <span className={styles.usageLabel}>Purchases:</span>
                      <span className={styles.usageValue}>{user.totalPurchases}</span>
                    </div>
                  </div>
                </td>

                {/* Created Date */}
                <td>
                  <div className={styles.date}>
                    {formatDate(user.createdAt)}
                  </div>
                </td>

                {/* Actions */}
                <td>
                  {editingUser === user.id ? (
                    <div className={styles.editActions}>
                      <button
                        onClick={() => handleSaveUser(user.id)}
                        className={styles.saveButton}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className={styles.cancelButton}
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEditUser(user)}
                      className={styles.editButton}
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

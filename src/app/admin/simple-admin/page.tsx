/**
 * Simple Admin - Jednoduchý admin panel bez databáze pro testování
 */

'use client';

import { useState } from 'react';
import styles from './simple-admin.module.css';

// TODO: Load users from database instead of mock data
const mockUsers: User[] = [];

type Plan = "FREE" | "TEXT_STARTER" | "TEXT_PRO" | "VIDEO_LITE" | "VIDEO_PRO" | "VIDEO_UNLIMITED";
type User = {
  id: string;
  name: string;
  email: string;
  plan: Plan;
  videoCredits: number;
  createdAt: string;
  totalVideos: number;
  totalJobs: number;
  totalPurchases: number;
};
type EditForm = {
  plan?: Plan;
  videoCredits?: number;
};

export default function SimpleAdminPage() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({});
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
    
    // Simulace API call
    setTimeout(() => {
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, plan: editForm.plan! as Plan, videoCredits: editForm.videoCredits! }
          : user
      ));
      
      setEditingUser(null);
      setEditForm({});
      setMessage({ type: 'success', text: 'User updated successfully (MOCK)' });
      setIsLoading(false);
    }, 1000);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({});
  };

  const handleAddCredits = async (userId: string, credits: number) => {
    setIsLoading(true);
    
    // Simulace API call
    setTimeout(() => {
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, videoCredits: user.videoCredits + credits }
          : user
      ));
      setMessage({ type: 'success', text: `Added ${credits} credits to user (MOCK)` });
      setIsLoading(false);
    }, 500);
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
    <main className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Simple Admin Panel</h1>
        <p className={styles.subtitle}>
          ⚠️ Mock data for testing - no database connection required
        </p>
        <div className={styles.warning}>
          <p>
            <strong>Note:</strong> This is a mock admin panel with test data. 
            All changes are simulated and not saved to database.
          </p>
        </div>
      </div>

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
                    <div>
                      <div className={styles.userName}>
                        {user.name}
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

      {/* Quick Actions */}
      <div className={styles.quickActionsSection}>
        <h3>Quick Actions</h3>
        <div className={styles.quickActionsGrid}>
          <button
            onClick={() => {
              setUsers(prev => prev.map(u => ({ ...u, videoCredits: u.videoCredits + 5 })));
              setMessage({ type: 'success', text: 'Added 5 credits to all users (MOCK)' });
            }}
            className={styles.bulkButton}
          >
            +5 Credits to All
          </button>
          <button
            onClick={() => {
              setUsers(prev => prev.map(u => ({ ...u, plan: 'STARTER' as Plan })));
              setMessage({ type: 'success', text: 'Upgraded all users to STARTER (MOCK)' });
            }}
            className={styles.bulkButton}
          >
            Upgrade All to Starter
          </button>
          <button
            onClick={() => {
              setUsers(prev => prev.map(u => ({ ...u, plan: 'FREE' as Plan })));
              setMessage({ type: 'success', text: 'Downgraded all users to FREE (MOCK)' });
            }}
            className={styles.bulkButton}
          >
            Downgrade All to Free
          </button>
        </div>
      </div>
    </main>
  );
}

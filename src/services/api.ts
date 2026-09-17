import { User, RecognitionRecord, RecognitionStats, SystemSettings, AuthUser } from '../types';
import { INITIAL_AUTH_USER, INITIAL_USERS, INITIAL_RECORDS, INITIAL_STATS, INITIAL_SETTINGS } from './mockData';

const STORAGE_KEYS = {
  USERS: 'frs_users_v1',
  RECORDS: 'frs_records_v1',
  STATS: 'frs_stats_v1',
  SETTINGS: 'frs_settings_v1',
  AUTH: 'frs_auth_v1',
};

// Local storage helpers
function getStored<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
}

export const api = {
  // Auth
  async login(username: string, password: string): Promise<{ user: AuthUser; token: string }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setStored(STORAGE_KEYS.AUTH, data.user);
        return data;
      }
    } catch {
      // Fallback
    }

    // Local fallback validation
    if (username.trim().toLowerCase() === 'admin' && (password === 'admin123' || password === 'admin' || password === 'password')) {
      const user = INITIAL_AUTH_USER;
      setStored(STORAGE_KEYS.AUTH, user);
      return { user, token: 'frs-jwt-demo-token-xyz' };
    }
    // Also accept any demo login with warning if non-empty
    if (username.trim().length >= 3 && password.length >= 4) {
      const user: AuthUser = {
        ...INITIAL_AUTH_USER,
        username,
        name: username.charAt(0).toUpperCase() + username.slice(1),
      };
      setStored(STORAGE_KEYS.AUTH, user);
      return { user, token: 'frs-jwt-demo-token-custom' };
    }

    throw new Error('Invalid credentials. Use username: admin / password: admin123');
  },

  getCurrentUser(): AuthUser | null {
    return getStored<AuthUser | null>(STORAGE_KEYS.AUTH, INITIAL_AUTH_USER);
  },

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
  },

  // Users
  async getUsers(): Promise<User[]> {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setStored(STORAGE_KEYS.USERS, data);
        return data;
      }
    } catch {
      // Fallback
    }
    return getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  },

  async createUser(userData: Omit<User, 'id' | 'registeredAt' | 'recognitionCount'>): Promise<User> {
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}`,
      registeredAt: new Date().toISOString().split('T')[0],
      recognitionCount: 0,
      lastSeen: 'Just registered',
    };

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      if (res.ok) {
        const saved = await res.json();
        const users = getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
        setStored(STORAGE_KEYS.USERS, [saved, ...users]);
        return saved;
      }
    } catch {
      // Fallback
    }

    const users = getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const updated = [newUser, ...users];
    setStored(STORAGE_KEYS.USERS, updated);
    return newUser;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    const users = getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const updated = users.map(u => (u.id === id ? { ...u, ...updates } : u));
    setStored(STORAGE_KEYS.USERS, updated);
    const found = updated.find(u => u.id === id);
    if (!found) throw new Error('User not found');
    return found;
  },

  async deleteUser(id: string): Promise<boolean> {
    try {
      await fetch(`/api/users/${id}`, { method: 'DELETE' });
    } catch {
      // Fallback
    }

    const users = getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const updated = users.filter(u => u.id !== id);
    setStored(STORAGE_KEYS.USERS, updated);
    return true;
  },

  // Recognition History
  async getHistory(): Promise<RecognitionRecord[]> {
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setStored(STORAGE_KEYS.RECORDS, data);
        return data;
      }
    } catch {
      // Fallback
    }
    return getStored<RecognitionRecord[]>(STORAGE_KEYS.RECORDS, INITIAL_RECORDS);
  },

  async logRecognition(record: Omit<RecognitionRecord, 'id' | 'timestamp' | 'date' | 'time'>): Promise<RecognitionRecord> {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const newRecord: RecognitionRecord = {
      ...record,
      id: `rec-${Date.now()}`,
      timestamp: now.toISOString(),
      date: 'Today',
      time: timeStr,
    };

    try {
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord),
      });
    } catch {
      // Fallback
    }

    const history = getStored<RecognitionRecord[]>(STORAGE_KEYS.RECORDS, INITIAL_RECORDS);
    const updated = [newRecord, ...history.slice(0, 199)]; // Keep latest 200
    setStored(STORAGE_KEYS.RECORDS, updated);

    // Also increment user recognitionCount if matched
    if (record.userId) {
      const users = getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
      const userIndex = users.findIndex(u => u.userId === record.userId);
      if (userIndex !== -1) {
        users[userIndex].recognitionCount = (users[userIndex].recognitionCount || 0) + 1;
        users[userIndex].lastSeen = 'Just now';
        setStored(STORAGE_KEYS.USERS, [...users]);
      }
    }

    return newRecord;
  },

  async clearHistory(): Promise<boolean> {
    try {
      await fetch('/api/history', { method: 'DELETE' });
    } catch {
      // Fallback
    }
    setStored(STORAGE_KEYS.RECORDS, []);
    return true;
  },

  // Stats
  async getStats(): Promise<RecognitionStats> {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    const users = getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const records = getStored<RecognitionRecord[]>(STORAGE_KEYS.RECORDS, INITIAL_RECORDS);

    const successRecords = records.filter(r => r.status === 'success');
    const unknownRecords = records.filter(r => r.status === 'unknown');
    const avgConfidence = records.length > 0
      ? Math.round((records.reduce((acc, r) => acc + r.confidence, 0) / records.length) * 10) / 10
      : 96.5;

    return {
      totalUsers: users.length,
      recognizedToday: records.length,
      successCount: successRecords.length,
      unknownCount: unknownRecords.length,
      avgConfidence,
      hourlyTrends: INITIAL_STATS.hourlyTrends,
      departmentBreakdown: INITIAL_STATS.departmentBreakdown,
    };
  },

  // Settings
  getSettings(): SystemSettings {
    return getStored<SystemSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  },

  saveSettings(settings: SystemSettings): void {
    setStored(STORAGE_KEYS.SETTINGS, settings);
  },
};

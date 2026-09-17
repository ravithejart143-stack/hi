import React, { useState, useEffect } from 'react';
import { User, RecognitionRecord, RecognitionStats, SystemSettings, AuthUser } from './types';
import { api } from './services/api';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { LoginPage } from './components/auth/LoginPage';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { FaceRecognitionPage } from './components/recognition/FaceRecognitionPage';
import { RegisterFacePage } from './components/registration/RegisterFacePage';
import { UsersPage } from './components/users/UsersPage';
import { HistoryPage } from './components/history/HistoryPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { ArchitecturePage } from './components/architecture/ArchitecturePage';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // App Data
  const [users, setUsers] = useState<User[]>([]);
  const [records, setRecords] = useState<RecognitionRecord[]>([]);
  const [stats, setStats] = useState<RecognitionStats>({
    totalUsers: 0,
    recognizedToday: 0,
    successCount: 0,
    unknownCount: 0,
    avgConfidence: 96.8,
    hourlyTrends: [],
    departmentBreakdown: [],
  });
  const [settings, setSettings] = useState<SystemSettings>(api.getSettings());

  // Quick register prefill snapshot from live camera unknown detection
  const [prefilledSnapshotUrl, setPrefilledSnapshotUrl] = useState<string | null>(null);

  // Load initial session and data
  useEffect(() => {
    const initData = async () => {
      const savedUser = api.getCurrentUser();
      if (savedUser) {
        setCurrentUser(savedUser);
      }

      try {
        const [loadedUsers, loadedRecords, loadedStats] = await Promise.all([
          api.getUsers(),
          api.getHistory(),
          api.getStats(),
        ]);
        setUsers(loadedUsers);
        setRecords(loadedRecords);
        setStats(loadedStats);
      } catch (e) {
        console.error('Error loading initial data:', e);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  // Auth handlers
  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setCurrentTab('dashboard');
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setCurrentTab('dashboard');
  };

  // User CRUD handlers
  const handleRegisterUser = async (
    userData: Omit<User, 'id' | 'registeredAt' | 'recognitionCount'>
  ): Promise<User> => {
    const newUser = await api.createUser(userData);
    setUsers((prev) => [newUser, ...prev]);
    // Refresh stats
    const updatedStats = await api.getStats();
    setStats(updatedStats);
    setPrefilledSnapshotUrl(null);
    return newUser;
  };

  const handleUpdateUser = async (id: string, updates: Partial<User>): Promise<User> => {
    const updated = await api.updateUser(id, updates);
    setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    return updated;
  };

  const handleDeleteUser = async (id: string): Promise<boolean> => {
    const ok = await api.deleteUser(id);
    if (ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      const updatedStats = await api.getStats();
      setStats(updatedStats);
    }
    return ok;
  };

  // Log recognition event handler
  const handleLogRecognition = async (
    record: Omit<RecognitionRecord, 'id' | 'timestamp' | 'date' | 'time'>
  ): Promise<RecognitionRecord> => {
    const newRecord = await api.logRecognition(record);
    setRecords((prev) => [newRecord, ...prev.slice(0, 199)]);

    // Increment user visits in state if matched
    if (record.userId) {
      setUsers((prev) =>
        prev.map((u) =>
          u.userId === record.userId
            ? { ...u, recognitionCount: (u.recognitionCount || 0) + 1, lastSeen: 'Just now' }
            : u
        )
      );
    }

    // Update stats
    setStats((prev) => {
      const isSuccess = record.status === 'success';
      return {
        ...prev,
        recognizedToday: prev.recognizedToday + 1,
        successCount: isSuccess ? prev.successCount + 1 : prev.successCount,
        unknownCount: !isSuccess ? prev.unknownCount + 1 : prev.unknownCount,
      };
    });

    return newRecord;
  };

  const handleClearHistory = async (): Promise<boolean> => {
    const ok = await api.clearHistory();
    if (ok) {
      setRecords([]);
      const updatedStats = await api.getStats();
      setStats(updatedStats);
    }
    return ok;
  };

  const handleSaveSettings = (newSettings: SystemSettings) => {
    api.saveSettings(newSettings);
    setSettings(newSettings);
  };

  // Quick register unknown face shortcut from camera
  const handleQuickRegisterUnknown = (snapshotUrl: string) => {
    setPrefilledSnapshotUrl(snapshotUrl);
    setCurrentTab('register');
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-indigo-500 border-t-transparent" />
          <p className="font-semibold text-xs text-slate-400 tracking-wider">
            INITIALIZING FRS BIOMETRIC TERMINAL...
          </p>
        </div>
      </div>
    );
  }

  // If not logged in, show Login Page
  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onLoginApi={(username, pass) => api.login(username, pass)}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
        }}
        onLogout={handleLogout}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          currentUser={currentUser}
          onLogout={handleLogout}
          onNavigateToRecognition={() => setCurrentTab('recognition')}
          currentTab={currentTab}
        />

        {/* Dynamic View Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {currentTab === 'dashboard' && (
            <DashboardPage
              stats={stats}
              recentRecords={records}
              users={users}
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'recognition' && (
            <FaceRecognitionPage
              registeredUsers={users}
              settings={settings}
              onLogRecognition={handleLogRecognition}
              onQuickRegisterUnknown={handleQuickRegisterUnknown}
            />
          )}

          {currentTab === 'register' && (
            <RegisterFacePage
              onRegisterUser={handleRegisterUser}
              prefilledSnapshotUrl={prefilledSnapshotUrl}
              onNavigateToRecognition={() => setCurrentTab('recognition')}
              onNavigateToUsers={() => setCurrentTab('users')}
            />
          )}

          {currentTab === 'users' && (
            <UsersPage
              users={users}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              onNavigateToRegister={() => setCurrentTab('register')}
            />
          )}

          {currentTab === 'history' && (
            <HistoryPage records={records} onClearHistory={handleClearHistory} />
          )}

          {currentTab === 'architecture' && <ArchitecturePage />}

          {currentTab === 'settings' && (
            <SettingsPage
              settings={settings}
              onSaveSettings={handleSaveSettings}
              currentUser={currentUser}
            />
          )}
        </main>
      </div>
    </div>
  );
}

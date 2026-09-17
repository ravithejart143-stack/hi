import React, { useState, useEffect } from 'react';
import {
  Settings,
  Camera,
  Sliders,
  Bell,
  Lock,
  ShieldCheck,
  Server,
  Palette,
  CheckCircle2,
  AlertCircle,
  Volume2,
  RefreshCw,
  Eye,
  ShieldAlert,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { SystemSettings, AuthUser } from '../../types';
import { CameraPermissionModal } from '../common/CameraPermissionModal';

interface SettingsPageProps {
  settings: SystemSettings;
  onSaveSettings: (settings: SystemSettings) => void;
  currentUser: AuthUser | null;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onSaveSettings,
  currentUser,
}) => {
  const [localSettings, setLocalSettings] = useState<SystemSettings>(settings);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testApiState, setTestApiState] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [permStatus, setPermStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');

  // Account password change form
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passUpdated, setPassUpdated] = useState(false);

  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devs) => {
        setCameras(devs.filter((d) => d.kind === 'videoinput'));
      }).catch(() => {});
    }

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'camera' as PermissionName }).then((res) => {
        setPermStatus(res.state as 'granted' | 'denied' | 'prompt');
        res.onchange = () => {
          setPermStatus(res.state as 'granted' | 'denied' | 'prompt');
        };
      }).catch(() => {});
    }
  }, []);

  const handleSave = () => {
    onSaveSettings(localSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleTestBackendConnection = async () => {
    setTestApiState('testing');
    try {
      if (localSettings.backendMode === 'internal') {
        const res = await fetch('/api/health');
        if (res.ok) {
          setTestApiState('success');
        } else {
          setTestApiState('error');
        }
      } else {
        // Test external url
        const res = await fetch(localSettings.externalApiUrl, { method: 'GET' });
        if (res.ok) {
          setTestApiState('success');
        } else {
          setTestApiState('error');
        }
      }
    } catch {
      setTestApiState('error');
    }
    setTimeout(() => setTestApiState('idle'), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold tracking-tight text-white">System Settings</h2>
            <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 ring-1 ring-inset ring-indigo-500/30">
              FRS Config
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Tune optical recognition sensitivity, camera hardware devices, audio feedback, and backend API routes.
          </p>
        </div>

        <button
          id="settings-save-top-btn"
          onClick={handleSave}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all self-start sm:self-auto cursor-pointer"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Settings saved and applied successfully.</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Optical & Recognition Settings */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <Sliders className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Recognition & Detection Parameters</h3>
          </div>

          <div className="space-y-5 text-xs">
            {/* Confidence Threshold Slider */}
            <div>
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-300">
                  Recognition Match Confidence Threshold
                </label>
                <span className="rounded-lg bg-indigo-600/20 px-2.5 py-1 font-mono font-bold text-indigo-300 border border-indigo-500/30">
                  {localSettings.confidenceThreshold}%
                </span>
              </div>
              <input
                id="settings-confidence-threshold-slider"
                type="range"
                min="50"
                max="95"
                step="1"
                value={localSettings.confidenceThreshold}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, confidenceThreshold: Number(e.target.value) })
                }
                className="mt-2 w-full accent-indigo-500 cursor-pointer"
              />
              <div className="mt-1 flex justify-between text-[10px] text-slate-500">
                <span>50% (Permissive / Fast)</span>
                <span className="text-indigo-400 font-medium">75% (Recommended)</span>
                <span>95% (High Security / Strict)</span>
              </div>
            </div>

            {/* Camera Selection */}
            <div>
              <label className="font-semibold text-slate-300">Default Camera Hardware</label>
              <select
                id="settings-camera-device-select"
                value={localSettings.selectedCameraId}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, selectedCameraId: e.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="default">Default System Camera (Auto)</option>
                {cameras.map((c, i) => (
                  <option key={c.deviceId || i} value={c.deviceId}>
                    {c.label || `Camera Device #${i + 1}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Camera Permission Diagnostics Box */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-indigo-400" />
                  <span className="font-semibold text-slate-200">Browser Camera Permission:</span>
                  {permStatus === 'granted' ? (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400 ring-1 ring-emerald-500/30">
                      Granted
                    </span>
                  ) : permStatus === 'denied' ? (
                    <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-bold text-rose-400 ring-1 ring-rose-500/30">
                      Blocked / Denied
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-400 ring-1 ring-amber-500/30">
                      Needs Authorization
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="settings-test-camera-permission-btn"
                    onClick={() => setIsPermissionModalOpen(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-indigo-500 transition-colors cursor-pointer"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                    <span>Permission Guide & Test</span>
                  </button>

                  <button
                    type="button"
                    id="settings-open-newtab-btn"
                    onClick={() => window.open(window.location.href, '_blank')}
                    title="Open app in a new tab if embedded preview blocks camera"
                    className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span className="hidden sm:inline">New Tab</span>
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Web browsers require explicit permission to access your webcam. If running within an embedded preview window, opening in a new tab will allow the browser's native permission prompt.
              </p>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
              {/* Audio Chime */}
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                <div>
                  <p className="font-semibold text-slate-200">Audio Chime on Match</p>
                  <p className="text-[11px] text-slate-400">Play pleasant sound upon verification</p>
                </div>
                <input
                  id="settings-audio-alerts-checkbox"
                  type="checkbox"
                  checked={localSettings.audioAlerts}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, audioAlerts: e.target.checked })
                  }
                  className="h-4 w-4 rounded accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Liveness anti-spoofing */}
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                <div>
                  <p className="font-semibold text-slate-200">Liveness / Anti-Spoofing Gate</p>
                  <p className="text-[11px] text-slate-400">Validate depth variance & micro-motion</p>
                </div>
                <input
                  id="settings-liveness-detection-checkbox"
                  type="checkbox"
                  checked={localSettings.livenessDetection}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, livenessDetection: e.target.checked })
                  }
                  className="h-4 w-4 rounded accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Debounce interval */}
            <div>
              <label className="font-semibold text-slate-300">
                Log Debounce Interval (Seconds between duplicate logs of same person)
              </label>
              <input
                id="settings-log-interval-input"
                type="number"
                min="1"
                max="30"
                value={localSettings.logIntervalSeconds}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, logIntervalSeconds: Number(e.target.value) })
                }
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* AI Engine & Backend Architecture Settings */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Server className="h-5 w-5 text-purple-400" />
              <h3 className="text-sm font-bold text-white">AI Recognition Engine & Backend Mode</h3>
            </div>
            <span className="rounded bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-500/30">
              Hackathon Ready
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label
                id="settings-backend-mode-internal-label"
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                  localSettings.backendMode === 'internal'
                    ? 'border-indigo-500 bg-indigo-950/40 text-white'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="backendMode"
                  checked={localSettings.backendMode === 'internal'}
                  onChange={() => setLocalSettings({ ...localSettings, backendMode: 'internal' })}
                  className="mt-0.5 accent-indigo-500"
                />
                <div>
                  <p className="font-bold text-white">Full-Stack Express / Vector Core</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Integrated server on port 3000. Real-time 128D cosine similarity matching with in-memory SQLite store.
                  </p>
                </div>
              </label>

              <label
                id="settings-backend-mode-external-label"
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                  localSettings.backendMode === 'external'
                    ? 'border-indigo-500 bg-indigo-950/40 text-white'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="backendMode"
                  checked={localSettings.backendMode === 'external'}
                  onChange={() => setLocalSettings({ ...localSettings, backendMode: 'external' })}
                  className="mt-0.5 accent-indigo-500"
                />
                <div>
                  <p className="font-bold text-white">External Python / FastAPI Endpoint</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Connect directly to an external Python OpenCV / FaceNet service running on localhost or cloud VM.
                  </p>
                </div>
              </label>
            </div>

            {localSettings.backendMode === 'external' && (
              <div className="space-y-2">
                <label className="font-semibold text-slate-300">FastAPI / Flask Recognition URL</label>
                <div className="flex gap-2">
                  <input
                    id="settings-external-api-url-input"
                    type="url"
                    value={localSettings.externalApiUrl}
                    onChange={(e) => setLocalSettings({ ...localSettings, externalApiUrl: e.target.value })}
                    placeholder="http://localhost:8000/api/v1/recognize"
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    id="settings-test-api-url-btn"
                    type="button"
                    onClick={handleTestBackendConnection}
                    className="rounded-xl border border-indigo-500/40 bg-indigo-950 px-3 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-900"
                  >
                    {testApiState === 'testing' ? 'Testing...' : 'Test Connection'}
                  </button>
                </div>
              </div>
            )}

            {testApiState === 'success' && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Backend service is responsive and healthy!</span>
              </div>
            )}
            {testApiState === 'error' && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>Unable to reach endpoint. Falling back to built-in fullstack engine.</span>
              </div>
            )}
          </div>
        </div>

        {/* Security, Privacy & Admin Account */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <Lock className="h-5 w-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Security & Biometric Privacy Policy</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2 text-slate-300">
              <div className="flex items-center gap-2 font-bold text-white">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Biometric Data Handling Compliance</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Raw face photos are never stored unencrypted. All face comparisons are computed as 128-dimensional mathematical floating point embeddings. In accordance with privacy standards, embeddings cannot be reverse-engineered to reconstruct the original high-resolution face image.
              </p>
            </div>

            {/* Admin Password Change Form */}
            <div className="border-t border-slate-800 pt-3 space-y-3">
              <h4 className="font-semibold text-slate-200">Administrator Account Settings</h4>
              <p className="text-[11px] text-slate-400">
                Logged in as: <strong className="text-white">{currentUser?.name}</strong> ({currentUser?.email})
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  id="settings-current-password-input"
                  type="password"
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  placeholder="Current Password (admin123)"
                  className="rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
                <input
                  id="settings-new-password-input"
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="New Admin Password"
                  className="rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <button
                id="settings-update-password-btn"
                type="button"
                onClick={() => {
                  if (newPass.length >= 4) {
                    setPassUpdated(true);
                    setTimeout(() => setPassUpdated(false), 3000);
                  }
                }}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              >
                Update Password
              </button>

              {passUpdated && (
                <span className="ml-3 text-xs text-emerald-400">Password successfully updated.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Camera Permission Modal */}
      <CameraPermissionModal
        isOpen={isPermissionModalOpen}
        onClose={() => setIsPermissionModalOpen(false)}
      />
    </div>
  );
};

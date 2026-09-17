import React, { useState, useEffect } from 'react';
import {
  Camera,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  X,
  CheckCircle2,
  Lock,
  Globe,
  Monitor,
  Laptop,
  Smartphone,
  HelpCircle,
} from 'lucide-react';

interface CameraPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionGranted?: () => void;
}

export const CameraPermissionModal: React.FC<CameraPermissionModalProps> = ({
  isOpen,
  onClose,
  onPermissionGranted,
}) => {
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');
  const [activeTab, setActiveTab] = useState<'chrome' | 'safari' | 'firefox' | 'edge' | 'os'>('chrome');
  const [testingPermission, setTestingPermission] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);

  // Check current permission state if supported
  const checkCurrentPermission = async () => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        // 'camera' is standard in Chromium, Firefox 105+
        const status = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setPermissionState(status.state as 'prompt' | 'granted' | 'denied');
        status.onchange = () => {
          setPermissionState(status.state as 'prompt' | 'granted' | 'denied');
        };
      } else {
        setPermissionState('unknown');
      }
    } catch {
      setPermissionState('unknown');
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkCurrentPermission();
      setTestResult(null);
    }
  }, [isOpen]);

  // Request / test camera access
  const handleRequestPermission = async () => {
    setTestingPermission(true);
    setTestResult(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support the WebRTC MediaDevices API.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      // Stop all tracks immediately after testing
      stream.getTracks().forEach((track) => track.stop());

      setPermissionState('granted');
      setTestResult({
        status: 'success',
        message: 'Camera permission successfully granted! Your webcam is ready.',
      });

      if (onPermissionGranted) {
        onPermissionGranted();
      }
    } catch (err: unknown) {
      const error = err as Error;
      setPermissionState('denied');

      let userMsg = 'Camera permission was denied or camera hardware was not found.';
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        userMsg = 'Camera permission was blocked by your browser. Please follow the instructions below to enable it.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        userMsg = 'No camera device detected. Please connect a USB webcam or enable your integrated camera.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        userMsg = 'Your camera is already in use by another application (such as Zoom, Teams, or Google Meet). Close it and try again.';
      }

      setTestResult({
        status: 'error',
        message: userMsg,
      });
    } finally {
      setTestingPermission(false);
    }
  };

  const handleOpenInNewTab = () => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <div
      id="camera-permission-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="camera-permission-modal-container"
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                permissionState === 'granted'
                  ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
                  : permissionState === 'denied'
                  ? 'bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/40'
                  : 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/40'
              }`}
            >
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Camera Permission & Setup Guide</h3>
              <p className="text-xs text-slate-400">
                Grant browser permission to enable real-time biometric face detection
              </p>
            </div>
          </div>

          <button
            id="camera-permission-modal-close-btn"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Banner */}
        <div className="border-b border-slate-800/80 bg-slate-950/40 px-6 py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-300">Status:</span>
              {permissionState === 'granted' ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/30">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Camera Permission Granted
                </span>
              ) : permissionState === 'denied' ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-bold text-rose-400 ring-1 ring-rose-500/30">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Permission Blocked / Denied
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-400 ring-1 ring-amber-500/30">
                  <HelpCircle className="h-3.5 w-3.5" />
                  Needs Authorization / Prompt
                </span>
              )}
            </div>

            {/* Test Permission CTA */}
            <div className="flex items-center gap-2">
              <button
                id="camera-permission-test-trigger-btn"
                onClick={handleRequestPermission}
                disabled={testingPermission}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                {testingPermission ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Requesting...</span>
                  </>
                ) : (
                  <>
                    <Camera className="h-3.5 w-3.5" />
                    <span>Prompt / Test Camera</span>
                  </>
                )}
              </button>

              <button
                id="camera-permission-new-tab-btn"
                onClick={handleOpenInNewTab}
                title="Open in new window to bypass iframe restrictions"
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Open in New Tab</span>
              </button>
            </div>
          </div>

          {/* Test Feedback Message */}
          {testResult && (
            <div
              className={`mt-3 rounded-xl border p-2.5 text-xs flex items-center gap-2 ${
                testResult.status === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
              }`}
            >
              {testResult.status === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Embedded Iframe Notice */}
        <div className="bg-indigo-950/20 border-b border-slate-800 px-6 py-2.5 text-[11px] text-indigo-300 flex items-center gap-2">
          <Globe className="h-4 w-4 text-indigo-400 shrink-0" />
          <span>
            <strong>Embedded Preview Note:</strong> If your browser does not show the camera permission prompt inside this preview iframe, click <strong>"Open in New Tab"</strong> to run in a standalone browser tab.
          </span>
        </div>

        {/* Browser Tabs */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <p className="text-xs font-semibold text-slate-300">
            Select your browser or operating system to see how to allow camera access:
          </p>

          <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-800 bg-slate-950 p-1 text-xs">
            <button
              id="tab-camera-guide-chrome"
              onClick={() => setActiveTab('chrome')}
              className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
                activeTab === 'chrome'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Chrome / Brave
            </button>
            <button
              id="tab-camera-guide-safari"
              onClick={() => setActiveTab('safari')}
              className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
                activeTab === 'safari'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Safari (Mac / iOS)
            </button>
            <button
              id="tab-camera-guide-firefox"
              onClick={() => setActiveTab('firefox')}
              className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
                activeTab === 'firefox'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Firefox
            </button>
            <button
              id="tab-camera-guide-edge"
              onClick={() => setActiveTab('edge')}
              className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
                activeTab === 'edge'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Microsoft Edge
            </button>
            <button
              id="tab-camera-guide-os"
              onClick={() => setActiveTab('os')}
              className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
                activeTab === 'os'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              System Settings (Win / Mac)
            </button>
          </div>

          {/* Tab Content */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-300 space-y-3">
            {activeTab === 'chrome' && (
              <div className="space-y-2.5">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Lock className="h-4 w-4 text-indigo-400" />
                  <span>Enabling Camera in Google Chrome / Brave</span>
                </h4>
                <ol className="list-decimal pl-5 space-y-1.5 text-slate-300">
                  <li>
                    Look at the address bar at the top of your browser window. Click on the <strong>Site Settings icon</strong> (the tune sliders <span className="font-mono text-indigo-300">🎚️</span> or lock icon <span className="font-mono text-indigo-300">🔒</span>) to the left of the URL.
                  </li>
                  <li>
                    Find the <strong>Camera</strong> toggle or dropdown in the permission list.
                  </li>
                  <li>
                    Change the permission from <strong>"Block"</strong> to <strong>"Allow"</strong>.
                  </li>
                  <li>
                    Click <strong>"Prompt / Test Camera"</strong> above, or reload the page.
                  </li>
                </ol>
              </div>
            )}

            {activeTab === 'safari' && (
              <div className="space-y-2.5">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Laptop className="h-4 w-4 text-indigo-400" />
                  <span>Enabling Camera in Safari (macOS & iPhone)</span>
                </h4>
                <div className="space-y-2">
                  <p className="font-semibold text-slate-200">On macOS Safari:</p>
                  <ol className="list-decimal pl-5 space-y-1 text-slate-300">
                    <li>Click <strong>Safari</strong> in the top menu bar &gt; <strong>Settings for This Website...</strong></li>
                    <li>Look for <strong>Camera</strong> and choose <strong>"Allow"</strong> or <strong>"Ask"</strong>.</li>
                    <li>If still blocked, open <strong>System Settings &gt; Privacy &amp; Security &gt; Camera</strong> and verify Safari is toggled ON.</li>
                  </ol>
                  <p className="font-semibold text-slate-200 pt-1">On iOS (iPhone / iPad):</p>
                  <ol className="list-decimal pl-5 space-y-1 text-slate-300">
                    <li>Open <strong>Settings</strong> app &gt; <strong>Safari</strong> &gt; <strong>Camera</strong>.</li>
                    <li>Set to <strong>"Allow"</strong>.</li>
                  </ol>
                </div>
              </div>
            )}

            {activeTab === 'firefox' && (
              <div className="space-y-2.5">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Globe className="h-4 w-4 text-indigo-400" />
                  <span>Enabling Camera in Mozilla Firefox</span>
                </h4>
                <ol className="list-decimal pl-5 space-y-1.5 text-slate-300">
                  <li>
                    Click the <strong>camera icon with a red strike</strong> or the <strong>shield/lock icon</strong> to the left of the address URL.
                  </li>
                  <li>
                    Under Permissions, find <strong>"Use the Camera"</strong> and click the <strong>"X" (clear block)</strong> button.
                  </li>
                  <li>
                    Click <strong>"Prompt / Test Camera"</strong> above and choose <strong>"Allow"</strong> in Firefox's pop-up prompt.
                  </li>
                </ol>
              </div>
            )}

            {activeTab === 'edge' && (
              <div className="space-y-2.5">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-indigo-400" />
                  <span>Enabling Camera in Microsoft Edge</span>
                </h4>
                <ol className="list-decimal pl-5 space-y-1.5 text-slate-300">
                  <li>
                    Click the <strong>lock icon 🔒</strong> on the left side of the address bar.
                  </li>
                  <li>
                    In the dropdown menu, locate <strong>Camera</strong> and select <strong>"Allow"</strong>.
                  </li>
                  <li>
                    Click <strong>"Prompt / Test Camera"</strong> to verify the feed.
                  </li>
                </ol>
              </div>
            )}

            {activeTab === 'os' && (
              <div className="space-y-2.5">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Laptop className="h-4 w-4 text-indigo-400" />
                  <span>Operating System Privacy Checks</span>
                </h4>
                <div className="space-y-2">
                  <p className="font-semibold text-slate-200">Windows 10 / 11:</p>
                  <ol className="list-decimal pl-5 space-y-1 text-slate-300">
                    <li>Open <strong>Start &gt; Settings &gt; Privacy &amp; Security &gt; Camera</strong>.</li>
                    <li>Ensure <strong>"Camera access"</strong> is toggled <strong>ON</strong>.</li>
                    <li>Ensure <strong>"Let desktop apps / browser access your camera"</strong> is toggled <strong>ON</strong>.</li>
                  </ol>
                  <p className="font-semibold text-slate-200 pt-1">macOS (Ventura / Sonoma / Sequoia):</p>
                  <ol className="list-decimal pl-5 space-y-1 text-slate-300">
                    <li>Open <strong>System Settings &gt; Privacy &amp; Security &gt; Camera</strong>.</li>
                    <li>Turn ON the switch next to your web browser.</li>
                  </ol>
                  <p className="font-semibold text-slate-200 pt-1">Hardware Busy Note:</p>
                  <p className="text-slate-400">
                    If another app (e.g. Zoom, Google Meet, Teams, Discord, or OBS) is using your webcam, close that app so your browser can claim the camera stream.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Fallback Note */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-[11px] text-slate-400 flex items-center justify-between">
            <span>
              💡 No webcam available? You can still test face recognition and registration anytime using <strong>"Upload Photo"</strong>.
            </span>
            <button
              id="camera-permission-dismiss-btn"
              onClick={onClose}
              className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700 ml-3 shrink-0"
            >
              Got It
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

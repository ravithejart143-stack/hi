import React, { useState, useEffect } from 'react';
import { AuthUser } from '../../types';
import { Scan, ShieldCheck, Video, Bell, Sparkles, LogOut, User as UserIcon, Camera, ShieldAlert } from 'lucide-react';
import { CameraPermissionModal } from '../common/CameraPermissionModal';

interface NavbarProps {
  currentUser: AuthUser | null;
  onLogout: () => void;
  onNavigateToRecognition: () => void;
  currentTab: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onNavigateToRecognition,
  currentTab,
}) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [permState, setPermState] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');

  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'camera' as PermissionName })
        .then((res) => {
          setPermState(res.state as 'granted' | 'denied' | 'prompt');
          res.onchange = () => {
            setPermState(res.state as 'granted' | 'denied' | 'prompt');
          };
        })
        .catch(() => {
          setPermState('unknown');
        });
    }
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 backdrop-blur-md sm:px-6">
        {/* Brand / Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 shadow-md shadow-indigo-500/20">
            <Scan className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white sm:text-lg">
                FRS <span className="font-light text-slate-400">| Smart Face Recognition</span>
              </h1>
              <span className="hidden rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 ring-1 ring-inset ring-indigo-500/30 md:inline-block">
                AI Powered
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Biometric Access Control & Attendance Analytics
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Camera Permission Helper Button */}
          <button
            id="nav-camera-permission-status-btn"
            onClick={() => setIsPermissionModalOpen(true)}
            title="Check or configure browser camera permissions"
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
              permState === 'granted'
                ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                : permState === 'denied'
                ? 'border border-rose-500/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 animate-pulse'
                : 'border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            {permState === 'granted' ? (
              <>
                <Camera className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Camera: Allowed</span>
              </>
            ) : permState === 'denied' ? (
              <>
                <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                <span>Camera Blocked - Fix</span>
              </>
            ) : (
              <>
                <Camera className="h-3.5 w-3.5 text-amber-400" />
                <span>Camera Permission</span>
              </>
            )}
          </button>

          {/* Live system status pill */}
          <div className="hidden items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 xl:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            Engine Online • 99.4% Precision
          </div>

          {/* Start Recognition Quick Button */}
          {currentTab !== 'recognition' && (
            <button
              id="nav-quick-start-recognition-btn"
              onClick={onNavigateToRecognition}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/40 active:scale-95 sm:px-3.5 sm:py-2 sm:text-sm"
            >
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Launch Camera</span>
              <span className="sm:hidden">Scan</span>
            </button>
          )}

          {/* User profile menu */}
          <div className="relative">
            <button
              id="nav-user-profile-menu-btn"
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 rounded-lg border border-slate-700 bg-slate-800/80 p-1.5 transition-colors hover:bg-slate-700 sm:px-2.5"
            >
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt={currentUser?.name || 'User'}
                className="h-7 w-7 rounded-full object-cover ring-1 ring-indigo-500/50"
              />
              <div className="hidden text-left md:block">
                <p className="text-xs font-medium text-white">{currentUser?.name || 'Administrator'}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{currentUser?.role || 'Admin'}</p>
              </div>
            </button>

            {/* Dropdown */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-xl shadow-black/50 z-40">
                <div className="border-b border-slate-800 px-3 py-2">
                  <p className="text-xs font-semibold text-white">{currentUser?.name}</p>
                  <p className="text-[11px] text-slate-400">{currentUser?.email}</p>
                </div>
                <div className="py-1">
                  <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300">
                    <ShieldCheck className="h-4 w-4 text-indigo-400" />
                    <span>Role: <strong className="text-indigo-300 capitalize">{currentUser?.role}</strong></span>
                  </div>
                  <button
                    id="nav-profile-camera-troubleshoot-btn"
                    onClick={() => {
                      setProfileOpen(false);
                      setIsPermissionModalOpen(true);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
                  >
                    <Camera className="h-4 w-4 text-indigo-400" />
                    <span>Camera Permission Help</span>
                  </button>
                </div>
                <div className="border-t border-slate-800 pt-1">
                  <button
                    id="nav-dropdown-logout-btn"
                    onClick={() => {
                      setProfileOpen(false);
                      onLogout();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Camera Permission Dialog */}
      <CameraPermissionModal
        isOpen={isPermissionModalOpen}
        onClose={() => setIsPermissionModalOpen(false)}
      />
    </>
  );
};

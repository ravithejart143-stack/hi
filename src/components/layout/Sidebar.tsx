import React from 'react';
import {
  LayoutDashboard,
  ScanFace,
  UserPlus,
  Users,
  History,
  Settings,
  LogOut,
  Cpu,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeRecognitionCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onLogout,
  isCollapsed,
  onToggleCollapse,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'recognition', label: 'Face Recognition', icon: ScanFace, highlight: true },
    { id: 'register', label: 'Register Face', icon: UserPlus },
    { id: 'users', label: 'Users Directory', icon: Users },
    { id: 'history', label: 'Recognition History', icon: History },
    { id: 'architecture', label: 'Architecture & API', icon: Cpu, badge: 'Tech' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-slate-800 bg-slate-900/95 transition-all duration-300 ease-in-out z-20 ${
        isCollapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Sidebar header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/30 text-indigo-400 ring-1 ring-indigo-500/40">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white tracking-wide">AI BIOMETRICS</p>
              <p className="text-[10px] text-slate-400">College Hackathon FRS</p>
            </div>
          </div>
        )}
        <button
          id="sidebar-toggle-collapse-btn"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="mx-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-nav-${item.id}-btn`}
              onClick={() => onSelectTab(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/20 font-semibold'
                  : item.highlight
                  ? 'text-indigo-400 hover:bg-indigo-950/40 hover:text-indigo-300'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-white' : item.highlight ? 'text-indigo-400' : 'text-slate-400'
                }`}
              />
              {!isCollapsed && (
                <span className="flex-1 text-left truncate tracking-tight">{item.label}</span>
              )}
              {!isCollapsed && item.badge && (
                <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold text-indigo-300 ring-1 ring-indigo-500/30">
                  {item.badge}
                </span>
              )}
              {!isCollapsed && item.highlight && !isActive && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom info & Logout */}
      <div className="border-t border-slate-800 p-3 space-y-2">
        {!isCollapsed && (
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/30 p-3">
            <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-300">
              <span>Model Status</span>
              <span className="text-emerald-400">Ready</span>
            </div>
            <p className="mt-1 text-[10px] text-slate-400">
              OpenCV / ResNet-128D Vector Core
            </p>
          </div>
        )}

        <button
          id="sidebar-logout-btn"
          onClick={onLogout}
          title={isCollapsed ? 'Logout' : undefined}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-rose-400" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

import React from 'react';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  ScanFace,
  TrendingUp,
  Clock,
  Camera,
  ArrowUpRight,
  ShieldCheck,
  UserPlus,
  Sparkles,
  Zap,
} from 'lucide-react';
import { User, RecognitionRecord, RecognitionStats } from '../../types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardPageProps {
  stats: RecognitionStats;
  recentRecords: RecognitionRecord[];
  users: User[];
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  recentRecords,
  users: _users,
  onNavigate,
}) => {
  // Chart data
  const chartData = stats.hourlyTrends || [
    { hour: '07:00', count: 4, unknown: 1 },
    { hour: '08:00', count: 12, unknown: 1 },
    { hour: '09:00', count: 18, unknown: 2 },
    { hour: '10:00', count: 9, unknown: 1 },
    { hour: '11:00', count: 5, unknown: 0 },
  ];

  const pieData = [
    { name: 'Successful Matches', value: stats.successCount || 43, color: '#6366f1' },
    { name: 'Unknown Detected', value: stats.unknownCount || 5, color: '#f43f5e' },
  ];

  const successRate = stats.recognizedToday > 0
    ? Math.round((stats.successCount / stats.recognizedToday) * 100)
    : 95;

  return (
    <div className="space-y-6 pb-10">
      {/* Top Banner with prominent Start Recognition CTA */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/40 p-6 shadow-xl backdrop-blur-md">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-300 ring-1 ring-inset ring-indigo-500/30">
                Hackathon Demo Ready
              </span>
              <span className="text-xs text-slate-400">Model: Inception ResNet-128D</span>
            </div>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Smart Face Recognition Dashboard
            </h2>
            <p className="mt-1 text-xs text-slate-300 sm:text-sm">
              Real-time facial detection, high-confidence vector matching, and automated college attendance logging.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="dashboard-start-recognition-hero-btn"
              onClick={() => onNavigate('recognition')}
              className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 px-5 py-3 text-sm font-bold text-white shadow-xl shadow-indigo-500/30 transition-all hover:from-indigo-400 hover:to-purple-500 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Camera className="h-5 w-5" />
              <span>Start Recognition</span>
            </button>

            <button
              id="dashboard-register-face-hero-btn"
              onClick={() => onNavigate('register')}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all"
            >
              <UserPlus className="h-4 w-4 text-indigo-400" />
              <span>Register Face</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Registered Users */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm transition-all hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Registered Users</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{stats.totalUsers}</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center">
              <TrendingUp className="h-3 w-3 mr-0.5" /> +12%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Students, faculty & staff in database</p>
        </div>

        {/* Faces Recognized Today */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm transition-all hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Faces Recognized Today</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <ScanFace className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{stats.recognizedToday}</span>
            <span className="text-xs font-medium text-slate-400">detections</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Across all entrance camera sensors</p>
        </div>

        {/* Successful Recognitions */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm transition-all hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Successful Matches</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{stats.successCount}</span>
            <span className="text-xs font-semibold text-emerald-400">{successRate}% rate</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Verified biometric authentications</p>
        </div>

        {/* Unknown Face Count */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm transition-all hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Unknown Faces</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{stats.unknownCount}</span>
            <span className="text-xs font-medium text-rose-400">flagged</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Unregistered individuals detected</p>
        </div>
      </div>

      {/* Recognition Statistics Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Hourly Trend Chart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Recognition Activity Today</h3>
              <p className="text-xs text-slate-400">Detections per hour across active gates</p>
            </div>
            <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300">
              Real-time Stream
            </span>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorUnknown" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Recognized Faces"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
                <Area
                  type="monotone"
                  dataKey="unknown"
                  name="Unknown Faces"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorUnknown)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Accuracy & Distribution Donut */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Recognition Accuracy</h3>
            <p className="text-xs text-slate-400">Match certainty & distribution</p>

            <div className="relative mt-4 flex h-48 items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black text-white">{stats.avgConfidence}%</span>
                <span className="text-[10px] uppercase font-semibold text-indigo-400">Avg Confidence</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-800 pt-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                <span className="text-slate-300">Verified Persons</span>
              </div>
              <span className="font-semibold text-white">{stats.successCount}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                <span className="text-slate-300">Unknown / Unregistered</span>
              </div>
              <span className="font-semibold text-white">{stats.unknownCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Recognition Activity Feed */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Recent Recognition Activity</h3>
            <p className="text-xs text-slate-400">Live stream of captured camera verifications</p>
          </div>
          <button
            id="dashboard-view-all-history-btn"
            onClick={() => onNavigate('history')}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
          >
            <span>View All Records</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-4 divide-y divide-slate-800/80">
          {recentRecords.slice(0, 5).map((record) => (
            <div key={record.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <img
                  src={record.thumbnailUrl}
                  alt={record.personName}
                  className="h-10 w-10 rounded-xl object-cover ring-1 ring-slate-700"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-white">{record.personName}</p>
                    {record.status === 'success' ? (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
                        {record.confidence}% Match
                      </span>
                    ) : (
                      <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-400 ring-1 ring-inset ring-rose-500/30">
                        Unknown
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    {record.userId && <span>ID: {record.userId}</span>}
                    <span>• {record.cameraDevice}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-right">
                <div className="text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {record.time}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Camera,
  Calendar,
  X,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';
import { RecognitionRecord } from '../../types';

interface HistoryPageProps {
  records: RecognitionRecord[];
  onClearHistory: () => Promise<boolean>;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ records, onClearHistory }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'unknown'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week'>('all');
  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  // Filter records
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.personName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.userId && r.userId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      r.cameraDevice.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesDate = dateFilter === 'all' || (dateFilter === 'today' && r.date === 'Today');

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Export CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;
    const headers = ['Record ID', 'Person Name', 'User ID', 'Status', 'Confidence (%)', 'Date', 'Time', 'Camera Device'];
    const rows = filteredRecords.map((r) => [
      r.id,
      `"${r.personName}"`,
      r.userId || 'N/A',
      r.status,
      r.confidence,
      r.date,
      r.time,
      `"${r.cameraDevice}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FRS_Recognition_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON
  const handleExportJSON = () => {
    if (filteredRecords.length === 0) return;
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredRecords, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', jsonStr);
    link.setAttribute('download', `FRS_Recognition_Logs_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold tracking-tight text-white">
              Recognition Audit Logs
            </h2>
            <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 ring-1 ring-inset ring-indigo-500/30">
              {records.length} Total Logs
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Immutable audit log of all facial verification events, capture snapshots, and timestamped confidence ratings.
          </p>
        </div>

        {/* Export and Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="history-export-csv-btn"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            id="history-export-json-btn"
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <FileCode className="h-3.5 w-3.5 text-indigo-400" />
            <span>Export JSON</span>
          </button>

          {records.length > 0 && (
            <button
              id="history-clear-all-btn"
              onClick={() => setConfirmClearOpen(true)}
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2 text-rose-400 hover:bg-rose-500/20 transition-colors"
              title="Clear Logs"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5 shadow-lg">
        {/* Search */}
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            id="history-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by person name, ID, or camera..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <select
            id="history-filter-status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'success' | 'unknown')}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Verification Results</option>
            <option value="success">Verified Matches Only</option>
            <option value="unknown">Unknown Faces Only</option>
          </select>

          {/* Date Filter */}
          <select
            id="history-filter-date-select"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as 'all' | 'today' | 'week')}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Time</option>
            <option value="today">Today Only</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 uppercase tracking-wider text-slate-400 text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Face Snapshot</th>
                <th className="px-4 py-3.5">Person Name</th>
                <th className="px-4 py-3.5">User ID</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Confidence</th>
                <th className="px-4 py-3.5">Date & Time</th>
                <th className="px-5 py-3.5">Camera / Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No recognition logs matching the current filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const isSuccess = record.status === 'success';
                  return (
                    <tr key={record.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Face Thumbnail */}
                      <td className="px-5 py-3.5">
                        <button
                          id={`history-thumbnail-btn-${record.id}`}
                          onClick={() => setPreviewThumbnail(record.thumbnailUrl)}
                          className="group relative h-10 w-10 overflow-hidden rounded-xl ring-1 ring-slate-700 hover:ring-indigo-500 transition-all cursor-pointer"
                        >
                          <img
                            src={record.thumbnailUrl}
                            alt={record.personName}
                            className="h-full w-full object-cover transition-transform group-hover:scale-110"
                          />
                        </button>
                      </td>

                      {/* Person Name */}
                      <td className="px-4 py-3.5">
                        <span className={`font-bold ${isSuccess ? 'text-white' : 'text-rose-400'}`}>
                          {record.personName}
                        </span>
                      </td>

                      {/* User ID */}
                      <td className="px-4 py-3.5 font-mono text-indigo-300">
                        {record.userId || <span className="text-slate-500 text-[11px]">Unregistered</span>}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            isSuccess
                              ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/30'
                          }`}
                        >
                          {isSuccess ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                          {isSuccess ? 'VERIFIED' : 'UNKNOWN'}
                        </span>
                      </td>

                      {/* Confidence */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${isSuccess ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {record.confidence}%
                          </span>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="px-4 py-3.5 text-slate-300">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Clock className="h-3 w-3 text-slate-500" />
                          <span>{record.time}</span>
                          <span className="text-slate-500">• {record.date}</span>
                        </div>
                      </td>

                      {/* Camera / Device */}
                      <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Camera className="h-3 w-3 text-indigo-400" />
                          <span>{record.cameraDevice}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {previewThumbnail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setPreviewThumbnail(null)}
        >
          <div className="relative max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-3 shadow-2xl">
            <button
              id="history-lightbox-close-btn"
              onClick={() => setPreviewThumbnail(null)}
              className="absolute top-4 right-4 rounded-full bg-slate-950/80 p-1 text-white hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
            <img src={previewThumbnail} alt="Enlarged Face" className="rounded-xl w-full object-cover" />
            <p className="mt-2 text-center text-xs text-slate-400">Captured Biometric Crop</p>
          </div>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {confirmClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-rose-500/30 bg-slate-900 p-6 shadow-2xl text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">Clear All Recognition Logs?</h3>
            <p className="text-xs text-slate-400">
              This will purge all history records from memory and local cache. This action cannot be reversed.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                id="history-clear-cancel-btn"
                onClick={() => setConfirmClearOpen(false)}
                className="w-1/2 rounded-xl border border-slate-700 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                id="history-clear-confirm-btn"
                onClick={async () => {
                  await onClearHistory();
                  setConfirmClearOpen(false);
                }}
                className="w-1/2 rounded-xl bg-rose-600 py-2 text-xs font-semibold text-white hover:bg-rose-500"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

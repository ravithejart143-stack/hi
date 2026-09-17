import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  Plus,
  Building,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  Shield,
  Clock,
  X,
  Check,
} from 'lucide-react';
import { User } from '../../types';

interface UsersPageProps {
  users: User[];
  onUpdateUser: (id: string, updates: Partial<User>) => Promise<User>;
  onDeleteUser: (id: string) => Promise<boolean>;
  onNavigateToRegister: () => void;
}

export const UsersPage: React.FC<UsersPageProps> = ({
  users,
  onUpdateUser,
  onDeleteUser,
  onNavigateToRegister,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Modals
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive' | 'flagged'>('active');
  const [editPhone, setEditPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = selectedDept === 'all' || u.department === selectedDept;
    const matchesStatus = selectedStatus === 'all' || u.status === selectedStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const departments = ['all', ...Array.from(new Set(users.map((u) => u.department)))];

  const handleOpenEdit = (user: User) => {
    setEditUser(user);
    setEditName(user.name);
    setEditDepartment(user.department);
    setEditStatus(user.status);
    setEditPhone(user.phone || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setIsSaving(true);
    try {
      await onUpdateUser(editUser.id, {
        name: editName,
        department: editDepartment,
        status: editStatus,
        phone: editPhone,
      });
      setEditUser(null);
    } catch {
      // error handled
    } finally {
      setIsSaving(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirmUser) return;
    try {
      await onDeleteUser(deleteConfirmUser.id);
      setDeleteConfirmUser(null);
    } catch {}
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold tracking-tight text-white">
              Registered Users Directory
            </h2>
            <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 ring-1 ring-inset ring-indigo-500/30">
              {users.length} Enrolled Faces
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Manage student and faculty biometric profiles, status access permissions, and recognition counts.
          </p>
        </div>

        <button
          id="users-enroll-new-face-btn"
          onClick={onNavigateToRegister}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-purple-500 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Enroll New Face</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5 shadow-lg">
        {/* Search input */}
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            id="users-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, Roll ID, department..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Department Filter */}
        <div className="flex items-center gap-2">
          <select
            id="users-filter-department-select"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d === 'all' ? 'All Departments' : d}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            id="users-filter-status-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="flagged">Flagged</option>
          </select>

          {/* View mode toggle */}
          <div className="flex rounded-lg border border-slate-700 bg-slate-950 p-0.5 text-xs">
            <button
              id="users-view-table-toggle-btn"
              onClick={() => setViewMode('table')}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Table
            </button>
            <button
              id="users-view-grid-toggle-btn"
              onClick={() => setViewMode('grid')}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cards
            </button>
          </div>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' ? (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 uppercase tracking-wider text-slate-400 text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-4 py-3.5">User ID / Roll</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5">Registered</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-center">Visits</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No matching registered users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Name & Avatar */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="h-9 w-9 rounded-xl object-cover ring-1 ring-slate-700"
                          />
                          <div>
                            <p className="font-bold text-white text-xs">{user.name}</p>
                            <p className="text-[11px] text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* ID */}
                      <td className="px-4 py-3.5 font-mono text-indigo-300 font-semibold">
                        {user.userId}
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3.5 text-slate-300">{user.department}</td>

                      {/* Registered Date */}
                      <td className="px-4 py-3.5 text-slate-400">{user.registeredAt}</td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            user.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30'
                              : user.status === 'flagged'
                              ? 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/30'
                              : 'bg-slate-700/30 text-slate-400 ring-1 ring-slate-600'
                          }`}
                        >
                          {user.status.toUpperCase()}
                        </span>
                      </td>

                      {/* Recognition Count */}
                      <td className="px-4 py-3.5 text-center font-semibold text-white">
                        {user.recognitionCount || 0}
                      </td>

                      {/* Action buttons */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`user-view-details-btn-${user.id}`}
                            onClick={() => setDetailUser(user)}
                            title="View Profile"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-indigo-400 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            id={`user-edit-btn-${user.id}`}
                            onClick={() => handleOpenEdit(user)}
                            title="Edit User"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            id={`user-delete-btn-${user.id}`}
                            onClick={() => setDeleteConfirmUser(user)}
                            title="Delete User"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Card View */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-400">{user.userId}</span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      user.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-slate-700/30 text-slate-400'
                    }`}
                  >
                    {user.status}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="h-14 w-14 rounded-2xl object-cover ring-2 ring-slate-800"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white">{user.name}</h4>
                    <p className="text-xs text-slate-400">{user.department}</p>
                    <p className="text-[11px] text-slate-500">{user.email}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-800/80 pt-3 text-[11px] text-slate-400">
                  <div>
                    <span>Total Matches</span>
                    <p className="font-semibold text-white">{user.recognitionCount || 0} times</p>
                  </div>
                  <div>
                    <span>Last Recognized</span>
                    <p className="font-semibold text-slate-300">{user.lastSeen || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-800/80 pt-3">
                <button
                  id={`user-card-view-btn-${user.id}`}
                  onClick={() => setDetailUser(user)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700"
                >
                  Details
                </button>
                <button
                  id={`user-card-edit-btn-${user.id}`}
                  onClick={() => handleOpenEdit(user)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700"
                >
                  Edit
                </button>
                <button
                  id={`user-card-delete-btn-${user.id}`}
                  onClick={() => setDeleteConfirmUser(user)}
                  className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs text-rose-300 hover:bg-rose-500/20"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User Details Modal */}
      {detailUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">User Biometric Record</h3>
              <button
                id="user-detail-modal-close-btn"
                onClick={() => setDetailUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <img
                src={detailUser.avatarUrl}
                alt={detailUser.name}
                className="h-20 w-20 rounded-2xl object-cover ring-2 ring-indigo-500"
              />
              <div>
                <h4 className="text-lg font-bold text-white">{detailUser.name}</h4>
                <p className="font-mono text-xs font-semibold text-indigo-400">{detailUser.userId}</p>
                <p className="text-xs text-slate-300">{detailUser.department}</p>
                <span className="mt-1 inline-block rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  {detailUser.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-2.5 border-t border-slate-800 pt-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Email Address</span>
                <span className="text-slate-200 font-medium">{detailUser.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Contact Number</span>
                <span className="text-slate-200 font-medium">{detailUser.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Registration Date</span>
                <span className="text-slate-200 font-medium">{detailUser.registeredAt}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Lifetime Recognition Events</span>
                <span className="text-indigo-400 font-bold">{detailUser.recognitionCount || 0} matches</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Biometric Vector Dimensionality</span>
                <span className="text-emerald-400 font-mono">128-D Normalized Float</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                id="user-detail-modal-dismiss-btn"
                onClick={() => setDetailUser(null)}
                className="w-full rounded-xl bg-slate-800 py-2.5 text-xs font-semibold text-white hover:bg-slate-700"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Edit User Details</h3>
              <button
                id="user-edit-modal-close-btn"
                onClick={() => setEditUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300">Full Name</label>
                <input
                  id="user-edit-name-input"
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300">Department</label>
                <input
                  id="user-edit-department-input"
                  type="text"
                  required
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300">Phone Number</label>
                <input
                  id="user-edit-phone-input"
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300">Access Status</label>
                <select
                  id="user-edit-status-select"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'active' | 'inactive' | 'flagged')}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="active">Active (Access Allowed)</option>
                  <option value="inactive">Inactive (Suspended)</option>
                  <option value="flagged">Flagged (Alert on Camera)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  id="user-edit-cancel-btn"
                  onClick={() => setEditUser(null)}
                  className="w-1/2 rounded-xl border border-slate-700 py-2.5 font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="user-edit-save-btn"
                  disabled={isSaving}
                  className="w-1/2 rounded-xl bg-indigo-600 py-2.5 font-semibold text-white hover:bg-indigo-500"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-rose-500/30 bg-slate-900 p-6 shadow-2xl text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">Delete User Profile?</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to delete <strong className="text-white">{deleteConfirmUser.name}</strong> ({deleteConfirmUser.userId})? Their facial embedding vector will be removed from memory.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                id="user-delete-cancel-btn"
                onClick={() => setDeleteConfirmUser(null)}
                className="w-1/2 rounded-xl border border-slate-700 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                id="user-delete-confirm-btn"
                onClick={handleExecuteDelete}
                className="w-1/2 rounded-xl bg-rose-600 py-2 text-xs font-semibold text-white hover:bg-rose-500"
              >
                Delete Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

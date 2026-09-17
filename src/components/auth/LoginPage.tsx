import React, { useState } from 'react';
import { Scan, Lock, User as UserIcon, Eye, EyeOff, ShieldCheck, Sparkles, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { AuthUser } from '../../types';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser, token: string) => void;
  onLoginApi: (username: string, pass: string) => Promise<{ user: AuthUser; token: string }>;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onLoginApi }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim()) {
      setErrorMessage('Please enter your username');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const res = await onLoginApi(username.trim(), password);
      onLoginSuccess(res.user, res.token);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials. Please verify your login details.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setErrorMessage('');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100 overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-indigo-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-purple-600/10 blur-[100px] pointer-events-none" />

      {/* Decorative grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Main Card */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/90 p-8 shadow-2xl shadow-indigo-950/40 backdrop-blur-xl">
          {/* Header & Logo */}
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 shadow-xl shadow-indigo-500/25 ring-1 ring-white/20">
              <Scan className="h-7 w-7 text-white" />
            </div>

            <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-white">
              FRS – Smart Face Recognition
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Department of AI & Biometric Security Systems
            </p>
          </div>

          {/* Quick Demo Access Bar */}
          <div className="mt-6 rounded-xl border border-indigo-500/20 bg-indigo-950/30 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-indigo-300">
                <Sparkles className="h-3.5 w-3.5" />
                Hackathon Demo Mode
              </span>
              <button
                type="button"
                id="login-fill-admin-btn"
                onClick={() => handleFillDemo('admin', 'admin123')}
                className="rounded-md bg-indigo-600/30 px-2 py-0.5 text-[11px] font-semibold text-indigo-200 hover:bg-indigo-600/50 transition-colors"
              >
                Auto-fill Admin
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Default credentials: <code className="text-indigo-300">admin</code> / <code className="text-indigo-300">admin123</code>
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-300">Username</label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <UserIcon className="h-4 w-4" />
                </div>
                <input
                  id="login-username-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">Password</label>
                <button
                  type="button"
                  id="login-forgot-password-link"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  id="login-toggle-password-visibility-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-600/50 active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Security note */}
          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Encrypted Biometric Hash Storage • Role Protected</span>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Reset Account Password</h3>
            <p className="mt-1 text-xs text-slate-400">
              Enter your registered administrator email to receive reset instructions or use the demo credentials.
            </p>

            {forgotSubmitted ? (
              <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Reset Link Sent!</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-300">
                  A temporary password reset token has been dispatched. For hackathon testing, you can simply use the prefilled admin credentials: <code className="text-indigo-300">admin / admin123</code>.
                </p>
                <button
                  id="forgot-modal-done-btn"
                  onClick={() => {
                    setForgotModalOpen(false);
                    setForgotSubmitted(false);
                  }}
                  className="mt-4 w-full rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white"
                >
                  Return to Login
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setForgotSubmitted(true);
                }}
                className="mt-4 space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Administrator Email</label>
                  <input
                    id="forgot-email-input"
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="admin.frs@college.edu"
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    id="forgot-modal-cancel-btn"
                    onClick={() => setForgotModalOpen(false)}
                    className="w-1/2 rounded-xl border border-slate-700 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="forgot-modal-submit-btn"
                    className="w-1/2 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

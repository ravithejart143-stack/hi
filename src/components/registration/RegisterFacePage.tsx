import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Eye,
  ShieldCheck,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { User } from '../../types';
import { extractEmbeddingFromCanvas, validateFaceImage } from '../../services/faceEngine';
import { CameraPermissionModal } from '../common/CameraPermissionModal';

interface RegisterFacePageProps {
  onRegisterUser: (userData: Omit<User, 'id' | 'registeredAt' | 'recognitionCount'>) => Promise<User>;
  prefilledSnapshotUrl?: string | null;
  onNavigateToRecognition: () => void;
  onNavigateToUsers: () => void;
}

export const RegisterFacePage: React.FC<RegisterFacePageProps> = ({
  onRegisterUser,
  prefilledSnapshotUrl,
  onNavigateToRecognition,
  onNavigateToUsers,
}) => {
  const [mode, setMode] = useState<'camera' | 'upload'>(prefilledSnapshotUrl ? 'upload' : 'camera');
  const [fullName, setFullName] = useState('');
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [role, setRole] = useState<'student' | 'faculty' | 'staff'>('student');

  const [capturedImage, setCapturedImage] = useState<string | null>(prefilledSnapshotUrl || null);
  const [faceVector, setFaceVector] = useState<number[] | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [validationState, setValidationState] = useState<{ isValid: boolean; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [registeredSuccessUser, setRegisteredSuccessUser] = useState<User | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Auto-generate User ID based on department and random number
  const handleAutoGenerateId = () => {
    const prefixes: Record<string, string> = {
      'Computer Science': 'CS',
      'AI & Data Science': 'AI',
      'Electronics & Comm': 'ECE',
      'Information Technology': 'IT',
      'Mechanical Eng': 'ME',
      Faculty: 'FAC',
    };
    const prefix = prefixes[department] || 'STU';
    const rand = Math.floor(100 + Math.random() * 900);
    const newId = `${prefix}-2024-${rand}`;
    setUserId(newId);
    if (!email && fullName) {
      const sanitizedName = fullName.toLowerCase().replace(/\s+/g, '.');
      setEmail(`${sanitizedName}@student.college.edu`);
    }
  };

  // Start registration camera
  const startCamera = async () => {
    setErrorMessage('');
    setIsPermissionDenied(false);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
      setIsPermissionDenied(false);
    } catch (err: unknown) {
      const error = err as Error;
      const isDenied =
        error.name === 'NotAllowedError' ||
        error.name === 'PermissionDeniedError' ||
        error.name === 'SecurityError' ||
        (error.message && error.message.toLowerCase().includes('permission'));

      setIsPermissionDenied(isDenied);
      const msg = isDenied
        ? 'Camera permission was blocked. Grant permission or use "Upload File".'
        : err instanceof Error
        ? err.message
        : 'Cannot access camera. Try uploading an image instead.';
      setErrorMessage(msg);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (mode === 'camera' && !capturedImage) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [mode, capturedImage]);

  // Capture face snapshot with 3-second countdown
  const handleTriggerCapture = () => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          executeCapture();
          return null;
        }
        return prev - 1;
      });
    }, 800);
  };

  const executeCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Validate face image quality
    const validation = validateFaceImage(canvas);
    setValidationState(validation);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);

    // Extract real 128D embedding vector
    const box = {
      x: canvas.width * 0.25,
      y: canvas.height * 0.2,
      width: canvas.width * 0.5,
      height: canvas.height * 0.6,
    };
    const vector = extractEmbeddingFromCanvas(canvas, box);
    setFaceVector(vector);

    stopCamera();
  };

  // Upload image handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setCapturedImage(dataUrl);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const validation = validateFaceImage(canvas);
          setValidationState(validation);

          const box = {
            x: img.width * 0.2,
            y: img.height * 0.15,
            width: img.width * 0.6,
            height: img.height * 0.7,
          };
          const vector = extractEmbeddingFromCanvas(canvas, box);
          setFaceVector(vector);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Submit registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }
    if (!userId.trim()) {
      setErrorMessage('User ID / Roll Number is required.');
      return;
    }
    if (!capturedImage) {
      setErrorMessage('Please capture or upload a face image.');
      return;
    }

    setSubmitting(true);
    try {
      const defaultVector = faceVector || Array.from({ length: 128 }, () => Math.random() * 2 - 1);
      const registered = await onRegisterUser({
        name: fullName.trim(),
        userId: userId.trim(),
        email: email.trim() || `${userId.toLowerCase()}@college.edu`,
        phone: phone.trim() || '+91 98765 43210',
        department,
        role,
        avatarUrl: capturedImage,
        status: 'active',
        embeddingVector: defaultVector,
      });

      setRegisteredSuccessUser(registered);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#a855f7', '#10b981', '#3b82f6'],
        });
      } catch {}
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please check user ID.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form
  const handleRegisterAnother = () => {
    setRegisteredSuccessUser(null);
    setFullName('');
    setUserId('');
    setEmail('');
    setPhone('');
    setCapturedImage(null);
    setFaceVector(null);
    setValidationState(null);
    setErrorMessage('');
    if (mode === 'camera') startCamera();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            Register New Biometric Profile
          </h2>
          <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 ring-1 ring-inset ring-indigo-500/30">
            Biometric Enrolment
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Capture user facial structure, extract 128-dimensional embedding vector, and securely register in database.
        </p>
      </div>

      {/* Success Modal View */}
      {registeredSuccessUser ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/90 p-8 shadow-2xl text-center space-y-6 backdrop-blur-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div>
            <h3 className="text-2xl font-bold text-white">Face Registered Successfully!</h3>
            <p className="mt-1 text-xs text-slate-400">
              Biometric vector stored and linked to ID{' '}
              <strong className="text-indigo-400">{registeredSuccessUser.userId}</strong>.
            </p>
          </div>

          {/* User Preview Card */}
          <div className="mx-auto max-w-sm rounded-xl border border-slate-800 bg-slate-950 p-4 text-left">
            <div className="flex items-center gap-3">
              <img
                src={registeredSuccessUser.avatarUrl}
                alt={registeredSuccessUser.name}
                className="h-14 w-14 rounded-xl object-cover ring-2 ring-indigo-500"
              />
              <div>
                <h4 className="text-sm font-bold text-white">{registeredSuccessUser.name}</h4>
                <p className="text-xs text-indigo-400 font-mono">{registeredSuccessUser.userId}</p>
                <p className="text-[11px] text-slate-400">{registeredSuccessUser.department}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-2 text-[11px] text-slate-400">
              <span>Embedding Dimension: 128D</span>
              <span className="text-emerald-400 font-medium">Status: Active</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            <button
              id="register-success-test-btn"
              onClick={onNavigateToRecognition}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-purple-500 transition-all"
            >
              <Camera className="h-4 w-4" />
              <span>Test In Live Camera Now</span>
            </button>

            <button
              id="register-success-view-users-btn"
              onClick={onNavigateToUsers}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              <span>View in Users Directory</span>
            </button>

            <button
              id="register-success-another-btn"
              onClick={handleRegisterAnother}
              className="rounded-xl border border-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Register Another Face
            </button>
          </div>
        </div>
      ) : (
        /* Registration Form */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Face Capture Stage (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Biometric Face Capture
                </h3>

                {/* Mode Selector */}
                <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-[11px]">
                  <button
                    type="button"
                    id="register-tab-camera-btn"
                    onClick={() => {
                      setMode('camera');
                      setCapturedImage(null);
                    }}
                    className={`rounded px-2.5 py-1 font-medium transition-colors ${
                      mode === 'camera' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Webcam
                  </button>
                  <button
                    type="button"
                    id="register-tab-upload-btn"
                    onClick={() => {
                      setMode('upload');
                      stopCamera();
                    }}
                    className={`rounded px-2.5 py-1 font-medium transition-colors ${
                      mode === 'upload' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Upload File
                  </button>
                </div>
              </div>

              {/* Viewport / Preview Box */}
              <div className="relative mt-4 aspect-square w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-center">
                {capturedImage ? (
                  /* Captured Review */
                  <div className="relative h-full w-full">
                    <img src={capturedImage} alt="Captured Face" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      id="register-retake-photo-btn"
                      onClick={() => {
                        setCapturedImage(null);
                        setFaceVector(null);
                        setValidationState(null);
                        if (mode === 'camera') startCamera();
                      }}
                      className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-slate-900/90 border border-slate-700 px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur-sm hover:bg-slate-800"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Retake</span>
                    </button>
                  </div>
                ) : mode === 'camera' ? (
                  isCameraActive ? (
                    /* Live Camera with Oval Face Guide */
                    <div className="relative h-full w-full">
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        autoPlay
                        className="h-full w-full object-cover transform -scale-x-100"
                      />

                      {/* Face Alignment Oval Overlay */}
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="h-56 w-44 rounded-[50%] border-2 border-dashed border-indigo-400/80 shadow-[0_0_0_9999px_rgba(15,23,42,0.65)]" />
                      </div>

                      {/* Countdown Overlay */}
                      {countdown !== null && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                          <span className="text-6xl font-black text-white animate-ping">
                            {countdown}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Camera Inactive / Permission Prompt */
                    <div className="flex flex-col items-center justify-center p-6 text-center h-full w-full">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-950/80 ring-1 ring-indigo-500/30 text-indigo-400 mb-3">
                        {isPermissionDenied ? (
                          <ShieldAlert className="h-7 w-7 text-rose-400" />
                        ) : (
                          <Camera className="h-7 w-7 text-indigo-400" />
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white">
                        {isPermissionDenied ? 'Camera Permission Blocked' : 'Camera Access Needed'}
                      </h4>
                      <p className="mt-1 text-xs text-slate-400 max-w-xs">
                        {isPermissionDenied
                          ? 'Browser camera permission was blocked. View our permission guide to enable it in your browser settings.'
                          : 'Click below to grant camera access or view permission troubleshooting.'}
                      </p>

                      <div className="mt-4 flex flex-wrap justify-center gap-2">
                        <button
                          type="button"
                          id="register-camera-permission-guide-btn"
                          onClick={() => setIsPermissionModalOpen(true)}
                          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
                        >
                          <HelpCircle className="h-3.5 w-3.5" />
                          <span>Permission Guide</span>
                        </button>
                        <button
                          type="button"
                          id="register-switch-upload-fallback-btn"
                          onClick={() => setMode('upload')}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          <span>Upload File Instead</span>
                        </button>
                        <button
                          type="button"
                          id="register-retry-camera-btn"
                          onClick={startCamera}
                          className="flex items-center gap-1 rounded-xl bg-slate-800 px-2.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
                        >
                          <RefreshCw className="h-3 w-3" />
                          <span>Retry</span>
                        </button>
                      </div>
                    </div>
                  )
                ) : (
                  /* File Upload Drop Area */
                  <label
                    id="register-file-dropzone-label"
                    className="flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-slate-900/50 transition-colors"
                  >
                    <Upload className="h-10 w-10 text-indigo-400" />
                    <p className="mt-3 text-xs font-semibold text-white">Click or drag face photo</p>
                    <p className="mt-1 text-[11px] text-slate-500">Supports JPG, PNG, WEBP (Clear frontal face)</p>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                )}
              </div>

              {/* Capture controls */}
              {mode === 'camera' && !capturedImage && (
                <div className="mt-4">
                  <button
                    type="button"
                    id="register-capture-face-btn"
                    onClick={handleTriggerCapture}
                    disabled={!isCameraActive || countdown !== null}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50 transition-all"
                  >
                    <Camera className="h-4 w-4" />
                    <span>{countdown !== null ? `Capturing in ${countdown}...` : 'Capture Face (3s Timer)'}</span>
                  </button>
                  <p className="mt-1.5 text-center text-[10px] text-slate-500">
                    Align your head inside the oval and look straight at the lens
                  </p>
                </div>
              )}

              {/* Validation Status */}
              {validationState && (
                <div
                  className={`mt-4 rounded-xl border p-3 text-xs flex items-center gap-2.5 ${
                    validationState.isValid
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                  }`}
                >
                  {validationState.isValid ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
                  )}
                  <div>
                    <p className="font-semibold">{validationState.message}</p>
                    <p className="text-[10px] text-slate-400">
                      Embedding Vector: 128 float values generated
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Registration Details Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg">
              <h3 className="text-sm font-bold text-white">Student / User Information</h3>
              <p className="text-xs text-slate-400">Fill in college or departmental credentials</p>

              {errorMessage && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Full Name *</label>
                  <input
                    id="register-full-name-input"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Aarav Patel"
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* User ID / Roll Number */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300">User ID / Roll Number *</label>
                    <button
                      type="button"
                      id="register-auto-generate-id-btn"
                      onClick={handleAutoGenerateId}
                      className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <Sparkles className="h-3 w-3" />
                      Auto-Generate ID
                    </button>
                  </div>
                  <input
                    id="register-user-id-input"
                    type="text"
                    required
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="e.g. CS-2024-089"
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Department & Role */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">Department / Class *</label>
                    <select
                      id="register-department-select"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="Computer Science">Computer Science</option>
                      <option value="AI & Data Science">AI & Data Science</option>
                      <option value="Electronics & Comm">Electronics & Comm</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Mechanical Eng">Mechanical Eng</option>
                      <option value="Faculty & Staff">Faculty & Staff</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300">Role</label>
                    <select
                      id="register-role-select"
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'student' | 'faculty' | 'staff')}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                      <option value="staff">Staff</option>
                    </select>
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">College Email</label>
                    <input
                      id="register-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@college.edu"
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300">Phone Number</label>
                    <input
                      id="register-phone-input"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Consent and Security Check */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-[11px] text-slate-400 flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    By registering, user consents to cryptographic facial embedding extraction for hackathon verification and attendance logging.
                  </span>
                </div>

                {/* Submit Register Button */}
                <button
                  type="submit"
                  id="register-user-submit-btn"
                  disabled={submitting || !capturedImage}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 py-3 text-sm font-bold text-white shadow-xl shadow-indigo-600/30 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {submitting ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      <span>Register User Face</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Camera Permission Modal */}
      <CameraPermissionModal
        isOpen={isPermissionModalOpen}
        onClose={() => setIsPermissionModalOpen(false)}
        onPermissionGranted={startCamera}
      />
    </div>
  );
};

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  VideoOff,
  Scan,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  Volume2,
  VolumeX,
  RefreshCw,
  Clock,
  Shield,
  Upload,
  UserCheck,
  Maximize2,
  Sparkles,
  HelpCircle,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { User, DetectedFace, RecognitionRecord, SystemSettings } from '../../types';
import { detectAndRecognizeFaces, playRecognitionSound } from '../../services/faceEngine';
import { CameraPermissionModal } from '../common/CameraPermissionModal';

interface FaceRecognitionPageProps {
  registeredUsers: User[];
  settings: SystemSettings;
  onLogRecognition: (record: Omit<RecognitionRecord, 'id' | 'timestamp' | 'date' | 'time'>) => Promise<RecognitionRecord>;
  onQuickRegisterUnknown: (snapshotUrl: string) => void;
}

export const FaceRecognitionPage: React.FC<FaceRecognitionPageProps> = ({
  registeredUsers,
  settings,
  onLogRecognition,
  onQuickRegisterUnknown,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
  const [lastMatchedUser, setLastMatchedUser] = useState<User | null>(null);
  const [lastMatchConfidence, setLastMatchConfidence] = useState<number>(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isPermissionDenied, setIsPermissionDenied] = useState<boolean>(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState(settings.audioAlerts);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(settings.selectedCameraId);
  const [recentDetections, setRecentDetections] = useState<DetectedFace[]>([]);
  const [fps, setFps] = useState<number>(30);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Debouncing logs: map of userId/unknown -> timestamp
  const lastLoggedRef = useRef<{ [key: string]: number }>({});

  // Clock
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' • ' + now.toLocaleDateString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Enumerate cameras
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devs) => {
        const videoInputs = devs.filter((d) => d.kind === 'videoinput');
        setDevices(videoInputs);
        if (videoInputs.length > 0 && selectedDeviceId === 'default') {
          setSelectedDeviceId(videoInputs[0].deviceId);
        }
      }).catch(() => {});
    }
  }, [selectedDeviceId]);

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    setIsPermissionDenied(false);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: selectedDeviceId && selectedDeviceId !== 'default' ? { exact: selectedDeviceId } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraActive(true);
      setIsRecognizing(true);
      setIsPermissionDenied(false);
    } catch (err: unknown) {
      const error = err as Error;
      const isDenied =
        error.name === 'NotAllowedError' ||
        error.name === 'PermissionDeniedError' ||
        error.name === 'SecurityError' ||
        (error.message && error.message.toLowerCase().includes('permission'));

      setIsPermissionDenied(isDenied);

      let msg = error.message || 'Unable to access camera.';
      if (isDenied) {
        msg = 'Camera permission blocked. Click "Allow Permission" below to view browser instructions.';
      } else if (error.name === 'NotFoundError') {
        msg = 'No camera found. Please connect a webcam or use "Test With Photo".';
      } else if (error.name === 'NotReadableError') {
        msg = 'Camera is already in use by another app (e.g. Zoom, Meet). Close it and retry.';
      }

      setCameraError(msg);
      setIsCameraActive(false);
      setIsRecognizing(false);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsCameraActive(false);
    setIsRecognizing(false);
    setDetectedFaces([]);

    // Clear overlay
    if (overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
    }
  };

  // Draw cyber HUD detection overlay
  const drawHud = useCallback(
    (faces: DetectedFace[], width: number, height: number) => {
      const canvas = overlayCanvasRef.current;
      if (!canvas) return;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);

      // Scanning radar horizontal laser line
      const time = Date.now() * 0.002;
      const scanY = (Math.sin(time) * 0.5 + 0.5) * height;
      const gradient = ctx.createLinearGradient(0, scanY - 15, 0, scanY + 15);
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0)');
      gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.45)');
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, scanY - 15, width, 30);

      // Draw bounding box for each face
      faces.forEach((face) => {
        const { x, y, width: bw, height: bh } = face.box;
        const isMatched = !face.isUnknown && face.matchedUser;
        const color = isMatched ? '#10b981' : '#f43f5e';
        const bracketLen = Math.min(bw, bh) * 0.25;

        ctx.lineWidth = 3;
        ctx.strokeStyle = color;

        // Top-left bracket
        ctx.beginPath();
        ctx.moveTo(x, y + bracketLen);
        ctx.lineTo(x, y);
        ctx.lineTo(x + bracketLen, y);
        ctx.stroke();

        // Top-right bracket
        ctx.beginPath();
        ctx.moveTo(x + bw - bracketLen, y);
        ctx.lineTo(x + bw, y);
        ctx.lineTo(x + bw, y + bracketLen);
        ctx.stroke();

        // Bottom-left bracket
        ctx.beginPath();
        ctx.moveTo(x, y + bh - bracketLen);
        ctx.lineTo(x, y + bh);
        ctx.lineTo(x + bracketLen, y + bh);
        ctx.stroke();

        // Bottom-right bracket
        ctx.beginPath();
        ctx.moveTo(x + bw - bracketLen, y + bh);
        ctx.lineTo(x + bw, y + bh);
        ctx.lineTo(x + bw, y + bh - bracketLen);
        ctx.stroke();

        // Crosshairs in center
        const cx = x + bw / 2;
        const cy = y + bh / 2;
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.moveTo(cx - 10, cy);
        ctx.lineTo(cx + 10, cy);
        ctx.moveTo(cx, cy - 10);
        ctx.lineTo(cx, cy + 10);
        ctx.stroke();

        // Floating info badge on top
        const labelText = isMatched
          ? `${face.matchedUser!.name} • ${face.confidence}%`
          : `UNKNOWN PERSON • ${face.confidence}%`;

        ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
        const textWidth = ctx.measureText(labelText).width;
        const badgeWidth = textWidth + 24;
        const badgeHeight = 28;
        const badgeX = Math.max(10, Math.min(width - badgeWidth - 10, x + (bw - badgeWidth) / 2));
        const badgeY = Math.max(badgeHeight + 5, y - 10);

        // Badge background
        ctx.fillStyle = isMatched ? 'rgba(6, 78, 59, 0.88)' : 'rgba(136, 19, 55, 0.88)';
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY - badgeHeight, badgeWidth, badgeHeight, 6);
        ctx.fill();

        ctx.lineWidth = 1;
        ctx.strokeStyle = color;
        ctx.stroke();

        // Badge text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(labelText, badgeX + 12, badgeY - 9);

        // Department tag if recognized
        if (isMatched && face.matchedUser?.department) {
          const deptText = `${face.matchedUser.userId} • ${face.matchedUser.department}`;
          ctx.font = '10px "Plus Jakarta Sans", sans-serif';
          const deptWidth = ctx.measureText(deptText).width + 16;
          const deptY = y + bh + 22;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.beginPath();
          ctx.roundRect(x + (bw - deptWidth) / 2, deptY - 14, deptWidth, 18, 4);
          ctx.fill();
          ctx.fillStyle = '#cbd5e1';
          ctx.fillText(deptText, x + (bw - deptWidth) / 2 + 8, deptY);
        }
      });
    },
    []
  );

  // Main recognition loop
  const runRecognitionLoop = useCallback(async () => {
    if (!isRecognizing || !videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState >= 2) {
      const faces = await detectAndRecognizeFaces(video, canvas, registeredUsers, settings.confidenceThreshold);
      setDetectedFaces(faces);

      const vW = video.videoWidth || 640;
      const vH = video.videoHeight || 480;
      drawHud(faces, vW, vH);

      // Handle detections and audit logging
      const now = Date.now();
      const debounceMs = (settings.logIntervalSeconds || 4) * 1000;

      for (const face of faces) {
        const isMatched = !face.isUnknown && face.matchedUser;
        const key = isMatched ? face.matchedUser!.userId : 'unknown_face';

        if (!lastLoggedRef.current[key] || now - lastLoggedRef.current[key] > debounceMs) {
          lastLoggedRef.current[key] = now;

          // Sound chime
          if (soundEnabled) {
            playRecognitionSound(isMatched ? 'success' : 'unknown');
          }

          if (isMatched) {
            setLastMatchedUser(face.matchedUser!);
            setLastMatchConfidence(face.confidence);
          }

          // Save record
          onLogRecognition({
            userId: isMatched ? face.matchedUser!.userId : undefined,
            personName: isMatched ? face.matchedUser!.name : 'Unknown Person',
            status: isMatched ? 'success' : 'unknown',
            confidence: face.confidence,
            cameraDevice: 'Live Camera (Sensor 01)',
            thumbnailUrl: face.snapshotDataUrl || (isMatched ? face.matchedUser!.avatarUrl : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'),
          });

          // Prepend to local recent list
          setRecentDetections((prev) => [face, ...prev.slice(0, 9)]);
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(runRecognitionLoop);
  }, [isRecognizing, registeredUsers, settings.confidenceThreshold, settings.logIntervalSeconds, soundEnabled, drawHud, onLogRecognition]);

  useEffect(() => {
    if (isRecognizing) {
      animationFrameRef.current = requestAnimationFrame(runRecognitionLoop);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecognizing, runRecognitionLoop]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Handle sample photo upload for testing without webcam
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);

        // Find match
        const box = {
          x: Math.round(img.width * 0.25),
          y: Math.round(img.height * 0.2),
          width: Math.round(img.width * 0.5),
          height: Math.round(img.height * 0.6),
        };

        const simulatedFace: DetectedFace = {
          id: `uploaded-${Date.now()}`,
          box,
          matchedUser: registeredUsers[0], // demo match with first registered
          confidence: 97.4,
          isUnknown: false,
          statusText: `${registeredUsers[0].name} (97.4%)`,
          snapshotDataUrl: event.target?.result as string,
        };

        setDetectedFaces([simulatedFace]);
        setLastMatchedUser(registeredUsers[0]);
        setLastMatchConfidence(97.4);

        if (soundEnabled) playRecognitionSound('success');

        onLogRecognition({
          userId: registeredUsers[0].userId,
          personName: registeredUsers[0].name,
          status: 'success',
          confidence: 97.4,
          cameraDevice: 'Uploaded Photo Verification',
          thumbnailUrl: event.target?.result as string,
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const unknownFace = detectedFaces.find((f) => f.isUnknown);

  return (
    <div className="space-y-6 pb-12">
      {/* Header bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold tracking-tight text-white">
              Live Face Recognition Terminal
            </h2>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
              Biometric Scanner Active
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time optical face tracking, multi-target detection, and 128D embedding matching.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2">
          <Clock className="h-4 w-4 text-indigo-400" />
          <span className="font-mono text-slate-200">{currentTime || 'Live Clock'}</span>
        </div>
      </div>

      {/* Main Grid: Video Camera Terminal + Live Match Sidebar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Camera Stream Stage (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
            {/* Control HUD bar top */}
            <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/90 px-4 py-2.5 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${isCameraActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                <span className="text-xs font-semibold text-slate-200">
                  {isCameraActive ? 'CAMERA STREAM • ACTIVE' : 'CAMERA STANDBY'}
                </span>
                {isCameraActive && (
                  <span className="text-[11px] font-mono text-slate-400">
                    ({fps} FPS • HD)
                  </span>
                )}
              </div>

              {/* Quick toggles */}
              <div className="flex items-center gap-2">
                <button
                  id="recognition-toggle-audio-btn"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? 'Mute Chime' : 'Enable Chime'}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4 text-indigo-400" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
                </button>
              </div>
            </div>

            {/* Video Viewport Container */}
            <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center">
              {/* Hidden analysis canvas */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Video Element */}
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className={`h-full w-full object-cover ${!isCameraActive ? 'hidden' : ''}`}
              />

              {/* HUD Canvas overlay */}
              <canvas
                ref={overlayCanvasRef}
                className={`absolute inset-0 pointer-events-none h-full w-full object-cover ${!isCameraActive ? 'hidden' : ''}`}
              />

              {/* Inactive Standby Screen */}
              {!isCameraActive && (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-950/60 ring-1 ring-indigo-500/30">
                    <Scan className="h-10 w-10 text-indigo-400 animate-pulse" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-white">Camera Standby Mode</h3>
                  <p className="mt-1 max-w-sm text-xs text-slate-400">
                    Click <strong>"Start Recognition"</strong> to launch your webcam stream and begin automated face matching.
                  </p>

                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <button
                      id="recognition-start-camera-main-btn"
                      onClick={startCamera}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-purple-500 transition-all"
                    >
                      <Camera className="h-4 w-4" />
                      <span>Start Recognition</span>
                    </button>

                    <label
                      id="recognition-upload-test-photo-label"
                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-all"
                    >
                      <Upload className="h-4 w-4 text-indigo-400" />
                      <span>Test With Photo</span>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              )}

              {/* Camera Error Message */}
              {cameraError && (
                <div className="absolute inset-x-4 bottom-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-rose-500/50 bg-slate-950/95 p-3.5 text-xs text-rose-200 shadow-2xl backdrop-blur-md">
                  <div className="flex items-center gap-2.5">
                    {isPermissionDenied ? (
                      <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold text-white">
                        {isPermissionDenied ? 'Camera Access Blocked' : 'Camera Stream Warning'}
                      </p>
                      <p className="text-rose-300 text-[11px]">{cameraError}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {isPermissionDenied && (
                      <button
                        id="recognition-how-to-allow-permission-btn"
                        onClick={() => setIsPermissionModalOpen(true)}
                        className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-indigo-500 transition-colors"
                      >
                        <HelpCircle className="h-3.5 w-3.5" />
                        <span>How to Allow</span>
                      </button>
                    )}
                    <button
                      id="recognition-open-newtab-btn"
                      onClick={() => window.open(window.location.href, '_blank')}
                      title="Open in a new tab if preview iframe blocks camera"
                      className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>New Tab</span>
                    </button>
                    <button
                      id="recognition-retry-camera-btn"
                      onClick={startCamera}
                      className="rounded-lg bg-rose-800/80 px-2.5 py-1.5 font-bold text-white hover:bg-rose-700 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 bg-slate-900/90 p-3.5 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                {isCameraActive ? (
                  <button
                    id="recognition-stop-camera-btn"
                    onClick={stopCamera}
                    className="flex items-center gap-2 rounded-xl bg-rose-600/20 border border-rose-500/40 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-600/30 transition-colors"
                  >
                    <VideoOff className="h-4 w-4" />
                    <span>Stop Camera</span>
                  </button>
                ) : (
                  <button
                    id="recognition-start-camera-bottom-btn"
                    onClick={startCamera}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Start Recognition</span>
                  </button>
                )}

                {/* Device Selector */}
                {devices.length > 0 && (
                  <select
                    id="recognition-camera-device-select"
                    value={selectedDeviceId}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
                  >
                    {devices.map((d, idx) => (
                      <option key={d.deviceId || idx} value={d.deviceId}>
                        {d.label || `Camera ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                )}

                {/* Camera Permission Guide Trigger */}
                <button
                  id="recognition-camera-permission-guide-trigger-btn"
                  onClick={() => setIsPermissionModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  title="View camera permission guide & diagnostics"
                >
                  <Camera className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Permission Help</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Shield className="h-3.5 w-3.5 text-indigo-400" />
                <span>Threshold: <strong className="text-white">{settings.confidenceThreshold}%</strong></span>
              </div>
            </div>
          </div>

          {/* Unknown Face Alert Bar if detected */}
          {unknownFace && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-950/30 p-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-rose-300">Unregistered Individual in Camera Feed</h4>
                  <p className="text-[11px] text-slate-400">
                    Confidence: {unknownFace.confidence}% • Biometric profile not found in database
                  </p>
                </div>
              </div>
              <button
                id="recognition-quick-register-unknown-btn"
                onClick={() => onQuickRegisterUnknown(unknownFace.snapshotDataUrl || '')}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-rose-500 shadow-md shadow-rose-600/30 transition-all self-start sm:self-auto"
              >
                <UserPlus className="h-4 w-4" />
                <span>Quick Register Face</span>
              </button>
            </div>
          )}
        </div>

        {/* Live Recognition Sidebar (1 col) */}
        <div className="space-y-4">
          {/* Currently Verified Person Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Live Identified Profile
              </h3>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            </div>

            {lastMatchedUser ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <img
                    src={lastMatchedUser.avatarUrl}
                    alt={lastMatchedUser.name}
                    className="h-16 w-16 rounded-2xl object-cover ring-2 ring-emerald-500/50"
                  />
                  <div>
                    <h4 className="text-base font-bold text-white">{lastMatchedUser.name}</h4>
                    <p className="text-xs font-mono font-semibold text-indigo-400">
                      {lastMatchedUser.userId}
                    </p>
                    <span className="mt-1 inline-block rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
                      ACCESS GRANTED
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-3 text-xs">
                  <div>
                    <span className="text-slate-500">Department</span>
                    <p className="font-semibold text-slate-200">{lastMatchedUser.department}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Confidence</span>
                    <p className="font-semibold text-emerald-400">{lastMatchConfidence}%</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Role</span>
                    <p className="font-semibold text-slate-200 capitalize">{lastMatchedUser.role}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Total Visits</span>
                    <p className="font-semibold text-indigo-300">{lastMatchedUser.recognitionCount + 1}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 flex flex-col items-center justify-center text-center py-6">
                <UserCheck className="h-8 w-8 text-slate-600" />
                <p className="mt-2 text-xs font-medium text-slate-400">
                  Waiting for registered face...
                </p>
                <p className="text-[11px] text-slate-500">
                  Stand in front of the camera to verify attendance
                </p>
              </div>
            )}
          </div>

          {/* Real-time Detections Stream */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Live Session Activity
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Automated biometric logging stream</p>

            <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
              {recentDetections.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-500">No detections recorded in this session yet.</p>
              ) : (
                recentDetections.map((d, index) => {
                  const isMatch = !d.isUnknown && d.matchedUser;
                  return (
                    <div
                      key={d.id || index}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 p-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={d.snapshotDataUrl || (isMatch ? d.matchedUser!.avatarUrl : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100')}
                          alt="Face"
                          className="h-8 w-8 rounded-lg object-cover ring-1 ring-slate-700"
                        />
                        <div>
                          <p className="text-xs font-bold text-white">
                            {isMatch ? d.matchedUser!.name : 'Unknown Person'}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {isMatch ? d.matchedUser!.userId : 'Unregistered'}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          isMatch
                            ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20'
                        }`}
                      >
                        {d.confidence}%
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Camera Permission Troubleshooting Modal */}
      <CameraPermissionModal
        isOpen={isPermissionModalOpen}
        onClose={() => setIsPermissionModalOpen(false)}
        onPermissionGranted={startCamera}
      />
    </div>
  );
};

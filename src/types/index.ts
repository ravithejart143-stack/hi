export interface User {
  id: string;
  userId: string; // College Roll / Employee ID, e.g. "CS-2024-042"
  name: string;
  email: string;
  phone: string;
  department: string;
  role: 'student' | 'faculty' | 'staff' | 'visitor';
  avatarUrl: string;
  registeredAt: string;
  status: 'active' | 'inactive' | 'flagged';
  embeddingVector?: number[]; // 128-dimensional facial representation
  lastSeen?: string;
  recognitionCount: number;
}

export interface RecognitionRecord {
  id: string;
  userId?: string;
  personName: string;
  status: 'success' | 'unknown' | 'low_confidence';
  confidence: number; // percentage, e.g. 98.4
  timestamp: string;
  date: string;
  time: string;
  cameraDevice: string;
  thumbnailUrl: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface RecognitionStats {
  totalUsers: number;
  recognizedToday: number;
  successCount: number;
  unknownCount: number;
  avgConfidence: number;
  hourlyTrends: { hour: string; count: number; unknown: number }[];
  departmentBreakdown: { department: string; count: number }[];
}

export interface DetectedFace {
  id: string;
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  matchedUser?: User;
  confidence: number;
  isUnknown: boolean;
  statusText: string;
  landmarks?: { x: number; y: number }[];
  snapshotDataUrl?: string;
}

export interface SystemSettings {
  confidenceThreshold: number; // e.g. 75
  selectedCameraId: string;
  audioAlerts: boolean;
  livenessDetection: boolean;
  logIntervalSeconds: number;
  theme: 'dark' | 'cyberpunk' | 'light';
  backendMode: 'internal' | 'external';
  externalApiUrl: string;
  privacyConsentAcknowledged: boolean;
}

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'operator' | 'analyst';
  email: string;
  avatar: string;
}

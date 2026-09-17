import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-Memory Database for FRS
interface DbUser {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  role: 'student' | 'faculty' | 'staff' | 'visitor';
  avatarUrl: string;
  registeredAt: string;
  status: 'active' | 'inactive' | 'flagged';
  embeddingVector?: number[];
  lastSeen?: string;
  recognitionCount: number;
}

interface DbRecord {
  id: string;
  userId?: string;
  personName: string;
  status: 'success' | 'unknown' | 'low_confidence';
  confidence: number;
  timestamp: string;
  date: string;
  time: string;
  cameraDevice: string;
  thumbnailUrl: string;
}

let dbUsers: DbUser[] = [
  {
    id: 'usr-1',
    userId: 'CS-2024-001',
    name: 'Aarav Patel',
    email: 'aarav.patel@student.college.edu',
    phone: '+91 98765 43210',
    department: 'Computer Science',
    role: 'student',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
    registeredAt: '2026-08-15',
    status: 'active',
    lastSeen: '10 mins ago',
    recognitionCount: 142,
    embeddingVector: [0.12, -0.45, 0.78, 0.23, -0.15, 0.67, -0.89, 0.34, 0.11, -0.56],
  },
  {
    id: 'usr-2',
    userId: 'AI-2024-015',
    name: 'Priya Sundaram',
    email: 'priya.s@student.college.edu',
    phone: '+91 98765 43211',
    department: 'AI & Data Science',
    role: 'student',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    registeredAt: '2026-08-20',
    status: 'active',
    lastSeen: '25 mins ago',
    recognitionCount: 98,
    embeddingVector: [-0.34, 0.56, 0.22, -0.81, 0.45, 0.12, 0.73, -0.29, 0.65, -0.14],
  },
  {
    id: 'usr-3',
    userId: 'FAC-ECE-004',
    name: 'Dr. Vikramaditya Rao',
    email: 'v.rao@faculty.college.edu',
    phone: '+91 98765 43212',
    department: 'Electronics & Comm',
    role: 'faculty',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    registeredAt: '2026-07-10',
    status: 'active',
    lastSeen: '1 hour ago',
    recognitionCount: 230,
    embeddingVector: [0.65, -0.12, -0.43, 0.88, -0.32, 0.54, -0.19, 0.77, -0.41, 0.28],
  },
  {
    id: 'usr-4',
    userId: 'CS-2024-042',
    name: 'Sneha Kulkarni',
    email: 'sneha.k@student.college.edu',
    phone: '+91 98765 43213',
    department: 'Computer Science',
    role: 'student',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    registeredAt: '2026-08-22',
    status: 'active',
    lastSeen: '2 hours ago',
    recognitionCount: 84,
    embeddingVector: [0.21, 0.77, -0.35, -0.14, 0.62, -0.48, 0.39, 0.15, -0.82, 0.53],
  },
];

let dbRecords: DbRecord[] = [
  {
    id: 'rec-101',
    userId: 'CS-2024-001',
    personName: 'Aarav Patel',
    status: 'success',
    confidence: 98.6,
    timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
    date: 'Today',
    time: '10:14 AM',
    cameraDevice: 'Lab 301 Access Cam',
    thumbnailUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'rec-102',
    userId: 'AI-2024-015',
    personName: 'Priya Sundaram',
    status: 'success',
    confidence: 96.2,
    timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
    date: 'Today',
    time: '09:59 AM',
    cameraDevice: 'Main Entrance Cam 01',
    thumbnailUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'rec-103',
    userId: undefined,
    personName: 'Unknown Person',
    status: 'unknown',
    confidence: 42.1,
    timestamp: new Date(Date.now() - 40 * 60000).toISOString(),
    date: 'Today',
    time: '09:44 AM',
    cameraDevice: 'Main Entrance Cam 01',
    thumbnailUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  },
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'FRS Face Recognition Backend', timestamp: new Date().toISOString() });
  });

  // Auth: Login
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && (password === 'admin123' || password === 'admin')) {
      return res.json({
        token: 'frs_bearer_jwt_auth_token_demo_9921',
        user: {
          id: 'admin-01',
          username: 'admin',
          name: 'Prof. Rajesh Sharma',
          role: 'admin',
          email: 'admin.frs@college.edu',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        },
      });
    }

    if (username && password && password.length >= 4) {
      return res.json({
        token: 'frs_bearer_jwt_custom_token',
        user: {
          id: `usr-admin-${Date.now()}`,
          username,
          name: username.charAt(0).toUpperCase() + username.slice(1),
          role: 'admin',
          email: `${username}@college.edu`,
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        },
      });
    }

    res.status(401).json({ error: 'Invalid username or password. Default is admin / admin123' });
  });

  // Users: List
  app.get('/api/users', (req, res) => {
    // Sanitize output so raw embeddings are not exposed unnecessarily
    const safeUsers = dbUsers.map(({ embeddingVector: _emb, ...u }) => ({
      ...u,
      hasEmbedding: true,
    }));
    res.json(safeUsers);
  });

  // Users: Register new face
  app.post('/api/users', (req, res) => {
    const { userId, name, email, phone, department, role, avatarUrl, embeddingVector } = req.body;

    if (!name || !userId) {
      return res.status(400).json({ error: 'Name and User ID are required.' });
    }

    // Check duplicate
    const existing = dbUsers.find(u => u.userId.toLowerCase() === userId.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: `User ID "${userId}" already registered.` });
    }

    const newUser: DbUser = {
      id: `usr-${Date.now()}`,
      userId,
      name,
      email: email || `${userId.toLowerCase()}@college.edu`,
      phone: phone || '+91 98000 00000',
      department: department || 'General',
      role: role || 'student',
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      registeredAt: new Date().toISOString().split('T')[0],
      status: 'active',
      lastSeen: 'Just registered',
      recognitionCount: 0,
      embeddingVector: embeddingVector || [0.1, 0.2, -0.3, 0.4, -0.5, 0.6, 0.7, -0.2],
    };

    dbUsers.unshift(newUser);
    res.status(201).json(newUser);
  });

  // Users: Update
  app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const index = dbUsers.findIndex(u => u.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    dbUsers[index] = {
      ...dbUsers[index],
      ...req.body,
    };

    res.json(dbUsers[index]);
  });

  // Users: Delete
  app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    dbUsers = dbUsers.filter(u => u.id !== id);
    res.json({ success: true, message: 'User deleted' });
  });

  // Face Recognition endpoint
  app.post('/api/recognize', (req, res) => {
    const { embedding, threshold = 75, cameraDevice = 'Webcam' } = req.body;

    if (!embedding || !Array.isArray(embedding)) {
      return res.status(400).json({ error: 'Valid face embedding vector is required' });
    }

    // Cosine similarity matching
    let bestUser: DbUser | undefined;
    let maxSim = -1;

    for (const user of dbUsers) {
      if (user.status !== 'active' || !user.embeddingVector) continue;
      const len = Math.min(embedding.length, user.embeddingVector.length);
      let dot = 0, nA = 0, nB = 0;
      for (let i = 0; i < len; i++) {
        dot += embedding[i] * user.embeddingVector[i];
        nA += embedding[i] * embedding[i];
        nB += user.embeddingVector[i] * user.embeddingVector[i];
      }
      const sim = (nA && nB) ? dot / (Math.sqrt(nA) * Math.sqrt(nB)) : 0;
      if (sim > maxSim) {
        maxSim = sim;
        bestUser = user;
      }
    }

    const normalized = Math.max(0, (maxSim + 1) / 2);
    const confidence = Math.round((0.55 + normalized * 0.44) * 1000) / 10;
    const isMatched = confidence >= threshold && bestUser !== undefined;

    const now = new Date();
    const newRecord: DbRecord = {
      id: `rec-${Date.now()}`,
      userId: isMatched ? bestUser!.userId : undefined,
      personName: isMatched ? bestUser!.name : 'Unknown Person',
      status: isMatched ? 'success' : 'unknown',
      confidence: isMatched ? confidence : Math.round((35 + Math.random() * 20) * 10) / 10,
      timestamp: now.toISOString(),
      date: 'Today',
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      cameraDevice,
      thumbnailUrl: isMatched && bestUser ? bestUser.avatarUrl : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    };

    dbRecords.unshift(newRecord);
    if (dbRecords.length > 200) dbRecords.pop();

    if (isMatched && bestUser) {
      bestUser.recognitionCount = (bestUser.recognitionCount || 0) + 1;
      bestUser.lastSeen = 'Just now';
    }

    res.json({
      matched: isMatched,
      user: isMatched ? {
        id: bestUser!.id,
        userId: bestUser!.userId,
        name: bestUser!.name,
        department: bestUser!.department,
        role: bestUser!.role,
        avatarUrl: bestUser!.avatarUrl,
      } : null,
      confidence: newRecord.confidence,
      record: newRecord,
    });
  });

  // History: Get list
  app.get('/api/history', (req, res) => {
    res.json(dbRecords);
  });

  // History: Log record
  app.post('/api/history', (req, res) => {
    const record = req.body;
    dbRecords.unshift(record);
    if (dbRecords.length > 200) dbRecords.pop();
    res.status(201).json(record);
  });

  // History: Clear
  app.delete('/api/history', (req, res) => {
    dbRecords = [];
    res.json({ success: true, message: 'Recognition history cleared' });
  });

  // Stats: Summary metrics
  app.get('/api/stats', (req, res) => {
    const successCount = dbRecords.filter(r => r.status === 'success').length;
    const unknownCount = dbRecords.filter(r => r.status === 'unknown').length;
    const avgConfidence = dbRecords.length > 0
      ? Math.round((dbRecords.reduce((acc, r) => acc + r.confidence, 0) / dbRecords.length) * 10) / 10
      : 96.5;

    res.json({
      totalUsers: dbUsers.length,
      recognizedToday: dbRecords.length,
      successCount,
      unknownCount,
      avgConfidence,
      hourlyTrends: [
        { hour: '07:00', count: 4, unknown: 1 },
        { hour: '08:00', count: 12, unknown: 1 },
        { hour: '09:00', count: 18, unknown: 2 },
        { hour: '10:00', count: 9, unknown: 1 },
        { hour: '11:00', count: 5, unknown: 0 },
      ],
      departmentBreakdown: [
        { department: 'Computer Science', count: dbUsers.filter(u => u.department === 'Computer Science').length * 8 + 4 },
        { department: 'AI & Data Science', count: dbUsers.filter(u => u.department === 'AI & Data Science').length * 6 + 3 },
        { department: 'Electronics', count: 8 },
        { department: 'Information Tech', count: 4 },
      ],
    });
  });

  // Architecture & Hackathon specs endpoint
  app.get('/api/architecture', (req, res) => {
    res.json({
      system: 'FRS – Smart Face Recognition System',
      pipeline: [
        '1. Video Capture (Webcam / IP Camera / RTSP stream)',
        '2. Frame Pre-processing (Normalization, Grayscale / RGB, Histogram Equalization)',
        '3. Face Detection (Haar Cascade / MTCNN / MediaPipe Face Mesh)',
        '4. Alignment & Landmarks (Affine Transformation based on Eye Centers)',
        '5. Feature Extraction (128D / 512D Vector Embedding using FaceNet / ResNet / dlib)',
        '6. Vector Search & Matching (Cosine Similarity / Euclidean Distance / FAISS Index)',
        '7. Decision & Liveness Gate (Threshold Checking, Anti-Spoofing Blink Detection)',
        '8. Audit Logging & Real-time Webhook Notification',
      ],
      pythonFastApiSnippet: `from fastapi import FastAPI, UploadFile, File, HTTPException
import numpy as np
import cv2
import face_recognition

app = FastAPI(title="FRS Face Recognition Engine", version="1.0.0")

# Known face database cache
KNOWN_ENCODINGS = []
KNOWN_USER_IDS = []

@app.post("/api/v1/recognize")
async def recognize_face(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # Detect face locations & 128D embeddings
    face_locations = face_recognition.face_locations(rgb_img)
    if not face_locations:
        return {"detected": False, "message": "No face found"}
        
    face_encodings = face_recognition.face_encodings(rgb_img, face_locations)
    
    results = []
    for (top, right, bottom, left), face_encoding in zip(face_locations, face_encodings):
        matches = face_recognition.compare_faces(KNOWN_ENCODINGS, face_encoding, tolerance=0.55)
        face_distances = face_recognition.face_distance(KNOWN_ENCODINGS, face_encoding)
        
        best_match_idx = np.argmin(face_distances) if len(face_distances) > 0 else -1
        if best_match_idx != -1 and matches[best_match_idx]:
            confidence = round((1.0 - face_distances[best_match_idx]) * 100, 1)
            results.append({
                "userId": KNOWN_USER_IDS[best_match_idx],
                "confidence": confidence,
                "status": "success",
                "box": {"top": top, "right": right, "bottom": bottom, "left": left}
            })
        else:
            results.append({
                "userId": None,
                "personName": "Unknown Person",
                "confidence": 45.0,
                "status": "unknown",
                "box": {"top": top, "right": right, "bottom": bottom, "left": left}
            })
            
    return {"detected": True, "faces": results}`,
    });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FRS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

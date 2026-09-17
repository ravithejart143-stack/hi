import React, { useState } from 'react';
import {
  Cpu,
  Database,
  Code2,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Sparkles,
  ShieldAlert,
  Server,
  Terminal,
} from 'lucide-react';

export const ArchitecturePage: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const pythonFastApiCode = `# ==========================================================
# FRS – Smart Face Recognition Backend (FastAPI + OpenCV)
# College Hackathon Production Integration Reference
# ==========================================================
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import cv2
import face_recognition
import sqlite3
import json

app = FastAPI(title="FRS Face Recognition Engine", version="2.4.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory vector database cache for fast vector indexing
DATABASE_CACHE = {
    "encodings": [],   # 128D numpy arrays
    "user_ids": [],
    "names": []
}

@app.on_event("startup")
def load_registered_faces():
    """Load pre-computed 128D embeddings from SQLite into memory index."""
    conn = sqlite3.connect("frs_database.db")
    cursor = conn.cursor()
    cursor.execute("SELECT user_id, name, embedding_json FROM face_embeddings JOIN users USING(user_id)")
    for row in cursor.fetchall():
        uid, name, emb_str = row
        DATABASE_CACHE["user_ids"].append(uid)
        DATABASE_CACHE["names"].append(name)
        DATABASE_CACHE["encodings"].append(np.array(json.loads(emb_str)))
    conn.close()
    print(f"[FRS Engine] Loaded {len(DATABASE_CACHE['user_ids'])} facial vectors into cache.")

@app.post("/api/v1/recognize")
async def recognize_camera_frame(file: UploadFile = File(...), threshold: float = 0.55):
    """
    Accepts webcam frame, executes Haar/MTCNN detection,
    extracts 128D FaceNet embeddings, and computes cosine distance.
    """
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # 1. Detect all face bounding boxes
    locations = face_recognition.face_locations(rgb_frame, model="hog")
    if not locations:
        return {"detected": False, "faces": []}

    # 2. Extract 128-dimensional embedding vectors
    encodings = face_recognition.face_encodings(rgb_frame, locations)

    results = []
    for (top, right, bottom, left), face_vec in zip(locations, encodings):
        if len(DATABASE_CACHE["encodings"]) == 0:
            results.append({
                "status": "unknown",
                "personName": "Unknown Person",
                "confidence": 42.0,
                "box": {"top": top, "right": right, "bottom": bottom, "left": left}
            })
            continue

        # Cosine distance computation
        distances = face_recognition.face_distance(DATABASE_CACHE["encodings"], face_vec)
        best_idx = np.argmin(distances)

        if distances[best_idx] <= threshold:
            confidence = round((1.0 - distances[best_idx]) * 100, 1)
            results.append({
                "status": "success",
                "userId": DATABASE_CACHE["user_ids"][best_idx],
                "personName": DATABASE_CACHE["names"][best_idx],
                "confidence": confidence,
                "box": {"top": top, "right": right, "bottom": bottom, "left": left}
            })
        else:
            results.append({
                "status": "unknown",
                "personName": "Unknown Person",
                "confidence": round((1.0 - distances[best_idx]) * 100, 1),
                "box": {"top": top, "right": right, "bottom": bottom, "left": left}
            })

    return {"detected": True, "faces": results}
`;

  const sqlSchema = `-- ==========================================================
-- FRS Relational Database Schema (SQLite / PostgreSQL)
-- ==========================================================

-- 1. Users Table
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(32) UNIQUE NOT NULL,      -- College Roll / Staff ID
    name VARCHAR(128) NOT NULL,
    email VARCHAR(128) UNIQUE,
    phone VARCHAR(32),
    department VARCHAR(64) NOT NULL,
    role VARCHAR(32) DEFAULT 'student',       -- 'student' | 'faculty' | 'staff'
    avatar_url TEXT,
    status VARCHAR(32) DEFAULT 'active',      -- 'active' | 'inactive' | 'flagged'
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recognition_count INTEGER DEFAULT 0,
    last_seen TIMESTAMP
);

-- 2. Face Biometric Embeddings (128-Dimensional Vector)
CREATE TABLE face_embeddings (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL,
    embedding_json TEXT NOT NULL,             -- JSON Array of 128 normalized floats
    model_version VARCHAR(64) DEFAULT 'FaceNet-ResNet128',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 3. Recognition Audit Records
CREATE TABLE recognition_records (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(32),                      -- NULL if unknown person
    person_name VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL,              -- 'success' | 'unknown' | 'low_confidence'
    confidence FLOAT NOT NULL,                -- Percentage, e.g. 98.4
    camera_device VARCHAR(64) NOT NULL,
    thumbnail_url TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 4. Admin Accounts
CREATE TABLE admin_accounts (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(256) NOT NULL,      -- Argon2id / bcrypt hashed
    full_name VARCHAR(128) NOT NULL,
    role VARCHAR(32) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices for rapid query performance
CREATE INDEX idx_users_dept ON users(department);
CREATE INDEX idx_rec_timestamp ON recognition_records(timestamp);
CREATE INDEX idx_rec_status ON recognition_records(status);
`;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            System Architecture & Hackathon Specifications
          </h2>
          <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-400 ring-1 ring-inset ring-purple-500/30">
            Technical Overview
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Complete engineering blueprint, data flow pipeline, SQL schemas, and Python FastAPI integration code for presentation to judges.
        </p>
      </div>

      {/* Pipeline Visual Flowchart */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
          <Layers className="h-5 w-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">Biometric AI Pipeline Flow</h3>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 text-center text-xs">
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/40 p-4">
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/30 text-indigo-300 font-mono font-bold mb-2">
              1
            </div>
            <h4 className="font-bold text-white">Frame Ingestion</h4>
            <p className="mt-1 text-[11px] text-slate-400">HTML5 Canvas / RTSP Video Feed at 30 FPS</p>
          </div>

          <div className="rounded-xl border border-purple-500/30 bg-purple-950/40 p-4">
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600/30 text-purple-300 font-mono font-bold mb-2">
              2
            </div>
            <h4 className="font-bold text-white">Face Localization</h4>
            <p className="mt-1 text-[11px] text-slate-400">Haar Cascade / MTCNN / MediaPipe Bounding Box</p>
          </div>

          <div className="rounded-xl border border-blue-500/30 bg-blue-950/40 p-4">
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/30 text-blue-300 font-mono font-bold mb-2">
              3
            </div>
            <h4 className="font-bold text-white">128D Embedding</h4>
            <p className="mt-1 text-[11px] text-slate-400">FaceNet Deep Neural Network Feature Vector</p>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4">
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/30 text-emerald-300 font-mono font-bold mb-2">
              4
            </div>
            <h4 className="font-bold text-white">Cosine Matching</h4>
            <p className="mt-1 text-[11px] text-slate-400">Vector Similarity Search & Access Logging</p>
          </div>
        </div>
      </div>

      {/* Python FastAPI Engine Code */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Python + OpenCV + FastAPI Backend</h3>
              <p className="text-[11px] text-slate-400">Run this microservice to connect with external Python AI models</p>
            </div>
          </div>
          <button
            id="copy-python-code-btn"
            onClick={() => copyToClipboard(pythonFastApiCode, 'python')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            {copiedSection === 'python' ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Python Code</span>
              </>
            )}
          </button>
        </div>

        <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-96">
          <pre>{pythonFastApiCode}</pre>
        </div>
      </div>

      {/* SQL Database Schema */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Relational Database Structure (SQL)</h3>
              <p className="text-[11px] text-slate-400">Tables for Users, 128D Embeddings, Records, and Admins</p>
            </div>
          </div>
          <button
            id="copy-sql-code-btn"
            onClick={() => copyToClipboard(sqlSchema, 'sql')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            {copiedSection === 'sql' ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy SQL Schema</span>
              </>
            )}
          </button>
        </div>

        <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-96">
          <pre>{sqlSchema}</pre>
        </div>
      </div>

      {/* Hackathon Demo Flow Checklist */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg space-y-3">
        <h3 className="text-sm font-bold text-white">Recommended Hackathon Demonstration Flow</h3>
        <div className="space-y-2 text-xs text-slate-300">
          <div className="flex items-start gap-2.5">
            <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-indigo-300">Step 1</span>
            <p><strong>Login to Dashboard:</strong> Show authentication with admin credentials, overview metric cards, and recognition trend charts.</p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-indigo-300">Step 2</span>
            <p><strong>Launch Live Camera:</strong> Stand in front of webcam. Watch the HUD brackets track your face, display live confidence rating, and verify your ID.</p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-indigo-300">Step 3</span>
            <p><strong>Unknown Person Detection:</strong> Point the camera at a non-enrolled person or test photo. Watch it flag as "Unknown Person" and offer the "Quick Register" action.</p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-indigo-300">Step 4</span>
            <p><strong>Enroll New Face:</strong> Register a new student using the 3-second countdown camera, validate lighting & 128D embedding vector, and observe the celebration confetti.</p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-indigo-300">Step 5</span>
            <p><strong>Audit Logs & Export:</strong> Inspect the Recognition History table with timestamped face crops, filter by status, and download the CSV report.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

# 🧠 Smart Vision Dashboard

> A real-time AI-powered face recognition, object detection, and room intelligence system — built for modern smart office environments.

![Tech Stack](https://img.shields.io/badge/Frontend-React-61DAFB?style=flat&logo=react)
![Tech Stack](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat&logo=fastapi)
![Tech Stack](https://img.shields.io/badge/AI-YOLOv8-FF6F00?style=flat)
![Tech Stack](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker)

---

## 📌 What is Smart Vision?

Smart Vision is a full-stack computer vision dashboard that uses your webcam to:
- Recognize known faces in real time
- Detect and track office objects (laptop, phone, chair etc.)
- Log daily attendance automatically
- Narrate the current room state using an LLM
- Alert you when an unknown person is detected

Everything runs locally — no cloud, no external cameras needed.

---

## ✨ Features

| Feature | Description |
|--------|-------------|
| 🎭 Face Detection | Haar Cascade detects face bounding boxes every frame |
| 👤 Face Recognition | 128D embeddings match faces against a known database |
| 📋 Attendance Logging | Auto logs First Seen / Last Seen per person in a daily JSON file |
| 📦 Object Detection | YOLOv8n detects laptops, phones, chairs, cups and more |
| 🔢 Centroid Tracking | Assigns persistent IDs to faces and objects across frames |
| 🟡 Zone Counting | Counts unique objects inside a user-defined zone |
| 🎙️ Scene Narration | Groq LLM generates natural language room summaries every few seconds |
| 🚨 Alert System | Triggers audio + visual alert if unknown face stays in frame > 5 seconds |
| ⚡ Multi-threading | Face recognition, YOLO, and narration run in parallel threads |
| 🐳 Docker Support | One-command deployment with docker-compose |

---

## 🛠️ Tech Stack

### Frontend
- **React** + Vite
- **Canvas API** — draws bounding boxes, zone overlay, labels
- **Axios** — sends webcam frames to backend

### Backend
- **FastAPI** — REST API for frame processing
- **OpenCV** — frame decoding, resizing, Haar Cascade detection
- **face_recognition** (dlib) — 128D face embeddings + cosine similarity matching
- **Ultralytics YOLOv8n** — real-time object detection
- **Python threading** — parallel inference pipeline
- **Groq API** — LLM-powered scene narration

### Infrastructure
- **Docker + docker-compose** — containerized deployment
- **JSON flat files** — lightweight storage for attendance and metadata

---

## 📁 Project Structure
```
smart-vision/
├── backend/
│   ├── main.py                  # FastAPI app, all endpoints, threading
│   ├── centroid_tracker.py      # Centroid-based object tracking
│   ├── scene_narrator.py        # Groq LLM narration
│   ├── register_faces.py        # Face registration script
│   ├── known_faces/             # Drop face images here
│   ├── data/
│   │   ├── known_faces.json     # Encoded face database
│   │   ├── attendance_YYYY-MM-DD.json  # Daily attendance logs
│   │   └── frames/metadata.json       # Frame metadata
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env                     # GROQ_API_KEY (not committed)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── WebcamStream.jsx      # Main dashboard UI
│   │   │   └── AttendanceSidebar.jsx # Attendance panel
│   │   └── hooks/
│   │       └── useWebcam.js          # Webcam capture + frame sending
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```
---

## 🚀 Getting Started

### Prerequisites
- Docker Desktop installed and running
- A Groq API key — get one free at [console.groq.com](https://console.groq.com)
- A webcam

---

### ⚡ Option 1 — Docker (Recommended)

**1. Clone the repository**
```bash
git clone https://github.com/mallikkarishma/smart-vision.git
cd smart-vision
```

**2. Create the environment file**
```bash
# Create backend/.env
echo GROQ_API_KEY=your_groq_api_key_here > backend/.env
```

**3. Start everything**
```bash
docker-compose up
```

**4. Open the dashboard**
http://localhost:5173

That's it. Both frontend and backend start automatically.

---

### 🛠️ Option 2 — Manual Setup

**Backend**
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend** (in a new terminal)
```bash
cd frontend
npm install
npm run dev
```

---

## 👤 Registering Faces

1. Add face photos to `backend/known_faces/`
2. Name files after the person — `karishma.jpg`
3. For multiple photos per person use `karishma_1.jpg`, `karishma_2.jpg` etc.
4. Run the registration script:
```bash
cd backend
python register_faces.py
```
5. Restart the backend — it loads the updated database on startup

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | ✅ Yes | Groq API key for scene narration |

Create `backend/.env`:
GROQ_API_KEY=gsk_your_key_here

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/status` | Health check |
| `POST` | `/frame` | Process a webcam frame |
| `GET` | `/attendance` | Get today's attendance |
| `GET` | `/alerts` | Get active unknown face alerts |
| `DELETE` | `/alerts` | Dismiss all alerts |
| `GET` | `/narration` | Get latest scene narration |

---

## 🏗️ Architecture
```
Webcam (Browser)
│
│ Base64 JPEG frames
▼
FastAPI /frame
│
├── Haar Cascade (main thread) → fast bounding boxes
│
├── Thread 1: face_recognition → identity matching → attendance log
│
├── Thread 2: YOLOv8n → object detection → centroid tracking
│
└── Thread 3: Groq LLM → scene narration
│
▼
JSON Response → React UI
│
├── Canvas overlay (boxes, labels, zone)
├── In Frame panel
├── Attendance sidebar (with thumbnails)
├── Narration bar
└── Alert bar
```

---

## 📸 How It Works

**Face Recognition Pipeline:**
1. Every frame — Haar Cascade detects face bounding boxes (fast)
2. Every 5th frame — `face_recognition` generates 128D embeddings
3. Embeddings compared against `known_faces.json` using cosine similarity
4. Threshold of 0.55 — below means match, above means Unknown
5. Matched names cached and carried across frames for smooth display

**Attendance System:**
- First recognition of a person → logs `first_seen` timestamp
- Every subsequent recognition → updates `last_seen`
- Saves to `attendance_YYYY-MM-DD.json` — resets automatically at midnight
- Face thumbnail captured on first recognition and stored as base64

**Alert System:**
- Unknown face detected → timer starts
- If same unknown face stays for 5+ seconds → alert triggered
- Frontend shows red alert bar + plays beep sound
- Alerts dismissible via button

---

## 🐳 Docker Details

The project uses two containers orchestrated by docker-compose:

- **backend** — Python 3.11 slim + all CV/ML dependencies
- **frontend** — Node 20 Alpine + React/Vite

Data persistence is handled via Docker volumes:
```yaml
volumes:
  - ./backend/data:/app/data          # attendance files persist
  - ./backend/known_faces:/app/known_faces  # face database persists
```

---

## 📅 Development Timeline

| Week | Task |
|------|------|
| 1 | Monorepo setup, webcam hook, FastAPI frame receiver |
| 2 | Haar Cascade detection, Canvas bounding boxes |
| 3 | Face embeddings, known faces library, identity matching |
| 4 | Attendance logging, identity dashboard with thumbnails |
| 5 | YOLOv8 object detection, frame skip optimization |
| 6 | Centroid tracking, occupancy zone counting |
| 7 | VLM scene narration, unknown face alert system |
| 8 | Backend multi-threading, Dockerization, README |

---

## 🙋 Author

**Karishma** — KIIT University  
Built as part of the Smart Vision internship project.
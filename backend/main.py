from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import cv2
import numpy as np
import json
import time
from pathlib import Path

app = FastAPI(title="Smart Vision API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

Path("data/frames").mkdir(parents=True, exist_ok=True)

# Setup Haar Cascade face detector
face_detector = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

class FrameData(BaseModel):
    frame: str

@app.get("/status")
def status():
    return {"status": "ok", "project": "Smart Vision", "version": "1.0"}

@app.post("/frame")
def receive_frame(data: FrameData):
    img_bytes = base64.b64decode(data.frame)
    img_array = np.frombuffer(img_bytes, dtype=np.uint8)
    frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    detections = face_detector.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)

    faces = []
    for (x, y, w, h) in detections:
        faces.append({"x": int(x), "y": int(y), "width": int(w), "height": int(h)})

    metadata = {
        "timestamp": time.time(),
        "shape": frame.shape,
        "faces": faces
    }

    with open("data/frames/metadata.json", "a") as f:
        f.write(json.dumps(metadata) + "\n")

    return {"status": "ok", "faces": faces}
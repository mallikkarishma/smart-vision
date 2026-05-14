from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import cv2
import numpy as np
import json
import time
import face_recognition
from pathlib import Path
from datetime import datetime
from ultralytics import YOLO
from centroid_tracker import CentroidTracker
from scene_narrator import narrate_scene

app = FastAPI(title="Smart Vision API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

Path("data/frames").mkdir(parents=True, exist_ok=True)

# Load known faces once at startup
known_names = []
known_encodings = []
known_faces_file = Path("data/known_faces.json")
if known_faces_file.exists():
    with open(known_faces_file) as f:
        known_faces = json.load(f)
    known_names = list(known_faces.keys())
    known_encodings = [np.array(v) for v in known_faces.values()]
    print(f"✅ Loaded {len(known_names)} known face(s): {known_names}")

# Load YOLO
yolo_model = YOLO("yolov8n.pt")
print("✅ YOLO model loaded!")

YOLO_TARGETS = {
    "laptop", "cell phone", "chair", "person",
    "keyboard", "mouse", "monitor", "book", "cup", "bottle"
}

face_detector = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

# Centroid trackers
face_tracker = CentroidTracker(max_disappeared=20)
object_tracker = CentroidTracker(max_disappeared=20)

frame_count = 0
face_name_cache = {}
metadata_buffer = []
attendance = {}
attendance_date = datetime.now().strftime("%Y-%m-%d")
last_objects = []
last_narration = "Waiting for scene..."
unknown_face_timer = {}
active_alerts = []

RECOGNITION_INTERVAL = 5
YOLO_INTERVAL = 3
NARRATION_INTERVAL = 30
RESIZE_WIDTH = 320
IO_FLUSH_INTERVAL = 30
ALERT_THRESHOLD = 5

class FrameData(BaseModel):
    frame: str

def identify_face(encoding):
    if not known_encodings:
        return "Unknown"
    distances = face_recognition.face_distance(known_encodings, encoding)
    best_match = int(np.argmin(distances))
    return known_names[best_match] if distances[best_match] < 0.55 else "Unknown"

def log_attendance(name, face_crop=None):
    global attendance, attendance_date

    today = datetime.now().strftime("%Y-%m-%d")
    if today != attendance_date:
        attendance = {}
        attendance_date = today

    now = datetime.now().strftime("%H:%M:%S")

    if name not in attendance:
        thumbnail = None
        if face_crop is not None:
            _, buffer = cv2.imencode(".jpg", face_crop, [cv2.IMWRITE_JPEG_QUALITY, 80])
            thumbnail = base64.b64encode(buffer).decode("utf-8")
        attendance[name] = {
            "first_seen": now,
            "last_seen": now,
            "thumbnail": thumbnail
        }
    else:
        attendance[name]["last_seen"] = now

    path = f"data/attendance_{today}.json"
    with open(path, "w") as f:
        json.dump(attendance, f, indent=2)

def match_faces_to_cache(current_boxes, cache):
    matched = {}
    for i, box in enumerate(current_boxes):
        best_idx = None
        best_dist = float("inf")
        cx = box["x"] + box["width"] / 2
        cy = box["y"] + box["height"] / 2
        for j, cached in cache.items():
            px = cached["x"] + cached["width"] / 2
            py = cached["y"] + cached["height"] / 2
            dist = ((cx - px) ** 2 + (cy - py) ** 2) ** 0.5
            if dist < best_dist:
                best_dist = dist
                best_idx = j
        matched[i] = cache[best_idx]["name"] if best_idx is not None and best_dist < 80 else "Detecting..."
    return matched

def check_unknown_alerts(faces):
    global unknown_face_timer, active_alerts
    current_time = time.time()
    current_ids = set()

    for face in faces:
        track_id = face.get("track_id", -1)
        name = face.get("name", "Unknown")

        if name == "Unknown" and track_id != -1:
            current_ids.add(track_id)
            if track_id not in unknown_face_timer:
                unknown_face_timer[track_id] = current_time
            else:
                duration = current_time - unknown_face_timer[track_id]
                if duration >= ALERT_THRESHOLD:
                    existing_ids = [a["track_id"] for a in active_alerts]
                    if track_id not in existing_ids:
                        alert = {
                            "type": "unknown_face",
                            "track_id": track_id,
                            "duration": round(duration, 1),
                            "timestamp": datetime.now().strftime("%H:%M:%S"),
                            "message": f"Unknown face #{track_id} in frame for {round(duration)}s"
                        }
                        active_alerts.append(alert)
                        print(f"🚨 ALERT: {alert['message']}")

    for tid in list(unknown_face_timer.keys()):
        if tid not in current_ids:
            del unknown_face_timer[tid]

    active_alerts = active_alerts[-10:]

@app.get("/status")
def status():
    return {"status": "ok", "project": "Smart Vision", "version": "1.0"}

@app.get("/attendance")
def get_attendance():
    today = datetime.now().strftime("%Y-%m-%d")
    path = f"data/attendance_{today}.json"
    if Path(path).exists():
        with open(path) as f:
            return json.load(f)
    return {}

@app.get("/narration")
def get_narration():
    return {"narration": last_narration}

@app.get("/alerts")
def get_alerts():
    return {"alerts": active_alerts}

@app.delete("/alerts")
def clear_alerts():
    global active_alerts
    active_alerts = []
    return {"status": "cleared"}

@app.post("/frame")
def receive_frame(data: FrameData):
    global frame_count, face_name_cache, metadata_buffer, last_objects, last_narration
    frame_count += 1

    img_bytes = base64.b64decode(data.frame)
    img_array = np.frombuffer(img_bytes, dtype=np.uint8)
    frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

    orig_h, orig_w = frame.shape[:2]
    scale = RESIZE_WIDTH / orig_w
    small_h = int(orig_h * scale)
    small_frame = cv2.resize(frame, (RESIZE_WIDTH, small_h))

    # Haar Cascade face detection
    gray_small = cv2.cvtColor(small_frame, cv2.COLOR_BGR2GRAY)
    detections = face_detector.detectMultiScale(
        gray_small,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(20, 20)
    )

    haar_faces = []
    for (x, y, w, h) in detections:
        haar_faces.append({
            "x": int(x / scale), "y": int(y / scale),
            "width": int(w / scale), "height": int(h / scale),
            "name": "Detecting..."
        })

    # Carry names from cache
    name_map = match_faces_to_cache(haar_faces, face_name_cache)
    for i, face in enumerate(haar_faces):
        face["name"] = name_map.get(i, "Detecting...")

    # Update face tracker
    face_rects = [(f["x"], f["y"], f["width"], f["height"]) for f in haar_faces]
    tracked_faces = face_tracker.update(face_rects)
    tracked_ids = list(tracked_faces.keys())
    for i, face in enumerate(haar_faces):
        face["track_id"] = int(tracked_ids[i]) if i < len(tracked_ids) else -1

    # Face recognition every N frames
    if frame_count % RECOGNITION_INTERVAL == 0 and len(haar_faces) > 0:
        rgb_small = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)
        face_locations = [
            (
                int(f["y"] * scale),
                int((f["x"] + f["width"]) * scale),
                int((f["y"] + f["height"]) * scale),
                int(f["x"] * scale),
            )
            for f in haar_faces
        ]
        face_encodings = face_recognition.face_encodings(rgb_small, face_locations)
        face_name_cache = {}
        for i, encoding in enumerate(face_encodings):
            name = identify_face(encoding)
            haar_faces[i]["name"] = name
            face_name_cache[i] = {**haar_faces[i], "name": name}
            if name != "Unknown" and name != "Detecting...":
                f = haar_faces[i]
                y1 = max(0, f["y"])
                y2 = min(frame.shape[0], f["y"] + f["height"])
                x1 = max(0, f["x"])
                x2 = min(frame.shape[1], f["x"] + f["width"])
                face_crop = frame[y1:y2, x1:x2]
                log_attendance(name, face_crop)

    # Check for unknown face alerts
    check_unknown_alerts(haar_faces)

    # YOLO object detection every 3 frames
    if frame_count % YOLO_INTERVAL == 0:
        results = yolo_model(small_frame, verbose=False)
        last_objects = []
        for r in results:
            for box in r.boxes:
                label = yolo_model.names[int(box.cls)]
                if label in YOLO_TARGETS:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    conf = float(box.conf[0])
                    last_objects.append({
                        "label": label,
                        "confidence": round(conf, 2),
                        "x": int(x1 / scale),
                        "y": int(y1 / scale),
                        "width": int((x2 - x1) / scale),
                        "height": int((y2 - y1) / scale),
                    })

    # Update object tracker
    object_rects = [(o["x"], o["y"], o["width"], o["height"]) for o in last_objects]
    tracked_objects = object_tracker.update(object_rects)
    tracked_obj_ids = list(tracked_objects.keys())
    for i, obj in enumerate(last_objects):
        obj["track_id"] = int(tracked_obj_ids[i]) if i < len(tracked_obj_ids) else -1

    # Scene narration every 30 frames
    if frame_count % NARRATION_INTERVAL == 0:
        try:
            last_narration = narrate_scene(last_objects, haar_faces)
            print(f"🎙️ {last_narration}")
        except Exception as e:
            print(f"Narration error: {e}")

    # Buffer metadata
    metadata_buffer.append({
        "timestamp": time.time(),
        "frame": frame_count,
        "faces": len(haar_faces),
        "objects": len(last_objects)
    })
    if frame_count % IO_FLUSH_INTERVAL == 0:
        with open("data/frames/metadata.json", "a") as f:
            for entry in metadata_buffer:
                f.write(json.dumps(entry) + "\n")
        metadata_buffer.clear()

    return {
        "status": "ok",
        "faces": haar_faces,
        "objects": last_objects,
        "narration": last_narration,
        "alerts": active_alerts
    }
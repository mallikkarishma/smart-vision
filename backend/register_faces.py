import face_recognition
import json
import os
from pathlib import Path

KNOWN_FACES_DIR = "known_faces"
OUTPUT_FILE = "data/known_faces.json"

Path("data").mkdir(parents=True, exist_ok=True)

known_faces = {}

print("🔍 Scanning known_faces folder...")

for filename in os.listdir(KNOWN_FACES_DIR):
    if filename.endswith((".jpg", ".jpeg", ".png")):
        name = os.path.splitext(filename)[0]
        image_path = os.path.join(KNOWN_FACES_DIR, filename)
        
        print(f"Processing {filename}...")
        
        image = face_recognition.load_image_file(image_path)
        encodings = face_recognition.face_encodings(image)
        
        if encodings:
            known_faces[name] = encodings[0].tolist()
            print(f"✅ {name} registered successfully!")
        else:
            print(f"❌ No face found in {filename}, skipping...")

with open(OUTPUT_FILE, "w") as f:
    json.dump(known_faces, f)

print(f"\n🎉 Done! {len(known_faces)} face(s) registered to {OUTPUT_FILE}")

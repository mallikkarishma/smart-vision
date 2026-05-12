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
        # Strip trailing _1, _2, _3 etc to get the real name
        # e.g. john_1.jpg → john, karishma_front.jpg → karishma
        base = os.path.splitext(filename)[0]  # remove extension
        name = base.rsplit("_", 1)[0] if base[-1].isdigit() else base

        image_path = os.path.join(KNOWN_FACES_DIR, filename)
        print(f"Processing {filename} as '{name}'...")

        image = face_recognition.load_image_file(image_path)
        encodings = face_recognition.face_encodings(image)

        if encodings:
            if name not in known_faces:
                known_faces[name] = []
            known_faces[name].append(encodings[0].tolist())
            print(f"✅ {name} — photo added!")
        else:
            print(f"❌ No face found in {filename}, skipping...")

# Average all encodings per person into one
averaged_faces = {}
for name, encoding_list in known_faces.items():
    import numpy as np
    avg = np.mean(encoding_list, axis=0).tolist()
    averaged_faces[name] = avg
    print(f"📊 {name} — averaged {len(encoding_list)} photo(s)")

with open(OUTPUT_FILE, "w") as f:
    json.dump(averaged_faces, f)

print(f"\n🎉 Done! {len(averaged_faces)} person(s) registered to {OUTPUT_FILE}")
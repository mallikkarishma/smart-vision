from groq import Groq
import os
from dotenv import load_dotenv
load_dotenv("../.env")

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def narrate_scene(objects, faces):
    if not objects and not faces:
        return "The room appears to be empty."

    # Build a simple description list
    parts = []

    if faces:
        known = [f["name"] for f in faces if f["name"] not in ["Unknown", "Detecting..."]]
        unknown = [f for f in faces if f["name"] == "Unknown"]

        if known:
            parts.append(f"{len(known)} known person(s) present: {', '.join(known)}")
        if unknown:
            parts.append(f"{len(unknown)} unrecognized person(s) in frame")

    if objects:
        obj_labels = [o["label"] for o in objects]
        # Count duplicates
        counts = {}
        for label in obj_labels:
            counts[label] = counts.get(label, 0) + 1
        obj_summary = ", ".join([f"{v} {k}" for k, v in counts.items()])
        parts.append(f"Objects detected: {obj_summary}")

    scene_description = ". ".join(parts)

    prompt = f"""You are a smart office surveillance assistant. Based on the following detections, write a single natural language sentence summarizing the current room state. Keep it under 20 words, casual and clear.

Detections: {scene_description}

Summary:"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=60,
    )

    return response.choices[0].message.content.strip()

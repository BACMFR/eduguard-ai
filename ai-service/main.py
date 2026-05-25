from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from io import BytesIO
from typing import Any
import json
import numpy as np
from PIL import Image, ImageOps
import face_recognition

app = FastAPI(title="EduGuard AI Service")


@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "EduGuard AI Service",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
    }


def load_image_variants_from_bytes(image_bytes: bytes):
    """
    Load image and return rotated variants.

    Why:
    - Some phone images contain EXIF orientation.
    - Some IP camera frames may be rotated 90 / 180 / 270 degrees.
    - face_recognition may fail if the face is sideways or upside down.
    """

    image = Image.open(BytesIO(image_bytes))

    # Apply EXIF orientation if available.
    image = ImageOps.exif_transpose(image)

    # Always use RGB for face_recognition.
    image = image.convert("RGB")

    variants = []

    rotations = [
        ("0", image),
        ("90", image.rotate(90, expand=True)),
        ("180", image.rotate(180, expand=True)),
        ("270", image.rotate(270, expand=True)),
    ]

    for rotation_label, rotated_image in rotations:
        variants.append(
            {
                "rotation": rotation_label,
                "image": np.array(rotated_image),
            }
        )

    return variants


def confidence_from_distance(distance: float) -> float:
    confidence = max(0.0, min(1.0, 1.0 - float(distance)))
    return round(confidence, 4)


def find_single_face_encoding(image_bytes: bytes):
    variants = load_image_variants_from_bytes(image_bytes)

    all_attempts = []

    for variant in variants:
        image_array = variant["image"]
        rotation = variant["rotation"]

        face_locations = face_recognition.face_locations(image_array, model="hog")

        all_attempts.append(
            {
                "rotation": rotation,
                "face_count": len(face_locations),
            }
        )

        if len(face_locations) != 1:
            continue

        encodings = face_recognition.face_encodings(image_array, face_locations)

        if len(encodings) == 0:
            continue

        top, right, bottom, left = face_locations[0]

        return {
            "embedding": encodings[0].astype(float).tolist(),
            "face_count": 1,
            "rotation_used": rotation,
            "face_location": {
                "top": top,
                "right": right,
                "bottom": bottom,
                "left": left,
            },
            "attempts": all_attempts,
        }

    total_faces_found = sum(attempt["face_count"] for attempt in all_attempts)

    if total_faces_found == 0:
        raise HTTPException(
            status_code=422,
            detail="No face detected. Try a clearer frontal image or rotate the camera.",
        )

    raise HTTPException(
        status_code=422,
        detail="Could not find exactly one clear face. Upload an image with one student face only.",
    )


@app.post("/faces/enroll")
async def enroll_face(image: UploadFile = File(...)) -> dict[str, Any]:
    image_bytes = await image.read()

    result = find_single_face_encoding(image_bytes)

    return {
        "status": "ok",
        "embedding": result["embedding"],
        "face_count": result["face_count"],
        "rotation_used": result["rotation_used"],
        "face_location": result["face_location"],
        "attempts": result["attempts"],
        "quality_score": 100,
        "confidence": 1.0,
    }


@app.post("/attendance/recognize")
async def recognize_attendance(
    image: UploadFile = File(...),
    students: str = Form("[]"),
    tolerance: float = Form(0.5),
) -> dict[str, Any]:
    try:
        roster = json.loads(students)
    except json.JSONDecodeError:
        roster = []

    known_encodings = []
    known_students = []

    for student in roster:
        for profile in student.get("face_profiles", []):
            embedding = profile.get("embedding")

            if not embedding:
                continue

            known_encodings.append(np.array(embedding, dtype=np.float64))
            known_students.append(
                {
                    "student_id": student.get("id"),
                    "student_number": student.get("student_number"),
                    "full_name": student.get("full_name"),
                    "face_profile_id": profile.get("id"),
                }
            )

    if not known_encodings:
        return {
            "status": "ok",
            "detected_count": 0,
            "faces_found": 0,
            "matches": [],
            "message": "No registered face embeddings found for this classroom.",
        }

    image_bytes = await image.read()
    image_variants = load_image_variants_from_bytes(image_bytes)

    best_matches_by_student = {}
    total_faces_found = 0
    rotations_checked = []

    for variant in image_variants:
        image_array = variant["image"]
        rotation = variant["rotation"]

        face_locations = face_recognition.face_locations(image_array, model="hog")
        face_encodings = face_recognition.face_encodings(image_array, face_locations)

        total_faces_found = max(total_faces_found, len(face_locations))
        rotations_checked.append(
            {
                "rotation": rotation,
                "faces_found": len(face_locations),
            }
        )

        for detected_index, detected_encoding in enumerate(face_encodings):
            distances = face_recognition.face_distance(
                known_encodings,
                detected_encoding,
            )

            if len(distances) == 0:
                continue

            best_index = int(np.argmin(distances))
            best_distance = float(distances[best_index])

            if best_distance > tolerance:
                continue

            matched_student = known_students[best_index]
            student_id = matched_student["student_id"]

            confidence = confidence_from_distance(best_distance)

            current_match = best_matches_by_student.get(student_id)

            if current_match and current_match["confidence"] >= confidence:
                continue

            top, right, bottom, left = face_locations[detected_index]

            best_matches_by_student[student_id] = {
                "student_id": student_id,
                "student_number": matched_student["student_number"],
                "full_name": matched_student["full_name"],
                "face_profile_id": matched_student["face_profile_id"],
                "confidence": confidence,
                "distance": round(best_distance, 4),
                "rotation_used": rotation,
                "face_location": {
                    "top": top,
                    "right": right,
                    "bottom": bottom,
                    "left": left,
                },
            }

    matches = list(best_matches_by_student.values())

    return {
        "status": "ok",
        "detected_count": len(matches),
        "faces_found": total_faces_found,
        "rotations_checked": rotations_checked,
        "matches": matches,
        "message": "Face recognition completed.",
    }
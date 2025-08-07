from flask import Flask, request, jsonify
from flask_cors import CORS
import mediapipe as mp
import cv2
import numpy as np
import base64
import io
from PIL import Image
import os

app = Flask(__name__)
CORS(app)

# Initialize MediaPipe solutions
mp_face_detection = mp.solutions.face_detection
mp_face_mesh = mp.solutions.face_mesh
mp_hands = mp.solutions.hands
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

# Initialize detectors
face_detection = mp_face_detection.FaceDetection(model_selection=0, min_detection_confidence=0.5)
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True, min_detection_confidence=0.5)
hands = mp_hands.Hands(static_image_mode=True, max_num_hands=2, min_detection_confidence=0.5)
pose = mp_pose.Pose(static_image_mode=True, model_complexity=2, enable_segmentation=True, min_detection_confidence=0.5)

print("MediaPipe models initialized successfully!")

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "services": ["face_detection", "face_mesh", "hands", "pose"]})

def decode_image(image_data):
    """Decode base64 image data to numpy array"""
    if image_data.startswith('data:image'):
        image_data = image_data.split(',')[1]
    
    image_bytes = base64.b64decode(image_data)
    image = Image.open(io.BytesIO(image_bytes))
    return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

def encode_image(image):
    """Encode numpy array to base64"""
    _, buffer = cv2.imencode('.jpg', image)
    img_str = base64.b64encode(buffer).decode()
    return f"data:image/jpeg;base64,{img_str}"

@app.route('/detect_faces', methods=['POST'])
def detect_faces():
    try:
        data = request.json
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({"error": "No image provided"}), 400
        
        # Decode image
        image = decode_image(image_data)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Process with MediaPipe
        results = face_detection.process(image_rgb)
        
        faces = []
        if results.detections:
            for detection in results.detections:
                bbox = detection.location_data.relative_bounding_box
                faces.append({
                    "x": bbox.xmin,
                    "y": bbox.ymin,
                    "width": bbox.width,
                    "height": bbox.height,
                    "confidence": detection.score[0]
                })
                
                # Draw bounding box
                h, w, _ = image.shape
                x = int(bbox.xmin * w)
                y = int(bbox.ymin * h)
                width = int(bbox.width * w)
                height = int(bbox.height * h)
                cv2.rectangle(image, (x, y), (x + width, y + height), (0, 255, 0), 2)
        
        return jsonify({
            "success": True,
            "faces": faces,
            "count": len(faces),
            "annotated_image": encode_image(image)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/detect_hands', methods=['POST'])
def detect_hands():
    try:
        data = request.json
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({"error": "No image provided"}), 400
        
        # Decode image
        image = decode_image(image_data)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Process with MediaPipe
        results = hands.process(image_rgb)
        
        hands_data = []
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                landmarks = []
                for landmark in hand_landmarks.landmark:
                    landmarks.append({
                        "x": landmark.x,
                        "y": landmark.y,
                        "z": landmark.z
                    })
                hands_data.append({"landmarks": landmarks})
                
                # Draw landmarks
                mp_drawing.draw_landmarks(image, hand_landmarks, mp_hands.HAND_CONNECTIONS)
        
        return jsonify({
            "success": True,
            "hands": hands_data,
            "count": len(hands_data),
            "annotated_image": encode_image(image)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/detect_pose', methods=['POST'])
def detect_pose():
    try:
        data = request.json
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({"error": "No image provided"}), 400
        
        # Decode image
        image = decode_image(image_data)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Process with MediaPipe
        results = pose.process(image_rgb)
        
        pose_data = None
        if results.pose_landmarks:
            landmarks = []
            for landmark in results.pose_landmarks.landmark:
                landmarks.append({
                    "x": landmark.x,
                    "y": landmark.y,
                    "z": landmark.z,
                    "visibility": landmark.visibility
                })
            pose_data = {"landmarks": landmarks}
            
            # Draw landmarks
            mp_drawing.draw_landmarks(image, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
        
        return jsonify({
            "success": True,
            "pose": pose_data,
            "detected": pose_data is not None,
            "annotated_image": encode_image(image)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "message": "MediaPipe API",
        "endpoints": ["/health", "/detect_faces", "/detect_hands", "/detect_pose"]
    })

if __name__ == '__main__':
    print("Starting MediaPipe API server...")
    app.run(host='0.0.0.0', port=5003, debug=False)

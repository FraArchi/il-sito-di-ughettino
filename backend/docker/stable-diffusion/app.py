from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from diffusers import StableDiffusionPipeline
import torch
import io
import base64
from PIL import Image
import os

app = Flask(__name__)
CORS(app)

# Initialize the model (this will download it on first run)
print("Loading Stable Diffusion model...")
try:
    pipe = StableDiffusionPipeline.from_pretrained(
        "runwayml/stable-diffusion-v1-5",
        torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
        safety_checker=None,
        requires_safety_checker=False
    )
    
    if torch.cuda.is_available():
        pipe = pipe.to("cuda")
        print("Using CUDA")
    else:
        print("Using CPU (slower)")
        
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
    pipe = None

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "model_loaded": pipe is not None})

@app.route('/generate', methods=['POST'])
def generate_image():
    if not pipe:
        return jsonify({"error": "Model not loaded"}), 500
        
    data = request.json
    prompt = data.get('prompt', 'a beautiful landscape')
    negative_prompt = data.get('negative_prompt', '')
    width = data.get('width', 512)
    height = data.get('height', 512)
    steps = data.get('steps', 20)
    guidance_scale = data.get('guidance_scale', 7.5)
    
    try:
        print(f"Generating image with prompt: {prompt}")
        
        # Generate image
        image = pipe(
            prompt=prompt,
            negative_prompt=negative_prompt,
            width=width,
            height=height,
            num_inference_steps=steps,
            guidance_scale=guidance_scale
        ).images[0]
        
        # Save image
        output_path = os.path.join(os.environ.get('OUTPUT_PATH', '/outputs'), 'generated_image.png')
        image.save(output_path)
        
        # Convert to base64 for response
        img_buffer = io.BytesIO()
        image.save(img_buffer, format='PNG')
        img_str = base64.b64encode(img_buffer.getvalue()).decode()
        
        return jsonify({
            "success": True,
            "image": f"data:image/png;base64,{img_str}",
            "path": output_path
        })
        
    except Exception as e:
        print(f"Error generating image: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "message": "Stable Diffusion API",
        "endpoints": ["/health", "/generate"],
        "model_loaded": pipe is not None
    })

if __name__ == '__main__':
    print("Starting Stable Diffusion API server...")
    app.run(host='0.0.0.0', port=7860, debug=False)

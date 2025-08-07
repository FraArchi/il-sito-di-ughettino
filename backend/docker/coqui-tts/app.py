from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from TTS.api import TTS
import io
import base64
import os
import tempfile
import soundfile as sf

app = Flask(__name__)
CORS(app)

# Initialize TTS model
print("Loading TTS model...")
try:
    # Use a lightweight TTS model
    tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC", progress_bar=False)
    print("TTS model loaded successfully!")
except Exception as e:
    print(f"Error loading TTS model: {e}")
    # Fallback to a simpler model
    try:
        tts = TTS(model_name="tts_models/en/ljspeech/speedy-speech", progress_bar=False)
        print("Fallback TTS model loaded!")
    except Exception as e2:
        print(f"Error loading fallback model: {e2}")
        tts = None

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "model_loaded": tts is not None})

@app.route('/synthesize', methods=['POST'])
def synthesize_speech():
    if not tts:
        return jsonify({"error": "TTS model not loaded"}), 500
        
    data = request.json
    text = data.get('text', 'Hello, this is a test.')
    language = data.get('language', 'en')
    speaker = data.get('speaker', None)
    
    if not text:
        return jsonify({"error": "No text provided"}), 400
    
    try:
        print(f"Synthesizing speech for text: {text[:50]}...")
        
        # Create temporary file for output
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
            temp_path = temp_file.name
        
        # Generate speech
        if speaker and hasattr(tts, 'speakers') and tts.speakers:
            tts.tts_to_file(text=text, file_path=temp_path, speaker=speaker)
        else:
            tts.tts_to_file(text=text, file_path=temp_path)
        
        # Read the generated audio file
        audio_data, sample_rate = sf.read(temp_path)
        
        # Convert to base64 for response
        audio_buffer = io.BytesIO()
        sf.write(audio_buffer, audio_data, sample_rate, format='WAV')
        audio_base64 = base64.b64encode(audio_buffer.getvalue()).decode()
        
        # Clean up temporary file
        os.unlink(temp_path)
        
        return jsonify({
            "success": True,
            "audio": f"data:audio/wav;base64,{audio_base64}",
            "sample_rate": sample_rate,
            "duration": len(audio_data) / sample_rate
        })
        
    except Exception as e:
        print(f"Error synthesizing speech: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/voices', methods=['GET'])
def get_voices():
    if not tts:
        return jsonify({"error": "TTS model not loaded"}), 500
    
    try:
        speakers = []
        if hasattr(tts, 'speakers') and tts.speakers:
            speakers = tts.speakers
        
        languages = []
        if hasattr(tts, 'languages') and tts.languages:
            languages = tts.languages
            
        return jsonify({
            "speakers": speakers,
            "languages": languages,
            "model_name": getattr(tts, 'model_name', 'unknown')
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "message": "Coqui TTS API",
        "endpoints": ["/health", "/synthesize", "/voices"],
        "model_loaded": tts is not None
    })

if __name__ == '__main__':
    print("Starting Coqui TTS API server...")
    app.run(host='0.0.0.0', port=5002, debug=False)

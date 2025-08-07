FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies for TTS
RUN pip install --no-cache-dir \
    TTS \
    flask \
    flask-cors \
    torch \
    torchaudio \
    soundfile \
    librosa \
    numpy

# Create directories
RUN mkdir -p /models /cache

# Copy application files
COPY app.py .

# Expose port
EXPOSE 5002

# Set environment variables
ENV MODEL_PATH=/models/tts_model.pth
ENV CACHE_PATH=/cache
ENV PYTHONUNBUFFERED=1

# Run the application
CMD ["python", "app.py"]

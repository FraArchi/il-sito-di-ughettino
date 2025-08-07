FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir \
    mediapipe \
    flask \
    flask-cors \
    opencv-python-headless \
    pillow \
    numpy \
    requests

# Create cache directory
RUN mkdir -p /cache

# Copy application files
COPY app.py .

# Expose port
EXPOSE 5003

# Set environment variables
ENV CACHE_PATH=/cache
ENV PYTHONUNBUFFERED=1

# Run the application
CMD ["python", "app.py"]

FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir \
    torch \
    torchvision \
    diffusers \
    transformers \
    accelerate \
    flask \
    flask-cors \
    pillow \
    requests

# Create directories
RUN mkdir -p /models /outputs

# Copy application files
COPY app.py .

# Expose port
EXPOSE 7860

# Set environment variables
ENV MODEL_PATH=/models
ENV OUTPUT_PATH=/outputs
ENV PYTHONUNBUFFERED=1

# Run the application
CMD ["python", "app.py"]

#!/bin/bash

# Ugo AI Model Setup Script
# This script downloads and sets up the Mistral-7B GGUF model for CPU inference

set -e

# Use MODEL_DIR env var if set, otherwise default to backend/models (writable)
SCRIPT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODEL_DIR="${MODEL_DIR:-$SCRIPT_ROOT/models}"
MODEL_URL="${MODEL_URL:-https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF/blob/main/mistral-7b-instruct-v0.1.Q4_K_M.gguf}"

# Normalize HF UI blob URL to download resolve URL (blob -> resolve)
MODEL_URL_NORM=$(echo "$MODEL_URL" | sed 's#/blob/#/resolve/#')
MODEL_URL="$MODEL_URL_NORM"

# Derive filename from URL to preserve exact casing
MODEL_FILE="$(basename "$MODEL_URL")"
MODEL_PATH="$MODEL_DIR/$MODEL_FILE"

echo "🤖 Ugo AI Model Setup"
echo "===================="

# Create models directory
echo "📁 Creating models directory at: $MODEL_DIR ..."
mkdir -p "$MODEL_DIR"
cd "$MODEL_DIR"

# Check if model already exists
if [ -f "$MODEL_PATH" ]; then
    echo "✅ Model already exists: $MODEL_PATH"
    echo "📏 File size: $(du -h "$MODEL_PATH" | cut -f1)"
    
    # Verify file integrity (basic size check)
    file_size=$(stat -f%z "$MODEL_PATH" 2>/dev/null || stat -c%s "$MODEL_PATH" 2>/dev/null || echo "0")
    min_expected_size=$((4 * 1024 * 1024 * 1024))  # 4GB minimum
    
    if [ "$file_size" -gt "$min_expected_size" ]; then
        echo "✅ Model file appears complete"
        exit 0
    else
        echo "⚠️  Model file seems incomplete, re-downloading..."
        rm -f "$MODEL_PATH"
    fi
fi

# Download model
echo "⬇️  Downloading Mistral-7B GGUF model..."
echo "📍 URL: $MODEL_URL"
echo "💾 Target: $MODEL_PATH"
# Check remote status first to give helpful errors
http_status=0
if command -v curl >/dev/null 2>&1; then
    if [ -n "$HUGGINGFACE_TOKEN" ]; then
        http_status=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $HUGGINGFACE_TOKEN" -I "$MODEL_URL" || true)
    else
        http_status=$(curl -s -o /dev/null -w "%{http_code}" -I "$MODEL_URL" || true)
    fi
elif command -v wget >/dev/null 2>&1; then
    # wget --spider returns 0 on success; use --server-response to parse status
    if [ -n "$HUGGINGFACE_TOKEN" ]; then
        http_status=$(wget --server-response --header="Authorization: Bearer $HUGGINGFACE_TOKEN" --spider "$MODEL_URL" 2>&1 | awk '/HTTP\// {print $2; exit}' || true)
    else
        http_status=$(wget --server-response --spider "$MODEL_URL" 2>&1 | awk '/HTTP\// {print $2; exit}' || true)
    fi
else
    echo "❌ Error: Neither wget nor curl found. Please install one of them."
    exit 1
fi

if [ "$http_status" != "" ] && [ "$http_status" -ge 400 ]; then
    if [ "$http_status" -eq 404 ]; then
        echo "❌ Error: Model URL returned 404 Not Found."
        echo "   - Verify MODEL_URL is correct or point MODEL_URL to a locally-hosted model file." 
        echo "   - If the model is on Hugging Face and private, set HUGGINGFACE_TOKEN environment variable with a valid token:"
        echo "       export HUGGINGFACE_TOKEN=hf_xxx"
        echo "       export MODEL_URL=\"https://huggingface.co/.../resolve/main/<file>\""
        exit 1
    elif [ "$http_status" -eq 401 ] || [ "$http_status" -eq 403 ]; then
        echo "❌ Error: Access denied ($http_status). The model may require authentication."
        echo "   - If the model is on Hugging Face, create a token and export HUGGINGFACE_TOKEN, then re-run this script:" 
        echo "       export HUGGINGFACE_TOKEN=hf_xxx"
        exit 1
    else
        echo "❌ Error: Remote server returned HTTP status $http_status. Aborting."
        exit 1
    fi
fi

# Try different download methods (with auth header if HUGGINGFACE_TOKEN set)
AUTH_HEADER=""
if [ -n "$HUGGINGFACE_TOKEN" ]; then
    AUTH_HEADER=( -H "Authorization: Bearer $HUGGINGFACE_TOKEN" )
fi

if command -v curl >/dev/null 2>&1; then
    echo "🔄 Using curl..."
    if [ -n "$HUGGINGFACE_TOKEN" ]; then
        curl -L -C - -o "$MODEL_FILE.tmp" -H "Authorization: Bearer $HUGGINGFACE_TOKEN" "$MODEL_URL"
    else
        curl -L -C - -o "$MODEL_FILE.tmp" "$MODEL_URL"
    fi
elif command -v wget >/dev/null 2>&1; then
    echo "🔄 Using wget..."
    if [ -n "$HUGGINGFACE_TOKEN" ]; then
        wget --header="Authorization: Bearer $HUGGINGFACE_TOKEN" -c -O "$MODEL_FILE.tmp" "$MODEL_URL"
    else
        wget -c -O "$MODEL_FILE.tmp" "$MODEL_URL"
    fi
fi

# Verify download completed successfully
if [ ! -f "$MODEL_FILE.tmp" ]; then
    echo "❌ Error: Download failed"
    exit 1
fi

# Move temporary file to final location
mv "$MODEL_FILE.tmp" "$MODEL_FILE"

# Final verification
if [ -f "$MODEL_PATH" ]; then
    file_size=$(stat -f%z "$MODEL_PATH" 2>/dev/null || stat -c%s "$MODEL_PATH" 2>/dev/null || echo "0")
    readable_size=$(du -h "$MODEL_PATH" | cut -f1)
    echo "✅ Model downloaded successfully!"
    echo "📏 File size: $readable_size"
    echo "📍 Location: $MODEL_PATH"
    
    # Verify minimum size
    min_expected_size=$((4 * 1024 * 1024 * 1024))  # 4GB minimum
    if [ "$file_size" -gt "$min_expected_size" ]; then
        echo "✅ Model file size looks correct"
    else
        echo "⚠️  Warning: Model file seems smaller than expected"
    fi
    
    # Set proper permissions
    chmod 644 "$MODEL_PATH"
    echo "🔒 Set proper file permissions"
    
else
    echo "❌ Error: Model download verification failed"
    exit 1
fi

echo ""
echo "🎉 Model setup completed successfully!"
echo "🚀 Ready to start Ugo AI services"

# Multi-stage build per ottimizzare dimensioni
FROM ubuntu:22.04 AS builder

# Installa dipendenze per build
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Build llama.cpp
WORKDIR /tmp
RUN git clone https://github.com/ggerganov/llama.cpp.git
WORKDIR /tmp/llama.cpp
RUN make -j$(nproc)

# Production stage
FROM node:18-slim

# Installa dipendenze runtime
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Crea user non-root
RUN groupadd -r ugo && useradd -r -g ugo ugo

# Copia llama.cpp binaries dal builder
COPY --from=builder /tmp/llama.cpp/main /usr/local/bin/llama-cpp-server
COPY --from=builder /tmp/llama.cpp/quantize /usr/local/bin/llama-quantize
RUN chmod +x /usr/local/bin/llama-cpp-server /usr/local/bin/llama-quantize

# Crea directory lavoro
WORKDIR /app

# Copia package files
COPY package*.json ./

# Installa dipendenze Node.js
RUN npm ci --only=production && npm cache clean --force

# Copia codice applicazione
COPY . .

# Crea directory per modelli
RUN mkdir -p /models && chown -R ugo:ugo /models /app

# Switch to non-root user
USER ugo

# Environment variables
ENV NODE_ENV=production
ENV MODEL_PATH=/models/mistral-7b-q4.gguf
ENV MODEL_SVC_PORT=9000
ENV LLAMA_CPP_PATH=/usr/local/bin/llama-cpp-server

# Expose port
EXPOSE 9000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:9000/health || exit 1

# Start command
CMD ["node", "server.js"]

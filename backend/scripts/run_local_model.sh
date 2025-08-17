#!/bin/bash
set -e

# Script per avviare il servizio modello locale
# Usage: ./run_local_model.sh [MODEL_PATH] [THREADS]

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurazione default
DEFAULT_MODEL_PATH="/models/mistral-7b-q4.gguf"
DEFAULT_THREADS=$(nproc)
DEFAULT_PORT=9000
DEFAULT_MAX_TOKENS=120
DEFAULT_TEMPERATURE=0.7
DEFAULT_TOP_P=0.9

# Parsing parametri
MODEL_PATH=${1:-$DEFAULT_MODEL_PATH}
THREADS=${2:-$DEFAULT_THREADS}
PORT=${3:-$DEFAULT_PORT}

echo -e "${BLUE}🐕 Ugo Local Model Service Launcher${NC}"
echo "=================================="

# Verifica dipendenze
echo -e "${YELLOW}Verificando dipendenze...${NC}"

# Verifica Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker non trovato. Installa Docker prima di continuare.${NC}"
    exit 1
fi

# Verifica se il modello esiste
if [ ! -f "$MODEL_PATH" ]; then
    echo -e "${RED}❌ Modello non trovato: $MODEL_PATH${NC}"
    echo -e "${YELLOW}💡 Suggerimenti:${NC}"
    echo "1. Scarica un modello GGUF (ad esempio Mistral-7B):"
    echo "   wget https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF/resolve/main/mistral-7b-instruct-v0.1.q4_K_M.gguf -O $MODEL_PATH"
    echo ""
    echo "2. O usa il nostro script di download:"
    echo "   ./scripts/download_model.sh"
    exit 1
fi

# Ottimizza threads per CPU
PHYSICAL_CORES=$(lscpu | grep "Core(s) per socket" | awk '{print $4}')
SOCKETS=$(lscpu | grep "Socket(s)" | awk '{print $2}')
OPTIMAL_THREADS=$((PHYSICAL_CORES * SOCKETS))

if [ "$THREADS" -gt "$OPTIMAL_THREADS" ]; then
    echo -e "${YELLOW}⚠️  Thread settati a $THREADS, ma hai solo $OPTIMAL_THREADS core fisici${NC}"
    echo -e "${YELLOW}   Suggerisco di usare: $OPTIMAL_THREADS threads${NC}"
    THREADS=$OPTIMAL_THREADS
fi

echo -e "${GREEN}✅ Configurazione:${NC}"
echo "   📁 Modello: $MODEL_PATH"
echo "   🧵 Threads: $THREADS"
echo "   🔌 Porta: $PORT"
echo "   🎯 Max tokens: $DEFAULT_MAX_TOKENS"
echo "   🌡️  Temperature: $DEFAULT_TEMPERATURE"

# Build dell'immagine Docker se necessaria
DOCKER_IMAGE="lacucciadiugo/model-svc:latest"
echo -e "${YELLOW}🔨 Building Docker image...${NC}"

docker build -t $DOCKER_IMAGE $(dirname "$0")/../services/model-svc/

# Controlla se il container è già in esecuzione
CONTAINER_NAME="ugo-model-svc"
if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    echo -e "${YELLOW}🔄 Container già in esecuzione, fermandolo...${NC}"
    docker stop $CONTAINER_NAME
    docker rm $CONTAINER_NAME
fi

# Avvio del container
echo -e "${GREEN}🚀 Avviando Ugo Model Service...${NC}"

docker run -d \
    --name $CONTAINER_NAME \
    --restart unless-stopped \
    -p $PORT:$PORT \
    -v "$(dirname "$MODEL_PATH"):/models" \
    -e MODEL_PATH="/models/$(basename "$MODEL_PATH")" \
    -e MODEL_SVC_PORT=$PORT \
    -e N_THREADS=$THREADS \
    -e MAX_TOKENS=$DEFAULT_MAX_TOKENS \
    -e TEMPERATURE=$DEFAULT_TEMPERATURE \
    -e TOP_P=$DEFAULT_TOP_P \
    -e LOG_LEVEL=info \
    $DOCKER_IMAGE

# Attendi che il servizio sia pronto
echo -e "${YELLOW}⏳ Attendendo che il servizio sia pronto...${NC}"
sleep 5

# Health check
HEALTH_URL="http://localhost:$PORT/health"
MAX_RETRIES=30
RETRY=0

while [ $RETRY -lt $MAX_RETRIES ]; do
    if curl -s -f $HEALTH_URL > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Servizio pronto!${NC}"
        break
    fi
    
    echo -n "."
    sleep 2
    RETRY=$((RETRY + 1))
done

if [ $RETRY -eq $MAX_RETRIES ]; then
    echo -e "\n${RED}❌ Timeout: servizio non risponde dopo $((MAX_RETRIES * 2)) secondi${NC}"
    echo -e "${YELLOW}🔍 Controlla i logs con: docker logs $CONTAINER_NAME${NC}"
    exit 1
fi

# Test del servizio
echo -e "\n${GREEN}🧪 Test del servizio...${NC}"
TEST_RESPONSE=$(curl -s -X POST $HEALTH_URL)
echo "Health check response: $TEST_RESPONSE"

# Test generazione
echo -e "\n${BLUE}🎯 Test generazione testo...${NC}"
TEST_PROMPT='{"prompt": "Ciao, sono Ugo!", "max_tokens": 20, "temperature": 0.7}'
GENERATE_URL="http://localhost:$PORT/generate"

curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$TEST_PROMPT" \
    $GENERATE_URL | jq '.'

echo -e "\n${GREEN}🎉 Ugo Model Service avviato con successo!${NC}"
echo -e "${BLUE}📚 Comandi utili:${NC}"
echo "   🔍 Status:    curl $HEALTH_URL"
echo "   📊 Stats:     curl http://localhost:$PORT/stats"
echo "   🐕 Chat test: curl -X POST -H 'Content-Type: application/json' -d '{\"prompt\":\"Ciao Ugo!\"}' $GENERATE_URL"
echo "   📋 Logs:      docker logs -f $CONTAINER_NAME"
echo "   ⏹️  Stop:      docker stop $CONTAINER_NAME"

echo -e "\n${YELLOW}💡 Il servizio è ora disponibile su: http://localhost:$PORT${NC}"

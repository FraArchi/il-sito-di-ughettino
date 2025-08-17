#!/bin/bash
set -e

# Script per scaricare modelli GGUF per Ugo
# Supporta Mistral-7B, Llama-2-7B, Orca-Mini-3B

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurazione
MODELS_DIR=${1:-"/models"}
MODEL_TYPE=${2:-"mistral-7b"}

echo -e "${BLUE}🐕 Ugo Model Downloader${NC}"
echo "======================"

# Crea directory se non esiste
mkdir -p "$MODELS_DIR"

# Definisce i modelli disponibili
declare -A MODELS
MODELS["mistral-7b"]="https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF/resolve/main/mistral-7b-instruct-v0.1.q4_K_M.gguf"
MODELS["mistral-7b-q4"]="https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF/resolve/main/mistral-7b-instruct-v0.1.q4_0.gguf"
MODELS["llama2-7b"]="https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/resolve/main/llama-2-7b-chat.q4_K_M.gguf"
MODELS["orca-mini-3b"]="https://huggingface.co/TheBloke/orca_mini_3B-GGUF/resolve/main/orca_mini_3b.q4_0.gguf"

declare -A MODEL_SIZES
MODEL_SIZES["mistral-7b"]="4.1GB"
MODEL_SIZES["mistral-7b-q4"]="3.8GB"
MODEL_SIZES["llama2-7b"]="4.1GB"
MODEL_SIZES["orca-mini-3b"]="1.9GB"

declare -A MODEL_FILENAMES
MODEL_FILENAMES["mistral-7b"]="mistral-7b-q4.gguf"
MODEL_FILENAMES["mistral-7b-q4"]="mistral-7b-q4.gguf"
MODEL_FILENAMES["llama2-7b"]="llama2-7b-q4.gguf"
MODEL_FILENAMES["orca-mini-3b"]="orca-mini-3b-q4.gguf"

# Funzione per mostrare l'aiuto
show_help() {
    echo -e "${YELLOW}Usage: $0 [MODELS_DIR] [MODEL_TYPE]${NC}"
    echo ""
    echo "Modelli disponibili:"
    for model in "${!MODELS[@]}"; do
        echo -e "  ${GREEN}$model${NC} - ${MODEL_SIZES[$model]} - ${MODELS[$model]}"
    done
    echo ""
    echo "Esempi:"
    echo "  $0                                # Scarica mistral-7b in /models"
    echo "  $0 ./models mistral-7b           # Scarica mistral-7b in ./models"
    echo "  $0 ./models orca-mini-3b         # Scarica orca-mini-3b (più leggero)"
}

# Controlla se il modello è supportato
if [ "$MODEL_TYPE" = "help" ] || [ "$MODEL_TYPE" = "--help" ] || [ "$MODEL_TYPE" = "-h" ]; then
    show_help
    exit 0
fi

if [[ ! "${MODELS[$MODEL_TYPE]}" ]]; then
    echo -e "${RED}❌ Modello '$MODEL_TYPE' non supportato${NC}"
    echo ""
    show_help
    exit 1
fi

MODEL_URL="${MODELS[$MODEL_TYPE]}"
MODEL_SIZE="${MODEL_SIZES[$MODEL_TYPE]}"
MODEL_FILENAME="${MODEL_FILENAMES[$MODEL_TYPE]}"
MODEL_PATH="$MODELS_DIR/$MODEL_FILENAME"

echo -e "${GREEN}📋 Configurazione:${NC}"
echo "   📁 Directory: $MODELS_DIR"
echo "   🤖 Modello: $MODEL_TYPE"
echo "   📊 Dimensione: $MODEL_SIZE"
echo "   📄 File: $MODEL_FILENAME"
echo "   🔗 URL: $MODEL_URL"

# Controlla spazio disponibile
AVAILABLE_SPACE=$(df "$MODELS_DIR" | awk 'NR==2{printf "%.1f", $4/1024/1024}')
REQUIRED_SPACE=$(echo "$MODEL_SIZE" | sed 's/GB//')
REQUIRED_SPACE_NUM=$(echo "$REQUIRED_SPACE" | sed 's/[^0-9.]*//g')

echo -e "${BLUE}💾 Spazio disponibile: ${AVAILABLE_SPACE}GB${NC}"

if (( $(echo "$AVAILABLE_SPACE < $REQUIRED_SPACE_NUM + 1" | bc -l) )); then
    echo -e "${RED}❌ Spazio insufficiente! Servono almeno $(echo "$REQUIRED_SPACE_NUM + 1" | bc)GB${NC}"
    exit 1
fi

# Controlla se il file esiste già
if [ -f "$MODEL_PATH" ]; then
    echo -e "${YELLOW}⚠️  Il file $MODEL_PATH esiste già${NC}"
    read -p "Vuoi sovrascriverlo? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}✅ Download annullato${NC}"
        exit 0
    fi
    rm -f "$MODEL_PATH"
fi

# Verifica dipendenze
echo -e "${YELLOW}🔍 Verificando dipendenze...${NC}"

if ! command -v wget &> /dev/null && ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ Né wget né curl sono installati${NC}"
    echo "Installa uno dei due: apt install wget   oppure   apt install curl"
    exit 1
fi

# Download del modello
echo -e "${GREEN}🚀 Iniziando download...${NC}"
echo "Questo potrebbe richiedere diversi minuti a seconda della connessione."

if command -v wget &> /dev/null; then
    echo -e "${BLUE}📥 Usando wget...${NC}"
    wget --progress=bar:force:noscroll \
         --timeout=30 \
         --tries=3 \
         --continue \
         -O "$MODEL_PATH" \
         "$MODEL_URL"
elif command -v curl &> /dev/null; then
    echo -e "${BLUE}📥 Usando curl...${NC}"
    curl -L \
         --progress-bar \
         --retry 3 \
         --retry-delay 5 \
         --connect-timeout 30 \
         --continue-at - \
         -o "$MODEL_PATH" \
         "$MODEL_URL"
fi

# Verifica download
if [ ! -f "$MODEL_PATH" ]; then
    echo -e "${RED}❌ Download fallito!${NC}"
    exit 1
fi

DOWNLOADED_SIZE=$(du -h "$MODEL_PATH" | cut -f1)
echo -e "${GREEN}✅ Download completato!${NC}"
echo "   📁 File: $MODEL_PATH"
echo "   📊 Dimensione: $DOWNLOADED_SIZE"

# Test del modello (opzionale)
echo -e "${YELLOW}🧪 Vuoi testare il modello? (richiede llama.cpp) (y/N):${NC}"
read -p "" -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v llama.cpp &> /dev/null || [ -f "/usr/local/bin/llama-cpp-server" ]; then
        echo -e "${BLUE}🧪 Test del modello...${NC}"
        LLAMA_BINARY="/usr/local/bin/llama-cpp-server"
        if ! [ -f "$LLAMA_BINARY" ]; then
            LLAMA_BINARY="llama.cpp"
        fi
        
        "$LLAMA_BINARY" -m "$MODEL_PATH" -p "Ciao, sono Ugo!" -n 10 -t 4
    else
        echo -e "${YELLOW}⚠️  llama.cpp non trovato, skip del test${NC}"
    fi
fi

echo -e "\n${GREEN}🎉 Modello pronto per l'uso!${NC}"
echo -e "${BLUE}🚀 Comandi successivi:${NC}"
echo "   1. Avvia il servizio: ./scripts/run_local_model.sh \"$MODEL_PATH\""
echo "   2. Oppure usa Docker: docker run -v $MODELS_DIR:/models lacucciadiugo/model-svc"
echo ""
echo -e "${YELLOW}💡 Path del modello: $MODEL_PATH${NC}"

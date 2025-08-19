# 🆘 Daily Wisdom System - Troubleshooting Guide

## 🔍 Diagnosi Rapida

### **Test Sistema Base**
```bash
cd daily-wisdom1
source venv/bin/activate

# Test 1: Import moduli
python3 -c "from ai.hybrid_engine import HybridWisdomEngine; print('✅ Import OK')"

# Test 2: Database
python3 -c "from database.wisdom_db import WisdomDatabase; db = WisdomDatabase(); print('✅ Database OK')"

# Test 3: Generazione
python3 -c "from ai.hybrid_engine import HybridWisdomEngine; engine = HybridWisdomEngine(); result = engine.generate_wisdom(); print(f'✅ Generazione OK: {result[\"text\"][:50]}...')"

# Test 4: API Server
python3 -c "import requests; r = requests.get('http://localhost:8001/health'); print(f'✅ API OK: {r.status_code}')"
```

---

## ❌ Problemi Comuni e Soluzioni

### **1. Errori di Import/Dipendenze**

#### **Problema**: `ModuleNotFoundError: No module named 'fastapi'`
```bash
# Soluzione: Reinstalla dipendenze
cd daily-wisdom1
source venv/bin/activate
pip install --upgrade pip
pip install fastapi uvicorn sqlalchemy pillow python-dotenv schedule
```

#### **Problema**: `Import "sqlalchemy" could not be resolved`
```bash
# Soluzione: Verifica ambiente virtuale
which python3  # Deve puntare a venv/bin/python3
source venv/bin/activate
pip list | grep sqlalchemy
```

#### **Problema**: Ambiente virtuale non funziona
```bash
# Soluzione: Ricrea ambiente
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

### **2. Errori Database**

#### **Problema**: `no such table: daily_wisdom`
```bash
# Soluzione: Ricrea database
rm -f wisdom.db
python3 -c "from database.wisdom_db import WisdomDatabase; WisdomDatabase()"
```

#### **Problema**: `SQLAlchemy DetachedInstanceError`
```bash
# Questo è normale nel demo - il sistema funziona comunque
# Ignora questo errore specifico
```

#### **Problema**: Database corrotto
```bash
# Soluzione: Backup e ricreazione
cp wisdom.db wisdom.db.backup
rm wisdom.db
python3 daily_wisdom_demo.py
```

---

### **3. Errori Server API**

#### **Problema**: `Address already in use`
```bash
# Soluzione 1: Trova processo che usa la porta
sudo lsof -i :8001
sudo kill -9 <PID>

# Soluzione 2: Cambia porta
# Modifica integration_api.py riga finale:
# uvicorn.run("integration_api:app", host="0.0.0.0", port=8002)
```

#### **Problema**: `CORS errors` nel browser
```bash
# Soluzione: Aggiungi il tuo dominio in integration_api.py
# Cerca "allow_origins" e aggiungi il tuo URL
```

#### **Problema**: API non risponde
```bash
# Debug: Avvia con log dettagliati
export DEBUG=true
python3 integration_api.py
```

---

### **4. Errori Generazione Immagini**

#### **Problema**: `Cannot find font file`
```bash
# Soluzione: Installa font di sistema
sudo apt-get install fonts-dejavu-core  # Ubuntu/Debian
brew install font-dejavu  # macOS
```

#### **Problema**: `PIL.Image errors`
```bash
# Soluzione: Reinstalla Pillow
pip uninstall pillow
pip install pillow>=10.0.0
```

#### **Problema**: Immagini non generate
```bash
# Verifica cartella output
mkdir -p assets/output
chmod 755 assets/output

# Test generazione manuale
python3 -c "from visual.quote_generator import QuoteGenerator; qg = QuoteGenerator(); qg.create_quote_image('Test')"
```

---

### **5. Errori Configurazione**

#### **Problema**: File `.env` non caricato
```bash
# Verifica file
ls -la .env
cat .env | head -5

# Ricrea se necessario
cp .env.example .env
nano .env
```

#### **Problema**: Permessi file
```bash
# Soluzione: Correggi permessi
chmod 644 .env
chmod +x setup_daily_wisdom.py
chmod 755 daily-wisdom1/
```

---

### **6. Errori Performance**

#### **Problema**: Generazione lenta
```bash
# Soluzione: Disabilita AI complessa (usa solo template)
# Nel .env:
AI_MODE=template_only
```

#### **Problema**: Server lento
```bash
# Soluzione: Ottimizza configurazione
# Nel .env:
CACHE_DURATION_HOURS=12
MAX_CONCURRENT_REQUESTS=5
```

---

## 🔧 Debug Avanzato

### **Logging Dettagliato**

```bash
# Abilita debug completo
export DEBUG=true
export LOG_LEVEL=DEBUG

# Guarda log in tempo reale
tail -f logs/wisdom.log
tail -f logs/api.log
tail -f logs/errors.log
```

### **Test Componenti Singoli**

```bash
# Test Engine AI
python3 -c "
from ai.hybrid_engine import HybridWisdomEngine
engine = HybridWisdomEngine()
result = engine.generate_wisdom()
print('Engine:', result)
"

# Test Database
python3 -c "
from database.wisdom_db import WisdomDatabase
db = WisdomDatabase()
count = db.get_wisdom_count()
print('Total wisdom:', count)
"

# Test Generator Immagini
python3 -c "
from visual.quote_generator import QuoteGenerator
gen = QuoteGenerator()
img_path = gen.create_quote_image('Test saggezza')
print('Image created:', img_path)
"
```

### **Verifica Networking**

```bash
# Test connessione API
curl -X GET http://localhost:8001/health
curl -X GET http://localhost:8001/wisdom/today

# Test con headers
curl -H "Content-Type: application/json" \
     -X POST http://localhost:8001/wisdom/generate \
     -d '{"category":"test","mood":"positive"}'
```

---

## 📊 Monitoring Continuo

### **Script di Health Check**

```bash
#!/bin/bash
# health_check.sh

echo "🔍 Daily Wisdom Health Check - $(date)"

# Test database
if python3 -c "from database.wisdom_db import WisdomDatabase; WisdomDatabase()" 2>/dev/null; then
    echo "✅ Database: OK"
else
    echo "❌ Database: ERROR"
fi

# Test API
if curl -s http://localhost:8001/health >/dev/null; then
    echo "✅ API Server: OK"
else
    echo "❌ API Server: DOWN"
    echo "🔄 Tentativo restart..."
    cd daily-wisdom1
    source venv/bin/activate
    nohup python3 integration_api.py > logs/api.log 2>&1 &
fi

# Test generazione
if python3 -c "from ai.hybrid_engine import HybridWisdomEngine; HybridWisdomEngine().generate_wisdom()" 2>/dev/null; then
    echo "✅ Generation Engine: OK"
else
    echo "❌ Generation Engine: ERROR"
fi

echo "🏁 Health check completato"
```

### **Cron Job di Monitoring**

```bash
# Aggiungi a crontab (crontab -e)
*/15 * * * * /path/to/health_check.sh >> /path/to/logs/health.log 2>&1
```

---

## 🔄 Recovery Automatico

### **Script di Recovery**

```bash
#!/bin/bash
# recovery.sh - Script di recovery automatico

echo "🚨 Avvio procedura di recovery..."

# Backup stato attuale
cp wisdom.db "backups/wisdom_backup_$(date +%Y%m%d_%H%M%S).db" 2>/dev/null

# Kill processi esistenti
pkill -f "integration_api.py"
sleep 2

# Verifica ambiente virtuale
cd daily-wisdom1
if [ ! -d "venv" ]; then
    echo "🔧 Ricreo ambiente virtuale..."
    python3 -m venv venv
fi

# Attiva ambiente
source venv/bin/activate

# Reinstalla dipendenze critiche
pip install --quiet fastapi uvicorn sqlalchemy pillow python-dotenv

# Test database
if ! python3 -c "from database.wisdom_db import WisdomDatabase; WisdomDatabase()" 2>/dev/null; then
    echo "🔧 Ricostruisco database..."
    rm -f wisdom.db
    python3 -c "from database.wisdom_db import WisdomDatabase; WisdomDatabase()"
fi

# Riavvia API server
echo "🚀 Riavvio API server..."
nohup python3 integration_api.py > logs/api.log 2>&1 &

# Test finale
sleep 5
if curl -s http://localhost:8001/health >/dev/null; then
    echo "✅ Recovery completato con successo!"
else
    echo "❌ Recovery fallito - intervento manuale necessario"
fi
```

---

## 📞 Supporto e Risorse

### **File di Log Importanti**
- `logs/wisdom.log` - Log generazione saggezze
- `logs/api.log` - Log server API
- `logs/errors.log` - Log errori sistema
- `logs/debug.log` - Log debug dettagliato

### **Configurazioni di Backup**
- `backups/wisdom_*.db` - Backup database
- `backups/config_*.env` - Backup configurazioni
- `assets/output/` - Immagini generate

### **Comandi Utili**

```bash
# Restart completo sistema
./recovery.sh

# Pulizia cache e temp
rm -rf __pycache__ */__pycache__ */*/__pycache__
rm -rf logs/*.log

# Reset totale (ATTENZIONE: perdita dati)
rm -rf venv wisdom.db logs/* backups/* assets/output/*
python3 setup_daily_wisdom.py

# Export configurazione
tar -czf daily_wisdom_config_$(date +%Y%m%d).tar.gz .env logs/ backups/ wisdom.db

# Statistiche sistema
python3 -c "
from database.wisdom_db import WisdomDatabase
db = WisdomDatabase()
print('Total Wisdom:', db.get_wisdom_count())
print('Today Generated:', db.get_today_count())
print('Database Size:', os.path.getsize('wisdom.db'), 'bytes')
"
```

---

## 🆘 Quando Contattare il Supporto

Contatta il supporto se riscontri:
- ❌ Errori persistenti dopo recovery
- ❌ Corruzione database irreversibile  
- ❌ Problemi di performance gravi
- ❌ Errori di sicurezza o accesso

**Includi sempre:**
- Log degli errori (`logs/errors.log`)
- Output del comando `python3 --version`
- Output del comando `pip list`
- File di configurazione `.env` (RIMUOVI le API keys!)

🐕 **Ugo non molla mai - e nemmeno noi!**

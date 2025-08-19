
# 🐕 La Cuccia di Ugo - Daily Wisdom System
## Guida Setup Completa

Benvenuto nel sistema di saggezza quotidiana più carino del web! Questa guida ti porterà da zero a Ugo-funzionante in meno di 5 minuti.

> 📚 **Documentazione Completa**: 
> - [README Principale](README.md) - Panoramica completa del sistema
> - [API Documentation](API_DOCUMENTATION.md) - Documentazione completa delle API
> - [Deployment Guide](DEPLOYMENT_GUIDE.md) - Guida per il deployment in produzione

---

## 🚀 Quick Start (Per i più impazienti)

```bash
# 1. Clona o scarica il progetto
cd daily-wisdom

# 2. Esegui lo script di setup automatico
python setup_project.py

# 3. Testa il sistema
python daily_wisdom_demo.py

# 4. Avvia il server web
python -m uvicorn integration.wisdom_api:app --host 0.0.0.0 --port 5000
```

**Fatto!** 🎉 Vai su http://localhost:5000 per vedere Ugo in azione.

---

## 📋 Setup Dettagliato

### Step 1: Requisiti di Sistema

**Python**: 3.9 o superiore
```bash
python --version  # Deve mostrare Python 3.9+
```

**Sistema Operativo**: Windows, macOS, Linux (qualsiasi)

**Spazio disco**: ~500MB (include AI models opzionali)

**RAM**: Minimo 2GB, consigliati 4GB

### Step 2: Installazione Dependencies

Il sistema usa solo librerie open source gratuite:

```bash
# Installa automaticamente con:
pip install -r requirements.txt

# Oppure manualmente:
pip install fastapi uvicorn sqlalchemy requests beautifulsoup4 pillow
```

### Step 3: Configurazione Base

Il sistema funziona subito senza configurazione, ma per funzionalità avanzate:

#### 🔑 API Keys Opzionali (Tutte Gratuite!)

Crea un file `.env` nella root del progetto:

```bash
# OpenWeatherMap (1000 calls/day gratis)
# Registrati su: https://openweathermap.org/api
OPENWEATHER_API_KEY=your_key_here

# Unsplash (50 downloads/hour gratis)  
# Registrati su: https://unsplash.com/developers
UNSPLASH_ACCESS_KEY=your_key_here

# News API (100 requests/day gratis)
# Registrati su: https://newsapi.org
NEWS_API_KEY=your_key_here

# Debug mode (opzionale)
DEBUG=true
```

**⚠️ Importante**: Il sistema funziona anche SENZA queste API keys! Userà fallback locali.

### Step 4: Verifica Installazione

```bash
# Test completo del sistema
python setup_project.py

# Dovrebbe mostrare:
# ✅ Struttura cartelle creata!
# ✅ Dipendenze installate!
# ✅ Database inizializzato!
# ✅ Verifica installazione completata!
```

### Step 5: Prima Saggezza di Ugo!

```bash
# Genera la prima saggezza
python daily_wisdom_demo.py

# Output atteso:
# 🐕 Generando la prima saggezza di Ugo...
# 📝 Saggezza generata: Come un cane che aspetta il padrone...
# 🖼️ Immagine creata: assets/output/wisdom_20240101_080000.png
# 💾 Salvata nel database con ID: 1
```

---

## 🗂️ Struttura del Progetto

```
daily-wisdom/
├── 📁 config/           # Configurazioni
├── 📁 models/           # Modelli database  
├── 📁 database/         # Gestione database
├── 📁 ai/              # Motori AI
├── 📁 context/         # Raccolta contesto
├── 📁 visual/          # Generazione immagini
├── 📁 scheduler/       # Automazione
├── 📁 integration/     # Integrazione web
├── 📁 social/          # Social media
├── 📁 analytics/       # Analytics e metriche
├── 📁 assets/          # Risorse (immagini, font)
├── 📁 examples/        # Esempi di output
├── 📁 logs/            # File di log
└── 📁 backups/         # Backup automatici
```

---

## 🔧 Risoluzione Problemi

### ❌ "ModuleNotFoundError: No module named 'qualcosa'"

**Soluzione**:
```bash
pip install -r requirements.txt --upgrade
```

### ❌ "Permission denied" durante setup

**Windows**:
```bash
# Esegui come amministratore
python setup_project.py
```

**Linux/Mac**:
```bash
sudo python setup_project.py
# Oppure:
chmod +x setup_project.py
./setup_project.py
```

### ❌ Database non si crea

**Soluzione**:
```bash
# Reset completo database
python -c "from utils.db_init import reset_database; reset_database()"
```

### ❌ Immagini non si generano

**Controllo font**:
```bash
# Il sistema scarica automaticamente i font Google
# Se problemi, usa font di sistema:
python -c "from visual.font_manager import list_system_fonts; list_system_fonts()"
```

### ❌ Porta 5000 occupata

**Cambia porta**:
```bash
# Usa una porta diversa
python -m uvicorn integration.wisdom_api:app --host 0.0.0.0 --port 8000
```

### ❌ API esterne non funzionano

**Normale!** Il sistema ha fallback per tutto:
- ❌ Meteo API → ☀️ Usa stagione corrente
- ❌ News API → 📰 Usa template generici  
- ❌ Immagini API → 🖼️ Usa libreria locale

---

## 🧪 Testing del Sistema

### Test Base
```bash
# Test database
python -c "from database.wisdom_db import WisdomDatabase; db = WisdomDatabase(); print('✅ Database OK')"

# Test AI engine
python -c "from ai.template_engine import TemplateEngine; engine = TemplateEngine(); print('✅ AI Engine OK')"

# Test visual
python -c "from visual.quote_generator import QuoteGenerator; gen = QuoteGenerator(); print('✅ Visual OK')"
```

### Test API Web
```bash
# Avvia il server
python -m uvicorn integration.wisdom_api:app --host 0.0.0.0 --port 5000

# In un altro terminal:
curl http://localhost:5000/health
curl http://localhost:5000/daily-wisdom
```

### Test Completo Automation
```bash
# Simula processo giornaliero completo
python automation/daily_runner.py --test-mode
```

---

## 🚀 Deployment e Automazione

### Setup Automazione (Linux/Mac)
```bash
# Configura cron job per esecuzione automatica
python utils/cron_setup.py
```

### Setup Automazione (Windows)
```bash
# Configura Task Scheduler
python utils/windows_scheduler.py
```

### Backup Automatico
```bash
# Backup manuale
python -c "from utils.backup import create_backup; create_backup()"

# I backup automatici sono già configurati ogni 24h
```

---

## 🎛️ Configurazione Avanzata

### Personalizzazione Ugo
Modifica `config/settings.py`:

```python
UGO_PERSONALITY = {
    "name": "Ugo",           # Cambia nome se vuoi
    "traits": [              # Aggiungi/modifica tratti
        "Filosofo della vita semplice",
        "Il tuo tratto personalizzato"
    ],
    "speaking_style": {
        "max_length": 280,   # Lunghezza massima saggezze
        "emoji_frequency": "Alta"  # Bassa/Moderata/Alta
    }
}
```

### Aggiungere Template Personalizzati
```python
# In ai/template_engine.py, aggiungi i tuoi template:
CUSTOM_TEMPLATES = [
    "La tua saggezza personalizzata con {variabile}",
    "Un altro template con {altra_variabile}"
]
```

### Personalizzazione Visual
```python
# In config/settings.py, sezione VISUAL_CONFIG
"colors": {
    "primary": "#TuoColore",     # Cambia i colori
    "secondary": "#AltroColore"
}
```

---

## 📞 Supporto

### Debug Mode
```bash
# Abilita debug per informazioni dettagliate
export DEBUG=true
python daily_wisdom_demo.py
```

### Log Files
I log sono salvati in `logs/`:
- `wisdom.log` - Log generale sistema
- `ai_engine.log` - Log motore AI
- `visual.log` - Log generazione immagini
- `scheduler.log` - Log automazione

### Contatti
- 📧 **Email**: supporto@lacucciadiugo.it
- 🐕 **GitHub**: [Repository del progetto]
- 💬 **Discord**: [Server della community]

---

## 🎉 Prossimi Passi

Una volta che tutto funziona:

1. **✅ Configura le API keys** per funzionalità complete
2. **✅ Personalizza la personalità di Ugo** in `config/settings.py`
3. **✅ Configura l'automazione** per pubblicazione quotidiana  
4. **✅ Integra nel tuo sito web** con il widget
5. **✅ Configura i social media** per distribuzione automatica
6. **✅ Leggi la [API Documentation](API_DOCUMENTATION.md)** per integrazioni avanzate
7. **✅ Segui la [Deployment Guide](DEPLOYMENT_GUIDE.md)** per il deployment in produzione

**🚀 Il tuo Ugo virtuale è pronto a conquistare il mondo con la sua saggezza!**

## 📚 Documentazione Completa

- **[README.md](README.md)** - Panoramica sistema e architettura
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - API RESTful complete
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Deploy e configurazione produzione
- **[README_SETUP.md](README_SETUP.md)** - Questa guida (setup sviluppo)

---

*Made with ❤️ for La Cuccia di Ugo*

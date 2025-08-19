
# 🐕 La Cuccia di Ugo - Daily Wisdom System

![Daily Wisdom System](https://img.shields.io/badge/Daily%20Wisdom-1.0.0-blue)
![Python](https://img.shields.io/badge/Python-3.9+-green)
![AI Powered](https://img.shields.io/badge/AI-Powered-orange)

> **Sistema di generazione automatica di saggezze quotidiane con AI ibrida e distribuzione social**

---

## 🎯 Panoramica

Il **Daily Wisdom System** è un sistema completo per generare, visualizzare e distribuire automaticamente saggezze quotidiane personalizzate. Utilizza un motore AI ibrido che combina template predefiniti con intelligenza artificiale locale per creare contenuti unici e contestuali.

### ✨ Caratteristiche Principali

- 🧠 **AI Ibrida**: Combina template + AI locale per saggezze uniche
- 🌍 **Contesto Intelligente**: Meteo, stagioni, eventi per personalizzazione
- 🖼️ **Generazione Visiva**: Crea automaticamente immagini quotabili
- 📅 **Automazione Completa**: Scheduler per pubblicazione automatica
- 📊 **Analytics Avanzate**: Monitoraggio performance e engagement
- 🌐 **API RESTful**: Integrazione facile con siti web
- 📱 **Social Media**: Distribuzione automatica sui social

---

## 🚀 Quick Start

### 1. Installazione Rapida
```bash
cd daily-wisdom
python setup_project.py
```

### 2. Demo Completa
```bash
python daily_wisdom_demo.py
```

### 3. Avvia il Server
```bash
python -m uvicorn integration.wisdom_api:app --host 0.0.0.0 --port 5000
```

### 4. Esplora l'API
Visita: `http://0.0.0.0:5000/docs`

---

## 📁 Struttura del Progetto

```
daily-wisdom/
│
├── 🧠 ai/                    # Motori di AI e generazione
│   ├── hybrid_engine.py      # Motore AI ibrido principale
│   ├── local_ai_engine.py    # AI locale (Transformers)
│   └── template_engine.py    # Sistema template
│
├── 🌍 context/               # Costruzione contesto
│   ├── context_builder.py    # Builder contesto intelligente
│   └── weather_service.py    # Servizio meteo
│
├── 🖼️ visual/                # Generazione immagini
│   └── quote_generator.py    # Creatore immagini quote
│
├── 🗄️ database/              # Gestione database
│   └── wisdom_db.py          # Database SQLite
│
├── 📅 scheduler/             # Automazione
│   └── daily_scheduler.py    # Scheduler automatico
│
├── 🔄 automation/            # Pipeline contenuti
│   └── content_pipeline.py   # Pipeline completa
│
├── 🌐 integration/           # API Web
│   └── wisdom_api.py         # FastAPI server
│
├── 📊 analytics/             # Metriche e statistiche
│   └── wisdom_analytics.py   # Sistema analytics
│
├── 📱 social/                # Social media
│   └── social_publisher.py   # Pubblicazione automatica
│
├── 📈 dashboard/             # Dashboard web
│   ├── web_dashboard.py      # Dashboard Flask
│   └── templates/            # Template HTML
│
├── 📋 reports/               # Report e esportazione
│   └── report_generator.py   # Generatore report
│
└── ⚙️ utils/                 # Utilità
    ├── db_init.py            # Inizializzazione DB
    └── template_seeder.py    # Seed template iniziali
```

---

## 🛠️ Componenti Principali

### 🧠 Sistema AI Ibrido

Il cuore del sistema è il **motore AI ibrido** che combina:

1. **Template Engine**: 500+ template predefiniti
2. **Local AI**: Modelli Transformers per personalizzazione
3. **Context Awareness**: Adattamento al contesto

```python
from ai.hybrid_engine import HybridWisdomEngine

engine = HybridWisdomEngine()
wisdom = engine.generate_wisdom()
print(wisdom['text'])  # "Come un cane fedele, la pazienza porta sempre frutti dolci 🐕"
```

### 🌍 Contesto Intelligente

Il sistema raccoglie automaticamente:
- 🌤️ **Meteo corrente** (OpenWeatherMap API)
- 📅 **Stagione e data**
- 📰 **Eventi attuali** (News API)
- ⏰ **Orario del giorno**

### 🖼️ Generazione Visiva

Crea automaticamente immagini per ogni saggezza:
- 🎨 **Design responsive**
- 🌈 **Palette colori dinamica**
- 🔤 **Typography ottimizzata**
- 📱 **Ottimizzazione social media**

### 📅 Automazione Completa

- **Scheduler integrato** per esecuzione automatica
- **Pipeline completa** testo + immagine
- **Backup automatici** del database
- **Error handling** e recovery

---

## 📊 API Endpoints

### Core Endpoints

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/daily-wisdom` | GET | Saggezza del giorno |
| `/wisdom/generate` | POST | Genera nuova saggezza |
| `/wisdom/{id}` | GET | Recupera saggezza specifica |
| `/analytics/stats` | GET | Statistiche sistema |
| `/health` | GET | Health check |

### Esempi di Utilizzo

```bash
# Ottieni saggezza del giorno
curl http://0.0.0.0:5000/daily-wisdom

# Genera saggezza personalizzata
curl -X POST http://0.0.0.0:5000/wisdom/generate \
  -H "Content-Type: application/json" \
  -d '{"context": {"mood": "motivational"}}'

# Statistiche sistema
curl http://0.0.0.0:5000/analytics/stats
```

---

## ⚙️ Configurazione

### 🔑 API Keys (Opzionali)

Crea `.env` nella root:

```bash
# Meteo (1000 chiamate/giorno gratis)
OPENWEATHER_API_KEY=your_key

# Immagini (50 download/ora gratis)
UNSPLASH_ACCESS_KEY=your_key

# News (100 richieste/giorno gratis)
NEWS_API_KEY=your_key
```

### 🎛️ Personalizzazione

Modifica `config/settings.py`:

```python
UGO_PERSONALITY = {
    "name": "Ugo",
    "traits": ["Filosofo della vita semplice"],
    "speaking_style": {
        "max_length": 280,
        "emoji_frequency": "Alta"
    }
}
```

---

## 📈 Analytics e Monitoraggio

### Dashboard Web

Accedi al dashboard su: `http://0.0.0.0:5000/dashboard`

Visualizza:
- 📊 **Statistiche generazione**
- 💖 **Engagement metrics**
- 📈 **Trend temporali**
- 🔧 **Performance sistema**

### Metriche Disponibili

- **Saggezze generate**: Totale e per periodo
- **Qualità media**: Score 0-10
- **Tempo di generazione**: Performance AI
- **Visualizzazioni**: Engagement utenti
- **Distribuzioni**: Lunghezza, sentiment, topic

---

## 🔄 Automazione e Scheduling

### Configurazione Automatica

```python
from scheduler.daily_scheduler import scheduler

# Avvia scheduling automatico
scheduler.start()  # Genera saggezza alle 08:00 ogni giorno

# Personalizza orario
scheduler.set_daily_time("06:30")
```

### Pipeline Completa

```python
from automation.content_pipeline import content_pipeline

# Genera contenuto completo (testo + immagine)
content = await content_pipeline.generate_complete_content()
print(f"Testo: {content['text']}")
print(f"Immagine: {content['image_path']}")
```

---

## 📱 Integrazione Social Media

### Pubblicazione Automatica

```python
from social.social_publisher import SocialPublisher

publisher = SocialPublisher()

# Pubblica su tutti i canali configurati
await publisher.publish_daily_wisdom(wisdom_content)
```

### Piattaforme Supportate

- 🐦 **Twitter/X**: Tweet automatici
- 📘 **Facebook**: Post con immagini
- 📷 **Instagram**: Stories e post
- 💼 **LinkedIn**: Contenuti professionali
- 📱 **Telegram**: Canale bot

---

## 🧪 Testing e Sviluppo

### Test Sistema

```bash
# Test completo
python daily_wisdom_demo.py

# Test componenti singoli
python -c "from ai.hybrid_engine import HybridWisdomEngine; print('AI OK')"
python -c "from database.wisdom_db import WisdomDatabase; print('DB OK')"
python -c "from visual.quote_generator import QuoteGenerator; print('Visual OK')"
```

### Debug Mode

```bash
export DEBUG=true
python daily_wisdom_demo.py
```

---

## 🚀 Deployment e Produzione

### Deployment Replit

Il sistema è ottimizzato per deployment su Replit:

1. **Fork** questo repository
2. **Configura** le API keys nei Secrets
3. **Run** il progetto
4. **Configura** il dominio personalizzato

### Configurazione Produzione

- **Database**: SQLite per sviluppo, PostgreSQL per produzione
- **Storage**: Locale per dev, cloud storage per produzione
- **Monitoring**: Logs strutturati + metriche Prometheus
- **Backup**: Automatico ogni 24h

---

## 🔧 Troubleshooting

### Problemi Comuni

#### ❌ Database non si crea
```bash
python -c "from utils.db_init import reset_database; reset_database()"
```

#### ❌ Font mancanti
```bash
# Il sistema scarica automaticamente i font Google
# Fallback: usa font di sistema
```

#### ❌ API esterne non funzionano
**Normale!** Il sistema ha fallback per tutto:
- ❌ Meteo → ☀️ Usa stagione
- ❌ News → 📰 Template generici
- ❌ Immagini → 🎨 Libreria locale

### Log Files

Controlla i log in `logs/`:
- `wisdom.log` - Sistema generale
- `ai_engine.log` - Motore AI
- `visual.log` - Generazione immagini
- `scheduler.log` - Automazione

---

## 📚 Esempi Pratici

### Integrazione nel Tuo Sito

```html
<!DOCTYPE html>
<html>
<head>
    <title>La Saggezza di Ugo</title>
</head>
<body>
    <div id="ugo-wisdom"></div>
    <script>
        fetch('http://your-domain.com/daily-wisdom')
            .then(response => response.json())
            .then(data => {
                document.getElementById('ugo-wisdom').innerHTML = 
                    `<blockquote>${data.text}</blockquote>`;
            });
    </script>
</body>
</html>
```

### Widget Personalizzato

```javascript
// Widget JavaScript per siti esterni
class UgoWisdomWidget {
    constructor(apiUrl, containerId) {
        this.apiUrl = apiUrl;
        this.container = document.getElementById(containerId);
        this.loadWisdom();
    }
    
    async loadWisdom() {
        try {
            const response = await fetch(`${this.apiUrl}/daily-wisdom`);
            const wisdom = await response.json();
            this.render(wisdom);
        } catch (error) {
            console.error('Errore caricamento saggezza:', error);
        }
    }
    
    render(wisdom) {
        this.container.innerHTML = `
            <div class="ugo-wisdom-card">
                <blockquote>${wisdom.text}</blockquote>
                <cite>— Ugo, ${new Date(wisdom.created_at).toLocaleDateString()}</cite>
            </div>
        `;
    }
}

// Utilizzo
new UgoWisdomWidget('http://your-api-url.com', 'wisdom-container');
```

---

## 🤝 Contribuire

### Setup Sviluppo

1. **Fork** il repository
2. **Clone** localmente
3. **Installa** dipendenze: `python setup_project.py`
4. **Sviluppa** le tue modifiche
5. **Testa**: `python daily_wisdom_demo.py`
6. **Submit** pull request

### Linee Guida

- ✅ **Code style**: Segui PEP 8
- ✅ **Testing**: Aggiungi test per nuove funzionalità
- ✅ **Documentazione**: Documenta APIs e funzioni
- ✅ **Commit**: Messaggi descrittivi

---

## 📄 Licenza

Questo progetto è rilasciato sotto licenza MIT. Vedi `LICENSE` per dettagli.

---

## 🐕 Contatti e Supporto

- 🌐 **Sito**: [lacucciadiugo.it](https://lacucciadiugo.it)
- 📧 **Email**: supporto@lacucciadiugo.it
- 🐙 **GitHub**: [Repository progetto]
- 💬 **Discord**: [Community server]

---

**Made with ❤️ for La Cuccia di Ugo**

*Il tuo cane virtuale più saggio del web! 🐕✨*

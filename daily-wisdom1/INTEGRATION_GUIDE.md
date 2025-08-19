# 🐕 Daily Wisdom System - Guida Integrazione Completa

## 📋 Panoramica

Questa guida ti aiuterà a integrare il **Daily Wisdom System di Ugo** nel tuo sito esistente **senza utilizzare Docker**. Il sistema genererà automaticamente saggezze quotidiane con immagini e le renderà disponibili tramite API REST.

---

## 🚀 Setup Iniziale (QUELLO CHE DEVI FARE TU)

### 1. **Esegui il Setup Automatico**
```bash
# Dalla directory principale del progetto
python3 setup_daily_wisdom.py
```

### 2. **Configura le Variabili d'Ambiente**
```bash
# Copia e modifica il file di configurazione
cd daily-wisdom1
cp .env.example .env
nano .env  # o usa il tuo editor preferito
```

**API Keys da configurare (tutte opzionali):**
- **OpenWeatherMap**: Per contesto meteo (1000 chiamate/giorno gratis)
- **Unsplash**: Per immagini di sfondo (50 download/ora gratis)  
- **News API**: Per contesto notizie (100 richieste/giorno gratis)

### 3. **Avvia il Server API**
```bash
cd daily-wisdom1
source venv/bin/activate
python3 integration_api.py
```

Il server sarà disponibile su: `http://localhost:8001`

---

## 🔗 Integrazione con il Tuo Sito

### **API Endpoints Disponibili**

#### 🌅 **Saggezza del Giorno**
```http
GET http://localhost:8001/wisdom/today
```
**Risposta:**
```json
{
  "id": 1,
  "text": "Ogni momento è buono per una carezza! 🐕❤️",
  "image_url": "/wisdom/1/image",
  "created_at": "2025-08-19T10:30:00",
  "category": "motivational",
  "mood": "positive",
  "quality_score": 0.95
}
```

#### 🎲 **Saggezza Casuale**
```http
GET http://localhost:8001/wisdom/random
```

#### ✨ **Genera Nuova Saggezza**
```http
POST http://localhost:8001/wisdom/generate
Content-Type: application/json

{
  "category": "motivational",
  "mood": "positive",
  "context": {
    "weather": "sunny",
    "time_of_day": "morning"
  }
}
```

#### 🖼️ **Immagine della Saggezza**
```http
GET http://localhost:8001/wisdom/{wisdom_id}/image
```
Restituisce direttamente l'immagine PNG.

---

## 💻 Esempi di Integrazione

### **Frontend React/Next.js**

```javascript
// components/DailyWisdom.jsx
import { useState, useEffect } from 'react';

const DailyWisdom = () => {
  const [wisdom, setWisdom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodayWisdom();
  }, []);

  const fetchTodayWisdom = async () => {
    try {
      const response = await fetch('http://localhost:8001/wisdom/today');
      const data = await response.json();
      setWisdom(data);
    } catch (error) {
      console.error('Errore nel caricamento della saggezza:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewWisdom = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8001/wisdom/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'motivational',
          mood: 'positive'
        })
      });
      const data = await response.json();
      setWisdom(data);
    } catch (error) {
      console.error('Errore nella generazione:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>🐕 Ugo sta pensando...</div>;

  return (
    <div className="daily-wisdom-card">
      <h2>💫 La Saggezza di Ugo</h2>
      {wisdom && (
        <>
          <img 
            src={`http://localhost:8001${wisdom.image_url}`}
            alt="Saggezza di Ugo"
            className="wisdom-image"
          />
          <p className="wisdom-text">{wisdom.text}</p>
          <div className="wisdom-meta">
            <span>Categoria: {wisdom.category}</span>
            <span>Qualità: {(wisdom.quality_score * 100).toFixed(0)}%</span>
          </div>
          <button onClick={generateNewWisdom}>
            🎲 Nuova Saggezza
          </button>
        </>
      )}
    </div>
  );
};

export default DailyWisdom;
```

### **Backend Node.js/Express**

```javascript
// routes/wisdom.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

const WISDOM_API_BASE = 'http://localhost:8001';

// Cache semplice in memoria
let wisdomCache = null;
let cacheTime = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 ora

router.get('/daily', async (req, res) => {
  try {
    // Controlla cache
    if (wisdomCache && cacheTime && Date.now() - cacheTime < CACHE_DURATION) {
      return res.json(wisdomCache);
    }

    // Fetch da API
    const response = await axios.get(`${WISDOM_API_BASE}/wisdom/today`);
    wisdomCache = response.data;
    cacheTime = Date.now();

    res.json(wisdomCache);
  } catch (error) {
    console.error('Errore API wisdom:', error);
    res.status(500).json({ error: 'Errore nel caricamento della saggezza' });
  }
});

router.post('/generate', async (req, res) => {
  try {
    const { category, mood, context } = req.body;
    
    const response = await axios.post(`${WISDOM_API_BASE}/wisdom/generate`, {
      category: category || 'general',
      mood: mood || 'positive',
      context: context || {}
    });

    // Invalida cache
    wisdomCache = null;
    cacheTime = null;

    res.json(response.data);
  } catch (error) {
    console.error('Errore generazione wisdom:', error);
    res.status(500).json({ error: 'Errore nella generazione' });
  }
});

module.exports = router;
```

### **PHP/WordPress**

```php
<?php
// functions.php o plugin personalizzato

class DailyWisdomIntegration {
    private $api_base = 'http://localhost:8001';
    private $cache_key = 'daily_wisdom_cache';
    private $cache_duration = 3600; // 1 ora

    public function get_daily_wisdom() {
        // Controlla cache WordPress
        $cached = get_transient($this->cache_key);
        if ($cached !== false) {
            return $cached;
        }

        // Fetch da API
        $response = wp_remote_get($this->api_base . '/wisdom/today');
        
        if (is_wp_error($response)) {
            return ['error' => 'Errore connessione API'];
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        // Salva in cache
        set_transient($this->cache_key, $data, $this->cache_duration);

        return $data;
    }

    public function display_wisdom_widget() {
        $wisdom = $this->get_daily_wisdom();
        
        if (isset($wisdom['error'])) {
            return '<div class="wisdom-error">🐕 Ugo sta riposando...</div>';
        }

        ob_start();
        ?>
        <div class="daily-wisdom-widget">
            <h3>💫 La Saggezza di Ugo</h3>
            <img src="<?php echo $this->api_base . $wisdom['image_url']; ?>" 
                 alt="Saggezza di Ugo" class="wisdom-image">
            <p class="wisdom-text"><?php echo esc_html($wisdom['text']); ?></p>
            <div class="wisdom-meta">
                <small>Categoria: <?php echo esc_html($wisdom['category']); ?></small>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
}

// Shortcode per uso in post/pagine
function daily_wisdom_shortcode($atts) {
    $wisdom = new DailyWisdomIntegration();
    return $wisdom->display_wisdom_widget();
}
add_shortcode('daily_wisdom', 'daily_wisdom_shortcode');

// Widget per sidebar
class Daily_Wisdom_Widget extends WP_Widget {
    public function __construct() {
        parent::__construct('daily_wisdom', '🐕 Saggezza di Ugo');
    }

    public function widget($args, $instance) {
        echo $args['before_widget'];
        $wisdom = new DailyWisdomIntegration();
        echo $wisdom->display_wisdom_widget();
        echo $args['after_widget'];
    }
}

function register_daily_wisdom_widget() {
    register_widget('Daily_Wisdom_Widget');
}
add_action('widgets_init', 'register_daily_wisdom_widget');
?>
```

---

## ⚙️ Automazione e Scheduling

### **Cron Job per Generazione Automatica**

```bash
# Aggiungi al crontab (crontab -e)

# Genera saggezza ogni giorno alle 8:00
0 8 * * * cd /path/to/your/project/daily-wisdom1 && source venv/bin/activate && python3 -c "from automation.content_pipeline import ContentPipeline; ContentPipeline().generate_complete_content()" >> logs/cron.log 2>&1

# Backup database ogni domenica alle 2:00  
0 2 * * 0 cd /path/to/your/project/daily-wisdom1 && source venv/bin/activate && python3 -c "from database.wisdom_db import WisdomDatabase; WisdomDatabase().backup_database()" >> logs/backup.log 2>&1
```

### **Systemd Service (Linux)**

```ini
# /etc/systemd/system/daily-wisdom.service
[Unit]
Description=Daily Wisdom API Server
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/your/project/daily-wisdom1
Environment=PATH=/path/to/your/project/daily-wisdom1/venv/bin
ExecStart=/path/to/your/project/daily-wisdom1/venv/bin/python integration_api.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Attiva il service
sudo systemctl enable daily-wisdom
sudo systemctl start daily-wisdom
sudo systemctl status daily-wisdom
```

---

## 🎨 Personalizzazione

### **Configurazione nel .env**

```bash
# Personalità di Ugo
UGO_PERSONALITY_MOOD=always_positive
UGO_LANGUAGE=italiano
UGO_DEFAULT_CATEGORY=motivational

# Timing generazione
DAILY_GENERATION_TIME=08:00
SCHEDULER_ENABLED=true

# Integrazione sito
MAIN_SITE_URL=https://your-domain.com
CORS_ORIGINS=https://your-domain.com,http://localhost:3000
```

### **Temi e Stili**

Il sistema genera immagini personalizzabili. Puoi modificare:
- **Colori**: Modifica `visual/quote_generator.py`
- **Font**: Aggiungi font in `assets/fonts/`
- **Template**: Personalizza `ai/template_engine.py`

---

## 🔐 Sicurezza

### **Autenticazione API (Opzionale)**

```bash
# Nel .env
API_TOKEN=your_super_secret_token_here
```

```javascript
// Nel frontend
const response = await fetch('http://localhost:8001/wisdom/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your_super_secret_token_here'
  },
  body: JSON.stringify({...})
});
```

### **Rate Limiting**

```bash
# Nel .env
RATE_LIMIT_PER_MINUTE=60
MAX_DAILY_GENERATIONS=100
```

---

## 📊 Monitoring e Logging

### **Health Check**

```http
GET http://localhost:8001/health
```

### **Statistiche**

```http
GET http://localhost:8001/stats
```

### **Log Files**

- `logs/wisdom.log` - Log generazione saggezze
- `logs/api.log` - Log richieste API  
- `logs/errors.log` - Log errori sistema

---

## 🆘 Troubleshooting

### **Problemi Comuni**

1. **Porta 8001 occupata**
   ```bash
   # Cambia porta nel integration_api.py
   uvicorn.run("integration_api:app", host="0.0.0.0", port=8002)
   ```

2. **Errori di import**
   ```bash
   cd daily-wisdom1
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Database corrotto**
   ```bash
   rm wisdom.db
   python3 -c "from database.wisdom_db import WisdomDatabase; WisdomDatabase()"
   ```

4. **Immagini non generate**
   ```bash
   # Verifica dipendenze immagini
   pip install pillow>=10.0.0
   ```

### **Log Debug**

```bash
# Abilita debug mode
export DEBUG=true
python3 integration_api.py
```

---

## 🚀 Deploy in Produzione

### **1. Configurazione Produzione**

```bash
# Nel .env
DEBUG=false
ENVIRONMENT=production
DATABASE_URL=sqlite:///production_wisdom.db
```

### **2. Reverse Proxy (Nginx)**

```nginx
# /etc/nginx/sites-available/daily-wisdom
server {
    listen 80;
    server_name your-domain.com;

    location /api/wisdom/ {
        proxy_pass http://localhost:8001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### **3. SSL con Let's Encrypt**

```bash
sudo certbot --nginx -d your-domain.com
```

---

## 📝 Note Finali

- ✅ **Sistema completamente standalone** (no Docker)
- ✅ **Database SQLite locale** (no database server)
- ✅ **API REST standard** (integrazione facile)
- ✅ **Logging completo** (monitoring e debug)
- ✅ **Caching automatico** (performance ottimizzate)
- ✅ **Configurazione flessibile** (adattabile a ogni setup)

Il sistema è progettato per essere **leggero**, **affidabile** e **facile da integrare** in qualsiasi stack tecnologico esistente.

🐕 **Ugo è pronto a condividere la sua saggezza con il mondo!**

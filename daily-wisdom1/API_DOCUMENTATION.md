
# 🌐 Daily Wisdom System - API Documentation

![API Version](https://img.shields.io/badge/API-v1.0-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green)

> **Documentazione completa delle API RESTful del Daily Wisdom System**

---

## 📋 Indice

1. [Panoramica](#panoramica)
2. [Autenticazione](#autenticazione)
3. [Endpoints Core](#endpoints-core)
4. [Endpoints Analytics](#endpoints-analytics)
5. [Endpoints Admin](#endpoints-admin)
6. [Modelli Dati](#modelli-dati)
7. [Codici di Errore](#codici-di-errore)
8. [Esempi di Utilizzo](#esempi-di-utilizzo)
9. [SDK e Client](#sdk-e-client)

---

## 🎯 Panoramica

Il Daily Wisdom System espone una API RESTful completa per l'integrazione con applicazioni esterne. L'API è costruita con FastAPI e fornisce accesso a tutte le funzionalità del sistema.

### Base URL
```
Production: https://your-domain.replit.app
Development: http://0.0.0.0:5000
```

### Formato Risposta
Tutte le risposte sono in formato JSON con la seguente struttura:

```json
{
    "success": true,
    "data": { ... },
    "message": "Operazione completata",
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0.0"
}
```

---

## 🔐 Autenticazione

### API Key (Opzionale)
Per funzionalità avanzate, include l'header:
```
X-API-Key: your-api-key
```

### Rate Limiting
- **Pubblico**: 100 richieste/ora
- **Autenticato**: 1000 richieste/ora

---

## 🧠 Endpoints Core

### 1. Saggezza del Giorno

#### `GET /daily-wisdom`
Ottieni la saggezza quotidiana corrente.

**Parametri Query:**
- `format` (opzionale): `json` | `text` | `html`
- `include_image` (opzionale): `true` | `false`

**Esempio Request:**
```bash
curl -X GET "http://0.0.0.0:5000/daily-wisdom?format=json&include_image=true"
```

**Esempio Response:**
```json
{
    "success": true,
    "data": {
        "id": 123,
        "text": "Come un cane fedele, la pazienza porta sempre frutti dolci 🐕",
        "quality_score": 8.5,
        "sentiment_score": 0.8,
        "created_at": "2024-01-15T08:00:00Z",
        "context": {
            "weather": "soleggiato",
            "season": "inverno",
            "mood": "motivational"
        },
        "image_url": "/assets/images/wisdom_20240115.png",
        "tags": ["pazienza", "fedeltà", "motivazione"],
        "stats": {
            "views": 1547,
            "shares": 89,
            "likes": 234
        }
    },
    "message": "Saggezza del giorno recuperata",
    "timestamp": "2024-01-15T10:30:00Z"
}
```

### 2. Genera Nuova Saggezza

#### `POST /wisdom/generate`
Genera una nuova saggezza con parametri personalizzati.

**Request Body:**
```json
{
    "context": {
        "mood": "motivational",
        "topic": "friendship",
        "weather": "rainy",
        "custom_prompt": "Parla di lealtà"
    },
    "options": {
        "max_length": 200,
        "include_emoji": true,
        "style": "philosophical"
    }
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "id": 124,
        "text": "Nella pioggia più intensa, un vero amico è l'ombrello che non si chiude mai ☔🐕",
        "quality_score": 9.1,
        "sentiment_score": 0.9,
        "generation_time": 1.23,
        "source_engine": "hybrid",
        "context_used": {
            "weather": "rainy",
            "mood": "motivational",
            "topic": "friendship"
        }
    }
}
```

### 3. Recupera Saggezza Specifica

#### `GET /wisdom/{wisdom_id}`
Ottieni una saggezza specifica tramite ID.

**Parametri Path:**
- `wisdom_id`: ID della saggezza

**Response:**
```json
{
    "success": true,
    "data": {
        "id": 123,
        "text": "La vera saggezza è sapere di non sapere 🤔",
        "created_at": "2024-01-15T08:00:00Z",
        "quality_score": 8.7,
        "metadata": {
            "engine": "template",
            "context": {...},
            "generation_time": 0.45
        }
    }
}
```

### 4. Lista Saggezze

#### `GET /wisdom`
Ottieni una lista paginata di saggezze.

**Parametri Query:**
- `page` (default: 1): Numero pagina
- `limit` (default: 20): Saggezze per pagina
- `sort` (default: `created_at`): Campo ordinamento
- `order` (default: `desc`): Direzione ordinamento
- `search`: Testo da cercare
- `date_from`: Data inizio (YYYY-MM-DD)
- `date_to`: Data fine (YYYY-MM-DD)
- `min_quality`: Qualità minima (0-10)

**Esempio Request:**
```bash
curl "http://0.0.0.0:5000/wisdom?page=1&limit=10&min_quality=8&sort=quality_score&order=desc"
```

**Response:**
```json
{
    "success": true,
    "data": {
        "wisdom_list": [
            {
                "id": 125,
                "text": "La felicità è un cane che scodinzola 🐕💖",
                "quality_score": 9.2,
                "created_at": "2024-01-15T09:15:00Z"
            }
        ],
        "pagination": {
            "current_page": 1,
            "total_pages": 15,
            "total_items": 289,
            "items_per_page": 20,
            "has_next": true,
            "has_prev": false
        }
    }
}
```

---

## 📊 Endpoints Analytics

### 1. Statistiche Sistema

#### `GET /analytics/stats`
Ottieni statistiche complete del sistema.

**Response:**
```json
{
    "success": true,
    "data": {
        "overview": {
            "total_wisdom": 1247,
            "total_views": 45632,
            "total_shares": 2341,
            "avg_quality": 8.3,
            "avg_generation_time": 1.45
        },
        "today": {
            "wisdom_generated": 1,
            "views": 234,
            "shares": 12,
            "new_users": 5
        },
        "trends": {
            "quality_trend": "+5.2%",
            "engagement_trend": "+12.7%",
            "generation_trend": "-2.1s"
        },
        "top_tags": [
            {"tag": "motivazione", "count": 89},
            {"tag": "amicizia", "count": 76},
            {"tag": "pazienza", "count": 65}
        ]
    }
}
```

### 2. Metriche Performance

#### `GET /analytics/performance`
Metriche dettagliate di performance.

**Parametri Query:**
- `period`: `day` | `week` | `month` | `year`
- `metric`: `quality` | `generation_time` | `engagement`

**Response:**
```json
{
    "success": true,
    "data": {
        "period": "week",
        "metrics": {
            "avg_quality": 8.4,
            "avg_generation_time": 1.23,
            "success_rate": 98.7,
            "total_requests": 1234
        },
        "timeline": [
            {
                "date": "2024-01-15",
                "quality": 8.6,
                "generation_time": 1.12,
                "requests": 89
            }
        ]
    }
}
```

### 3. Report Engagement

#### `GET /analytics/engagement`
Statistiche di engagement degli utenti.

**Response:**
```json
{
    "success": true,
    "data": {
        "total_interactions": 5678,
        "interaction_types": {
            "views": 4567,
            "shares": 789,
            "likes": 322
        },
        "top_wisdom": [
            {
                "id": 98,
                "text": "L'amore di un cane non ha prezzo 💖",
                "views": 567,
                "shares": 89,
                "engagement_rate": 15.7
            }
        ],
        "engagement_trends": {
            "daily_average": 123,
            "peak_hour": "14:00",
            "peak_day": "Tuesday"
        }
    }
}
```

---

## 🔧 Endpoints Admin

### 1. Health Check

#### `GET /health`
Verifica stato del sistema.

**Response:**
```json
{
    "success": true,
    "data": {
        "status": "healthy",
        "version": "1.0.0",
        "uptime": "2d 5h 23m",
        "components": {
            "database": "healthy",
            "ai_engine": "healthy",
            "scheduler": "running",
            "storage": "healthy"
        },
        "metrics": {
            "memory_usage": "45%",
            "cpu_usage": "12%",
            "disk_usage": "23%"
        }
    }
}
```

### 2. Configurazione Sistema

#### `GET /admin/config`
Ottieni configurazione corrente (richiede autenticazione).

#### `PUT /admin/config`
Aggiorna configurazione sistema.

**Request Body:**
```json
{
    "scheduler": {
        "daily_time": "08:00",
        "enabled": true
    },
    "ai_engine": {
        "quality_threshold": 7.0,
        "max_retries": 3
    },
    "social": {
        "auto_publish": true,
        "platforms": ["twitter", "facebook"]
    }
}
```

---

## 📄 Modelli Dati

### Wisdom Object
```json
{
    "id": "integer",
    "text": "string",
    "quality_score": "float (0-10)",
    "sentiment_score": "float (-1 to 1)",
    "created_at": "ISO 8601 timestamp",
    "updated_at": "ISO 8601 timestamp",
    "context": {
        "weather": "string",
        "season": "string",
        "mood": "string",
        "topic": "string"
    },
    "metadata": {
        "source_engine": "string",
        "generation_time": "float (seconds)",
        "template_id": "integer",
        "word_count": "integer"
    },
    "image_url": "string (optional)",
    "tags": ["string"],
    "stats": {
        "views": "integer",
        "shares": "integer",
        "likes": "integer"
    }
}
```

### Context Object
```json
{
    "weather": "string",
    "temperature": "float",
    "season": "string",
    "time_of_day": "string",
    "day_of_week": "string",
    "mood": "string",
    "topic": "string",
    "custom_context": "object"
}
```

---

## ❌ Codici di Errore

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

### Error Response Format
```json
{
    "success": false,
    "error": {
        "code": "WISDOM_NOT_FOUND",
        "message": "Saggezza con ID 999 non trovata",
        "details": {
            "requested_id": 999,
            "available_range": "1-289"
        }
    },
    "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Codes
- `WISDOM_NOT_FOUND` - Saggezza non trovata
- `INVALID_CONTEXT` - Contesto non valido
- `GENERATION_FAILED` - Errore generazione AI
- `RATE_LIMIT_EXCEEDED` - Limite rate superato
- `INVALID_API_KEY` - API key non valida

---

## 💡 Esempi di Utilizzo

### JavaScript/Fetch
```javascript
// Ottieni saggezza del giorno
async function getDailyWisdom() {
    try {
        const response = await fetch('http://0.0.0.0:5000/daily-wisdom');
        const data = await response.json();
        
        if (data.success) {
            console.log('Saggezza:', data.data.text);
            return data.data;
        }
    } catch (error) {
        console.error('Errore:', error);
    }
}

// Genera saggezza personalizzata
async function generateCustomWisdom(mood, topic) {
    try {
        const response = await fetch('http://0.0.0.0:5000/wisdom/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                context: { mood, topic },
                options: { include_emoji: true }
            })
        });
        
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Errore generazione:', error);
    }
}
```

### Python/Requests
```python
import requests

class WisdomClient:
    def __init__(self, base_url="http://0.0.0.0:5000", api_key=None):
        self.base_url = base_url
        self.headers = {'Content-Type': 'application/json'}
        if api_key:
            self.headers['X-API-Key'] = api_key
    
    def get_daily_wisdom(self):
        response = requests.get(f"{self.base_url}/daily-wisdom", 
                              headers=self.headers)
        return response.json()
    
    def generate_wisdom(self, context=None, options=None):
        payload = {
            'context': context or {},
            'options': options or {}
        }
        response = requests.post(f"{self.base_url}/wisdom/generate",
                               json=payload, headers=self.headers)
        return response.json()
    
    def get_stats(self):
        response = requests.get(f"{self.base_url}/analytics/stats",
                              headers=self.headers)
        return response.json()

# Utilizzo
client = WisdomClient()
wisdom = client.get_daily_wisdom()
print(wisdom['data']['text'])
```

### cURL Examples
```bash
# Saggezza del giorno
curl -X GET "http://0.0.0.0:5000/daily-wisdom"

# Genera saggezza motivazionale
curl -X POST "http://0.0.0.0:5000/wisdom/generate" \
  -H "Content-Type: application/json" \
  -d '{"context": {"mood": "motivational"}, "options": {"include_emoji": true}}'

# Statistiche sistema
curl -X GET "http://0.0.0.0:5000/analytics/stats"

# Lista saggezze con filtri
curl -X GET "http://0.0.0.0:5000/wisdom?min_quality=8&limit=5"
```

---

## 🛠️ SDK e Client

### JavaScript SDK
```javascript
class UgoWisdomSDK {
    constructor(apiUrl, apiKey = null) {
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
    }
    
    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(this.apiKey && { 'X-API-Key': this.apiKey })
        };
        
        const response = await fetch(`${this.apiUrl}${endpoint}`, {
            headers,
            ...options
        });
        
        return response.json();
    }
    
    getDailyWisdom() {
        return this.request('/daily-wisdom');
    }
    
    generateWisdom(context, options) {
        return this.request('/wisdom/generate', {
            method: 'POST',
            body: JSON.stringify({ context, options })
        });
    }
    
    getStats() {
        return this.request('/analytics/stats');
    }
}

// Utilizzo
const sdk = new UgoWisdomSDK('http://0.0.0.0:5000');
const wisdom = await sdk.getDailyWisdom();
```

---

## 📚 Documenti Correlati

- [README.md](README.md) - Panoramica generale
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Guida installazione
- [DEPLOYMENT.md](DEPLOYMENT.md) - Guida deployment
- [CONTRIBUTING.md](CONTRIBUTING.md) - Linee guida contribuzione

---

**Made with ❤️ for La Cuccia di Ugo**

*API Documentation v1.0 - Aggiornato: 15 Gennaio 2024*

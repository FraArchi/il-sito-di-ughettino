
# 🚀 Daily Wisdom System - Deployment Guide

![Deployment](https://img.shields.io/badge/Deployment-Ready-green)
![Replit](https://img.shields.io/badge/Platform-Replit-orange)
![Uptime](https://img.shields.io/badge/Uptime-99.9%25-brightgreen)

> **Guida completa per il deployment del Daily Wisdom System su Replit e altre piattaforme**

---

## 📋 Indice

1. [Deployment su Replit](#deployment-su-replit)
2. [Configurazione Produzione](#configurazione-produzione)
3. [Variabili d'Ambiente](#variabili-dambiente)
4. [Database Setup](#database-setup)
5. [Monitoring e Logs](#monitoring-e-logs)
6. [Backup e Recovery](#backup-e-recovery)
7. [Performance Optimization](#performance-optimization)
8. [Troubleshooting](#troubleshooting)

---

## 🌐 Deployment su Replit

### 1. Preparazione Repository

```bash
# 1. Fork questo repository su GitHub
# 2. Importa su Replit da GitHub
# 3. Il sistema rileverà automaticamente il runtime Python
```

### 2. Configurazione Automatica

Il file `.replit` è già configurato:

```toml
[run]
command = "cd daily-wisdom && python -c \"from utils.db_init import create_database; create_database()\" && python -m uvicorn integration.wisdom_api:app --host 0.0.0.0 --port 5000 --reload"

[nix]
channel = "stable-22_11"

[env]
PYTHONPATH = "/home/runner/$REPL_SLUG/daily-wisdom"
PORT = "5000"

[packager]
language = "python3"
ignoredPackages = ["unit_tests"]

[packager.features]
enabledForHosting = false
packageSearch = true
guessImports = true

[languages.python3]
pattern = "**/*.py"
syntax = "python"

[languages.python3.languageServer]
start = ["pylsp"]

[deployment]
build = ["python", "daily-wisdom/setup_project.py"]
run = ["python", "-m", "uvicorn", "daily-wisdom.integration.wisdom_api:app", "--host", "0.0.0.0", "--port", "5000"]
```

### 3. Primo Deployment

1. **Apri il Repl** su Replit
2. **Esegui setup**: Il comando Run automaticamente:
   - Installa le dipendenze
   - Inizializza il database
   - Avvia il server

3. **Verifica funzionamento**:
   ```bash
   # Il server sarà disponibile su:
   https://your-repl-name.your-username.replit.app
   ```

### 4. Configurazione Domain Personalizzato

1. **Vai su Deployments** nel tuo Repl
2. **Configura Custom Domain**
3. **Aggiungi**: `lacucciadiugo-wisdom.it` (esempio)

---

## ⚙️ Configurazione Produzione

### 1. Environment Variables (Secrets)

Configura i seguenti secrets in Replit:

```bash
# Database (Produzione)
DATABASE_URL=sqlite:///wisdom_production.db
# O per PostgreSQL:
# DATABASE_URL=postgresql://user:pass@host:port/dbname

# API Keys Esterne (Opzionali)
OPENWEATHER_API_KEY=your_openweather_key
UNSPLASH_ACCESS_KEY=your_unsplash_key
NEWS_API_KEY=your_news_api_key

# Configurazione App
DEBUG=false
ENVIRONMENT=production
LOG_LEVEL=info

# Social Media (Opzionali)
TWITTER_API_KEY=your_twitter_key
TWITTER_API_SECRET=your_twitter_secret
FACEBOOK_ACCESS_TOKEN=your_facebook_token

# Security
SECRET_KEY=your-super-secret-key-here
API_RATE_LIMIT=1000
CORS_ORIGINS=https://lacucciadiugo.it,https://www.lacucciadiugo.it

# Monitoring
SENTRY_DSN=your_sentry_dsn
ANALYTICS_ENABLED=true
```

### 2. File di Configurazione Produzione

Crea `config/production.py`:

```python
"""Configurazione per ambiente di produzione"""

import os
from .settings import *

# Override per produzione
DEBUG = False
ENVIRONMENT = "production"
LOG_LEVEL = "INFO"

# Database
if os.getenv("DATABASE_URL", "").startswith("postgresql"):
    DATABASE_CONFIG = {
        "url": os.getenv("DATABASE_URL"),
        "pool_size": 20,
        "max_overflow": 10,
        "pool_timeout": 30
    }
else:
    DATABASE_CONFIG = {
        "url": "sqlite:///wisdom_production.db",
        "echo": False
    }

# Cache
CACHE_CONFIG = {
    "enabled": True,
    "ttl": 3600,  # 1 ora
    "max_size": 1000
}

# Rate Limiting
RATE_LIMIT = {
    "requests_per_hour": 1000,
    "burst_size": 50
}

# Backup
BACKUP_CONFIG = {
    "enabled": True,
    "interval": "24h",
    "retention_days": 30,
    "storage": "local"  # o "cloud" per S3/GCS
}
```

---

## 🔐 Variabili d'Ambiente

### Variabili Essenziali

| Variabile | Descrizione | Default | Richiesta |
|-----------|-------------|---------|-----------|
| `ENVIRONMENT` | Ambiente di esecuzione | `development` | No |
| `DEBUG` | Modalità debug | `true` | No |
| `SECRET_KEY` | Chiave crittografia | Generata | Sì (prod) |
| `DATABASE_URL` | URL database | SQLite locale | No |
| `PORT` | Porta server | `5000` | No |

### API Keys Esterne (Opzionali)

| Variabile | Servizio | Limite Gratuito |
|-----------|----------|----------------|
| `OPENWEATHER_API_KEY` | OpenWeatherMap | 1000 call/day |
| `UNSPLASH_ACCESS_KEY` | Unsplash | 50 download/hour |
| `NEWS_API_KEY` | NewsAPI | 100 requests/day |

### Social Media (Opzionali)

| Variabile | Piattaforma | Descrizione |
|-----------|-------------|-------------|
| `TWITTER_API_KEY` | Twitter/X | API Key |
| `TWITTER_API_SECRET` | Twitter/X | API Secret |
| `FACEBOOK_ACCESS_TOKEN` | Facebook | Access Token |
| `TELEGRAM_BOT_TOKEN` | Telegram | Bot Token |

---

## 🗄️ Database Setup

### SQLite (Default - Sviluppo)

```python
# Configurazione automatica
# File: wisdom.db nella root del progetto
# Backup automatico ogni 24h
```

### PostgreSQL (Produzione)

1. **Crea database PostgreSQL**:
   ```sql
   CREATE DATABASE wisdom_production;
   CREATE USER wisdom_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE wisdom_production TO wisdom_user;
   ```

2. **Configura variabile ambiente**:
   ```bash
   DATABASE_URL=postgresql://wisdom_user:secure_password@localhost:5432/wisdom_production
   ```

3. **Migrazione automatica**:
   ```python
   # Il sistema migra automaticamente al primo avvio
   python -c "from utils.db_init import migrate_to_postgresql; migrate_to_postgresql()"
   ```

### Backup Automatico

```python
# Configurazione backup in config/settings.py
BACKUP_CONFIG = {
    "enabled": True,
    "schedule": "0 2 * * *",  # Ogni giorno alle 2:00
    "retention_days": 30,
    "compression": True,
    "storage": {
        "type": "local",  # "s3", "gcs", "local"
        "path": "backups/"
    }
}
```

---

## 📊 Monitoring e Logs

### 1. Logging Strutturato

```python
# Configurazione logging
LOGGING_CONFIG = {
    "version": 1,
    "formatters": {
        "json": {
            "format": "%(asctime)s %(name)s %(levelname)s %(message)s",
            "class": "pythonjsonlogger.jsonlogger.JsonFormatter"
        }
    },
    "handlers": {
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": "logs/wisdom.log",
            "maxBytes": 10485760,  # 10MB
            "backupCount": 5,
            "formatter": "json"
        }
    },
    "loggers": {
        "wisdom": {
            "handlers": ["file"],
            "level": "INFO"
        }
    }
}
```

### 2. Health Check Endpoints

```python
# GET /health - Health check completo
{
    "status": "healthy",
    "components": {
        "database": "healthy",
        "ai_engine": "healthy",
        "scheduler": "running"
    },
    "metrics": {
        "uptime": "5d 12h 34m",
        "memory_usage": "45%",
        "response_time": "123ms"
    }
}

# GET /metrics - Metriche Prometheus
wisdom_requests_total{method="GET",endpoint="/daily-wisdom"} 1234
wisdom_generation_duration_seconds{engine="hybrid"} 1.23
wisdom_database_size_bytes 567890
```

### 3. Sentry Integration (Opzionale)

```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

if os.getenv("SENTRY_DSN"):
    sentry_sdk.init(
        dsn=os.getenv("SENTRY_DSN"),
        integrations=[FastApiIntegration()],
        traces_sample_rate=0.1,
        environment=os.getenv("ENVIRONMENT", "development")
    )
```

---

## 💾 Backup e Recovery

### 1. Backup Automatico

```python
# Script: utils/backup_manager.py
class BackupManager:
    def create_daily_backup(self):
        """Crea backup giornaliero completo"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Backup database
        self.backup_database(f"backup_db_{timestamp}.sql")
        
        # Backup assets
        self.backup_assets(f"backup_assets_{timestamp}.tar.gz")
        
        # Backup configurazione
        self.backup_config(f"backup_config_{timestamp}.json")
        
        # Cleanup vecchi backup
        self.cleanup_old_backups(retention_days=30)
```

### 2. Recovery Procedure

```bash
# 1. Stop il servizio
sudo systemctl stop wisdom-api

# 2. Restore database
python utils/restore_backup.py --file backup_db_20240115_020000.sql

# 3. Restore assets
tar -xzf backup_assets_20240115_020000.tar.gz -C assets/

# 4. Restart servizio
sudo systemctl start wisdom-api
```

### 3. Disaster Recovery

```python
# Procedura di recovery completa
def disaster_recovery():
    """Recovery completo del sistema"""
    
    # 1. Verifica integrità backup
    verify_backup_integrity()
    
    # 2. Restore database
    restore_latest_database()
    
    # 3. Restore assets
    restore_assets()
    
    # 4. Rebuild cache
    rebuild_cache()
    
    # 5. Restart scheduler
    restart_scheduler()
    
    # 6. Verify system health
    verify_system_health()
```

---

## ⚡ Performance Optimization

### 1. Caching Strategy

```python
# Cache Redis (opzionale)
REDIS_CONFIG = {
    "url": os.getenv("REDIS_URL", "redis://localhost:6379"),
    "max_connections": 20,
    "socket_keepalive": True
}

# Cache locale
LOCAL_CACHE = {
    "wisdom_cache": {
        "size": 1000,
        "ttl": 3600  # 1 ora
    },
    "context_cache": {
        "size": 500,
        "ttl": 1800  # 30 minuti
    }
}
```

### 2. Database Optimization

```sql
-- Indici per performance
CREATE INDEX idx_wisdom_created_at ON wisdom(created_at);
CREATE INDEX idx_wisdom_quality_score ON wisdom(quality_score);
CREATE INDEX idx_wisdom_tags ON wisdom_tags(tag_name);

-- Vacuum automatico (SQLite)
PRAGMA auto_vacuum = INCREMENTAL;
PRAGMA journal_mode = WAL;
```

### 3. API Optimization

```python
# Rate limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.get("/daily-wisdom")
@limiter.limit("100/hour")
async def get_daily_wisdom(request: Request):
    # Implementazione con cache
    cached = await cache.get("daily_wisdom")
    if cached:
        return cached
    
    wisdom = generate_daily_wisdom()
    await cache.set("daily_wisdom", wisdom, ttl=3600)
    return wisdom
```

---

## 🔧 Troubleshooting

### Problemi Comuni

#### 1. Server non si avvia

**Sintomi**: Errore all'avvio del server
**Soluzioni**:
```bash
# Verifica dipendenze
pip install -r requirements.txt

# Verifica database
python -c "from utils.db_init import verify_database; verify_database()"

# Controlla logs
tail -f logs/wisdom.log
```

#### 2. API lente

**Sintomi**: Tempi di risposta > 5 secondi
**Soluzioni**:
```python
# Abilita cache
CACHE_ENABLED = True

# Ottimizza database
python utils/optimize_database.py

# Controlla metriche
curl http://0.0.0.0:5000/metrics
```

#### 3. Generazione saggezze fallisce

**Sintomi**: Errori nel motore AI
**Soluzioni**:
```python
# Test motore AI
python -c "from ai.hybrid_engine import HybridWisdomEngine; engine = HybridWisdomEngine(); print(engine.test_connection())"

# Fallback a template
echo "USE_TEMPLATE_ONLY=true" >> .env

# Reinizializza template
python utils/template_seeder.py --reset
```

### Monitoring Checklist

- [ ] ✅ Server risponde su `/health`
- [ ] ✅ Database connesso e funzionante
- [ ] ✅ Scheduler attivo
- [ ] ✅ Backup funzionanti
- [ ] ✅ Logs senza errori critici
- [ ] ✅ Metriche dentro i limiti
- [ ] ✅ SSL certificato valido

### Log Analysis

```bash
# Errori critici
grep "ERROR" logs/wisdom.log | tail -20

# Performance issues
grep "slow" logs/wisdom.log | tail -10

# Analytics
python utils/log_analyzer.py --date today --metrics response_time
```

---

## 📈 Scaling e Performance

### Horizontal Scaling

```yaml
# docker-compose.yml per multi-instance
version: '3.8'
services:
  wisdom-api-1:
    build: .
    environment:
      - INSTANCE_ID=1
  
  wisdom-api-2:
    build: .
    environment:
      - INSTANCE_ID=2
  
  nginx:
    image: nginx
    ports:
      - "80:80"
    depends_on:
      - wisdom-api-1
      - wisdom-api-2
```

### Load Balancing

```nginx
# nginx.conf
upstream wisdom_backend {
    server wisdom-api-1:5000;
    server wisdom-api-2:5000;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://wisdom_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🔒 Security Checklist

- [ ] ✅ HTTPS abilitato
- [ ] ✅ API rate limiting configurato
- [ ] ✅ Database credenziali sicure
- [ ] ✅ Logs non contengono secrets
- [ ] ✅ CORS configurato correttamente
- [ ] ✅ Input validation attiva
- [ ] ✅ Error handling sicuro

---

## 📞 Supporto Deployment

### Contatti Tecnici
- 📧 **DevOps**: devops@lacucciadiugo.it
- 🔧 **Support**: support@lacucciadiugo.it
- 📱 **Emergency**: +39 XXX XXX XXXX

### Documentazione Aggiuntiva
- [API Documentation](API_DOCUMENTATION.md)
- [Setup Guide](README_SETUP.md)
- [Contributing Guide](CONTRIBUTING.md)

---

**Made with ❤️ for La Cuccia di Ugo**

*Deployment Guide v1.0 - Aggiornato: 15 Gennaio 2024*


"""
🐕 La Cuccia di Ugo - Daily Wisdom System
Configurazione centralizzata per tutti i componenti
"""

import os
from pathlib import Path
from typing import Dict, Any
from dotenv import load_dotenv

# Carica le variabili d'ambiente
load_dotenv()

class Settings:
    """Configurazione centralizzata del sistema"""
    
    # === CONFIGURAZIONE BASE ===
    PROJECT_NAME = "La Cuccia di Ugo - Daily Wisdom"
    VERSION = "1.0.0"
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    
    # Path del progetto
    BASE_DIR = Path(__file__).parent.parent
    DATA_DIR = BASE_DIR / "data"
    LOGS_DIR = BASE_DIR / "logs"
    ASSETS_DIR = BASE_DIR / "assets"
    BACKUP_DIR = BASE_DIR / "backups"
    
    # === DATABASE ===
    DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/wisdom.db")
    BACKUP_INTERVAL_HOURS = int(os.getenv("BACKUP_INTERVAL_HOURS", "24"))
    
    # === API KEYS GRATUITE ===
    # OpenWeatherMap (1000 calls/day gratis)
    OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
    OPENWEATHER_BASE_URL = "http://api.openweathermap.org/data/2.5"
    
    # Unsplash (50 downloads/hour gratis)
    UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY", "")
    UNSPLASH_BASE_URL = "https://api.unsplash.com"
    
    # News API (100 requests/day gratis)
    NEWS_API_KEY = os.getenv("NEWS_API_KEY", "")
    NEWS_API_BASE_URL = "https://newsapi.org/v2"
    
    # === UGO PERSONALITY ===
    UGO_PERSONALITY = {
        "name": "Ugo",
        "species": "Golden Retriever filosofo",
        "age": "3 anni umani, infinita saggezza canina",
        "traits": [
            "Ottimista incrollabile",
            "Filosofo della vita semplice",
            "Amante della natura",
            "Sempre affettuoso",
            "Saggezza spontanea"
        ],
        "speaking_style": {
            "tone": "Caldo e accogliente",
            "language": "Italiano colloquiale",
            "metaphors": "Natura, cani, vita quotidiana",
            "max_length": 280,  # Per social media
            "emoji_frequency": "Moderata"
        }
    }
    
    # === AI CONFIGURATION ===
    AI_CONFIG = {
        "primary_engine": "template",  # template, local_ai, hybrid
        "fallback_engines": ["template"],
        "local_model_path": BASE_DIR / "models" / "mistral-7b-instruct.gguf",
        "context_length": 2048,
        "temperature": 0.7,
        "max_tokens": 100,
        "quality_threshold": 0.7
    }
    
    # === VISUAL SETTINGS ===
    VISUAL_CONFIG = {
        "output_formats": {
            "instagram_post": (1080, 1080),
            "instagram_story": (1080, 1920),
            "facebook_post": (1200, 630),
            "twitter_post": (1200, 675),
            "website_hero": (1920, 1080)
        },
        "fonts": {
            "primary": "Montserrat",
            "secondary": "Open Sans",
            "accent": "Dancing Script"
        },
        "colors": {
            "primary": "#8B4513",      # Marrone caldo
            "secondary": "#F4A460",    # Sandy brown
            "accent": "#FFD700",       # Gold
            "text": "#2F4F4F",        # Dark slate gray
            "background": "#FFF8DC"    # Cornsilk
        },
        "quality": 95,
        "optimization": True
    }
    
    # === SCHEDULING ===
    SCHEDULE_CONFIG = {
        "daily_wisdom_time": "07:00",
        "timezone": "Europe/Rome",
        "retry_attempts": 3,
        "retry_delay_minutes": 30,
        "weekend_posting": True,
        "holiday_posting": True
    }
    
    # === SOCIAL MEDIA ===
    SOCIAL_CONFIG = {
        "platforms": {
            "instagram": {
                "enabled": False,
                "hashtags_count": 10,
                "optimal_times": ["08:00", "12:00", "19:00"]
            },
            "facebook": {
                "enabled": False,
                "optimal_times": ["09:00", "13:00", "18:00"]
            },
            "twitter": {
                "enabled": False,
                "hashtags_count": 5,
                "optimal_times": ["08:00", "12:00", "17:00", "20:00"]
            }
        },
        "hashtags": {
            "base": ["#LaCucciadiUgo", "#UgoSaggezza", "#DailyWisdom"],
            "seasonal": {
                "spring": ["#Primavera", "#Natura", "#Rinascita"],
                "summer": ["#Estate", "#Sole", "#Felicità"],
                "autumn": ["#Autunno", "#Riflessione", "#Cambiamento"],
                "winter": ["#Inverno", "#Calore", "#Famiglia"]
            }
        }
    }
    
    # === ANALYTICS ===
    ANALYTICS_CONFIG = {
        "tracking_enabled": True,
        "metrics": [
            "wisdom_generated",
            "wisdom_shared",
            "engagement_rate",
            "click_through_rate",
            "sentiment_score"
        ],
        "reporting_frequency": "weekly",
        "retention_days": 365
    }
    
    # === RSS FEEDS ITALIANI GRATUITI ===
    RSS_FEEDS = [
        {
            "name": "ANSA",
            "url": "https://www.ansa.it/sito/notizie/mondo/mondo_rss.xml",
            "category": "news"
        },
        {
            "name": "La Gazzetta dello Sport",
            "url": "https://www.gazzetta.it/rss/home.xml",
            "category": "sport"
        },
        {
            "name": "Focus",
            "url": "https://www.focus.it/rss/scienza.xml",
            "category": "science"
        }
    ]
    
    # === LOGGING ===
    LOGGING_CONFIG = {
        "level": "INFO" if not DEBUG else "DEBUG",
        "format": "{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        "rotation": "10 MB",
        "retention": "30 days",
        "compression": "zip"
    }
    
    # === WEB SERVER ===
    SERVER_CONFIG = {
        "host": "0.0.0.0",
        "port": int(os.getenv("PORT", "5000")),
        "reload": DEBUG,
        "workers": 1 if DEBUG else 4
    }

    @classmethod
    def create_directories(cls):
        """Crea le directory necessarie se non esistono"""
        dirs = [cls.DATA_DIR, cls.LOGS_DIR, cls.ASSETS_DIR, cls.BACKUP_DIR]
        for directory in dirs:
            directory.mkdir(parents=True, exist_ok=True)
    
    @classmethod
    def get_api_key(cls, service: str) -> str:
        """Ottiene una API key con fallback graceful"""
        key = getattr(cls, f"{service.upper()}_API_KEY", "")
        if not key:
            print(f"⚠️ API key per {service} non configurata (funzionamento limitato)")
        return key
    
    @classmethod
    def is_production(cls) -> bool:
        """Verifica se siamo in ambiente di produzione"""
        return os.getenv("ENVIRONMENT", "development") == "production"

# Istanza globale delle settings
settings = Settings()

# Crea le directory al primo import
settings.create_directories()


"""
🐕 La Cuccia di Ugo - Social Media Publisher
Sistema di pubblicazione automatica delle saggezze sui social media
"""

import os
import json
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from pathlib import Path
import requests
import base64
from dataclasses import dataclass

from database.wisdom_db import WisdomDatabase
from visual.quote_generator import QuoteGenerator
from config.settings import settings


@dataclass
class SocialPost:
    """Rappresenta un post sui social media"""
    platform: str
    content: str
    image_path: Optional[str] = None
    scheduled_time: Optional[datetime] = None
    hashtags: List[str] = None
    post_id: Optional[str] = None
    status: str = "draft"  # draft, scheduled, published, failed


class SocialMediaPublisher:
    """Gestore pubblicazione automatica sui social media"""
    
    def __init__(self):
        self.db = WisdomDatabase()
        self.quote_generator = QuoteGenerator()
        self.platforms = {
            'facebook': FacebookPublisher(),
            'instagram': InstagramPublisher(),
            'twitter': TwitterPublisher(),
            'linkedin': LinkedInPublisher(),
            'telegram': TelegramPublisher(),
        }
        
    def publish_daily_wisdom(self, wisdom_id: int, platforms: List[str] = None) -> Dict[str, Any]:
        """Pubblica una saggezza su tutti i social specificati"""
        if platforms is None:
            platforms = ['facebook', 'instagram', 'twitter', 'telegram']
        
        # Ottieni la saggezza dal database
        wisdom = self.db.get_wisdom_by_id(wisdom_id)
        if not wisdom:
            return {"error": "Saggezza non trovata"}
        
        # Genera immagine se non esiste
        if not wisdom.image_path:
            image_path = self.quote_generator.create_quote_card(wisdom.text)
            self.db.update_wisdom_metrics(wisdom_id, {"image_path": image_path})
        else:
            image_path = wisdom.image_path
        
        results = {}
        
        for platform in platforms:
            if platform not in self.platforms:
                results[platform] = {"error": f"Piattaforma {platform} non supportata"}
                continue
            
            try:
                # Crea post personalizzato per la piattaforma
                post = self._create_platform_post(wisdom, platform, image_path)
                
                # Pubblica
                publisher = self.platforms[platform]
                result = publisher.publish(post)
                
                results[platform] = result
                
                # Salva risultato nel database
                self._save_social_post_result(wisdom_id, platform, post, result)
                
            except Exception as e:
                results[platform] = {"error": str(e)}
        
        return results
    
    def _create_platform_post(self, wisdom, platform: str, image_path: str) -> SocialPost:
        """Crea un post personalizzato per ogni piattaforma"""
        base_hashtags = ["#LaCucciadiUgo", "#UgoWisdom", "#SaggezzaQuotidiana"]
        
        # Personalizzazioni per piattaforma
        if platform == "instagram":
            content = f"{wisdom.text}\n\n🐕 Ugo condivide la sua saggezza quotidiana!"
            hashtags = base_hashtags + ["#DogsofInstagram", "#DogWisdom", "#PetLove"]
            
        elif platform == "facebook":
            content = f"🐕 La saggezza di oggi da Ugo:\n\n\"{wisdom.text}\"\n\nCosa ne pensi della riflessione di oggi?"
            hashtags = base_hashtags + ["#Cani", "#Saggezza"]
            
        elif platform == "twitter":
            # Twitter ha limiti di caratteri
            content = f"🐕 {wisdom.text}\n\n#UgoWisdom #SaggezzaQuotidiana"
            if len(content) > 280:
                content = f"🐕 {wisdom.text[:200]}...\n\n#UgoWisdom"
            hashtags = []  # Già inclusi nel content
            
        elif platform == "linkedin":
            content = f"🐕 Riflessione del giorno da Ugo:\n\n{wisdom.text}\n\nAnche i nostri amici a quattro zampe hanno molto da insegnarci sulla vita."
            hashtags = base_hashtags + ["#Leadership", "#Motivazione"]
            
        elif platform == "telegram":
            content = f"🐕 *La saggezza di oggi da Ugo:*\n\n_{wisdom.text}_\n\nBuona giornata dalla Cuccia di Ugo! 🏠"
            hashtags = []  # Telegram non usa hashtags
        
        else:
            content = wisdom.text
            hashtags = base_hashtags
        
        return SocialPost(
            platform=platform,
            content=content,
            image_path=image_path,
            hashtags=hashtags,
            scheduled_time=datetime.now()
        )
    
    def _save_social_post_result(self, wisdom_id: int, platform: str, post: SocialPost, result: Dict):
        """Salva il risultato della pubblicazione nel database"""
        # Qui salveresti nel database usando la tabella social_posts
        # Per ora log semplice
        log_data = {
            "wisdom_id": wisdom_id,
            "platform": platform,
            "content": post.content,
            "result": result,
            "timestamp": datetime.now().isoformat()
        }
        
        # Salva in un file JSON per il momento
        log_file = Path("logs/social_posts.json")
        log_file.parent.mkdir(exist_ok=True)
        
        if log_file.exists():
            with open(log_file, 'r', encoding='utf-8') as f:
                logs = json.load(f)
        else:
            logs = []
        
        logs.append(log_data)
        
        with open(log_file, 'w', encoding='utf-8') as f:
            json.dump(logs, f, indent=2, ensure_ascii=False)
    
    def schedule_posts(self, wisdom_id: int, schedule_times: Dict[str, datetime]) -> Dict[str, Any]:
        """Pianifica post per orari specifici"""
        results = {}
        
        for platform, scheduled_time in schedule_times.items():
            if platform not in self.platforms:
                continue
            
            # Per ora salva solo la pianificazione (implementazione completa richiederebbe un task scheduler)
            results[platform] = {
                "scheduled": True,
                "time": scheduled_time.isoformat(),
                "status": "pending"
            }
        
        return results
    
    def get_posting_schedule(self) -> Dict[str, List[str]]:
        """Ottiene gli orari ottimali per ogni piattaforma"""
        return {
            "instagram": ["08:00", "12:00", "19:00"],
            "facebook": ["09:00", "15:00", "20:00"],
            "twitter": ["08:00", "12:00", "17:00", "20:00"],
            "linkedin": ["08:00", "12:00", "17:00"],
            "telegram": ["08:00", "20:00"]
        }


class BaseSocialPublisher:
    """Classe base per publisher social"""
    
    def __init__(self, platform_name: str):
        self.platform_name = platform_name
        self.api_credentials = self._load_credentials()
    
    def _load_credentials(self) -> Dict[str, str]:
        """Carica credenziali dalla configurazione"""
        return {
            "api_key": os.getenv(f"{self.platform_name.upper()}_API_KEY", ""),
            "api_secret": os.getenv(f"{self.platform_name.upper()}_API_SECRET", ""),
            "access_token": os.getenv(f"{self.platform_name.upper()}_ACCESS_TOKEN", "")
        }
    
    def publish(self, post: SocialPost) -> Dict[str, Any]:
        """Metodo base per pubblicazione (da implementare nelle sottoclassi)"""
        raise NotImplementedError("Ogni publisher deve implementare il metodo publish")
    
    def _upload_image(self, image_path: str) -> Optional[str]:
        """Upload immagine alla piattaforma"""
        # Implementazione base - da specializzare per ogni piattaforma
        return None


class FacebookPublisher(BaseSocialPublisher):
    """Publisher per Facebook"""
    
    def __init__(self):
        super().__init__("facebook")
    
    def publish(self, post: SocialPost) -> Dict[str, Any]:
        """Pubblica su Facebook"""
        if not self.api_credentials.get("access_token"):
            return {
                "success": False,
                "error": "Token di accesso Facebook mancante",
                "mock_post": True
            }
        
        # Mock implementation - sostituire con Facebook Graph API reale
        return {
            "success": True,
            "post_id": f"fb_mock_{datetime.now().timestamp()}",
            "platform": "facebook",
            "url": "https://facebook.com/mock_post",
            "mock_post": True
        }


class InstagramPublisher(BaseSocialPublisher):
    """Publisher per Instagram"""
    
    def __init__(self):
        super().__init__("instagram")
    
    def publish(self, post: SocialPost) -> Dict[str, Any]:
        """Pubblica su Instagram"""
        if not self.api_credentials.get("access_token"):
            return {
                "success": False,
                "error": "Token di accesso Instagram mancante",
                "mock_post": True
            }
        
        # Mock implementation - sostituire con Instagram Basic Display API reale
        return {
            "success": True,
            "post_id": f"ig_mock_{datetime.now().timestamp()}",
            "platform": "instagram",
            "url": "https://instagram.com/p/mock_post",
            "mock_post": True
        }


class TwitterPublisher(BaseSocialPublisher):
    """Publisher per Twitter/X"""
    
    def __init__(self):
        super().__init__("twitter")
    
    def publish(self, post: SocialPost) -> Dict[str, Any]:
        """Pubblica su Twitter"""
        if not self.api_credentials.get("api_key"):
            return {
                "success": False,
                "error": "API Key Twitter mancante",
                "mock_post": True
            }
        
        # Mock implementation - sostituire con Twitter API v2 reale
        return {
            "success": True,
            "post_id": f"tw_mock_{datetime.now().timestamp()}",
            "platform": "twitter",
            "url": "https://twitter.com/mock_user/status/mock_id",
            "mock_post": True
        }


class LinkedInPublisher(BaseSocialPublisher):
    """Publisher per LinkedIn"""
    
    def __init__(self):
        super().__init__("linkedin")
    
    def publish(self, post: SocialPost) -> Dict[str, Any]:
        """Pubblica su LinkedIn"""
        return {
            "success": True,
            "post_id": f"li_mock_{datetime.now().timestamp()}",
            "platform": "linkedin",
            "mock_post": True
        }


class TelegramPublisher(BaseSocialPublisher):
    """Publisher per Telegram"""
    
    def __init__(self):
        super().__init__("telegram")
        self.bot_token = os.getenv("TELEGRAM_BOT_TOKEN", "")
        self.channel_id = os.getenv("TELEGRAM_CHANNEL_ID", "")
    
    def publish(self, post: SocialPost) -> Dict[str, Any]:
        """Pubblica su Telegram"""
        if not self.bot_token or not self.channel_id:
            return {
                "success": False,
                "error": "Configurazione Telegram mancante",
                "mock_post": True
            }
        
        try:
            # Pubblica su Telegram (implementazione reale)
            url = f"https://api.telegram.org/bot{self.bot_token}/sendPhoto"
            
            # Prepara dati
            with open(post.image_path, 'rb') as photo:
                files = {'photo': photo}
                data = {
                    'chat_id': self.channel_id,
                    'caption': post.content,
                    'parse_mode': 'Markdown'
                }
                
                response = requests.post(url, files=files, data=data, timeout=30)
                
                if response.status_code == 200:
                    result = response.json()
                    return {
                        "success": True,
                        "post_id": str(result['result']['message_id']),
                        "platform": "telegram",
                        "message_id": result['result']['message_id']
                    }
                else:
                    return {
                        "success": False,
                        "error": f"Errore Telegram: {response.text}"
                    }
                    
        except Exception as e:
            return {
                "success": False,
                "error": f"Errore pubblicazione Telegram: {str(e)}",
                "mock_post": True
            }


# Factory per creare publisher
def create_social_publisher() -> SocialMediaPublisher:
    """Factory per creare un publisher social media"""
    return SocialMediaPublisher()

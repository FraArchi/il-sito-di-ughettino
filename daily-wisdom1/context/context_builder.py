
"""
🐕 La Cuccia di Ugo - Context Builder
Raccoglie contesto intelligente per generazione saggezze personalizzate
"""

import json
import random
import requests
from datetime import datetime, date
from typing import Dict, List, Optional, Any
from config.settings import settings

class ContextBuilder:
    """Builder per raccogliere contesto ricco e intelligente"""
    
    def __init__(self):
        self.weather_enabled = bool(settings.OPENWEATHER_API_KEY)
        self.news_enabled = bool(settings.NEWS_API_KEY)
    
    def build_daily_context(self) -> Dict[str, Any]:
        """Costruisce contesto completo per la saggezza quotidiana"""
        context = {}
        
        # Contesto temporale base
        context.update(self._get_temporal_context())
        
        # Contesto meteorologico
        if self.weather_enabled:
            weather_data = self._get_weather_context()
            if weather_data:
                context['weather'] = weather_data
        
        # Contesto stagionale
        context.update(self._get_seasonal_context())
        
        # Contesto emotivo del giorno
        context.update(self._get_daily_emotional_context())
        
        # Contesto notizie (se disponibile)
        if self.news_enabled:
            news_context = self._get_news_context()
            if news_context:
                context['news_sentiment'] = news_context
        
        # Contesto personalità Ugo
        context.update(self._get_ugo_personality_context())
        
        # Fallback per contesto mancante
        context = self._ensure_fallback_context(context)
        
        return context
    
    def _get_temporal_context(self) -> Dict[str, Any]:
        """Contesto temporale completo"""
        now = datetime.now()
        
        # Momento del giorno
        hour = now.hour
        if hour < 6:
            time_of_day = 'notte'
            time_mood = 'tranquillo'
        elif hour < 12:
            time_of_day = 'mattina'
            time_mood = 'energico'
        elif hour < 18:
            time_of_day = 'pomeriggio'
            time_mood = 'attivo'
        else:
            time_of_day = 'sera'
            time_mood = 'rilassato'
        
        # Giorno della settimana
        weekday = now.weekday()
        if weekday < 5:
            day_type = 'feriale'
            day_energy = 'produttivo'
        else:
            day_type = 'weekend'
            day_energy = 'rilassato'
        
        return {
            'time_of_day': time_of_day,
            'time_mood': time_mood,
            'hour': hour,
            'day_type': day_type,
            'day_energy': day_energy,
            'weekday': weekday,
            'date': now.date().isoformat(),
            'timestamp': now.isoformat()
        }
    
    def _get_weather_context(self) -> Optional[Dict[str, Any]]:
        """Ottiene contesto meteorologico da OpenWeatherMap"""
        if not self.weather_enabled:
            return None
        
        try:
            # Coordinate Roma come default (può essere personalizzato)
            lat, lon = 41.9028, 12.4964
            
            url = f"{settings.OPENWEATHER_BASE_URL}/weather"
            params = {
                'lat': lat,
                'lon': lon,
                'appid': settings.OPENWEATHER_API_KEY,
                'units': 'metric',
                'lang': 'it'
            }
            
            response = requests.get(url, params=params, timeout=5)
            response.raise_for_status()
            data = response.json()
            
            # Estrai informazioni rilevanti
            weather_context = {
                'temperature': round(data['main']['temp']),
                'feels_like': round(data['main']['feels_like']),
                'humidity': data['main']['humidity'],
                'description': data['weather'][0]['description'],
                'main': data['weather'][0]['main'].lower(),
                'icon': data['weather'][0]['icon'],
                'wind_speed': data.get('wind', {}).get('speed', 0),
                'cloudiness': data['clouds']['all'],
                'city': data['name']
            }
            
            # Aggiungi mood meteorologico
            weather_context['mood'] = self._interpret_weather_mood(weather_context)
            
            return weather_context
            
        except Exception as e:
            print(f"⚠️ Errore recupero meteo: {e}")
            return None
    
    def _interpret_weather_mood(self, weather: Dict[str, Any]) -> str:
        """Interpreta il mood basandosi sul meteo"""
        main = weather['main']
        temp = weather['temperature']
        
        if main == 'clear':
            return 'raggiante' if temp > 20 else 'sereno'
        elif main == 'clouds':
            return 'riflessivo' if weather['cloudiness'] > 70 else 'tranquillo'
        elif main in ['rain', 'drizzle']:
            return 'contemplativo'
        elif main == 'snow':
            return 'magico'
        elif main == 'thunderstorm':
            return 'drammatico'
        else:
            return 'misterioso'
    
    def _get_seasonal_context(self) -> Dict[str, Any]:
        """Contesto stagionale dettagliato"""
        month = datetime.now().month
        day = datetime.now().day
        
        # Stagioni astronomiche
        if month in [12, 1, 2]:
            season = 'inverno'
            season_mood = 'accogliente'
            season_themes = ['calore', 'famiglia', 'intimità', 'protezione']
        elif month in [3, 4, 5]:
            season = 'primavera'
            season_mood = 'rinnovamento'
            season_themes = ['crescita', 'speranza', 'fioritura', 'energia']
        elif month in [6, 7, 8]:
            season = 'estate'
            season_mood = 'gioioso'
            season_themes = ['libertà', 'avventura', 'vitalità', 'gioco']
        else:
            season = 'autunno'
            season_mood = 'riflessivo'
            season_themes = ['cambiamento', 'saggezza', 'raccolta', 'trasformazione']
        
        # Eventi stagionali speciali
        seasonal_events = self._get_seasonal_events(month, day)
        
        return {
            'season': season,
            'season_mood': season_mood,
            'season_themes': season_themes,
            'month': month,
            'seasonal_events': seasonal_events
        }
    
    def _get_seasonal_events(self, month: int, day: int) -> List[str]:
        """Identifica eventi stagionali speciali"""
        events = []
        
        # Eventi fissi
        special_dates = {
            (1, 1): ['capodanno', 'nuovi_inizi'],
            (2, 14): ['san_valentino', 'amore'],
            (3, 8): ['festa_donna', 'celebrazione'],
            (3, 21): ['equinozio_primavera', 'equilibrio'],
            (4, 25): ['festa_liberazione', 'libertà'],
            (5, 1): ['festa_lavoro', 'impegno'],
            (6, 21): ['solstizio_estate', 'energia_massima'],
            (8, 15): ['ferragosto', 'relax'],
            (9, 22): ['equinozio_autunno', 'raccolta'],
            (10, 31): ['halloween', 'mistero'],
            (12, 8): ['immacolata', 'purezza'],
            (12, 21): ['solstizio_inverno', 'rinascita_luce'],
            (12, 25): ['natale', 'famiglia'],
            (12, 31): ['san_silvestro', 'bilanci']
        }
        
        if (month, day) in special_dates:
            events.extend(special_dates[(month, day)])
        
        # Eventi approssimativi
        if month == 3 and 19 <= day <= 23:
            events.append('inizio_primavera')
        elif month == 6 and 19 <= day <= 23:
            events.append('inizio_estate')
        elif month == 9 and 20 <= day <= 24:
            events.append('inizio_autunno')
        elif month == 12 and 19 <= day <= 23:
            events.append('inizio_inverno')
        
        return events
    
    def _get_daily_emotional_context(self) -> Dict[str, Any]:
        """Contesto emotivo del giorno basato su vari fattori"""
        now = datetime.now()
        
        # Emotional pattern basato su giorno dell'anno
        day_of_year = now.timetuple().tm_yday
        
        # Ciclo emotivo settimanale
        weekday_emotions = {
            0: 'determinato',    # Lunedì
            1: 'produttivo',     # Martedì
            2: 'equilibrato',    # Mercoledì
            3: 'perseverante',   # Giovedì
            4: 'soddisfatto',    # Venerdì
            5: 'libero',         # Sabato
            6: 'sereno'          # Domenica
        }
        
        base_emotion = weekday_emotions[now.weekday()]
        
        # Modifica emotiva basata su ora
        hour_modifiers = {
            'mattina': 'energico',
            'pomeriggio': 'attivo', 
            'sera': 'rilassato',
            'notte': 'tranquillo'
        }
        
        time_context = self._get_temporal_context()
        mood_modifier = hour_modifiers.get(time_context['time_of_day'], 'neutro')
        
        # Selezione mood finale
        possible_moods = [base_emotion, mood_modifier, 'positivo', 'speranzoso']
        daily_mood = random.choice(possible_moods)
        
        return {
            'daily_emotion': base_emotion,
            'mood_modifier': mood_modifier,
            'final_mood': daily_mood,
            'emotional_intensity': self._calculate_emotional_intensity(now),
            'suggested_themes': self._get_mood_themes(daily_mood)
        }
    
    def _calculate_emotional_intensity(self, now: datetime) -> float:
        """Calcola intensità emotiva del momento"""
        # Base: ora del giorno (picchi mattina e sera)
        hour = now.hour
        if 7 <= hour <= 9 or 18 <= hour <= 20:
            intensity = 0.8
        elif 10 <= hour <= 16:
            intensity = 0.6
        else:
            intensity = 0.4
        
        # Modifica per weekend
        if now.weekday() >= 5:
            intensity += 0.1
        
        # Modifica per eventi speciali
        seasonal_events = self._get_seasonal_events(now.month, now.day)
        if seasonal_events:
            intensity += 0.2
        
        return min(1.0, intensity)
    
    def _get_mood_themes(self, mood: str) -> List[str]:
        """Ottiene temi appropriati per il mood"""
        theme_mapping = {
            'energico': ['azione', 'movimento', 'vitalità', 'entusiasmo'],
            'sereno': ['pace', 'calma', 'equilibrio', 'armonia'],
            'riflessivo': ['saggezza', 'contemplazione', 'profondità', 'crescita'],
            'gioioso': ['felicità', 'celebrazione', 'gioco', 'risate'],
            'determinato': ['obiettivi', 'forza', 'perseveranza', 'coraggio'],
            'amoroso': ['affetto', 'cura', 'tenerezza', 'connessione'],
            'curioso': ['scoperta', 'esplorazione', 'apprendimento', 'meraviglia']
        }
        
        return theme_mapping.get(mood, ['positività', 'speranza', 'amore', 'crescita'])
    
    def _get_news_context(self) -> Optional[Dict[str, Any]]:
        """Ottiene contesto dalle notizie (sentiment generale)"""
        if not self.news_enabled:
            return None
        
        try:
            url = f"{settings.NEWS_API_BASE_URL}/top-headlines"
            params = {
                'country': 'it',
                'apiKey': settings.NEWS_API_KEY,
                'pageSize': 10
            }
            
            response = requests.get(url, params=params, timeout=5)
            response.raise_for_status()
            data = response.json()
            
            if not data.get('articles'):
                return None
            
            # Analizza sentiment generale
            headlines = [article['title'] for article in data['articles'][:5]]
            sentiment = self._analyze_news_sentiment(headlines)
            
            return {
                'general_sentiment': sentiment,
                'news_count': len(headlines),
                'topics': self._extract_news_topics(headlines)
            }
            
        except Exception as e:
            print(f"⚠️ Errore recupero notizie: {e}")
            return None
    
    def _analyze_news_sentiment(self, headlines: List[str]) -> str:
        """Analizza sentiment dalle notizie (versione semplificata)"""
        positive_keywords = ['successo', 'vittoria', 'migliora', 'crescita', 'pace', 'accordo']
        negative_keywords = ['crisi', 'problema', 'guerra', 'emergenza', 'difficoltà']
        
        positive_score = 0
        negative_score = 0
        
        for headline in headlines:
            headline_lower = headline.lower()
            positive_score += sum(1 for word in positive_keywords if word in headline_lower)
            negative_score += sum(1 for word in negative_keywords if word in headline_lower)
        
        if positive_score > negative_score:
            return 'ottimista'
        elif negative_score > positive_score:
            return 'cauto'
        else:
            return 'equilibrato'
    
    def _extract_news_topics(self, headlines: List[str]) -> List[str]:
        """Estrae topic principali dalle notizie"""
        topics = []
        topic_keywords = {
            'politica': ['governo', 'elezioni', 'parlamento', 'ministro'],
            'economia': ['mercato', 'economia', 'lavoro', 'imprese'],
            'sport': ['calcio', 'sport', 'campionato', 'squadra'],
            'tecnologia': ['tecnologia', 'digitale', 'internet', 'app'],
            'salute': ['salute', 'medicina', 'ospedale', 'cura'],
            'ambiente': ['ambiente', 'clima', 'verde', 'sostenibilità']
        }
        
        for topic, keywords in topic_keywords.items():
            if any(keyword in ' '.join(headlines).lower() for keyword in keywords):
                topics.append(topic)
        
        return topics[:3]  # Massimo 3 topic
    
    def _get_ugo_personality_context(self) -> Dict[str, Any]:
        """Contesto specifico della personalità di Ugo"""
        personality = settings.UGO_PERSONALITY
        
        # Seleziona tratti casuali per variazione
        active_traits = random.sample(personality['traits'], 2)
        
        # Stato emotivo di Ugo
        ugo_emotions = [
            'felice', 'curioso', 'affettuoso', 'giocoso', 'saggio',
            'protettivo', 'leale', 'entusiasta', 'calmo', 'amoroso'
        ]
        
        return {
            'ugo_name': personality['name'],
            'ugo_species': personality['species'],
            'active_traits': active_traits,
            'ugo_emotion': random.choice(ugo_emotions),
            'speaking_style': personality['speaking_style'],
            'personality_focus': random.choice(['saggezza', 'affetto', 'gioco', 'protezione'])
        }
    
    def _ensure_fallback_context(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Assicura che ci sia sempre contesto minimo utilizzabile"""
        
        # Fallback temporale
        if 'time_of_day' not in context:
            hour = datetime.now().hour
            context['time_of_day'] = 'mattina' if hour < 12 else 'sera'
        
        # Fallback stagionale
        if 'season' not in context:
            month = datetime.now().month
            if month in [12, 1, 2]:
                context['season'] = 'inverno'
            elif month in [3, 4, 5]:
                context['season'] = 'primavera'
            elif month in [6, 7, 8]:
                context['season'] = 'estate'
            else:
                context['season'] = 'autunno'
        
        # Fallback meteo
        if 'weather' not in context:
            context['weather'] = {
                'description': 'sereno',
                'mood': 'positivo',
                'temperature': 20
            }
        
        # Fallback mood
        if 'final_mood' not in context:
            context['final_mood'] = 'positivo'
        
        # Fallback emotivo
        if 'ugo_emotion' not in context:
            context['ugo_emotion'] = 'affettuoso'
        
        return context
    
    def get_context_summary(self, context: Dict[str, Any]) -> str:
        """Genera un riassunto human-readable del contesto"""
        summary_parts = []
        
        # Tempo
        if 'time_of_day' in context:
            summary_parts.append(f"È {context['time_of_day']}")
        
        # Stagione
        if 'season' in context:
            summary_parts.append(f"siamo in {context['season']}")
        
        # Meteo
        if 'weather' in context and isinstance(context['weather'], dict):
            weather = context['weather']
            summary_parts.append(f"il tempo è {weather.get('description', 'bello')}")
        
        # Mood
        if 'final_mood' in context:
            summary_parts.append(f"l'energia è {context['final_mood']}")
        
        # Ugo
        if 'ugo_emotion' in context:
            summary_parts.append(f"Ugo si sente {context['ugo_emotion']}")
        
        return ", ".join(summary_parts) + "."

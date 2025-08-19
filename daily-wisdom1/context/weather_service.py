
"""
🐕 La Cuccia di Ugo - Weather Service
Servizio meteo con fallback intelligenti
"""

import requests
import random
from datetime import datetime
from typing import Dict, Optional, Any
from config.settings import settings

class WeatherService:
    """Servizio per ottenere informazioni meteorologiche con fallback"""
    
    def __init__(self):
        self.api_key = settings.OPENWEATHER_API_KEY
        self.base_url = settings.OPENWEATHER_BASE_URL
        self.enabled = bool(self.api_key)
    
    def get_current_weather(self, city: str = "Roma") -> Dict[str, Any]:
        """Ottiene meteo corrente con fallback intelligente"""
        
        if self.enabled:
            weather_data = self._fetch_real_weather(city)
            if weather_data:
                return weather_data
        
        # Fallback: genera meteo realistico basato su stagione
        return self._generate_seasonal_weather()
    
    def _fetch_real_weather(self, city: str) -> Optional[Dict[str, Any]]:
        """Recupera meteo reale dalle API"""
        try:
            params = {
                'q': city,
                'appid': self.api_key,
                'units': 'metric',
                'lang': 'it'
            }
            
            response = requests.get(f"{self.base_url}/weather", params=params, timeout=5)
            response.raise_for_status()
            data = response.json()
            
            return {
                'temperature': round(data['main']['temp']),
                'feels_like': round(data['main']['feels_like']),
                'humidity': data['main']['humidity'],
                'description': data['weather'][0]['description'],
                'main': data['weather'][0]['main'].lower(),
                'icon': data['weather'][0]['icon'],
                'wind_speed': data.get('wind', {}).get('speed', 0),
                'cloudiness': data['clouds']['all'],
                'city': data['name'],
                'source': 'api',
                'mood': self._weather_to_mood(data['weather'][0]['main'])
            }
            
        except Exception as e:
            print(f"⚠️ Errore API meteo: {e}")
            return None
    
    def _generate_seasonal_weather(self) -> Dict[str, Any]:
        """Genera meteo realistico basato sulla stagione corrente"""
        month = datetime.now().month
        hour = datetime.now().hour
        
        # Parametri stagionali
        if month in [12, 1, 2]:  # Inverno
            temp_range = (5, 15)
            weather_options = [
                ('clear', 'sereno', '☀️'),
                ('clouds', 'nuvoloso', '☁️'),
                ('rain', 'piovoso', '🌧️'),
                ('snow', 'nevoso', '❄️')
            ]
            weights = [0.3, 0.4, 0.2, 0.1]
            
        elif month in [3, 4, 5]:  # Primavera
            temp_range = (12, 22)
            weather_options = [
                ('clear', 'sereno', '☀️'),
                ('clouds', 'parzialmente nuvoloso', '⛅'),
                ('rain', 'pioggia primaverile', '🌦️')
            ]
            weights = [0.5, 0.3, 0.2]
            
        elif month in [6, 7, 8]:  # Estate
            temp_range = (20, 32)
            weather_options = [
                ('clear', 'soleggiato', '☀️'),
                ('clouds', 'poche nuvole', '⛅'),
                ('thunderstorm', 'temporale estivo', '⛈️')
            ]
            weights = [0.7, 0.2, 0.1]
            
        else:  # Autunno
            temp_range = (10, 20)
            weather_options = [
                ('clear', 'sereno', '☀️'),
                ('clouds', 'nuvoloso', '☁️'),
                ('rain', 'pioggia autunnale', '🌧️'),
                ('mist', 'nebbioso', '🌫️')
            ]
            weights = [0.3, 0.4, 0.2, 0.1]
        
        # Selezione weather
        weather_main, description, icon = random.choices(weather_options, weights=weights)[0]
        
        # Temperatura basata su ora del giorno
        temp_min, temp_max = temp_range
        if 6 <= hour <= 14:  # Mattina/primo pomeriggio
            temperature = temp_min + (temp_max - temp_min) * random.uniform(0.6, 1.0)
        elif 15 <= hour <= 19:  # Pomeriggio/sera
            temperature = temp_min + (temp_max - temp_min) * random.uniform(0.7, 0.9)
        else:  # Notte/alba
            temperature = temp_min + (temp_max - temp_min) * random.uniform(0.2, 0.6)
        
        return {
            'temperature': round(temperature),
            'feels_like': round(temperature + random.uniform(-2, 2)),
            'humidity': random.randint(40, 80),
            'description': description,
            'main': weather_main,
            'icon': icon,
            'wind_speed': random.uniform(0, 15),
            'cloudiness': random.randint(0, 100),
            'city': 'Roma',
            'source': 'seasonal_fallback',
            'mood': self._weather_to_mood(weather_main)
        }
    
    def _weather_to_mood(self, weather_main: str) -> str:
        """Converte condizione meteo in mood"""
        mood_mapping = {
            'clear': 'raggiante',
            'clouds': 'tranquillo',
            'rain': 'contemplativo',
            'drizzle': 'riflessivo',
            'thunderstorm': 'drammatico',
            'snow': 'magico',
            'mist': 'misterioso',
            'fog': 'introspettivo'
        }
        
        return mood_mapping.get(weather_main, 'sereno')
    
    def get_weather_inspiration(self, weather_data: Dict[str, Any]) -> Dict[str, Any]:
        """Ottiene ispirazione basata sul meteo per la generazione saggezze"""
        
        main = weather_data['main']
        temp = weather_data['temperature']
        mood = weather_data['mood']
        
        # Temi ispirati dal meteo
        weather_themes = {
            'clear': ['luce', 'chiarezza', 'energia', 'ottimismo'],
            'clouds': ['riflessione', 'profondità', 'calma', 'contemplazione'],
            'rain': ['pulizia', 'rinnovamento', 'intimità', 'accoglienza'],
            'snow': ['purezza', 'magia', 'silenzio', 'meraviglia'],
            'thunderstorm': ['potenza', 'cambiamento', 'intensità', 'trasformazione']
        }
        
        # Metafore canine per il meteo
        dog_metaphors = {
            'clear': "come un cane che corre felice nel prato",
            'clouds': "come un cane che riposa tranquillo",
            'rain': "come un cane che si rifugia in casa",
            'snow': "come un cucciolo che scopre la neve",
            'thunderstorm': "come un cane coraggioso che protegge"
        }
        
        # Attività suggerite
        activities = {
            'clear': ['passeggiata', 'gioco all\'aperto', 'corsa nel parco'],
            'clouds': ['relax in casa', 'lettura insieme', 'coccole'],
            'rain': ['tempo in famiglia', 'giochi in casa', 'racconti'],
            'snow': ['giochi nella neve', 'calore domestico', 'meraviglia'],
            'thunderstorm': ['protezione', 'sicurezza in casa', 'vicinanza']
        }
        
        return {
            'themes': weather_themes.get(main, ['serenità', 'pace']),
            'dog_metaphor': dog_metaphors.get(main, "come un cane felice"),
            'suggested_activities': activities.get(main, ['relax', 'gioco']),
            'emotional_tone': mood,
            'temperature_feeling': 'caldo' if temp > 20 else 'fresco' if temp > 10 else 'freddo'
        }

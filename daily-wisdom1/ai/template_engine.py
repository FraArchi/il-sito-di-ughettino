
"""
🐕 La Cuccia di Ugo - Template Engine
Motore basato su template per generazione saggezze affidabili
"""

import random
import re
from datetime import datetime
from typing import Dict, List, Optional, Any
from database.wisdom_db import WisdomDatabase
from models.wisdom_models import WisdomTemplate
from config.settings import settings

class TemplateEngine:
    """Engine per generazione saggezze basato su template predefiniti"""
    
    def __init__(self):
        self.db = WisdomDatabase()
        self.ugo_personality = settings.UGO_PERSONALITY
        
    def generate_wisdom(self, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Genera una saggezza usando i template"""
        context = context or {}
        
        # Seleziona template appropriato
        template = self._select_template(context)
        if not template:
            return self._generate_fallback_wisdom(context)
        
        # Prepara contesto per rendering
        render_context = self._prepare_render_context(context)
        
        # Genera saggezza
        wisdom_text = template.render(render_context)
        
        # Post-processing
        wisdom_text = self._post_process_text(wisdom_text)
        
        # Aggiorna statistiche template
        self.db.update_template_stats(template.id, success=True)
        
        return {
            "text": wisdom_text,
            "source_engine": "template",
            "template_id": template.id,
            "category": template.category,
            "mood": self._detect_mood(wisdom_text),
            "context_data": context,
            "generation_params": {
                "template_usage_count": template.usage_count,
                "template_success_rate": template.success_rate
            },
            "quality_score": self._calculate_quality_score(wisdom_text, template),
            "sentiment_score": self._calculate_sentiment_score(wisdom_text)
        }
    
    def _select_template(self, context: Dict[str, Any]) -> Optional[WisdomTemplate]:
        """Seleziona il template più appropriato per il contesto"""
        # Estrai parametri di selezione
        category = context.get('category', 'saggezza')
        mood = context.get('mood')
        season = context.get('season')
        
        # Logica di selezione intelligente
        candidates = []
        
        # Prima prova con categoria specifica
        templates = self.db.get_templates_by_category(category)
        if templates:
            candidates.extend(templates)
        
        # Se non troviamo nulla, usa categoria generale
        if not candidates:
            templates = self.db.get_templates_by_category('saggezza')
            candidates.extend(templates)
        
        # Filtra per compatibilità mood se specificato
        if mood and candidates:
            mood_compatible = []
            for template in candidates:
                if not template.mood_compatibility or mood in template.mood_compatibility:
                    mood_compatible.append(template)
            if mood_compatible:
                candidates = mood_compatible
        
        # Applica peso stagionale se disponibile
        if season and candidates:
            weighted_candidates = []
            for template in candidates:
                weight = 1.0
                if template.seasonal_weight and season in template.seasonal_weight:
                    weight = template.seasonal_weight[season]
                
                # Aggiungi template multiple volte in base al peso
                count = max(1, int(weight * 10))
                weighted_candidates.extend([template] * count)
            
            candidates = weighted_candidates
        
        # Selezione finale con bias verso qualità e varietà
        if not candidates:
            return None
        
        # Favorisce template con alta success rate ma non usati di recente
        scored_candidates = []
        for template in candidates:
            score = template.success_rate
            
            # Bonus per template poco usati (varietà)
            if template.usage_count == 0:
                score += 0.2
            elif template.usage_count < 5:
                score += 0.1
            
            # Penalità per template usati molto di recente
            if template.last_used:
                days_since_use = (datetime.utcnow() - template.last_used).days
                if days_since_use < 7:
                    score -= 0.1
            
            scored_candidates.append((template, score))
        
        # Selezione weighted random
        templates = [t[0] for t in scored_candidates]
        weights = [max(0.1, t[1]) for t in scored_candidates]
        
        return random.choices(templates, weights=weights)[0]
    
    def _prepare_render_context(self, context: Dict[str, Any]) -> Dict[str, str]:
        """Prepara il contesto per il rendering del template"""
        render_context = {}
        
        # Meteo
        weather = context.get('weather', {})
        if isinstance(weather, dict):
            render_context['weather'] = weather.get('description', 'bello')
            render_context['temperature'] = str(weather.get('temp', '20'))
        else:
            render_context['weather'] = str(weather) if weather else 'sereno'
        
        # Stagione
        season = context.get('season')
        if not season:
            month = datetime.now().month
            if month in [12, 1, 2]:
                season = 'inverno'
            elif month in [3, 4, 5]:
                season = 'primavera'
            elif month in [6, 7, 8]:
                season = 'estate'
            else:
                season = 'autunno'
        render_context['season'] = season
        
        # Momento della giornata
        hour = datetime.now().hour
        if hour < 6:
            time_of_day = 'notte'
        elif hour < 12:
            time_of_day = 'mattina'
        elif hour < 18:
            time_of_day = 'pomeriggio'
        else:
            time_of_day = 'sera'
        render_context['time_of_day'] = time_of_day
        
        # Emozioni e mood
        emotions = [
            'gioia', 'serenità', 'entusiasmo', 'gratitudine', 'amore',
            'curiosità', 'speranza', 'fiducia', 'meraviglia', 'pace'
        ]
        render_context['emotion'] = context.get('emotion', random.choice(emotions))
        render_context['mood'] = context.get('mood', 'positivo')
        
        # Aggiungi contesto extra dal context originale
        for key, value in context.items():
            if isinstance(value, (str, int, float)):
                render_context[key] = str(value)
        
        return render_context
    
    def _post_process_text(self, text: str) -> str:
        """Post-processing del testo generato"""
        # Pulisci spazi extra
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Assicurati che inizi con maiuscola
        if text and text[0].islower():
            text = text[0].upper() + text[1:]
        
        # Limita lunghezza
        max_length = self.ugo_personality['speaking_style']['max_length']
        if len(text) > max_length:
            # Taglia alla parola più vicina
            text = text[:max_length]
            last_space = text.rfind(' ')
            if last_space > max_length * 0.8:  # Solo se non taglia troppo
                text = text[:last_space]
            text += '...'
        
        # Assicurati che finisca con punteggiatura
        if text and text[-1] not in '.!?…':
            text += '.'
        
        return text
    
    def _detect_mood(self, text: str) -> str:
        """Rileva il mood dal testo generato"""
        mood_keywords = {
            'felice': ['gioia', 'felice', 'allegr', 'sorriso', 'risata'],
            'sereno': ['sereno', 'pace', 'calma', 'tranquill'],
            'motivato': ['forza', 'coragg', 'determina', 'obiettiv'],
            'riflessivo': ['pensa', 'riflette', 'saggezza', 'comprende'],
            'amoroso': ['amore', 'affetto', 'cuore', 'abbraccia'],
            'energico': ['energia', 'entusiasm', 'vivace', 'dinamico']
        }
        
        text_lower = text.lower()
        mood_scores = {}
        
        for mood, keywords in mood_keywords.items():
            score = sum(1 for keyword in keywords if keyword in text_lower)
            if score > 0:
                mood_scores[mood] = score
        
        if mood_scores:
            return max(mood_scores, key=mood_scores.get)
        
        return 'positivo'  # Default
    
    def _calculate_quality_score(self, text: str, template: WisdomTemplate) -> float:
        """Calcola un punteggio di qualità per la saggezza generata"""
        score = 0.0
        
        # Lunghezza appropriata (non troppo corta, non troppo lunga)
        length = len(text)
        if 50 <= length <= 200:
            score += 0.3
        elif 30 <= length <= 280:
            score += 0.2
        
        # Presenza di emoji appropriati
        emoji_count = len(re.findall(r'[🐕🐾❤️💕🌟✨🌈☀️🌙💖🎾🏠🌸🍂❄️🌱]', text))
        if 1 <= emoji_count <= 3:
            score += 0.2
        
        # Presenza di metafore canine
        dog_metaphors = ['cane', 'coda', 'zampe', 'zampette', 'orecchie', 'tartufo', 'pelo']
        metaphor_count = sum(1 for metaphor in dog_metaphors if metaphor in text.lower())
        if metaphor_count > 0:
            score += 0.2
        
        # Sentiment positivo
        positive_words = ['felice', 'gioia', 'amore', 'speranza', 'fiducia', 'bello', 'meraviglioso']
        positive_count = sum(1 for word in positive_words if word in text.lower())
        score += min(0.2, positive_count * 0.05)
        
        # Bonus per template con buona storia
        if template.success_rate > 0.8:
            score += 0.1
        
        return min(1.0, score)
    
    def _calculate_sentiment_score(self, text: str) -> float:
        """Calcola sentiment score del testo"""
        positive_words = [
            'felice', 'gioia', 'amore', 'bello', 'meraviglioso', 'fantastico',
            'speranza', 'fiducia', 'sereno', 'pace', 'gratitudine', 'dolce'
        ]
        
        negative_words = [
            'triste', 'dolore', 'paura', 'preoccupa', 'difficile', 'problema'
        ]
        
        text_lower = text.lower()
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        if positive_count + negative_count == 0:
            return 0.5  # Neutrale
        
        return positive_count / (positive_count + negative_count)
    
    def _generate_fallback_wisdom(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Genera saggezza di fallback quando non ci sono template"""
        fallback_wisdoms = [
            "Ugo sa che ogni giorno è un dono da scartare con entusiasmo 🐕✨",
            "Come un cane che scodinzola, la felicità è contagiosa 🐾💕",
            "La saggezza di Ugo? Amare senza condizioni e vivere nel presente 🌟",
            "Ogni momento è buono per una carezza o una coccola 🏠❤️",
            "Ugo ricorda: la vita è più bella quando è condivisa 🌈"
        ]
        
        wisdom_text = random.choice(fallback_wisdoms)
        
        return {
            "text": wisdom_text,
            "source_engine": "template_fallback",
            "category": "generale",
            "mood": "positivo",
            "context_data": context,
            "quality_score": 0.8,
            "sentiment_score": 0.9
        }
    
    def get_engine_stats(self) -> Dict[str, Any]:
        """Ottiene statistiche del motore template"""
        return {
            "engine_type": "template",
            "templates_available": len(self.db.get_templates_by_category("saggezza")),
            "avg_quality": 0.85,
            "reliability": 0.99
        }

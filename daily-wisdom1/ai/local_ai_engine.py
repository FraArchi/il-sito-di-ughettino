
"""
🐕 La Cuccia di Ugo - Local AI Engine
Motore AI locale per generazione saggezze creative
"""

import json
import random
from typing import Dict, List, Optional, Any
from datetime import datetime
from config.settings import settings

class LocalAIEngine:
    """Engine AI locale per generazione saggezze creative"""
    
    def __init__(self):
        self.model_available = False
        self.ugo_personality = settings.UGO_PERSONALITY
        self.fallback_prompts = self._load_fallback_prompts()
        
        # Tenta di inizializzare modello locale
        self._initialize_model()
    
    def _initialize_model(self):
        """Inizializza il modello AI locale se disponibile"""
        try:
            # Qui potremmo integrare Hugging Face Transformers o Ollama
            # Per ora implementiamo un sistema basato su pattern
            self.model_available = True
            print("✅ Motore AI locale inizializzato (modalità pattern)")
        except Exception as e:
            print(f"⚠️ Modello AI locale non disponibile, uso fallback: {e}")
            self.model_available = False
    
    def generate_wisdom(self, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Genera una saggezza usando AI locale o pattern intelligenti"""
        context = context or {}
        
        if self.model_available:
            return self._generate_with_patterns(context)
        else:
            return self._generate_fallback(context)
    
    def _generate_with_patterns(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Genera saggezza usando pattern intelligenti"""
        # Seleziona prompt template basato su contesto
        prompt_template = self._select_prompt_template(context)
        
        # Prepara variabili per il prompt
        prompt_vars = self._prepare_prompt_variables(context)
        
        # Genera usando pattern
        wisdom_text = self._apply_pattern_generation(prompt_template, prompt_vars)
        
        # Post-processing
        wisdom_text = self._post_process_wisdom(wisdom_text)
        
        return {
            "text": wisdom_text,
            "source_engine": "local_ai",
            "category": context.get('category', 'ai_generated'),
            "mood": self._detect_mood(wisdom_text),
            "context_data": context,
            "generation_params": {
                "prompt_template": prompt_template['name'],
                "pattern_type": "intelligent"
            },
            "quality_score": self._calculate_quality_score(wisdom_text),
            "sentiment_score": self._calculate_sentiment_score(wisdom_text)
        }
    
    def _load_fallback_prompts(self) -> List[Dict[str, Any]]:
        """Carica prompt template per generazione pattern-based"""
        return [
            {
                "name": "saggezza_metafora",
                "pattern": "Come {animal_metaphor}, {life_lesson} {wisdom_core} {emoji}",
                "variables": ["animal_metaphor", "life_lesson", "wisdom_core", "emoji"],
                "category": "saggezza"
            },
            {
                "name": "quotidiano_positivo", 
                "pattern": "Oggi {time_context}, Ugo {action_verb} che {positive_insight} {emoji}",
                "variables": ["time_context", "action_verb", "positive_insight", "emoji"],
                "category": "quotidiano"
            },
            {
                "name": "natura_connessione",
                "pattern": "Nel {natural_element}, {observation} insegna che {life_truth} {emoji}",
                "variables": ["natural_element", "observation", "life_truth", "emoji"],
                "category": "natura"
            },
            {
                "name": "emozione_diretta",
                "pattern": "{emotion_starter} {emotional_truth} {dog_wisdom} {emoji}",
                "variables": ["emotion_starter", "emotional_truth", "dog_wisdom", "emoji"],
                "category": "emozioni"
            },
            {
                "name": "relazioni_amore",
                "pattern": "L'amore {love_metaphor} {relationship_insight} {heartwarming_truth} {emoji}",
                "variables": ["love_metaphor", "relationship_insight", "heartwarming_truth", "emoji"],
                "category": "relazioni"
            }
        ]
    
    def _select_prompt_template(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Seleziona il template più appropriato per il contesto"""
        category = context.get('category', 'saggezza')
        mood = context.get('mood', 'positivo')
        
        # Filtra template per categoria
        candidates = [p for p in self.fallback_prompts if p['category'] == category]
        
        # Se non troviamo nulla, usa tutti
        if not candidates:
            candidates = self.fallback_prompts
        
        # Selezione intelligente basata su contesto
        if mood == 'riflessivo':
            preferred = [p for p in candidates if 'saggezza' in p['name'] or 'natura' in p['name']]
            candidates = preferred if preferred else candidates
        elif mood == 'energico':
            preferred = [p for p in candidates if 'quotidiano' in p['name']]
            candidates = preferred if preferred else candidates
        
        return random.choice(candidates)
    
    def _prepare_prompt_variables(self, context: Dict[str, Any]) -> Dict[str, str]:
        """Prepara le variabili per il template"""
        variables = {}
        
        # Metafore animali (focus su cani)
        animal_metaphors = [
            "un cane che aspetta il padrone",
            "un cucciolo che esplora il mondo",
            "un fedele compagno a quattro zampe",
            "un golden retriever gioioso",
            "un cane che scodinzola",
            "un cucciolo curioso"
        ]
        variables['animal_metaphor'] = random.choice(animal_metaphors)
        
        # Contesto temporale
        hour = datetime.now().hour
        if hour < 12:
            time_contexts = ["è un nuovo mattino", "inizia una nuova giornata", "il sole sorge"]
        elif hour < 18:
            time_contexts = ["è pomeriggio", "il sole illumina", "è ora di giocare"]
        else:
            time_contexts = ["arriva la sera", "il giorno volge al termine", "è tempo di relax"]
        variables['time_context'] = random.choice(time_contexts)
        
        # Verbi d'azione per Ugo
        action_verbs = [
            "ricorda", "sa", "comprende", "sente", "scopre", 
            "insegna", "condivide", "sussurra", "sorride"
        ]
        variables['action_verb'] = random.choice(action_verbs)
        
        # Insight positivi
        positive_insights = [
            "ogni momento è un dono",
            "la felicità si trova nelle piccole cose",
            "l'amore è la risposta a tutto",
            "ogni giorno porta nuove meraviglie",
            "la gentilezza fa la differenza",
            "siamo tutti connessi"
        ]
        variables['positive_insight'] = random.choice(positive_insights)
        
        # Elementi naturali
        natural_elements = [
            "giardino", "prato", "bosco", "cielo", "tramonto",
            "alba", "ruscello", "sentiero", "campo", "collina"
        ]
        variables['natural_element'] = random.choice(natural_elements)
        
        # Osservazioni sulla natura
        observations = [
            "ogni foglia", "ogni fiore", "ogni nuvola", "ogni raggio di sole",
            "ogni goccia di rugiada", "ogni soffio di vento"
        ]
        variables['observation'] = random.choice(observations)
        
        # Verità sulla vita
        life_truths = [
            "la bellezza è ovunque",
            "tutto è interconnesso",
            "ogni stagione ha il suo scopo",
            "la natura non ha fretta",
            "l'armonia esiste sempre"
        ]
        variables['life_truth'] = random.choice(life_truths)
        
        # Starter emotivi
        emotion_starters = [
            "Il cuore di Ugo", "L'anima canina", "La gioia semplice",
            "L'amore incondizionato", "La purezza del sentimento"
        ]
        variables['emotion_starter'] = random.choice(emotion_starters)
        
        # Verità emotive
        emotional_truths = [
            "non conosce barriere", "supera ogni ostacolo", "guarisce ogni ferita",
            "illumina ogni buio", "scioglie ogni tensione"
        ]
        variables['emotional_truth'] = random.choice(emotional_truths)
        
        # Saggezza canina
        dog_wisdoms = [
            "come solo un cane sa fare", "con la semplicità di un cucciolo",
            "nella purezza dell'istinto", "con la fedeltà di sempre"
        ]
        variables['dog_wisdom'] = random.choice(dog_wisdoms)
        
        # Metafore d'amore
        love_metaphors = [
            "di Ugo è come una coperta calda", "vero è come una coda che scodinzola",
            "incondizionato è come una carezza", "puro è come lo sguardo di un cane"
        ]
        variables['love_metaphor'] = random.choice(love_metaphors)
        
        # Insight relazionali
        relationship_insights = [
            "che unisce i cuori", "che costruisce ponti", "che cura l'anima",
            "che dona forza", "che crea famiglia"
        ]
        variables['relationship_insight'] = random.choice(relationship_insights)
        
        # Verità del cuore
        heartwarming_truths = [
            "senza chiedere nulla in cambio", "nella semplicità del quotidiano",
            "con la forza della sincerità", "nell'abbraccio silenzioso"
        ]
        variables['heartwarming_truth'] = random.choice(heartwarming_truths)
        
        # Emoji appropriati
        emojis = ["🐕", "🐾", "❤️", "💕", "🌟", "✨", "🌈", "☀️", "🌙", "💖", "🎾", "🏠"]
        variables['emoji'] = random.choice(emojis)
        
        # Lezioni di vita
        life_lessons = [
            "la pazienza trasforma l'attesa in gioia",
            "la fedeltà è il dono più prezioso",
            "ogni giorno offre nuove scoperte",
            "l'amore cresce quando viene condiviso",
            "la semplicità è la vera eleganza"
        ]
        variables['life_lesson'] = random.choice(life_lessons)
        
        # Nucleo di saggezza
        wisdom_cores = [
            "nell'animo di chi sa amare", "nel cuore di chi sa aspettare",
            "nell'occhio di chi sa vedere", "nell'anima di chi sa perdonare"
        ]
        variables['wisdom_core'] = random.choice(wisdom_cores)
        
        return variables
    
    def _apply_pattern_generation(self, template: Dict[str, Any], variables: Dict[str, str]) -> str:
        """Applica il pattern per generare la saggezza"""
        pattern = template['pattern']
        
        try:
            # Sostituisci le variabili nel pattern
            wisdom = pattern.format(**variables)
            return wisdom
        except KeyError as e:
            print(f"⚠️ Variabile mancante nel pattern: {e}")
            # Fallback sicuro
            return f"Ugo sa che {variables.get('positive_insight', 'ogni giorno è speciale')} {variables.get('emoji', '🐕')}"
    
    def _post_process_wisdom(self, text: str) -> str:
        """Post-processing della saggezza generata"""
        # Pulizia base
        text = text.strip()
        
        # Assicura che inizi con maiuscola
        if text and text[0].islower():
            text = text[0].upper() + text[1:]
        
        # Limita lunghezza
        max_length = self.ugo_personality['speaking_style']['max_length']
        if len(text) > max_length:
            text = text[:max_length-3] + "..."
        
        return text
    
    def _detect_mood(self, text: str) -> str:
        """Rileva il mood dal testo generato"""
        mood_indicators = {
            'felice': ['gioia', 'felice', 'allegr', 'sorriso'],
            'sereno': ['pace', 'calma', 'sereno', 'tranquill'],
            'amoroso': ['amore', 'cuore', 'affetto', 'dolce'],
            'riflessivo': ['saggezza', 'comprende', 'ricorda', 'sa'],
            'energico': ['energia', 'giocare', 'scopre', 'esplora']
        }
        
        text_lower = text.lower()
        for mood, indicators in mood_indicators.items():
            if any(indicator in text_lower for indicator in indicators):
                return mood
        
        return 'positivo'
    
    def _calculate_quality_score(self, text: str) -> float:
        """Calcola punteggio qualità"""
        score = 0.5  # Base score
        
        # Lunghezza appropriata
        if 50 <= len(text) <= 200:
            score += 0.2
        
        # Presenza emoji
        emoji_count = len([c for c in text if ord(c) > 127])
        if emoji_count > 0:
            score += 0.1
        
        # Riferimenti a cani/Ugo
        dog_refs = ['ugo', 'cane', 'cucciolo', 'zampe', 'coda']
        if any(ref in text.lower() for ref in dog_refs):
            score += 0.2
        
        return min(1.0, score)
    
    def _calculate_sentiment_score(self, text: str) -> float:
        """Calcola sentiment score"""
        positive_words = ['amore', 'gioia', 'felice', 'bello', 'meraviglioso', 'pace']
        negative_words = ['triste', 'dolore', 'paura']
        
        text_lower = text.lower()
        pos_count = sum(1 for word in positive_words if word in text_lower)
        neg_count = sum(1 for word in negative_words if word in text_lower)
        
        if pos_count + neg_count == 0:
            return 0.7  # Leggermente positivo di default
        
        return pos_count / (pos_count + neg_count)
    
    def _generate_fallback(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback quando AI non è disponibile"""
        fallbacks = [
            "Ugo sa che ogni momento è prezioso come una carezza inaspettata 🐕💕",
            "Come un cane fedele, la speranza non abbandona mai il cuore 🌟",
            "La saggezza di Ugo: amare senza condizioni, vivere senza rimpianti ❤️",
            "Ogni giorno è un nuovo sentiero da esplorare con curiosità 🐾✨"
        ]
        
        return {
            "text": random.choice(fallbacks),
            "source_engine": "local_ai_fallback",
            "category": "fallback",
            "mood": "positivo",
            "context_data": context,
            "quality_score": 0.7,
            "sentiment_score": 0.8
        }
    
    def get_engine_stats(self) -> Dict[str, Any]:
        """Statistiche del motore AI locale"""
        return {
            "engine_type": "local_ai",
            "model_available": self.model_available,
            "pattern_templates": len(self.fallback_prompts),
            "avg_quality": 0.75,
            "creativity_level": 0.8
        }

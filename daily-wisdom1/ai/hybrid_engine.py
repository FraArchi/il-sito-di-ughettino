
"""
🐕 La Cuccia di Ugo - Hybrid Wisdom Engine
Motore principale che combina template e AI per risultati ottimali
"""

import random
from typing import Dict, List, Optional, Any
from datetime import datetime

from ai.template_engine import TemplateEngine
from ai.local_ai_engine import LocalAIEngine
from database.wisdom_db import WisdomDatabase
from config.settings import settings

class HybridWisdomEngine:
    """Engine principale che orchestrare template e AI per generazione saggezze"""
    
    def __init__(self):
        self.template_engine = TemplateEngine()
        self.ai_engine = LocalAIEngine()
        self.db = WisdomDatabase()
        
        # Configurazione strategia
        self.strategy_weights = {
            'template': 0.7,    # Affidabilità alta
            'ai': 0.3,          # Creatività alta
            'hybrid': 0.0       # Combinazione (in sviluppo)
        }
        
        # Soglie qualità
        self.min_quality_threshold = settings.AI_CONFIG['quality_threshold']
        self.max_retry_attempts = 3
    
    def generate_wisdom(self, context: Dict[str, Any] = None, strategy: str = 'auto') -> Dict[str, Any]:
        """
        Genera saggezza usando strategia ottimale
        
        Args:
            context: Contesto per generazione
            strategy: 'auto', 'template', 'ai', 'hybrid'
        """
        context = context or {}
        
        # Log inizio generazione
        log_data = {
            'engine_type': 'hybrid',
            'started_at': datetime.utcnow(),
            'input_context': context
        }
        
        try:
            # Seleziona strategia
            if strategy == 'auto':
                strategy = self._select_optimal_strategy(context)
            
            # Genera usando strategia selezionata
            wisdom = self._generate_with_strategy(strategy, context)
            
            # Verifica qualità
            if wisdom['quality_score'] < self.min_quality_threshold:
                print(f"⚠️ Qualità bassa ({wisdom['quality_score']:.2f}), rigenerando...")
                wisdom = self._regenerate_with_fallback(context, tried_strategy=strategy)
            
            # Finalizza log
            log_data.update({
                'completed_at': datetime.utcnow(),
                'strategy_used': strategy,
                'passed_quality': wisdom['quality_score'] >= self.min_quality_threshold,
                'quality_score': wisdom['quality_score'],
                'generation_time': (datetime.utcnow() - log_data['started_at']).total_seconds()
            })
            
            # Salva log
            self.db.log_generation(log_data)
            
            return wisdom
            
        except Exception as e:
            print(f"❌ Errore durante generazione: {e}")
            log_data.update({
                'completed_at': datetime.utcnow(),
                'error': str(e),
                'passed_quality': False
            })
            self.db.log_generation(log_data)
            
            return self._emergency_fallback(context)
    
    def _select_optimal_strategy(self, context: Dict[str, Any]) -> str:
        """Seleziona la strategia ottimale basata su contesto e performance"""
        
        # Fattori di decisione
        factors = {
            'template': 0.0,
            'ai': 0.0
        }
        
        # Fattore 1: Disponibilità contesto
        if context.get('weather') or context.get('season'):
            factors['template'] += 0.3  # Template gestiscono bene il contesto
        
        if context.get('mood') == 'creativo':
            factors['ai'] += 0.4  # AI più creativa
        
        # Fattore 2: Performance storica
        stats = self.db.get_generation_stats(days=7)
        if stats['total'] > 0:
            by_engine = stats.get('by_engine', {})
            
            if 'template' in by_engine:
                template_success = by_engine['template']['success'] / by_engine['template']['count']
                factors['template'] += template_success * 0.3
            
            if 'local_ai' in by_engine:
                ai_success = by_engine['local_ai']['success'] / by_engine['local_ai']['count']
                factors['ai'] += ai_success * 0.3
        
        # Fattore 3: Ora del giorno (template più affidabile di notte)
        hour = datetime.now().hour
        if hour < 6 or hour > 22:
            factors['template'] += 0.2
        
        # Fattore 4: Varietà (evita troppa ripetizione)
        recent_wisdom = self.db.get_recent_wisdom(limit=5)
        template_count = sum(1 for w in recent_wisdom if w.source_engine == 'template')
        ai_count = sum(1 for w in recent_wisdom if w.source_engine.startswith('local_ai'))
        
        if template_count > ai_count + 2:
            factors['ai'] += 0.3  # Favorisce AI per varietà
        elif ai_count > template_count + 1:
            factors['template'] += 0.3  # Favorisce template per affidabilità
        
        # Decisione finale
        if factors['template'] > factors['ai']:
            return 'template'
        elif factors['ai'] > factors['template']:
            return 'ai'
        else:
            # Parità: usa weights di default
            return random.choices(
                ['template', 'ai'], 
                weights=[self.strategy_weights['template'], self.strategy_weights['ai']]
            )[0]
    
    def _generate_with_strategy(self, strategy: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Genera saggezza usando la strategia specificata"""
        
        if strategy == 'template':
            wisdom = self.template_engine.generate_wisdom(context)
            
        elif strategy == 'ai':
            wisdom = self.ai_engine.generate_wisdom(context)
            
        elif strategy == 'hybrid':
            # Strategia ibrida: combina template e AI
            wisdom = self._generate_hybrid(context)
            
        else:
            raise ValueError(f"Strategia non riconosciuta: {strategy}")
        
        # Aggiungi metadati hybrid engine
        wisdom['hybrid_metadata'] = {
            'strategy_used': strategy,
            'engine_version': '1.0',
            'selection_factors': self._get_selection_factors(context)
        }
        
        return wisdom
    
    def _generate_hybrid(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Genera saggezza combinando template e AI (strategia avanzata)"""
        
        # Fase 1: Genera base con template (affidabilità)
        template_wisdom = self.template_engine.generate_wisdom(context)
        
        # Fase 2: Aggiungi creatività AI se disponibile
        if self.ai_engine.model_available:
            # Usa la base template come ispirazione per AI
            ai_context = context.copy()
            ai_context['inspiration'] = template_wisdom['text']
            ai_context['enhance_creativity'] = True
            
            ai_wisdom = self.ai_engine.generate_wisdom(ai_context)
            
            # Seleziona il migliore o combina
            if ai_wisdom['quality_score'] > template_wisdom['quality_score'] + 0.1:
                result = ai_wisdom
                result['source_engine'] = 'hybrid_ai_enhanced'
            else:
                result = template_wisdom
                result['source_engine'] = 'hybrid_template_base'
        else:
            # Fallback: solo template ma con metadata hybrid
            result = template_wisdom
            result['source_engine'] = 'hybrid_template_only'
        
        return result
    
    def _regenerate_with_fallback(self, context: Dict[str, Any], tried_strategy: str) -> Dict[str, Any]:
        """Rigenera con strategia di fallback se qualità insufficiente"""
        
        fallback_strategies = ['template', 'ai']
        if tried_strategy in fallback_strategies:
            fallback_strategies.remove(tried_strategy)
        
        for strategy in fallback_strategies:
            try:
                wisdom = self._generate_with_strategy(strategy, context)
                if wisdom['quality_score'] >= self.min_quality_threshold:
                    wisdom['regenerated'] = True
                    wisdom['original_strategy'] = tried_strategy
                    return wisdom
            except Exception as e:
                print(f"⚠️ Fallback strategy {strategy} failed: {e}")
                continue
        
        # Ultimo fallback: emergency
        return self._emergency_fallback(context)
    
    def _emergency_fallback(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback di emergenza quando tutto else fallisce"""
        emergency_wisdoms = [
            "Ugo sa che anche nei momenti difficili, l'amore trova sempre una strada 🐕❤️",
            "Come un cane fedele, la speranza non ci abbandona mai 🌟",
            "Ogni giorno è un dono, come ogni carezza di Ugo 🐾💕",
            "La saggezza più grande? Amare senza condizioni, come fa Ugo 💖",
            "Anche nelle difficoltà, Ugo trova sempre un motivo per scodinzolare 🌈"
        ]
        
        return {
            "text": random.choice(emergency_wisdoms),
            "source_engine": "emergency_fallback",
            "category": "emergency",
            "mood": "speranzoso",
            "context_data": context,
            "quality_score": 0.8,  # Score decente per emergency
            "sentiment_score": 0.9,
            "emergency_fallback": True
        }
    
    def _get_selection_factors(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Ottiene fattori che hanno influenzato la selezione della strategia"""
        return {
            'has_weather_context': bool(context.get('weather')),
            'has_mood_context': bool(context.get('mood')),
            'time_of_day': datetime.now().hour,
            'recent_engines_used': [w.source_engine for w in self.db.get_recent_wisdom(limit=3)]
        }
    
    def generate_daily_wisdom(self) -> Dict[str, Any]:
        """Genera la saggezza quotidiana con contesto automatico"""
        
        # Costruisci contesto ricco per saggezza quotidiana
        context = self._build_daily_context()
        
        # Genera con strategia ottimale
        wisdom = self.generate_wisdom(context, strategy='auto')
        
        # Aggiungi metadati quotidiani
        wisdom['is_daily_wisdom'] = True
        wisdom['generation_date'] = datetime.now().date().isoformat()
        
        return wisdom
    
    def _build_daily_context(self) -> Dict[str, Any]:
        """Costruisce contesto ricco per la generazione quotidiana"""
        from context.context_builder import ContextBuilder
        
        context_builder = ContextBuilder()
        return context_builder.build_daily_context()
    
    def get_engine_stats(self) -> Dict[str, Any]:
        """Statistiche complete del motore ibrido"""
        template_stats = self.template_engine.get_engine_stats()
        ai_stats = self.ai_engine.get_engine_stats()
        generation_stats = self.db.get_generation_stats(days=30)
        
        return {
            "engine_type": "hybrid",
            "sub_engines": {
                "template": template_stats,
                "ai": ai_stats
            },
            "strategy_weights": self.strategy_weights,
            "quality_threshold": self.min_quality_threshold,
            "recent_performance": generation_stats,
            "total_wisdom_generated": generation_stats.get('total', 0),
            "avg_quality": generation_stats.get('avg_quality', 0),
            "success_rate": generation_stats.get('success_rate', 0)
        }
    
    def optimize_strategy_weights(self):
        """Ottimizza i pesi delle strategie basandosi su performance storica"""
        stats = self.db.get_generation_stats(days=14)
        
        if stats['total'] < 10:  # Non abbastanza dati
            return
        
        by_engine = stats.get('by_engine', {})
        
        # Calcola performance per engine
        performances = {}
        for engine, data in by_engine.items():
            if data['count'] > 0:
                success_rate = data['success'] / data['count']
                avg_time = sum(data['time']) / len(data['time']) if data['time'] else 5.0
                
                # Score combinato: successo pesato per velocità
                performance_score = success_rate * (1.0 / max(avg_time, 1.0))
                performances[engine] = performance_score
        
        # Aggiorna pesi proporzionalmente
        total_performance = sum(performances.values())
        if total_performance > 0:
            for engine in performances:
                if engine == 'template':
                    self.strategy_weights['template'] = performances[engine] / total_performance
                elif engine.startswith('local_ai'):
                    self.strategy_weights['ai'] = performances[engine] / total_performance
        
        print(f"📊 Pesi strategia aggiornati: {self.strategy_weights}")

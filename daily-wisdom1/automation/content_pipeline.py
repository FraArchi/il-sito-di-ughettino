
"""
🐕 La Cuccia di Ugo - Content Pipeline
Pipeline automatizzata per generazione e distribuzione contenuti
"""

import asyncio
from datetime import datetime
from typing import Dict, List, Any, Optional
from pathlib import Path

from database.wisdom_db import WisdomDatabase
from ai.hybrid_engine import HybridWisdomEngine
from visual.quote_generator import QuoteGenerator
from context.context_builder import ContextBuilder
from config.settings import settings

class ContentPipeline:
    """Pipeline automatizzata per generazione contenuti completi"""
    
    def __init__(self):
        self.db = WisdomDatabase()
        self.wisdom_engine = HybridWisdomEngine()
        self.quote_generator = QuoteGenerator()
        self.context_builder = ContextBuilder()
    
    async def generate_complete_content(self, custom_context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Genera contenuto completo: testo + immagine + metadati"""
        
        pipeline_start = datetime.now()
        print("🔄 Avvio pipeline generazione contenuto completo...")
        
        try:
            # Fase 1: Costruzione contesto
            print("📋 Fase 1: Costruzione contesto...")
            context = custom_context or self.context_builder.build_daily_context()
            
            # Fase 2: Generazione saggezza
            print("🧠 Fase 2: Generazione saggezza...")
            wisdom = self.wisdom_engine.generate_wisdom(context)
            
            # Fase 3: Generazione immagine
            print("🖼️ Fase 3: Generazione immagine...")
            image_path = self.quote_generator.create_quote_card(
                wisdom['text'], 
                context
            )
            
            # Fase 4: Generazione varianti social
            print("📱 Fase 4: Varianti social...")
            social_variants = self.quote_generator.create_social_variants(image_path)
            
            # Fase 5: Salvataggio database
            print("💾 Fase 5: Salvataggio...")
            wisdom_id = self.db.save_wisdom(wisdom)
            
            # Calcola tempo totale
            total_time = (datetime.now() - pipeline_start).total_seconds()
            
            result = {
                "wisdom_id": wisdom_id,
                "text": wisdom['text'],
                "image_path": str(image_path),
                "social_variants": social_variants,
                "context": context,
                "metadata": {
                    "generation_time": total_time,
                    "quality_score": wisdom['quality_score'],
                    "sentiment_score": wisdom['sentiment_score'],
                    "source_engine": wisdom['source_engine'],
                    "pipeline_timestamp": pipeline_start.isoformat()
                }
            }
            
            print(f"✅ Pipeline completata in {total_time:.2f}s")
            return result
            
        except Exception as e:
            print(f"❌ Errore nella pipeline: {e}")
            raise
    
    def generate_batch_content(self, count: int = 5, themes: List[str] = None) -> List[Dict[str, Any]]:
        """Genera batch di contenuti per accumulo"""
        
        print(f"🔄 Generazione batch di {count} contenuti...")
        results = []
        themes = themes or ['generale', 'natura', 'famiglia', 'gioco', 'saggezza']
        
        for i in range(count):
            try:
                # Varia il tema per ogni contenuto
                theme = themes[i % len(themes)]
                context = self.context_builder.build_daily_context()
                context['category'] = theme
                context['batch_index'] = i
                
                # Genera contenuto
                content = asyncio.run(self.generate_complete_content(context))
                results.append(content)
                
                print(f"✅ Contenuto {i+1}/{count} completato")
                
            except Exception as e:
                print(f"❌ Errore contenuto {i+1}: {e}")
                continue
        
        print(f"🎉 Batch completato: {len(results)}/{count} contenuti generati")
        return results
    
    def validate_content_quality(self, wisdom_data: Dict[str, Any]) -> Dict[str, Any]:
        """Valida la qualità del contenuto generato"""
        
        validation = {
            "passed": True,
            "score": 0.0,
            "issues": [],
            "recommendations": []
        }
        
        text = wisdom_data.get('text', '')
        
        # Check 1: Lunghezza appropriata
        if len(text) < 30:
            validation["issues"].append("Testo troppo corto")
            validation["passed"] = False
        elif len(text) > 300:
            validation["issues"].append("Testo troppo lungo")
            validation["score"] -= 0.2
        else:
            validation["score"] += 0.3
        
        # Check 2: Presenza Ugo
        if 'ugo' not in text.lower():
            validation["recommendations"].append("Considera di menzionare Ugo")
            validation["score"] -= 0.1
        else:
            validation["score"] += 0.2
        
        # Check 3: Sentiment positivo
        sentiment = wisdom_data.get('sentiment_score', 0)
        if sentiment < 0.5:
            validation["issues"].append("Sentiment non sufficientemente positivo")
            validation["score"] -= 0.3
        else:
            validation["score"] += 0.3
        
        # Check 4: Presenza emoji
        emoji_count = len([c for c in text if ord(c) > 127])
        if emoji_count == 0:
            validation["recommendations"].append("Aggiungi emoji per maggiore appeal")
            validation["score"] -= 0.1
        elif emoji_count > 5:
            validation["recommendations"].append("Troppi emoji, riduci")
            validation["score"] -= 0.1
        else:
            validation["score"] += 0.2
        
        # Normalizza score
        validation["score"] = max(0.0, min(1.0, validation["score"]))
        
        # Determina se passa la validazione
        if validation["score"] < 0.6:
            validation["passed"] = False
        
        return validation
    
    def optimize_content_for_platform(self, content: Dict[str, Any], platform: str) -> Dict[str, Any]:
        """Ottimizza contenuto per piattaforma specifica"""
        
        optimized = content.copy()
        text = content['text']
        
        if platform == 'instagram':
            # Instagram: più hashtag e emoji
            if not any(tag in text for tag in ['#', '@']):
                optimized['text'] += "\n\n#UgoCane #Saggezza #DailyWisdom #LaCuccaDiUgo"
            
        elif platform == 'twitter':
            # Twitter: limita caratteri
            if len(text) > 240:
                optimized['text'] = text[:237] + "..."
            
        elif platform == 'facebook':
            # Facebook: aggiungi call-to-action
            optimized['text'] += "\n\n💭 Cosa ne pensi? Condividi la tua saggezza nei commenti!"
            
        elif platform == 'linkedin':
            # LinkedIn: tono più professionale
            if 'gioco' in text.lower() or 'giocare' in text.lower():
                optimized['text'] = text.replace('giocare', 'impegnarsi positivamente')
        
        return optimized
    
    def get_pipeline_stats(self) -> Dict[str, Any]:
        """Ottiene statistiche della pipeline"""
        
        generation_stats = self.db.get_generation_stats(days=30)
        
        return {
            "total_content_generated": generation_stats.get('total', 0),
            "avg_generation_time": generation_stats.get('avg_time', 0),
            "success_rate": generation_stats.get('success_rate', 0),
            "quality_distribution": {
                "high_quality": len([w for w in self.db.get_recent_wisdom(50) if w.quality_score > 0.8]),
                "medium_quality": len([w for w in self.db.get_recent_wisdom(50) if 0.6 <= w.quality_score <= 0.8]),
                "low_quality": len([w for w in self.db.get_recent_wisdom(50) if w.quality_score < 0.6])
            },
            "engine_performance": {
                engine: stats for engine, stats in generation_stats.get('by_engine', {}).items()
            }
        }

# Istanza globale pipeline
content_pipeline = ContentPipeline()

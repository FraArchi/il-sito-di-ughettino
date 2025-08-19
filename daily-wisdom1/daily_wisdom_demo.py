
#!/usr/bin/env python3
"""
🐕 Demo completo del Daily Wisdom System
Dimostra tutte le funzionalità principali del sistema
"""

import asyncio
from datetime import datetime
from ai.hybrid_engine import HybridWisdomEngine
from visual.quote_generator import QuoteGenerator
from database.wisdom_db import WisdomDatabase
from scheduler.daily_scheduler import scheduler
from automation.content_pipeline import content_pipeline
from context.context_builder import ContextBuilder

def print_header(title):
    """Stampa header decorativo"""
    print("\n" + "="*60)
    print(f"🐕 {title}")
    print("="*60)

async def main():
    """Demo completo del sistema"""
    
    print_header("BENVENUTO NEL DAILY WISDOM SYSTEM DI UGO!")
    
    # Inizializza componenti
    print("\n🔧 Inizializzazione componenti...")
    engine = HybridWisdomEngine()
    generator = QuoteGenerator()
    db = WisdomDatabase()
    context_builder = ContextBuilder()
    
    print("✅ Tutti i componenti inizializzati!")
    
    # Demo 1: Generazione saggezza semplice
    print_header("DEMO 1: GENERAZIONE SAGGEZZA")
    
    print("🧠 Generando saggezza con AI ibrida...")
    wisdom = engine.generate_wisdom()
    print(f"📝 Saggezza generata: '{wisdom['text']}'")
    print(f"🎯 Qualità: {wisdom['quality_score']:.2f}")
    print(f"💖 Sentiment: {wisdom['sentiment_score']:.2f}")
    print(f"⚙️ Engine: {wisdom['source_engine']}")
    
    # Demo 2: Generazione con contesto
    print_header("DEMO 2: GENERAZIONE CON CONTESTO")
    
    print("📋 Costruendo contesto intelligente...")
    context = context_builder.build_daily_context()
    
    context_summary = context_builder.get_context_summary(context)
    print(f"🌍 Contesto: {context_summary}")
    
    wisdom_with_context = engine.generate_wisdom(context)
    print(f"📝 Saggezza contestuale: '{wisdom_with_context['text']}'")
    
    # Demo 3: Generazione immagine
    print_header("DEMO 3: GENERAZIONE IMMAGINE")
    
    print("🖼️ Creando immagine per la saggezza...")
    image_path = generator.create_quote_card(wisdom_with_context['text'], context)
    print(f"🎨 Immagine creata: {image_path}")
    
    # Demo 4: Pipeline completa
    print_header("DEMO 4: PIPELINE COMPLETA")
    
    print("🔄 Eseguendo pipeline completa...")
    complete_content = await content_pipeline.generate_complete_content()
    
    print(f"📝 Testo: '{complete_content['text'][:50]}...'")
    print(f"🖼️ Immagine: {complete_content['image_path']}")
    print(f"⏱️ Tempo generazione: {complete_content['metadata']['generation_time']:.2f}s")
    print(f"💾 ID database: {complete_content['wisdom_id']}")
    
    # Demo 5: Salvataggio e recupero
    print_header("DEMO 5: DATABASE OPERATIONS")
    
    # Salva prima saggezza
    wisdom_id = db.save_wisdom(wisdom)
    print(f"💾 Prima saggezza salvata con ID: {wisdom_id}")
    
    # Recupera saggezza
    retrieved = db.get_wisdom_by_id(wisdom_id)
    print(f"🔍 Saggezza recuperata: '{retrieved.text[:30]}...'")
    
    # Statistiche
    stats = db.get_database_stats()
    print(f"📊 Totale saggezze: {stats['total_wisdom']}")
    print(f"📈 Ultima generazione: {stats.get('last_wisdom_date', 'N/A')}")
    
    # Demo 6: Scheduler
    print_header("DEMO 6: SCHEDULER")
    
    print("📅 Stato scheduler:")
    status = scheduler.get_status()
    print(f"   Running: {status['is_running']}")
    print(f"   Orario giornaliero: {status['daily_time']}")
    print(f"   Saggezza oggi: {status['today_wisdom_exists']}")
    
    if not status['is_running']:
        print("▶️ Avvio scheduler...")
        scheduler.start()
        print("✅ Scheduler avviato!")
    
    # Demo 7: Statistiche complete
    print_header("DEMO 7: STATISTICHE SISTEMA")
    
    performance = db.get_performance_metrics()
    generation_stats = db.get_generation_stats()
    engine_stats = engine.get_engine_stats()
    
    print(f"📊 Metriche Performance:")
    print(f"   Saggezze totali: {performance.get('total_wisdom', 0)}")
    print(f"   Visualizzazioni: {performance.get('total_views', 0)}")
    print(f"   Qualità media: {performance.get('avg_quality', 0):.2f}")
    
    print(f"⚙️ Statistiche Generazione:")
    print(f"   Successi: {generation_stats.get('successful', 0)}")
    print(f"   Tasso successo: {generation_stats.get('success_rate', 0):.2%}")
    print(f"   Tempo medio: {generation_stats.get('avg_time', 0):.2f}s")
    
    print(f"🤖 Prestazioni Engine:")
    print(f"   Tipo: {engine_stats.get('engine_type', 'N/A')}")
    print(f"   Saggezze generate: {engine_stats.get('total_wisdom_generated', 0)}")
    
    # Demo 8: Saggezze recenti
    print_header("DEMO 8: SAGGEZZE RECENTI")
    
    recent = db.get_recent_wisdom(5)
    print(f"📚 Ultime {len(recent)} saggezze:")
    
    for i, w in enumerate(recent, 1):
        created = w.created_at.strftime("%Y-%m-%d %H:%M")
        print(f"   {i}. '{w.text[:40]}...' ({created})")
    
    # Demo finale
    print_header("DEMO COMPLETATO!")
    
    print("🎉 Il tuo Daily Wisdom System è completamente funzionante!")
    print("\n📋 Cosa puoi fare ora:")
    print("   1. Avvia l'API: python -m uvicorn integration.wisdom_api:app --host 0.0.0.0 --port 5000")
    print("   2. Visita: http://localhost:5000")
    print("   3. Esplora le API: http://localhost:5000/docs")
    print("   4. Lo scheduler genererà automaticamente saggezze quotidiane")
    
    print(f"\n🐕 Ugo è felice e pronto a condividere la sua saggezza quotidiana!")
    
    # Ferma scheduler per demo
    print("\n⏹️ Fermo scheduler per completare demo...")
    scheduler.stop()

if __name__ == "__main__":
    asyncio.run(main())


"""
🐕 La Cuccia di Ugo - Daily Scheduler
Sistema di scheduling per generazione automatica saggezze quotidiane
"""

import time
import schedule
import threading
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from database.wisdom_db import WisdomDatabase
from ai.hybrid_engine import HybridWisdomEngine
from visual.quote_generator import QuoteGenerator
from config.settings import settings

class DailyWisdomScheduler:
    """Scheduler per automazione completa del Daily Wisdom System"""
    
    def __init__(self):
        self.db = WisdomDatabase()
        self.wisdom_engine = HybridWisdomEngine()
        self.quote_generator = QuoteGenerator()
        self.is_running = False
        self.scheduler_thread = None
        
        # Configurazione timing
        self.daily_time = settings.SCHEDULER_CONFIG.get('daily_generation_time', '08:00')
        self.enabled = settings.SCHEDULER_CONFIG.get('enabled', True)
        
    def start(self):
        """Avvia lo scheduler"""
        if self.is_running:
            print("📅 Scheduler già in esecuzione")
            return
        
        print(f"📅 Avvio scheduler - Generazione quotidiana alle {self.daily_time}")
        
        # Configura task giornaliero
        schedule.every().day.at(self.daily_time).do(self._generate_daily_wisdom)
        
        # Task di manutenzione (ogni domenica alle 02:00)
        schedule.every().sunday.at("02:00").do(self._weekly_maintenance)
        
        # Task di ottimizzazione (ogni giorno alle 23:00)
        schedule.every().day.at("23:00").do(self._daily_optimization)
        
        # Avvia thread scheduler
        self.is_running = True
        self.scheduler_thread = threading.Thread(target=self._run_scheduler, daemon=True)
        self.scheduler_thread.start()
        
        print("✅ Scheduler avviato con successo!")
    
    def stop(self):
        """Ferma lo scheduler"""
        if not self.is_running:
            return
        
        print("📅 Fermando scheduler...")
        self.is_running = False
        schedule.clear()
        
        if self.scheduler_thread:
            self.scheduler_thread.join(timeout=5)
        
        print("✅ Scheduler fermato")
    
    def _run_scheduler(self):
        """Loop principale dello scheduler"""
        while self.is_running:
            try:
                schedule.run_pending()
                time.sleep(60)  # Controlla ogni minuto
            except Exception as e:
                print(f"❌ Errore nello scheduler: {e}")
                time.sleep(300)  # Attende 5 minuti prima di riprovare
    
    def _generate_daily_wisdom(self):
        """Genera la saggezza quotidiana"""
        print("🐕 Generando saggezza quotidiana...")
        
        try:
            # Controlla se esiste già una saggezza per oggi
            existing_wisdom = self.db.get_today_wisdom()
            if existing_wisdom:
                print("📝 Saggezza di oggi già esistente, salto generazione")
                return
            
            # Genera nuova saggezza
            wisdom = self.wisdom_engine.generate_daily_wisdom()
            
            # Salva nel database
            wisdom_id = self.db.save_wisdom(wisdom)
            print(f"💾 Saggezza salvata con ID: {wisdom_id}")
            
            # Genera immagine
            image_path = self.quote_generator.create_quote_card(
                wisdom['text'], 
                wisdom.get('context_data', {})
            )
            print(f"🖼️ Immagine generata: {image_path}")
            
            # Marca come pubblicata
            self.db.mark_wisdom_published(wisdom_id)
            
            # Log successo
            print(f"🎉 Saggezza quotidiana completata: '{wisdom['text'][:50]}...'")
            
        except Exception as e:
            print(f"❌ Errore generazione saggezza quotidiana: {e}")
    
    def _weekly_maintenance(self):
        """Manutenzione settimanale del sistema"""
        print("🧹 Avvio manutenzione settimanale...")
        
        try:
            # Pulizia dati vecchi
            self.db.cleanup_old_data(days_to_keep=365)
            
            # Backup database
            backup_path = self.db.create_backup()
            print(f"💾 Backup creato: {backup_path}")
            
            # Ottimizza strategie AI
            self.wisdom_engine.optimize_strategy_weights()
            
            # Statistiche settimanali
            stats = self.db.get_performance_metrics(days=7)
            print(f"📊 Saggezze generate questa settimana: {stats['total_wisdom']}")
            print(f"📈 Engagement medio: {stats['avg_engagement']:.2f}")
            
        except Exception as e:
            print(f"❌ Errore manutenzione settimanale: {e}")
    
    def _daily_optimization(self):
        """Ottimizzazione quotidiana"""
        print("⚙️ Ottimizzazione quotidiana...")
        
        try:
            # Aggiorna pesi strategia engine
            self.wisdom_engine.optimize_strategy_weights()
            
            # Statistiche giornaliere
            today_wisdom = self.db.get_today_wisdom()
            if today_wisdom:
                print(f"📝 Saggezza di oggi: {today_wisdom.views} visualizzazioni")
            
        except Exception as e:
            print(f"❌ Errore ottimizzazione: {e}")
    
    def generate_now(self) -> Dict[str, Any]:
        """Genera una saggezza immediatamente (per testing)"""
        print("🐕 Generazione immediata...")
        return self._generate_daily_wisdom()
    
    def get_next_scheduled_time(self) -> Optional[str]:
        """Ottiene il prossimo orario di generazione"""
        jobs = schedule.get_jobs()
        if not jobs:
            return None
        
        next_run = min(job.next_run for job in jobs if job.next_run)
        return next_run.strftime("%Y-%m-%d %H:%M:%S")
    
    def get_status(self) -> Dict[str, Any]:
        """Ottiene stato dello scheduler"""
        return {
            "is_running": self.is_running,
            "daily_time": self.daily_time,
            "next_scheduled": self.get_next_scheduled_time(),
            "scheduled_jobs": len(schedule.get_jobs()),
            "today_wisdom_exists": bool(self.db.get_today_wisdom())
        }

# Istanza globale scheduler
scheduler = DailyWisdomScheduler()

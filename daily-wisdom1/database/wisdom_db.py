
"""
🐕 La Cuccia di Ugo - Daily Wisdom System
Gestione database e operazioni CRUD
"""

import os
import json
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from sqlalchemy import create_engine, func, desc, and_, or_
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError
from contextlib import contextmanager

from models.wisdom_models import Base, DailyWisdom, WisdomTemplate, GenerationLog, SocialPost, WisdomAnalytics, SystemConfig
from config.settings import settings

class WisdomDatabase:
    """Classe principale per gestione database delle saggezze"""
    
    def __init__(self, database_url: str = None):
        self.database_url = database_url or settings.DATABASE_URL
        self.engine = create_engine(self.database_url, echo=settings.DEBUG)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        
        # Crea le tabelle se non esistono
        self.init_database()
    
    def init_database(self):
        """Inizializza il database creando tutte le tabelle"""
        try:
            Base.metadata.create_all(bind=self.engine)
            print("✅ Database inizializzato correttamente")
        except Exception as e:
            print(f"❌ Errore inizializzazione database: {e}")
            raise
    
    @contextmanager
    def get_session(self) -> Session:
        """Context manager per gestione sessioni database"""
        session = self.SessionLocal()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()
    
    # === DAILY WISDOM OPERATIONS ===
    
    def save_wisdom(self, wisdom_data: Dict[str, Any]) -> int:
        """Salva una nuova saggezza nel database"""
        with self.get_session() as session:
            wisdom = DailyWisdom(
                text=wisdom_data['text'],
                source_engine=wisdom_data.get('source_engine', 'unknown'),
                category=wisdom_data.get('category', 'general'),
                mood=wisdom_data.get('mood', 'positive'),
                context_data=wisdom_data.get('context_data', {}),
                generation_params=wisdom_data.get('generation_params', {}),
                quality_score=wisdom_data.get('quality_score', 0.0),
                sentiment_score=wisdom_data.get('sentiment_score', 0.0)
            )
            
            session.add(wisdom)
            session.flush()  # Per ottenere l'ID
            
            return wisdom.id
    
    def get_today_wisdom(self) -> Optional[DailyWisdom]:
        """Ottiene la saggezza di oggi se esiste"""
        today = datetime.now().date()
        
        with self.get_session() as session:
            return session.query(DailyWisdom).filter(
                func.date(DailyWisdom.created_at) == today,
                DailyWisdom.is_active == True
            ).first()
    
    def get_wisdom_by_id(self, wisdom_id: int) -> Optional[DailyWisdom]:
        """Ottiene una saggezza per ID"""
        with self.get_session() as session:
            return session.query(DailyWisdom).filter(
                DailyWisdom.id == wisdom_id,
                DailyWisdom.is_active == True
            ).first()
    
    def get_recent_wisdom(self, limit: int = 10) -> List[DailyWisdom]:
        """Ottiene le saggezze più recenti"""
        with self.get_session() as session:
            return session.query(DailyWisdom).filter(
                DailyWisdom.is_active == True
            ).order_by(desc(DailyWisdom.created_at)).limit(limit).all()
    
    def get_wisdom_by_category(self, category: str, limit: int = 10) -> List[DailyWisdom]:
        """Ottiene saggezze per categoria"""
        with self.get_session() as session:
            return session.query(DailyWisdom).filter(
                DailyWisdom.category == category,
                DailyWisdom.is_active == True
            ).order_by(desc(DailyWisdom.created_at)).limit(limit).all()
    
    def get_top_performing_wisdom(self, limit: int = 10) -> List[DailyWisdom]:
        """Ottiene le saggezze con migliori performance"""
        with self.get_session() as session:
            return session.query(DailyWisdom).filter(
                DailyWisdom.is_active == True,
                DailyWisdom.engagement_rate > 0
            ).order_by(desc(DailyWisdom.engagement_rate)).limit(limit).all()
    
    def update_wisdom_metrics(self, wisdom_id: int, metrics: Dict[str, Any]) -> bool:
        """Aggiorna le metriche di una saggezza"""
        with self.get_session() as session:
            wisdom = session.query(DailyWisdom).filter(DailyWisdom.id == wisdom_id).first()
            if not wisdom:
                return False
            
            for key, value in metrics.items():
                if hasattr(wisdom, key):
                    setattr(wisdom, key, value)
            
            return True
    
    def mark_wisdom_published(self, wisdom_id: int) -> bool:
        """Marca una saggezza come pubblicata"""
        with self.get_session() as session:
            wisdom = session.query(DailyWisdom).filter(DailyWisdom.id == wisdom_id).first()
            if not wisdom:
                return False
            
            wisdom.is_published = True
            wisdom.published_at = datetime.utcnow()
            return True
    
    # === TEMPLATE OPERATIONS ===
    
    def get_templates_by_category(self, category: str) -> List[WisdomTemplate]:
        """Ottiene template per categoria"""
        with self.get_session() as session:
            return session.query(WisdomTemplate).filter(
                WisdomTemplate.category == category,
                WisdomTemplate.is_active == True
            ).all()
    
    def get_random_template(self, category: str = None, mood: str = None) -> Optional[WisdomTemplate]:
        """Ottiene un template casuale con filtri opzionali"""
        with self.get_session() as session:
            query = session.query(WisdomTemplate).filter(WisdomTemplate.is_active == True)
            
            if category:
                query = query.filter(WisdomTemplate.category == category)
            
            if mood:
                # Filtra per compatibilità mood se disponibile
                query = query.filter(
                    or_(
                        WisdomTemplate.mood_compatibility.is_(None),
                        WisdomTemplate.mood_compatibility.contains([mood])
                    )
                )
            
            # Ordina per success_rate e usage_count per bilanciare qualità e varietà
            query = query.order_by(
                desc(WisdomTemplate.success_rate),
                WisdomTemplate.usage_count.asc()
            )
            
            templates = query.limit(10).all()
            if not templates:
                return None
            
            # Selezione weighted random basata su success_rate
            import random
            weights = [max(t.success_rate, 0.1) for t in templates]
            return random.choices(templates, weights=weights)[0]
    
    def update_template_stats(self, template_id: int, success: bool, engagement: float = 0.0):
        """Aggiorna le statistiche di utilizzo di un template"""
        with self.get_session() as session:
            template = session.query(WisdomTemplate).filter(WisdomTemplate.id == template_id).first()
            if not template:
                return
            
            template.usage_count += 1
            template.last_used = datetime.utcnow()
            
            # Aggiorna success rate con media mobile
            if template.usage_count == 1:
                template.success_rate = 1.0 if success else 0.0
            else:
                current_rate = template.success_rate
                alpha = 0.1  # Fattore di smoothing
                template.success_rate = current_rate * (1 - alpha) + (1.0 if success else 0.0) * alpha
            
            # Aggiorna engagement medio
            if engagement > 0:
                if template.usage_count == 1:
                    template.avg_engagement = engagement
                else:
                    alpha = 0.2
                    template.avg_engagement = template.avg_engagement * (1 - alpha) + engagement * alpha
    
    # === ANALYTICS OPERATIONS ===
    
    def log_generation(self, log_data: Dict[str, Any]) -> int:
        """Registra un log di generazione"""
        with self.get_session() as session:
            log = GenerationLog(**log_data)
            session.add(log)
            session.flush()
            return log.id
    
    def get_generation_stats(self, days: int = 30) -> Dict[str, Any]:
        """Ottiene statistiche di generazione per periodo"""
        start_date = datetime.now() - timedelta(days=days)
        
        with self.get_session() as session:
            logs = session.query(GenerationLog).filter(
                GenerationLog.started_at >= start_date
            ).all()
            
            if not logs:
                return {"total": 0, "success_rate": 0, "avg_time": 0}
            
            total = len(logs)
            successful = sum(1 for log in logs if log.passed_quality)
            avg_time = sum(log.generation_time or 0 for log in logs) / total
            
            by_engine = {}
            for log in logs:
                engine = log.engine_type
                if engine not in by_engine:
                    by_engine[engine] = {"count": 0, "success": 0, "time": []}
                by_engine[engine]["count"] += 1
                if log.passed_quality:
                    by_engine[engine]["success"] += 1
                if log.generation_time:
                    by_engine[engine]["time"].append(log.generation_time)
            
            return {
                "total": total,
                "successful": successful,
                "success_rate": successful / total,
                "avg_time": avg_time,
                "by_engine": by_engine
            }
    
    def get_performance_metrics(self, days: int = 30) -> Dict[str, Any]:
        """Ottiene metriche di performance complessive"""
        start_date = datetime.now() - timedelta(days=days)
        
        with self.get_session() as session:
            wisdoms = session.query(DailyWisdom).filter(
                DailyWisdom.created_at >= start_date,
                DailyWisdom.is_active == True
            ).all()
            
            if not wisdoms:
                return {"total_wisdom": 0}
            
            total_views = sum(w.views for w in wisdoms)
            total_shares = sum(w.shares for w in wisdoms)
            total_likes = sum(w.likes for w in wisdoms)
            avg_engagement = sum(w.engagement_rate for w in wisdoms) / len(wisdoms)
            avg_quality = sum(w.quality_score for w in wisdoms) / len(wisdoms)
            
            # Breakdown per categoria
            by_category = {}
            for wisdom in wisdoms:
                cat = wisdom.category
                if cat not in by_category:
                    by_category[cat] = {"count": 0, "views": 0, "engagement": []}
                by_category[cat]["count"] += 1
                by_category[cat]["views"] += wisdom.views
                by_category[cat]["engagement"].append(wisdom.engagement_rate)
            
            return {
                "total_wisdom": len(wisdoms),
                "total_views": total_views,
                "total_shares": total_shares,
                "total_likes": total_likes,
                "avg_engagement": avg_engagement,
                "avg_quality": avg_quality,
                "by_category": by_category,
                "best_performing": max(wisdoms, key=lambda w: w.engagement_rate).to_dict() if wisdoms else None
            }
    
    # === SYSTEM CONFIG ===
    
    def get_config(self, key: str, default: Any = None) -> Any:
        """Ottiene un valore di configurazione"""
        with self.get_session() as session:
            config = session.query(SystemConfig).filter(SystemConfig.key == key).first()
            if not config:
                return default
            return config.get_typed_value()
    
    def set_config(self, key: str, value: Any, description: str = None):
        """Imposta un valore di configurazione"""
        data_type = type(value).__name__
        if data_type == 'dict' or data_type == 'list':
            data_type = 'json'
            value = json.dumps(value)
        elif data_type == 'bool':
            value = str(value)
        else:
            value = str(value)
        
        with self.get_session() as session:
            config = session.query(SystemConfig).filter(SystemConfig.key == key).first()
            if config:
                config.value = value
                config.data_type = data_type
                config.updated_at = datetime.utcnow()
                if description:
                    config.description = description
            else:
                config = SystemConfig(
                    key=key,
                    value=value,
                    data_type=data_type,
                    description=description
                )
                session.add(config)
    
    # === BACKUP & MAINTENANCE ===
    
    def create_backup(self, backup_path: str = None) -> str:
        """Crea un backup del database"""
        if not backup_path:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = f"{settings.BACKUP_DIR}/wisdom_backup_{timestamp}.db"
        
        # Per SQLite, semplicemente copia il file
        if self.database_url.startswith('sqlite'):
            db_path = self.database_url.replace('sqlite:///', '')
            import shutil
            shutil.copy2(db_path, backup_path)
        else:
            # Per altri database, usa SQL dump
            raise NotImplementedError("Backup per database non-SQLite non implementato")
        
        return backup_path
    
    def cleanup_old_data(self, days_to_keep: int = 365):
        """Pulizia dati vecchi mantenendo solo quelli recenti"""
        cutoff_date = datetime.now() - timedelta(days=days_to_keep)
        
        with self.get_session() as session:
            # Mantieni le saggezze ma rimuovi i log di generazione vecchi
            old_logs = session.query(GenerationLog).filter(
                GenerationLog.started_at < cutoff_date
            ).delete()
            
            print(f"🧹 Rimossi {old_logs} log di generazione vecchi")
    
    def get_database_stats(self) -> Dict[str, Any]:
        """Ottiene statistiche generali del database"""
        with self.get_session() as session:
            stats = {
                "total_wisdom": session.query(DailyWisdom).count(),
                "published_wisdom": session.query(DailyWisdom).filter(DailyWisdom.is_published == True).count(),
                "total_templates": session.query(WisdomTemplate).filter(WisdomTemplate.is_active == True).count(),
                "generation_logs": session.query(GenerationLog).count(),
                "social_posts": session.query(SocialPost).count(),
                "database_size": self._get_database_size()
            }
            
            # Ultima saggezza generata
            last_wisdom = session.query(DailyWisdom).order_by(desc(DailyWisdom.created_at)).first()
            if last_wisdom:
                stats["last_wisdom_date"] = last_wisdom.created_at.isoformat()
            
            return stats
    
    def _get_database_size(self) -> str:
        """Ottiene la dimensione del database"""
        if self.database_url.startswith('sqlite'):
            db_path = self.database_url.replace('sqlite:///', '')
            if os.path.exists(db_path):
                size_bytes = os.path.getsize(db_path)
                # Converte in formato leggibile
                for unit in ['B', 'KB', 'MB', 'GB']:
                    if size_bytes < 1024.0:
                        return f"{size_bytes:.1f} {unit}"
                    size_bytes /= 1024.0
                return f"{size_bytes:.1f} TB"
        return "N/A"

# Istanza globale del database
db = WisdomDatabase()

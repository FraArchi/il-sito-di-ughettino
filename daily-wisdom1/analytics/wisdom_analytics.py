
"""
🐕 La Cuccia di Ugo - Wisdom Analytics
Sistema di analisi e tracking delle performance delle saggezze
"""

import json
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from collections import defaultdict
from dataclasses import dataclass
import math

from database.wisdom_db import WisdomDatabase
from config.settings import settings


@dataclass
class AnalyticsReport:
    """Report di analytics"""
    period: str
    start_date: datetime
    end_date: datetime
    total_wisdom: int
    total_views: int
    total_engagement: float
    top_performing: List[Dict]
    trends: Dict[str, Any]
    recommendations: List[str]


class WisdomAnalytics:
    """Sistema di analytics per le saggezze quotidiane"""
    
    def __init__(self):
        self.db = WisdomDatabase()
    
    def generate_daily_report(self, target_date: datetime = None) -> AnalyticsReport:
        """Genera report giornaliero"""
        if target_date is None:
            target_date = datetime.now().date()
        
        start_date = datetime.combine(target_date, datetime.min.time())
        end_date = datetime.combine(target_date, datetime.max.time())
        
        return self._generate_report("daily", start_date, end_date)
    
    def generate_weekly_report(self, week_offset: int = 0) -> AnalyticsReport:
        """Genera report settimanale"""
        today = datetime.now().date()
        start_of_week = today - timedelta(days=today.weekday() + (week_offset * 7))
        end_of_week = start_of_week + timedelta(days=6)
        
        start_date = datetime.combine(start_of_week, datetime.min.time())
        end_date = datetime.combine(end_of_week, datetime.max.time())
        
        return self._generate_report("weekly", start_date, end_date)
    
    def generate_monthly_report(self, month_offset: int = 0) -> AnalyticsReport:
        """Genera report mensile"""
        today = datetime.now().date()
        
        # Calcola primo e ultimo giorno del mese
        if month_offset == 0:
            start_of_month = today.replace(day=1)
        else:
            # Gestione mesi precedenti/successivi
            year = today.year
            month = today.month + month_offset
            
            while month <= 0:
                month += 12
                year -= 1
            while month > 12:
                month -= 12
                year += 1
            
            start_of_month = datetime(year, month, 1).date()
        
        # Ultimo giorno del mese
        if start_of_month.month == 12:
            end_of_month = datetime(start_of_month.year + 1, 1, 1).date() - timedelta(days=1)
        else:
            end_of_month = datetime(start_of_month.year, start_of_month.month + 1, 1).date() - timedelta(days=1)
        
        start_date = datetime.combine(start_of_month, datetime.min.time())
        end_date = datetime.combine(end_of_month, datetime.max.time())
        
        return self._generate_report("monthly", start_date, end_date)
    
    def _generate_report(self, period: str, start_date: datetime, end_date: datetime) -> AnalyticsReport:
        """Genera report per periodo specificato"""
        
        # Ottieni metriche di base
        metrics = self.db.get_performance_metrics(
            days=(end_date - start_date).days + 1
        )
        
        # Ottieni saggezze del periodo
        wisdoms = self._get_wisdoms_in_period(start_date, end_date)
        
        # Calcola metriche avanzate
        trends = self._calculate_trends(wisdoms, period)
        top_performing = self._get_top_performing(wisdoms, limit=5)
        recommendations = self._generate_recommendations(wisdoms, trends)
        
        return AnalyticsReport(
            period=period,
            start_date=start_date,
            end_date=end_date,
            total_wisdom=len(wisdoms),
            total_views=sum(w.get('views', 0) for w in wisdoms),
            total_engagement=sum(w.get('engagement_rate', 0) for w in wisdoms) / max(len(wisdoms), 1),
            top_performing=top_performing,
            trends=trends,
            recommendations=recommendations
        )
    
    def _get_wisdoms_in_period(self, start_date: datetime, end_date: datetime) -> List[Dict]:
        """Ottiene saggezze in un periodo specifico"""
        # Query semplificata - in una implementazione reale useresti SQLAlchemy
        with self.db.get_session() as session:
            wisdoms = session.execute("""
                SELECT * FROM daily_wisdom 
                WHERE created_at BETWEEN ? AND ? 
                AND is_active = 1
                ORDER BY created_at DESC
            """, (start_date, end_date)).fetchall()
            
            # Converti in dict
            columns = ['id', 'text', 'created_at', 'views', 'likes', 'shares', 
                      'engagement_rate', 'quality_score', 'category', 'mood']
            
            return [dict(zip(columns, row)) for row in wisdoms]
    
    def _calculate_trends(self, wisdoms: List[Dict], period: str) -> Dict[str, Any]:
        """Calcola trends e pattern"""
        if not wisdoms:
            return {}
        
        # Raggruppa per categoria
        by_category = defaultdict(list)
        by_mood = defaultdict(list)
        by_hour = defaultdict(list)
        
        for wisdom in wisdoms:
            category = wisdom.get('category', 'general')
            mood = wisdom.get('mood', 'neutral')
            
            by_category[category].append(wisdom)
            by_mood[mood].append(wisdom)
            
            # Estrai ora dalla data
            if wisdom.get('created_at'):
                hour = datetime.fromisoformat(str(wisdom['created_at'])).hour
                by_hour[hour].append(wisdom)
        
        # Calcola performance per categoria
        category_performance = {}
        for category, category_wisdoms in by_category.items():
            avg_engagement = sum(w.get('engagement_rate', 0) for w in category_wisdoms) / len(category_wisdoms)
            avg_quality = sum(w.get('quality_score', 0) for w in category_wisdoms) / len(category_wisdoms)
            
            category_performance[category] = {
                'count': len(category_wisdoms),
                'avg_engagement': avg_engagement,
                'avg_quality': avg_quality,
                'total_views': sum(w.get('views', 0) for w in category_wisdoms)
            }
        
        # Trova ora migliore
        best_hour = None
        best_hour_engagement = 0
        for hour, hour_wisdoms in by_hour.items():
            if len(hour_wisdoms) > 0:
                avg_engagement = sum(w.get('engagement_rate', 0) for w in hour_wisdoms) / len(hour_wisdoms)
                if avg_engagement > best_hour_engagement:
                    best_hour_engagement = avg_engagement
                    best_hour = hour
        
        return {
            'category_performance': category_performance,
            'mood_distribution': {mood: len(mood_wisdoms) for mood, mood_wisdoms in by_mood.items()},
            'best_posting_hour': best_hour,
            'engagement_trend': self._calculate_engagement_trend(wisdoms),
            'quality_trend': self._calculate_quality_trend(wisdoms)
        }
    
    def _calculate_engagement_trend(self, wisdoms: List[Dict]) -> str:
        """Calcola trend di engagement"""
        if len(wisdoms) < 2:
            return "insufficient_data"
        
        # Ordina per data
        sorted_wisdoms = sorted(wisdoms, key=lambda w: w.get('created_at', ''))
        
        # Dividi in due metà
        mid_point = len(sorted_wisdoms) // 2
        first_half = sorted_wisdoms[:mid_point]
        second_half = sorted_wisdoms[mid_point:]
        
        first_avg = sum(w.get('engagement_rate', 0) for w in first_half) / max(len(first_half), 1)
        second_avg = sum(w.get('engagement_rate', 0) for w in second_half) / max(len(second_half), 1)
        
        if second_avg > first_avg * 1.1:
            return "increasing"
        elif second_avg < first_avg * 0.9:
            return "decreasing"
        else:
            return "stable"
    
    def _calculate_quality_trend(self, wisdoms: List[Dict]) -> str:
        """Calcola trend di qualità"""
        if len(wisdoms) < 2:
            return "insufficient_data"
        
        # Stesso metodo dell'engagement
        sorted_wisdoms = sorted(wisdoms, key=lambda w: w.get('created_at', ''))
        mid_point = len(sorted_wisdoms) // 2
        first_half = sorted_wisdoms[:mid_point]
        second_half = sorted_wisdoms[mid_point:]
        
        first_avg = sum(w.get('quality_score', 0) for w in first_half) / max(len(first_half), 1)
        second_avg = sum(w.get('quality_score', 0) for w in second_half) / max(len(second_half), 1)
        
        if second_avg > first_avg * 1.05:
            return "improving"
        elif second_avg < first_avg * 0.95:
            return "declining"
        else:
            return "stable"
    
    def _get_top_performing(self, wisdoms: List[Dict], limit: int = 5) -> List[Dict]:
        """Ottiene le saggezze con migliori performance"""
        if not wisdoms:
            return []
        
        # Ordina per engagement rate
        sorted_wisdoms = sorted(
            wisdoms, 
            key=lambda w: w.get('engagement_rate', 0), 
            reverse=True
        )
        
        return sorted_wisdoms[:limit]
    
    def _generate_recommendations(self, wisdoms: List[Dict], trends: Dict) -> List[str]:
        """Genera raccomandazioni basate sui dati"""
        recommendations = []
        
        if not wisdoms:
            recommendations.append("Inizia a generare saggezze quotidiane per ottenere analytics utili")
            return recommendations
        
        # Analizza performance categorie
        category_perf = trends.get('category_performance', {})
        if category_perf:
            best_category = max(category_perf.items(), key=lambda x: x[1]['avg_engagement'])
            worst_category = min(category_perf.items(), key=lambda x: x[1]['avg_engagement'])
            
            recommendations.append(
                f"La categoria '{best_category[0]}' sta performando meglio con {best_category[1]['avg_engagement']:.2f} engagement medio"
            )
            
            if worst_category[1]['avg_engagement'] < best_category[1]['avg_engagement'] * 0.5:
                recommendations.append(
                    f"Considera di migliorare la categoria '{worst_category[0]}' che ha engagement basso"
                )
        
        # Analizza timing
        best_hour = trends.get('best_posting_hour')
        if best_hour is not None:
            recommendations.append(
                f"L'orario migliore per pubblicare sembra essere le {best_hour}:00"
            )
        
        # Analizza trend engagement
        engagement_trend = trends.get('engagement_trend')
        if engagement_trend == "decreasing":
            recommendations.append(
                "L'engagement sta diminuendo. Prova a variare lo stile o i temi delle saggezze"
            )
        elif engagement_trend == "increasing":
            recommendations.append(
                "Ottimo! L'engagement sta crescendo. Continua con questa strategia"
            )
        
        # Analizza qualità
        quality_trend = trends.get('quality_trend')
        if quality_trend == "declining":
            recommendations.append(
                "La qualità delle saggezze sta calando. Considera di rivedere i template o l'AI engine"
            )
        
        # Raccomandazioni generiche se ce ne sono poche
        if len(recommendations) < 3:
            avg_engagement = sum(w.get('engagement_rate', 0) for w in wisdoms) / len(wisdoms)
            if avg_engagement < 0.05:
                recommendations.append(
                    "L'engagement è basso. Prova a rendere le saggezze più interattive o rilevanti"
                )
            
            recommendations.append(
                "Continua a pubblicare quotidianamente per costruire un'audience fedele"
            )
        
        return recommendations[:5]  # Massimo 5 raccomandazioni
    
    def get_real_time_metrics(self) -> Dict[str, Any]:
        """Ottiene metriche in tempo reale"""
        today_wisdom = self.db.get_today_wisdom()
        
        if not today_wisdom:
            return {
                "today_published": False,
                "message": "Nessuna saggezza pubblicata oggi"
            }
        
        return {
            "today_published": True,
            "wisdom_id": today_wisdom.id,
            "text": today_wisdom.text[:100] + "..." if len(today_wisdom.text) > 100 else today_wisdom.text,
            "views": today_wisdom.views,
            "likes": today_wisdom.likes,
            "shares": today_wisdom.shares,
            "engagement_rate": today_wisdom.engagement_rate,
            "published_at": today_wisdom.created_at.isoformat() if today_wisdom.created_at else None,
            "category": today_wisdom.category,
            "mood": today_wisdom.mood
        }
    
    def export_analytics_data(self, format: str = "json", days: int = 30) -> str:
        """Esporta dati analytics"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        wisdoms = self._get_wisdoms_in_period(start_date, end_date)
        
        export_data = {
            "export_date": datetime.now().isoformat(),
            "period": f"{days} days",
            "total_records": len(wisdoms),
            "data": wisdoms
        }
        
        if format.lower() == "json":
            return json.dumps(export_data, indent=2, ensure_ascii=False)
        elif format.lower() == "csv":
            # Implementazione CSV semplificata
            import csv
            import io
            
            output = io.StringIO()
            if wisdoms:
                writer = csv.DictWriter(output, fieldnames=wisdoms[0].keys())
                writer.writeheader()
                writer.writerows(wisdoms)
            
            return output.getvalue()
        
        return json.dumps(export_data, indent=2)


# Istanza globale analytics
analytics = WisdomAnalytics()

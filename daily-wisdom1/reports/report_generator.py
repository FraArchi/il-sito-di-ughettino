
"""
🐕 La Cuccia di Ugo - Report Generator
Sistema di generazione report e esportazione dati
"""

import json
import csv
import io
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, asdict
import base64

from database.wisdom_db import WisdomDatabase
from analytics.wisdom_analytics import WisdomAnalytics, AnalyticsReport
from visual.quote_generator import QuoteGenerator


@dataclass
class ReportConfig:
    """Configurazione per generazione report"""
    report_type: str  # daily, weekly, monthly, custom
    start_date: datetime
    end_date: datetime
    format: str = "html"  # html, pdf, json, csv
    include_charts: bool = True
    include_images: bool = False
    include_raw_data: bool = False
    categories: List[str] = None
    recipients: List[str] = None


class ReportGenerator:
    """Generatore di report completi per il sistema Daily Wisdom"""
    
    def __init__(self):
        self.db = WisdomDatabase()
        self.analytics = WisdomAnalytics()
        self.quote_generator = QuoteGenerator()
        
        # Crea cartella reports se non esiste
        self.reports_dir = Path("reports/generated")
        self.reports_dir.mkdir(parents=True, exist_ok=True)
    
    def generate_daily_report(self, target_date: datetime = None, format: str = "html") -> str:
        """Genera report giornaliero"""
        if target_date is None:
            target_date = datetime.now()
        
        config = ReportConfig(
            report_type="daily",
            start_date=target_date,
            end_date=target_date,
            format=format
        )
        
        return self.generate_report(config)
    
    def generate_weekly_report(self, week_offset: int = 0, format: str = "html") -> str:
        """Genera report settimanale"""
        today = datetime.now().date()
        start_of_week = today - timedelta(days=today.weekday() + (week_offset * 7))
        end_of_week = start_of_week + timedelta(days=6)
        
        config = ReportConfig(
            report_type="weekly",
            start_date=datetime.combine(start_of_week, datetime.min.time()),
            end_date=datetime.combine(end_of_week, datetime.max.time()),
            format=format
        )
        
        return self.generate_report(config)
    
    def generate_monthly_report(self, month_offset: int = 0, format: str = "html") -> str:
        """Genera report mensile"""
        today = datetime.now().date()
        
        # Calcola primo e ultimo giorno del mese
        if month_offset == 0:
            start_of_month = today.replace(day=1)
        else:
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
        
        config = ReportConfig(
            report_type="monthly",
            start_date=datetime.combine(start_of_month, datetime.min.time()),
            end_date=datetime.combine(end_of_month, datetime.max.time()),
            format=format
        )
        
        return self.generate_report(config)
    
    def generate_report(self, config: ReportConfig) -> str:
        """Genera report basato sulla configurazione"""
        
        # Ottieni analytics data
        if config.report_type == "daily":
            analytics_report = self.analytics.generate_daily_report(config.start_date)
        elif config.report_type == "weekly":
            analytics_report = self.analytics.generate_weekly_report()
        elif config.report_type == "monthly":
            analytics_report = self.analytics.generate_monthly_report()
        else:
            # Custom period
            days = (config.end_date - config.start_date).days
            analytics_report = self.analytics._generate_report("custom", config.start_date, config.end_date)
        
        # Genera report nel formato richiesto
        if config.format.lower() == "html":
            content = self._generate_html_report(analytics_report, config)
        elif config.format.lower() == "json":
            content = self._generate_json_report(analytics_report, config)
        elif config.format.lower() == "csv":
            content = self._generate_csv_report(analytics_report, config)
        else:
            raise ValueError(f"Formato {config.format} non supportato")
        
        # Salva report
        filename = self._generate_filename(config)
        filepath = self.reports_dir / filename
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return str(filepath)
    
    def _generate_html_report(self, analytics_report: AnalyticsReport, config: ReportConfig) -> str:
        """Genera report in formato HTML"""
        
        # Template HTML per il report
        html_template = '''
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Report {report_type} - La Cuccia di Ugo</title>
    <style>
        body {{ font-family: 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; border-radius: 8px; text-align: center; margin-bottom: 2rem; }}
        .header h1 {{ margin: 0; font-size: 2.5rem; }}
        .header p {{ margin: 0.5rem 0 0 0; opacity: 0.9; }}
        .container {{ max-width: 1200px; margin: 0 auto; }}
        .metrics-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 2rem; }}
        .metric-card {{ background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }}
        .metric-value {{ font-size: 2.5rem; font-weight: bold; color: #2c3e50; margin-bottom: 0.5rem; }}
        .metric-label {{ color: #7f8c8d; font-size: 1rem; }}
        .section {{ background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 2rem; }}
        .section h2 {{ color: #2c3e50; margin-bottom: 1rem; border-bottom: 2px solid #3498db; padding-bottom: 0.5rem; }}
        .table {{ width: 100%; border-collapse: collapse; margin-top: 1rem; }}
        .table th, .table td {{ padding: 0.75rem; text-align: left; border-bottom: 1px solid #ecf0f1; }}
        .table th {{ background: #f8f9fa; font-weight: bold; color: #2c3e50; }}
        .recommendations {{ background: #e8f5e8; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #27ae60; }}
        .recommendation {{ margin: 0.5rem 0; padding: 0.5rem; background: white; border-radius: 4px; }}
        .trend-up {{ color: #27ae60; font-weight: bold; }}
        .trend-down {{ color: #e74c3c; font-weight: bold; }}
        .trend-stable {{ color: #f39c12; font-weight: bold; }}
        .footer {{ text-align: center; margin-top: 2rem; color: #7f8c8d; }}
        .logo {{ font-size: 3rem; margin-bottom: 1rem; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🐕</div>
            <h1>Report {report_type.title()}</h1>
            <p>La Cuccia di Ugo - Daily Wisdom System</p>
            <p>Dal {start_date} al {end_date}</p>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">{total_wisdom}</div>
                <div class="metric-label">Saggezze Generate</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">{total_views}</div>
                <div class="metric-label">Visualizzazioni Totali</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">{engagement_rate:.1f}%</div>
                <div class="metric-label">Engagement Rate</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">{avg_quality:.1f}</div>
                <div class="metric-label">Qualità Media</div>
            </div>
        </div>
        
        <div class="section">
            <h2>📊 Analisi Performance</h2>
            <p><strong>Trend Engagement:</strong> <span class="trend-{engagement_trend_class}">{engagement_trend}</span></p>
            <p><strong>Trend Qualità:</strong> <span class="trend-{quality_trend_class}">{quality_trend}</span></p>
            
            {category_performance_html}
        </div>
        
        <div class="section">
            <h2>🏆 Top Performing Saggezze</h2>
            <table class="table">
                <thead>
                    <tr>
                        <th>Testo</th>
                        <th>Categoria</th>
                        <th>Engagement</th>
                        <th>Visualizzazioni</th>
                    </tr>
                </thead>
                <tbody>
                    {top_performing_html}
                </tbody>
            </table>
        </div>
        
        <div class="recommendations">
            <h2>💡 Raccomandazioni</h2>
            {recommendations_html}
        </div>
        
        <div class="footer">
            <p>Report generato il {generation_date}</p>
            <p>🐕 La Cuccia di Ugo - Daily Wisdom System v1.0</p>
        </div>
    </div>
</body>
</html>
'''
        
        # Prepara dati per il template
        trends = analytics_report.trends
        
        # Trend classes per styling
        engagement_trend = trends.get('engagement_trend', 'stable')
        engagement_trend_class = 'up' if engagement_trend == 'increasing' else 'down' if engagement_trend == 'decreasing' else 'stable'
        
        quality_trend = trends.get('quality_trend', 'stable')
        quality_trend_class = 'up' if quality_trend == 'improving' else 'down' if quality_trend == 'declining' else 'stable'
        
        # Performance per categoria
        category_performance = trends.get('category_performance', {})
        category_html = ""
        if category_performance:
            category_html = "<table class='table'><thead><tr><th>Categoria</th><th>Conteggio</th><th>Engagement Medio</th><th>Visualizzazioni</th></tr></thead><tbody>"
            for category, perf in category_performance.items():
                category_html += f"<tr><td>{category}</td><td>{perf['count']}</td><td>{perf['avg_engagement']:.2f}%</td><td>{perf['total_views']}</td></tr>"
            category_html += "</tbody></table>"
        
        # Top performing
        top_performing_html = ""
        for wisdom in analytics_report.top_performing:
            text = wisdom.get('text', '')[:80] + "..." if len(wisdom.get('text', '')) > 80 else wisdom.get('text', '')
            top_performing_html += f'''
            <tr>
                <td>{text}</td>
                <td>{wisdom.get('category', 'N/A')}</td>
                <td>{wisdom.get('engagement_rate', 0):.2f}%</td>
                <td>{wisdom.get('views', 0)}</td>
            </tr>
            '''
        
        # Raccomandazioni
        recommendations_html = ""
        for rec in analytics_report.recommendations:
            recommendations_html += f'<div class="recommendation">• {rec}</div>'
        
        # Compila template
        return html_template.format(
            report_type=analytics_report.period,
            start_date=analytics_report.start_date.strftime("%d/%m/%Y"),
            end_date=analytics_report.end_date.strftime("%d/%m/%Y"),
            total_wisdom=analytics_report.total_wisdom,
            total_views=analytics_report.total_views,
            engagement_rate=analytics_report.total_engagement * 100,
            avg_quality=7.5,  # Placeholder
            engagement_trend=engagement_trend.replace('_', ' ').title(),
            engagement_trend_class=engagement_trend_class,
            quality_trend=quality_trend.replace('_', ' ').title(),
            quality_trend_class=quality_trend_class,
            category_performance_html=category_html,
            top_performing_html=top_performing_html,
            recommendations_html=recommendations_html,
            generation_date=datetime.now().strftime("%d/%m/%Y %H:%M")
        )
    
    def _generate_json_report(self, analytics_report: AnalyticsReport, config: ReportConfig) -> str:
        """Genera report in formato JSON"""
        report_data = {
            "metadata": {
                "report_type": config.report_type,
                "generated_at": datetime.now().isoformat(),
                "period": {
                    "start": analytics_report.start_date.isoformat(),
                    "end": analytics_report.end_date.isoformat()
                },
                "format": "json",
                "version": "1.0"
            },
            "summary": {
                "total_wisdom": analytics_report.total_wisdom,
                "total_views": analytics_report.total_views,
                "total_engagement": analytics_report.total_engagement,
                "period": analytics_report.period
            },
            "analytics": asdict(analytics_report),
            "recommendations": analytics_report.recommendations
        }
        
        if config.include_raw_data:
            # Aggiungi dati raw se richiesto
            wisdoms = self.db._get_wisdoms_in_period(analytics_report.start_date, analytics_report.end_date)
            report_data["raw_data"] = wisdoms
        
        return json.dumps(report_data, indent=2, ensure_ascii=False, default=str)
    
    def _generate_csv_report(self, analytics_report: AnalyticsReport, config: ReportConfig) -> str:
        """Genera report in formato CSV"""
        output = io.StringIO()
        
        # Header del report
        writer = csv.writer(output)
        writer.writerow(["La Cuccia di Ugo - Daily Wisdom Report"])
        writer.writerow([f"Periodo: {analytics_report.start_date.strftime('%d/%m/%Y')} - {analytics_report.end_date.strftime('%d/%m/%Y')}"])
        writer.writerow([f"Generato il: {datetime.now().strftime('%d/%m/%Y %H:%M')}"])
        writer.writerow([])
        
        # Metriche principali
        writer.writerow(["METRICHE PRINCIPALI"])
        writer.writerow(["Metrica", "Valore"])
        writer.writerow(["Saggezze Generate", analytics_report.total_wisdom])
        writer.writerow(["Visualizzazioni Totali", analytics_report.total_views])
        writer.writerow(["Engagement Rate", f"{analytics_report.total_engagement * 100:.2f}%"])
        writer.writerow([])
        
        # Top performing
        writer.writerow(["TOP PERFORMING SAGGEZZE"])
        writer.writerow(["Testo", "Categoria", "Engagement", "Visualizzazioni"])
        for wisdom in analytics_report.top_performing:
            writer.writerow([
                wisdom.get('text', '')[:100],
                wisdom.get('category', ''),
                f"{wisdom.get('engagement_rate', 0):.2f}%",
                wisdom.get('views', 0)
            ])
        writer.writerow([])
        
        # Raccomandazioni
        writer.writerow(["RACCOMANDAZIONI"])
        for i, rec in enumerate(analytics_report.recommendations, 1):
            writer.writerow([f"{i}.", rec])
        
        return output.getvalue()
    
    def _generate_filename(self, config: ReportConfig) -> str:
        """Genera nome file per il report"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        date_str = config.start_date.strftime("%Y%m%d")
        
        if config.report_type == "daily":
            return f"daily_report_{date_str}.{config.format}"
        elif config.report_type == "weekly":
            return f"weekly_report_{date_str}_{timestamp}.{config.format}"
        elif config.report_type == "monthly":
            month_str = config.start_date.strftime("%Y%m")
            return f"monthly_report_{month_str}.{config.format}"
        else:
            return f"custom_report_{timestamp}.{config.format}"
    
    def schedule_automated_reports(self) -> Dict[str, Any]:
        """Configura invio automatico report"""
        
        # Configurazioni per report automatici
        automated_configs = [
            {
                "name": "daily_summary",
                "type": "daily",
                "format": "html",
                "schedule": "daily_8am",
                "recipients": ["admin@lacucciadiugo.com"]
            },
            {
                "name": "weekly_analytics",
                "type": "weekly", 
                "format": "html",
                "schedule": "monday_9am",
                "recipients": ["team@lacucciadiugo.com"]
            },
            {
                "name": "monthly_performance",
                "type": "monthly",
                "format": "json",
                "schedule": "first_of_month_10am",
                "recipients": ["analytics@lacucciadiugo.com"]
            }
        ]
        
        # Salva configurazioni
        config_file = self.reports_dir / "automated_reports_config.json"
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(automated_configs, f, indent=2)
        
        return {
            "success": True,
            "configurations": automated_configs,
            "config_file": str(config_file)
        }
    
    def export_all_data(self, format: str = "json") -> str:
        """Esporta tutti i dati del sistema"""
        
        # Ottieni tutti i dati
        all_wisdom = self.db.get_recent_wisdom(limit=1000)  # Tutti i dati disponibili
        db_stats = self.db.get_database_stats()
        analytics_data = self.analytics.get_performance_metrics(days=365)
        
        export_data = {
            "export_metadata": {
                "generated_at": datetime.now().isoformat(),
                "format": format,
                "total_records": len(all_wisdom),
                "system": "Daily Wisdom - La Cuccia di Ugo"
            },
            "database_stats": db_stats,
            "analytics_summary": analytics_data,
            "wisdom_data": [w.to_dict() for w in all_wisdom]
        }
        
        # Genera filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"full_export_{timestamp}.{format}"
        filepath = self.reports_dir / filename
        
        # Salva export
        if format.lower() == "json":
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(export_data, f, indent=2, ensure_ascii=False, default=str)
        elif format.lower() == "csv":
            # Export CSV semplificato
            with open(filepath, 'w', newline='', encoding='utf-8') as f:
                if all_wisdom:
                    fieldnames = all_wisdom[0].to_dict().keys()
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()
                    for wisdom in all_wisdom:
                        writer.writerow(wisdom.to_dict())
        
        return str(filepath)


# Istanza globale del generatore report
report_generator = ReportGenerator()

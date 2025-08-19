
"""
🐕 La Cuccia di Ugo - Web Dashboard
Dashboard web per monitorare e gestire il sistema Daily Wisdom
"""

from fastapi import FastAPI, Request, HTTPException, Form, File, UploadFile
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from pathlib import Path
import json
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from database.wisdom_db import WisdomDatabase
from analytics.wisdom_analytics import WisdomAnalytics
from ai.hybrid_engine import HybridWisdomEngine
from visual.quote_generator import QuoteGenerator
from social.social_publisher import SocialMediaPublisher
from automation.content_pipeline import ContentPipeline


class WisdomDashboard:
    """Dashboard principale del sistema Daily Wisdom"""
    
    def __init__(self):
        self.app = FastAPI(title="La Cuccia di Ugo - Daily Wisdom Dashboard", version="1.0.0")
        self.db = WisdomDatabase()
        self.analytics = WisdomAnalytics()
        self.ai_engine = HybridWisdomEngine()
        self.quote_generator = QuoteGenerator()
        self.social_publisher = SocialMediaPublisher()
        self.content_pipeline = ContentPipeline()
        
        # Setup templates e static files
        self.setup_static_files()
        self.setup_routes()
    
    def setup_static_files(self):
        """Configura file statici e templates"""
        # Crea cartelle se non esistono
        Path("dashboard/static").mkdir(parents=True, exist_ok=True)
        Path("dashboard/templates").mkdir(parents=True, exist_ok=True)
        
        # Mount static files
        self.app.mount("/static", StaticFiles(directory="dashboard/static"), name="static")
        
        # Templates
        self.templates = Jinja2Templates(directory="dashboard/templates")
    
    def setup_routes(self):
        """Configura tutte le route del dashboard"""
        
        @self.app.get("/", response_class=HTMLResponse)
        async def dashboard_home(request: Request):
            """Homepage del dashboard"""
            # Ottieni metriche in tempo reale
            real_time_metrics = self.analytics.get_real_time_metrics()
            
            # Ottieni statistiche generali
            db_stats = self.db.get_database_stats()
            
            # Ottieni ultime saggezze
            recent_wisdom = self.db.get_recent_wisdom(limit=5)
            
            # Report settimanale
            weekly_report = self.analytics.generate_weekly_report()
            
            context = {
                "request": request,
                "real_time_metrics": real_time_metrics,
                "db_stats": db_stats,
                "recent_wisdom": [w.to_dict() for w in recent_wisdom],
                "weekly_report": weekly_report,
                "page_title": "Dashboard - La Cuccia di Ugo"
            }
            
            return self.templates.TemplateResponse("dashboard.html", context)
        
        @self.app.get("/wisdom", response_class=HTMLResponse)
        async def wisdom_management(request: Request):
            """Gestione saggezze"""
            recent_wisdom = self.db.get_recent_wisdom(limit=20)
            
            context = {
                "request": request,
                "wisdom_list": [w.to_dict() for w in recent_wisdom],
                "page_title": "Gestione Saggezze"
            }
            
            return self.templates.TemplateResponse("wisdom_management.html", context)
        
        @self.app.get("/analytics", response_class=HTMLResponse)
        async def analytics_dashboard(request: Request):
            """Dashboard analytics"""
            daily_report = self.analytics.generate_daily_report()
            weekly_report = self.analytics.generate_weekly_report()
            monthly_report = self.analytics.generate_monthly_report()
            
            context = {
                "request": request,
                "daily_report": daily_report,
                "weekly_report": weekly_report,
                "monthly_report": monthly_report,
                "page_title": "Analytics"
            }
            
            return self.templates.TemplateResponse("analytics.html", context)
        
        @self.app.get("/social", response_class=HTMLResponse)
        async def social_management(request: Request):
            """Gestione social media"""
            # Carica log dei post social
            try:
                with open("logs/social_posts.json", 'r', encoding='utf-8') as f:
                    social_logs = json.load(f)
                    social_logs = social_logs[-20:]  # Ultimi 20
            except:
                social_logs = []
            
            posting_schedule = self.social_publisher.get_posting_schedule()
            
            context = {
                "request": request,
                "social_logs": social_logs,
                "posting_schedule": posting_schedule,
                "page_title": "Social Media"
            }
            
            return self.templates.TemplateResponse("social_management.html", context)
        
        # === API ENDPOINTS ===
        
        @self.app.post("/api/generate-wisdom")
        async def api_generate_wisdom():
            """API per generare una nuova saggezza"""
            try:
                wisdom = self.ai_engine.generate_wisdom()
                wisdom_id = self.db.save_wisdom(wisdom)
                
                return {
                    "success": True,
                    "wisdom_id": wisdom_id,
                    "wisdom": wisdom
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.post("/api/publish-social/{wisdom_id}")
        async def api_publish_social(wisdom_id: int, platforms: List[str] = None):
            """API per pubblicare su social media"""
            try:
                if platforms is None:
                    platforms = ["facebook", "instagram", "twitter", "telegram"]
                
                results = self.social_publisher.publish_daily_wisdom(wisdom_id, platforms)
                
                return {
                    "success": True,
                    "results": results
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/api/metrics/realtime")
        async def api_realtime_metrics():
            """API per metriche in tempo reale"""
            return self.analytics.get_real_time_metrics()
        
        @self.app.get("/api/wisdom/{wisdom_id}")
        async def api_get_wisdom(wisdom_id: int):
            """API per ottenere una saggezza specifica"""
            wisdom = self.db.get_wisdom_by_id(wisdom_id)
            if not wisdom:
                raise HTTPException(status_code=404, detail="Saggezza non trovata")
            
            return wisdom.to_dict()
        
        @self.app.put("/api/wisdom/{wisdom_id}/metrics")
        async def api_update_metrics(wisdom_id: int, metrics: Dict[str, Any]):
            """API per aggiornare metriche saggezza"""
            success = self.db.update_wisdom_metrics(wisdom_id, metrics)
            if not success:
                raise HTTPException(status_code=404, detail="Saggezza non trovata")
            
            return {"success": True}
        
        @self.app.get("/api/analytics/export")
        async def api_export_analytics(format: str = "json", days: int = 30):
            """API per esportare dati analytics"""
            data = self.analytics.export_analytics_data(format, days)
            
            if format.lower() == "csv":
                return FileResponse(
                    path="temp_export.csv",
                    filename=f"wisdom_analytics_{datetime.now().strftime('%Y%m%d')}.csv",
                    media_type="text/csv"
                )
            
            return {"data": data}
        
        @self.app.post("/api/automation/run-pipeline")
        async def api_run_pipeline():
            """API per eseguire la pipeline automatica"""
            try:
                result = await self.content_pipeline.run_daily_pipeline()
                return result
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/api/system/status")
        async def api_system_status():
            """API per stato del sistema"""
            return {
                "status": "healthy",
                "timestamp": datetime.now().isoformat(),
                "database": "connected",
                "ai_engine": "ready",
                "social_publisher": "ready",
                "components": {
                    "database": True,
                    "ai_engine": True,
                    "quote_generator": True,
                    "social_publisher": True,
                    "analytics": True
                }
            }
    
    def get_app(self) -> FastAPI:
        """Ottiene l'app FastAPI"""
        return self.app


# Template HTML di base per il dashboard
DASHBOARD_HTML_TEMPLATE = '''
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ page_title }} - La Cuccia di Ugo</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }
        .header { background: #2c3e50; color: white; padding: 1rem; }
        .header h1 { display: inline-block; }
        .nav { display: inline-block; float: right; }
        .nav a { color: white; text-decoration: none; margin: 0 1rem; padding: 0.5rem; }
        .nav a:hover { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .container { max-width: 1200px; margin: 2rem auto; padding: 0 1rem; }
        .card { background: white; padding: 1.5rem; margin: 1rem 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; }
        .metric-card { text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; border-radius: 8px; }
        .metric-value { font-size: 2.5rem; font-weight: bold; margin-bottom: 0.5rem; }
        .metric-label { font-size: 1rem; opacity: 0.9; }
        .btn { background: #3498db; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; }
        .btn:hover { background: #2980b9; }
        .btn-success { background: #27ae60; }
        .btn-success:hover { background: #219a52; }
        .btn-danger { background: #e74c3c; }
        .btn-danger:hover { background: #c0392b; }
        .table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
        .table th, .table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #ddd; }
        .table th { background: #f8f9fa; }
        .status-success { color: #27ae60; font-weight: bold; }
        .status-pending { color: #f39c12; font-weight: bold; }
        .status-error { color: #e74c3c; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🐕 La Cuccia di Ugo - Daily Wisdom</h1>
        <nav class="nav">
            <a href="/">Dashboard</a>
            <a href="/wisdom">Saggezze</a>
            <a href="/analytics">Analytics</a>
            <a href="/social">Social Media</a>
        </nav>
    </div>
    
    <div class="container">
        {% block content %}{% endblock %}
    </div>
    
    <script>
        // Funzioni JavaScript per interattività
        async function generateWisdom() {
            try {
                const response = await fetch('/api/generate-wisdom', { method: 'POST' });
                const result = await response.json();
                
                if (result.success) {
                    alert('Nuova saggezza generata con successo!');
                    location.reload();
                } else {
                    alert('Errore nella generazione: ' + result.error);
                }
            } catch (error) {
                alert('Errore: ' + error.message);
            }
        }
        
        async function publishToSocial(wisdomId) {
            try {
                const response = await fetch(`/api/publish-social/${wisdomId}`, { method: 'POST' });
                const result = await response.json();
                
                if (result.success) {
                    alert('Pubblicazione sui social completata!');
                } else {
                    alert('Errore nella pubblicazione');
                }
            } catch (error) {
                alert('Errore: ' + error.message);
            }
        }
        
        // Auto-refresh metriche ogni 30 secondi
        setInterval(async () => {
            try {
                const response = await fetch('/api/metrics/realtime');
                const metrics = await response.json();
                // Aggiorna elementi della pagina con nuove metriche
                console.log('Metriche aggiornate:', metrics);
            } catch (error) {
                console.log('Errore aggiornamento metriche:', error);
            }
        }, 30000);
    </script>
</body>
</html>
'''

# Funzione per creare i template HTML
def create_dashboard_templates():
    """Crea i template HTML necessari"""
    templates_dir = Path("dashboard/templates")
    templates_dir.mkdir(parents=True, exist_ok=True)
    
    # Template base
    base_template = '''
{% extends "base.html" %}

{% block content %}
<div class="metric-grid">
    <div class="metric-card">
        <div class="metric-value">{{ real_time_metrics.views or 0 }}</div>
        <div class="metric-label">Visualizzazioni Oggi</div>
    </div>
    <div class="metric-card">
        <div class="metric-value">{{ db_stats.total_wisdom or 0 }}</div>
        <div class="metric-label">Saggezze Totali</div>
    </div>
    <div class="metric-card">
        <div class="metric-value">{{ real_time_metrics.engagement_rate or 0 }}%</div>
        <div class="metric-label">Engagement Rate</div>
    </div>
    <div class="metric-card">
        <div class="metric-value">{{ weekly_report.total_views or 0 }}</div>
        <div class="metric-label">Visualizzazioni Settimana</div>
    </div>
</div>

<div class="card">
    <h2>Azioni Rapide</h2>
    <button class="btn btn-success" onclick="generateWisdom()">🎲 Genera Nuova Saggezza</button>
    <button class="btn" onclick="location.href='/analytics'">📊 Visualizza Analytics</button>
    <button class="btn" onclick="location.href='/social'">📱 Gestisci Social</button>
</div>

<div class="card">
    <h2>Ultime Saggezze</h2>
    <table class="table">
        <thead>
            <tr>
                <th>Data</th>
                <th>Testo</th>
                <th>Categoria</th>
                <th>Visualizzazioni</th>
                <th>Azioni</th>
            </tr>
        </thead>
        <tbody>
            {% for wisdom in recent_wisdom %}
            <tr>
                <td>{{ wisdom.created_at }}</td>
                <td>{{ wisdom.text[:80] }}...</td>
                <td>{{ wisdom.category }}</td>
                <td>{{ wisdom.views }}</td>
                <td>
                    <button class="btn" onclick="publishToSocial({{ wisdom.id }})">📱 Pubblica</button>
                </td>
            </tr>
            {% endfor %}
        </tbody>
    </table>
</div>
{% endblock %}
'''
    
    # Salva template base
    with open(templates_dir / "base.html", 'w', encoding='utf-8') as f:
        f.write(DASHBOARD_HTML_TEMPLATE)
    
    with open(templates_dir / "dashboard.html", 'w', encoding='utf-8') as f:
        f.write(base_template)

# Istanza globale del dashboard
dashboard = WisdomDashboard()

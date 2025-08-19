"""
🐕 La Cuccia di Ugo - Wisdom API
API REST completa per il Daily Wisdom System
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime, date
import json
from pathlib import Path

from database.wisdom_db import WisdomDatabase
from ai.hybrid_engine import HybridWisdomEngine
from visual.quote_generator import QuoteGenerator
from scheduler.daily_scheduler import scheduler
from automation.content_pipeline import content_pipeline
from dashboard.web_dashboard import WisdomDashboard
from analytics.wisdom_analytics import WisdomAnalytics
from social.social_publisher import SocialMediaPublisher
from reports.report_generator import ReportGenerator
from config.settings import settings

# Inizializza la dashboard che gestirà l'app FastAPI
dashboard = WisdomDashboard()
app = dashboard.get_app()

# Inizializza componenti aggiuntivi
db = WisdomDatabase()
ai_engine = HybridWisdomEngine()
quote_generator = QuoteGenerator()
analytics = WisdomAnalytics()
social_publisher = SocialMediaPublisher()
report_generator = ReportGenerator()

# Crea templates dashboard se non esistono
def setup_dashboard_templates():
    """Inizializza i template del dashboard"""
    from dashboard.web_dashboard import create_dashboard_templates
    try:
        create_dashboard_templates()
    except Exception as e:
        print(f"⚠️ Errore setup templates: {e}")

# Setup iniziale per i template del dashboard
setup_dashboard_templates()

# === ENDPOINTS PRINCIPALI ===
# Gli endpoints principali sono gestiti all'interno di WisdomDashboard.get_app()
# Qui aggiungiamo/modificamo se necessario, ma per ora li ereditiamo.

# --- Esempio di come WisdomDashboard potrebbe definire un endpoint ---
# @app.get("/", response_class=HTMLResponse)
# async def root_dashboard():
#     return dashboard.get_dashboard_html()
# --------------------------------------------------------------------

# === ENDPOINTS SAGGEZZE ===

@app.get("/api/wisdom/today")
async def get_today_wisdom():
    """Ottiene la saggezza di oggi"""
    wisdom = db.get_today_wisdom()
    if not wisdom:
        raise HTTPException(status_code=404, detail="Nessuna saggezza per oggi")

    return {
        "id": wisdom.id,
        "text": wisdom.text,
        "image_url": wisdom.image_url,
        "category": wisdom.category,
        "mood": wisdom.mood,
        "quality_score": wisdom.quality_score,
        "sentiment_score": wisdom.sentiment_score,
        "created_at": wisdom.created_at,
        "views": wisdom.views,
        "likes": wisdom.likes,
        "shares": wisdom.shares
    }

@app.post("/api/wisdom/generate")
async def generate_wisdom(request: WisdomRequest = WisdomRequest()):
    """Genera una nuova saggezza"""
    try:
        # Prepara contesto
        context = request.custom_context or {}
        if request.category:
            context['category'] = request.category
        if request.mood:
            context['mood'] = request.mood

        # Genera saggezza usando l'engine AI
        wisdom_data = ai_engine.generate_wisdom(context)

        # Salva nel database
        wisdom_id = db.save_wisdom(wisdom_data)
        wisdom_data['id'] = wisdom_id # Aggiunge ID per il ritorno

        # Potrebbe essere necessario generare anche un'immagine qui o tramite pipeline
        # image_path = quote_generator.create_quote_card(wisdom_data['text'], context)
        # db.update_wisdom_image_url(wisdom_id, str(image_path.relative_to(settings.ASSETS_DIR)))

        return {
            "id": wisdom_id,
            "text": wisdom_data['text'],
            "category": wisdom_data['category'],
            "mood": wisdom_data['mood'],
            "quality_score": wisdom_data['quality_score'],
            "sentiment_score": wisdom_data['sentiment_score'],
            "source_engine": wisdom_data.get('source_engine', 'N/A')
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore generazione saggezza: {str(e)}")

@app.get("/api/wisdom/recent")
async def get_recent_wisdom(limit: int = Query(10, le=50)):
    """Ottiene le saggezze più recenti"""
    wisdoms = db.get_recent_wisdom(limit)

    return [
        {
            "id": w.id,
            "text": w.text,
            "category": w.category,
            "mood": w.mood,
            "quality_score": w.quality_score,
            "created_at": w.created_at,
            "views": w.views,
            "likes": w.likes
        }
        for w in wisdoms
    ]

@app.get("/api/wisdom/{wisdom_id}")
async def get_wisdom_by_id(wisdom_id: int):
    """Ottiene una saggezza specifica"""
    wisdom = db.get_wisdom_by_id(wisdom_id)
    if not wisdom:
        raise HTTPException(status_code=404, detail="Saggezza non trovata")

    # Incrementa views
    db.update_wisdom_metrics(wisdom_id, {"views": wisdom.views + 1})

    return {
        "id": wisdom.id,
        "text": wisdom.text,
        "category": wisdom.category,
        "mood": wisdom.mood,
        "quality_score": wisdom.quality_score,
        "sentiment_score": wisdom.sentiment_score,
        "created_at": wisdom.created_at,
        "context_data": wisdom.context_data,
        "views": wisdom.views + 1, # Ritorna il valore aggiornato
        "likes": wisdom.likes,
        "shares": wisdom.shares
    }

@app.post("/api/wisdom/{wisdom_id}/like")
async def like_wisdom(wisdom_id: int):
    """Mette like a una saggezza"""
    wisdom = db.get_wisdom_by_id(wisdom_id)
    if not wisdom:
        raise HTTPException(status_code=404, detail="Saggezza non trovata")

    new_likes = wisdom.likes + 1
    db.update_wisdom_metrics(wisdom_id, {"likes": new_likes})

    return {"likes": new_likes, "message": "Like aggiunto!"}

@app.post("/api/wisdom/{wisdom_id}/share")
async def share_wisdom(wisdom_id: int):
    """Registra una condivisione"""
    wisdom = db.get_wisdom_by_id(wisdom_id)
    if not wisdom:
        raise HTTPException(status_code=404, detail="Saggezza non trovata")

    new_shares = wisdom.shares + 1
    db.update_wisdom_metrics(wisdom_id, {"shares": new_shares})

    return {"shares": new_shares, "message": "Condivisione registrata!"}

# === ENDPOINTS IMMAGINI ===

@app.post("/api/wisdom/{wisdom_id}/image")
async def generate_image_for_wisdom(wisdom_id: int, background_tasks: BackgroundTasks):
    """Genera immagine per una saggezza specifica"""
    wisdom = db.get_wisdom_by_id(wisdom_id)
    if not wisdom:
        raise HTTPException(status_code=404, detail="Saggezza non trovata")

    try:
        # Usa il quote_generator per creare l'immagine
        image_path_obj = quote_generator.create_quote_card(
            wisdom.text,
            wisdom.context_data or {} # Passa i dati di contesto se disponibili
        )

        # Aggiorna il URL dell'immagine nel DB
        relative_image_path = str(image_path_obj.relative_to(settings.ASSETS_DIR))
        db.update_wisdom_image_url(wisdom_id, relative_image_path)

        return {
            "wisdom_id": wisdom_id,
            "image_url": f"/assets/{relative_image_path}", # URL pubblico
            "message": "Immagine generata e associata alla saggezza"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore generazione immagine: {str(e)}")

@app.get("/api/images/{filename}")
async def get_generated_image(filename: str):
    """Serve immagini generate dal sistema"""
    # Costruisce il percorso completo dell'immagine all'interno della directory assets
    image_path = settings.ASSETS_DIR / "output" / filename

    if not image_path.exists():
        raise HTTPException(status_code=404, detail="Immagine non trovata")

    return FileResponse(image_path)

# === ENDPOINTS STATISTICHE & ANALYTICS ===

@app.get("/api/analytics/stats")
async def get_system_analytics_stats():
    """Statistiche complete del sistema"""
    # Recupera dati aggregati dal DB
    performance_metrics = db.get_performance_metrics()
    # Recupera statistiche di generazione dall'AI engine
    generation_stats = ai_engine.get_engine_stats()
    # Recupera statistiche dall'analytics module
    analytics_stats = analytics.get_system_overview()

    return {
        "total_wisdom_generated": performance_metrics.get('total_wisdom', 0),
        "total_views": performance_metrics.get('total_views', 0),
        "total_likes": performance_metrics.get('total_likes', 0),
        "total_shares": performance_metrics.get('total_shares', 0),
        "average_quality_score": performance_metrics.get('avg_quality', 0),
        "average_engagement_rate": performance_metrics.get('avg_engagement', 0),
        "ai_generation_success_rate": generation_stats.get('success_rate', 0),
        "analytics_summary": analytics_stats,
        "wisdom_by_category": performance_metrics.get('by_category', {}),
        "best_performing_wisdom": performance_metrics.get('best_performing')
    }

@app.get("/api/analytics/daily")
async def get_daily_performance():
    """Statistiche giornaliere sulla performance"""
    today_wisdom = db.get_today_wisdom()

    return {
        "wisdom_generated_today": bool(today_wisdom),
        "views_today": today_wisdom.views if today_wisdom else 0,
        "likes_today": today_wisdom.likes if today_wisdom else 0,
        "shares_today": today_wisdom.shares if today_wisdom else 0,
        "quality_score_today": today_wisdom.quality_score if today_wisdom else 0,
        "sentiment_score_today": today_wisdom.sentiment_score if today_wisdom else 0
    }

# === ENDPOINTS SOCIAL MEDIA ===

@app.post("/api/social/publish")
async def publish_to_social_media(
    platform: str = Query(..., description="Piattaforma social (es. twitter, linkedin)"),
    wisdom_id: int = Query(..., description="ID della saggezza da pubblicare")
):
    """Pubblica una saggezza su una piattaforma social"""
    wisdom = db.get_wisdom_by_id(wisdom_id)
    if not wisdom:
        raise HTTPException(status_code=404, detail="Saggezza non trovata")

    try:
        # Assicurati che ci sia un'immagine associata, altrimenti genera una
        if not wisdom.image_url:
            await generate_image_for_wisdom(wisdom_id) # Genera l'immagine se manca
            wisdom = db.get_wisdom_by_id(wisdom_id) # Ricarica la saggezza con l'immagine

        # Ottiene il percorso completo dell'immagine
        image_path = settings.ASSETS_DIR / wisdom.image_url

        # Pubblica usando il publisher social
        publish_result = social_publisher.publish(platform, wisdom.text, image_path)

        return {"message": f"Pubblicato su {platform}", "result": publish_result}

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore pubblicazione social: {str(e)}")

@app.get("/api/social/stats")
async def get_social_media_stats():
    """Statistiche sulle attività social"""
    return social_publisher.get_platform_stats()

# === ENDPOINTS REPORTS ===

@app.get("/api/reports/generate")
async def generate_report(
    report_type: str = Query(..., description="Tipo di report (es. daily, weekly, monthly, category_performance)"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = None,
    category: Optional[str] = None
):
    """Genera un report basato sui criteri specificati"""
    try:
        if report_type == "daily":
            report_data = report_generator.generate_daily_report(start_date or date.today())
        elif report_type == "weekly":
            report_data = report_generator.generate_weekly_report(start_date)
        elif report_type == "monthly":
            report_data = report_generator.generate_monthly_report(start_date.year, start_date.month)
        elif report_type == "category_performance":
            report_data = report_generator.generate_category_performance_report(start_date, end_date)
        else:
            raise ValueError("Tipo di report non valido.")

        return {"report_type": report_type, "data": report_data}

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore generazione report: {str(e)}")

@app.get("/api/reports/download")
async def download_report(
    report_type: str = Query(..., description="Tipo di report da scaricare"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = None,
    category: Optional[str] = None
):
    """Scarica un report generato in formato CSV o PDF"""
    # Prima genera il report
    report_content = await generate_report(report_type, start_date, end_date, category)

    # Poi crea il file e restituiscilo come FileResponse
    file_format = "csv" # Default
    filename = f"{report_type}_report"

    if report_type == "daily":
        filename += f"_{start_date.isoformat()}"
    elif report_type == "weekly":
        filename += f"_week_{start_date.isocalendar()[1]}_{start_date.year}"
    elif report_type == "monthly":
        filename += f"_{start_date.year}_{start_date.month:02d}"
    elif report_type == "category_performance":
        filename += f"_from_{start_date.isoformat()}_to_{end_date.isoformat()}"

    # Genera il contenuto del file (es. CSV)
    # Qui dovresti implementare la logica per convertire report_content['data'] in CSV/PDF
    # Per semplicità, usiamo un placeholder.
    import csv
    import io

    if report_type in ["daily", "weekly", "monthly", "category_performance"]:
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        # Scrive header (esempio)
        if report_content['data']:
            header = report_content['data'][0].keys()
            writer.writerow(header)
            # Scrive righe (esempio)
            for row_dict in report_content['data']:
                writer.writerow(row_dict.values())
        else:
            writer.writerow(["No data available for this report."])

        file_content = buffer.getvalue().encode('utf-8')
        filename += ".csv"
    else:
        # Gestire altri formati o fallire
        raise HTTPException(status_code=500, detail="Formato report non supportato per il download.")

    return FileResponse(
        io.BytesIO(file_content),
        media_type="text/csv",
        filename=filename,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# === ENDPOINTS SCHEDULER ===

@app.get("/api/scheduler/status")
async def get_scheduler_status():
    """Stato dello scheduler"""
    return scheduler.get_status()

@app.post("/api/scheduler/start")
async def start_scheduler_task():
    """Avvia lo scheduler"""
    if not scheduler.is_running():
        scheduler.start()
        return {"message": "Scheduler avviato", "status": scheduler.get_status()}
    else:
        return {"message": "Scheduler già in esecuzione", "status": scheduler.get_status()}


@app.post("/api/scheduler/stop")
async def stop_scheduler_task():
    """Ferma lo scheduler"""
    if scheduler.is_running():
        scheduler.stop()
        return {"message": "Scheduler fermato", "status": scheduler.get_status()}
    else:
        return {"message": "Scheduler non in esecuzione", "status": scheduler.get_status()}


@app.post("/api/scheduler/run-now")
async def trigger_scheduler_run():
    """Esegue immediatamente un ciclo dello scheduler"""
    # Qui potremmo voler triggerare l'esecuzione della task principale dello scheduler
    # Assumendo che scheduler.run_job() esegua il ciclo di generazione
    try:
        result = scheduler.run_job() # Assicurati che questo metodo esista e funzioni come previsto
        return {"message": "Esecuzione scheduler triggerata", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore nell'esecuzione dello scheduler: {str(e)}")

# === ENDPOINTS ADMIN ===

@app.get("/api/admin/database-stats")
async def get_database_stats():
    """Statistiche database (richiede permessi admin)"""
    # Implementa logica di autenticazione/autorizzazione admin qui
    return db.get_database_stats()

@app.post("/api/admin/backup-db")
async def create_database_backup():
    """Crea un backup del database"""
    # Implementa logica di autenticazione/autorizzazione admin qui
    try:
        backup_path = db.create_backup()
        return {"message": "Backup database creato con successo", "backup_path": str(backup_path)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore creazione backup: {str(e)}")

@app.post("/api/admin/cleanup-data")
async def cleanup_old_database_data(days_to_keep: int = Query(365, description="Numero di giorni di dati da mantenere")):
    """Esegue la pulizia dei dati vecchi nel database"""
    # Implementa logica di autenticazione/autorizzazione admin qui
    try:
        db.cleanup_old_data(days_to_keep=days_to_keep)
        return {"message": f"Pulizia dati completata. Mantenuti gli ultimi {days_to_keep} giorni."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore pulizia dati: {str(e)}")

# === ENDPOINTS PIPELINE CONTENUTO ===

@app.post("/api/pipeline/generate-full-content")
async def generate_complete_content_pipeline(background_tasks: BackgroundTasks):
    """Esegue l'intera pipeline di generazione contenuto (testo + immagine)"""
    try:
        # Assumendo che content_pipeline.generate_complete_content() ritorni un dizionario con risultati
        result = await content_pipeline.generate_complete_content()
        return {"message": "Pipeline di contenuto completata", "results": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore esecuzione pipeline contenuto: {str(e)}")

@app.get("/api/pipeline/stats")
async def get_content_pipeline_stats():
    """Restituisce statistiche sull'esecuzione della pipeline di contenuto"""
    return content_pipeline.get_pipeline_stats()

# === MIDDLEWARE E EVENTI DI AVVIO/SPEGNIMENTO ===

@app.on_event("startup")
async def startup_event():
    """Eseguito all'avvio dell'applicazione FastAPI"""
    print("🐕 Avvio La Cuccia di Ugo - Daily Wisdom API...")

    # Avvia lo scheduler se configurato per l'avvio automatico
    if settings.SCHEDULER_CONFIG.get('auto_start', True):
        try:
            scheduler.start()
            print("✅ Scheduler avviato automaticamente.")
        except Exception as e:
            print(f"⚠️ Errore all'avvio dello scheduler: {str(e)}")

    # Altri task di inizializzazione possono essere aggiunti qui
    print("✅ Daily Wisdom API pronta!")

@app.on_event("shutdown")
async def shutdown_event():
    """Eseguito allo spegnimento dell'applicazione FastAPI"""
    print("🐕 Spegnimento La Cuccia di Ugo - Daily Wisdom API...")
    # Ferma lo scheduler in modo pulito
    if scheduler.is_running():
        scheduler.stop()
        print("✅ Scheduler fermato.")
    print("✅ Spegnimento completato.")

# === SERVIZIO FILE STATICI ===

# Monta la directory degli asset statici per servire file come immagini
# La directory 'assets' deve contenere una sottodirectory 'output' per le immagini generate
app.mount("/assets", StaticFiles(directory=str(settings.ASSETS_DIR)), name="assets")

# --- WORKFLOW FIX ---
# Il problema con 'run' potrebbe essere legato a come lo scheduler viene gestito
# o a come il comando viene eseguito esternamente.
# Se il problema è nell'esecuzione dei task dello scheduler, assicurati che:
# 1. Il metodo `scheduler.start()` avvii correttamente il thread o processo dello scheduler.
# 2. Il metodo `scheduler.run_job()` (o simile) sia implementato per eseguire
#    il ciclo di generazione del contenuto una volta.
# 3. Il comando `run` nel file `.github/workflows/main.yml` (o simile)
#    chiami correttamente l'API per avviare lo scheduler o eseguire un task.
#
# Esempio di come potrebbe essere chiamato dal workflow:
# - `curl -X POST http://localhost:5000/api/scheduler/start`
# - `curl -X POST http://localhost:5000/api/scheduler/run-now`
#
# Assicurati che i percorsi e gli endpoint siano corretti nel tuo workflow.
# Il codice sopra espone già gli endpoint necessari per controllare lo scheduler.
# --------------------

if __name__ == "__main__":
    import uvicorn
    # Per eseguire l'applicazione localmente con ricaricamento automatico
    # Nota: il file di configurazione settings.py dovrebbe definire ASSETS_DIR
    # e SCHEDULER_CONFIG.
    uvicorn.run(
        "wisdom_api:app",
        host="0.0.0.0",
        port=5000,
        reload=True, # Abilita il ricaricamento automatico durante lo sviluppo
        log_level="info"
    )
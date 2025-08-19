"""
🐕 La Cuccia di Ugo - API di Integrazione per Sito Principale
FastAPI endpoint per integrare Daily Wisdom nel sito esistente
"""

import os
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import uvicorn

# Import dei moduli locali
from ai.hybrid_engine import HybridWisdomEngine
from database.wisdom_db import WisdomDatabase
from visual.quote_generator import QuoteGenerator
from automation.content_pipeline import ContentPipeline
from config.settings import settings

# Inizializza FastAPI
app = FastAPI(
    title="🐕 Daily Wisdom API",
    description="API per l'integrazione del Daily Wisdom System con il sito principale",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configurazione CORS per il sito principale
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In produzione usa domini specifici
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inizializzazione componenti
wisdom_engine = HybridWisdomEngine()
db = WisdomDatabase()
quote_generator = QuoteGenerator()
content_pipeline = ContentPipeline()

# Autenticazione semplice (opzionale)
def verify_api_token(authorization: Optional[str] = Header(None)):
    """Verifica il token API (opzionale per sicurezza)"""
    api_token = os.getenv("API_TOKEN")
    if api_token and authorization != f"Bearer {api_token}":
        raise HTTPException(status_code=401, detail="Token non valido")
    return True

@app.get("/")
async def root():
    """Endpoint di benvenuto"""
    return {
        "message": "🐕 Benvenuto nell'API di Daily Wisdom di Ugo!",
        "version": "1.0.0",
        "endpoints": {
            "wisdom_today": "/wisdom/today",
            "wisdom_random": "/wisdom/random",
            "wisdom_generate": "/wisdom/generate",
            "wisdom_image": "/wisdom/{wisdom_id}/image",
            "health": "/health"
        }
    }

@app.get("/health")
async def health_check():
    """Controllo stato del sistema"""
    try:
        # Test database
        recent_wisdom = db.get_recent_wisdom(limit=1)
        db_status = "healthy"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "timestamp": datetime.utcnow().isoformat(),
        "database": db_status,
        "version": "1.0.0"
    }

@app.get("/wisdom/today")
async def get_wisdom_today():
    """Ottieni la saggezza del giorno"""
    try:
        today = datetime.now().date()
        wisdom = db.get_wisdom_by_date(today)
        
        if not wisdom:
            # Genera nuova saggezza per oggi
            result = content_pipeline.generate_complete_content()
            wisdom_data = {
                "id": result["wisdom_id"],
                "text": result["wisdom"]["text"],
                "image_url": f"/wisdom/{result['wisdom_id']}/image",
                "created_at": datetime.utcnow().isoformat(),
                "category": result["wisdom"].get("category", "general"),
                "mood": result["wisdom"].get("mood", "positive"),
                "quality_score": result["wisdom"].get("quality_score", 0.8)
            }
        else:
            wisdom_data = {
                "id": wisdom.id,
                "text": wisdom.text,
                "image_url": f"/wisdom/{wisdom.id}/image",
                "created_at": wisdom.created_at.isoformat(),
                "category": wisdom.category,
                "mood": wisdom.mood,
                "quality_score": wisdom.quality_score
            }
        
        return wisdom_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore nel recupero della saggezza: {str(e)}")

@app.get("/wisdom/random")
async def get_random_wisdom():
    """Ottieni una saggezza casuale"""
    try:
        wisdom = db.get_random_wisdom()
        
        if not wisdom:
            raise HTTPException(status_code=404, detail="Nessuna saggezza disponibile")
        
        return {
            "id": wisdom.id,
            "text": wisdom.text,
            "image_url": f"/wisdom/{wisdom.id}/image",
            "created_at": wisdom.created_at.isoformat(),
            "category": wisdom.category,
            "mood": wisdom.mood,
            "quality_score": wisdom.quality_score
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore nel recupero della saggezza: {str(e)}")

@app.post("/wisdom/generate")
async def generate_new_wisdom(
    category: Optional[str] = "general",
    mood: Optional[str] = "positive",
    context: Optional[Dict[str, Any]] = None,
    authenticated: bool = Depends(verify_api_token)
):
    """Genera una nuova saggezza personalizzata"""
    try:
        # Prepara il contesto
        generation_context = context or {}
        generation_context.update({
            "category": category,
            "mood": mood,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Genera contenuto completo
        result = content_pipeline.generate_complete_content(context=generation_context)
        
        return {
            "id": result["wisdom_id"],
            "text": result["wisdom"]["text"],
            "image_url": f"/wisdom/{result['wisdom_id']}/image",
            "category": category,
            "mood": mood,
            "quality_score": result["wisdom"].get("quality_score", 0.8),
            "generation_time": result.get("generation_time", 0),
            "created_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore nella generazione: {str(e)}")

@app.get("/wisdom/{wisdom_id}/image")
async def get_wisdom_image(wisdom_id: int):
    """Ottieni l'immagine associata a una saggezza"""
    try:
        wisdom = db.get_wisdom_by_id(wisdom_id)
        if not wisdom:
            raise HTTPException(status_code=404, detail="Saggezza non trovata")
        
        # Cerca il file immagine
        image_path = None
        possible_paths = [
            f"assets/output/wisdom_{wisdom.mood}_{wisdom.created_at.strftime('%Y%m%d_%H%M%S')}.png",
            f"assets/output/wisdom_{wisdom_id}.png",
            f"assets/output/latest_wisdom.png"
        ]
        
        for path in possible_paths:
            full_path = os.path.join(settings.BASE_DIR, path)
            if os.path.exists(full_path):
                image_path = full_path
                break
        
        if not image_path:
            # Genera immagine se non esiste
            image_path = quote_generator.create_quote_image(
                wisdom.text,
                mood=wisdom.mood,
                output_name=f"wisdom_{wisdom_id}"
            )
        
        return FileResponse(
            image_path,
            media_type="image/png",
            filename=f"wisdom_{wisdom_id}.png"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore nel recupero dell'immagine: {str(e)}")

@app.get("/wisdom/recent")
async def get_recent_wisdom(limit: int = 10):
    """Ottieni le saggezze più recenti"""
    try:
        wisdom_list = db.get_recent_wisdom(limit=limit)
        
        return [
            {
                "id": w.id,
                "text": w.text,
                "image_url": f"/wisdom/{w.id}/image",
                "created_at": w.created_at.isoformat(),
                "category": w.category,
                "mood": w.mood,
                "quality_score": w.quality_score
            }
            for w in wisdom_list
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore nel recupero delle saggezze: {str(e)}")

@app.get("/stats")
async def get_stats():
    """Statistiche del sistema"""
    try:
        stats = db.get_system_stats()
        return {
            "total_wisdom": stats.get("total_wisdom", 0),
            "today_generations": stats.get("today_generations", 0),
            "average_quality": stats.get("average_quality", 0.8),
            "popular_categories": stats.get("popular_categories", []),
            "system_uptime": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {"error": f"Errore nel recupero statistiche: {str(e)}"}

# Webhook per integrazione (opzionale)
@app.post("/webhook/wisdom-generated")
async def wisdom_generated_webhook(data: Dict[str, Any]):
    """Webhook chiamato quando viene generata una nuova saggezza"""
    # Qui puoi notificare il sito principale della nuova saggezza
    # Ad esempio, invalidare cache, inviare notifiche, etc.
    return {"status": "received", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    # Avvia il server
    uvicorn.run(
        "integration_api:app",
        host="0.0.0.0",
        port=8001,
        reload=True if os.getenv("DEBUG", "false").lower() == "true" else False
    )

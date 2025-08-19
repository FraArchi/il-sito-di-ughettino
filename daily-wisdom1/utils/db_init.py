"""
🐕 La Cuccia di Ugo - Daily Wisdom System
Inizializzazione e popolamento database
"""

import json
from datetime import datetime
from database.wisdom_db import WisdomDatabase
from models.wisdom_models import WisdomTemplate, SystemConfig

def create_database():
    """Crea e inizializza il database completo"""
    try:
        # Crea istanza database
        db = WisdomDatabase()

        # Popola con template predefiniti
        from utils.template_seeder import seed_wisdom_templates
        seed_wisdom_templates()

        print("✅ Database inizializzato correttamente!")
        return True

    except Exception as e:
        print(f"❌ Errore durante inizializzazione database: {e}")
        return False

def populate_initial_templates():
    """Popola il database con template iniziali di saggezza"""
    print("📝 Popolando template iniziali...")

    db = WisdomDatabase()

    # Template di base per Ugo
    initial_templates = [
        # Categoria: Saggezza generale
        {
            "template_text": "Come un cane che aspetta il padrone, la pazienza trasforma l'attesa in gioia 🐕",
            "category": "saggezza",
            "variables": [],
            "mood_compatibility": ["calmo", "riflessivo", "positivo"]
        },
        {
            "template_text": "Oggi è {weather}, ma Ugo sa che ogni giorno ha il suo {emotion} speciale ☀️",
            "category": "saggezza",
            "variables": ["weather", "emotion"],
            "mood_compatibility": ["positivo", "neutro"]
        },
        {
            "template_text": "Un cane sa che la felicità si trova nelle piccole cose: una carezza, un gioco, un momento insieme 💕",
            "category": "felicità",
            "variables": [],
            "mood_compatibility": ["felice", "positivo", "amoroso"]
        },
        {
            "template_text": "Nel {season}, Ugo ricorda che ogni stagione della vita porta i suoi doni unici 🍃",
            "category": "stagioni",
            "variables": ["season"],
            "mood_compatibility": ["riflessivo", "positivo"]
        },
        {
            "template_text": "Come le zampette lasciano impronte sul sentiero, ogni gesto gentile lascia un segno nel cuore 🐾",
            "category": "gentilezza",
            "variables": [],
            "mood_compatibility": ["amoroso", "gentile", "positivo"]
        },

        # Categoria: Motivazione
        {
            "template_text": "Ogni {time_of_day} è un nuovo inizio, come ogni risveglio di Ugo è pieno di entusiasmo! 🌅",
            "category": "motivazione",
            "variables": ["time_of_day"],
            "mood_compatibility": ["energico", "motivato", "positivo"]
        },
        {
            "template_text": "Un cane non conta gli ostacoli, ma le possibilità di giocare che trova lungo la strada 🎾",
            "category": "motivazione",
            "variables": [],
            "mood_compatibility": ["coraggioso", "determinato", "giocoso"]
        },
        {
            "template_text": "Anche quando piove, Ugo sa che dopo ogni tempesta torna sempre il sole ⛈️→☀️",
            "category": "motivazione",
            "variables": [],
            "mood_compatibility": ["resiliente", "ottimista", "speranzoso"]
        },

        # Categoria: Amicizia
        {
            "template_text": "L'amicizia vera è come la coda di un cane: sempre in movimento e sempre sincera 🤝",
            "category": "amicizia",
            "variables": [],
            "mood_compatibility": ["sociale", "amoroso", "fedele"]
        },
        {
            "template_text": "Ugo non chiede da dove vieni o dove vai, ti accoglie semplicemente per quello che sei ❤️",
            "category": "amicizia",
            "variables": [],
            "mood_compatibility": ["accogliente", "incondizionato", "amoroso"]
        },

        # Categoria: Natura
        {
            "template_text": "Ogni passo nella natura è una lezione di vita che Ugo impara con tutti i sensi 🌲",
            "category": "natura",
            "variables": [],
            "mood_compatibility": ["esplorativo", "curioso", "sereno"]
        },
        {
            "template_text": "I fiori non si vergognano di essere belli, e Ugo non si vergogna di essere felice 🌸",
            "category": "natura",
            "variables": [],
            "mood_compatibility": ["naturale", "autentico", "felice"]
        },

        # Template stagionali
        {
            "template_text": "In primavera, anche Ugo sente il richiamo del rinnovamento e delle nuove avventure 🌱",
            "category": "stagioni",
            "variables": [],
            "seasonal_weight": {"spring": 2.0, "summer": 0.5, "autumn": 0.3, "winter": 0.2},
            "mood_compatibility": ["rinnovato", "energico", "curioso"]
        },
        {
            "template_text": "L'estate di Ugo sa di libertà, corse nel prato e tuffi nel ruscello 🏃‍♂️💦",
            "category": "stagioni",
            "variables": [],
            "seasonal_weight": {"spring": 0.3, "summer": 2.0, "autumn": 0.2, "winter": 0.1},
            "mood_compatibility": ["libero", "giocoso", "energico"]
        },
        {
            "template_text": "Come le foglie che cadono, Ugo sa che lasciar andare è parte della crescita 🍂",
            "category": "stagioni",
            "variables": [],
            "seasonal_weight": {"spring": 0.2, "summer": 0.3, "autumn": 2.0, "winter": 0.5},
            "mood_compatibility": ["riflessivo", "saggio", "accettante"]
        },
        {
            "template_text": "L'inverno insegna a Ugo il valore del calore condiviso e della casa accogliente 🏠❄️",
            "category": "stagioni",
            "variables": [],
            "seasonal_weight": {"spring": 0.1, "summer": 0.2, "autumn": 0.5, "winter": 2.0},
            "mood_compatibility": ["caloroso", "familiare", "protettivo"]
        },

        # Template con meteo
        {
            "template_text": "Con il sole, Ugo brilla di energia; con la pioggia, scopre la bellezza della calma 🌦️",
            "category": "meteo",
            "variables": [],
            "mood_compatibility": ["adattabile", "sereno", "equilibrato"]
        },
        {
            "template_text": "Ogni nuvola nel cielo di Ugo ha una forma di avventura che aspetta di essere scoperta ☁️",
            "category": "meteo",
            "variables": [],
            "mood_compatibility": ["immaginativo", "creativo", "sognatore"]
        },

        # Template filosofici
        {
            "template_text": "Ugo non filosofeggia sul senso della vita: la vive intensamente, un momento alla volta ⏰",
            "category": "filosofia",
            "variables": [],
            "mood_compatibility": ["presente", "intenso", "autentico"]
        },
        {
            "template_text": "La saggezza di Ugo? Amare senza condizioni e perdonare senza memoria 💖",
            "category": "filosofia",
            "variables": [],
            "mood_compatibility": ["saggio", "incondizionato", "perdonante"]
        },
        {
            "template_text": "Per Ugo, l'unica ricchezza vera sono i momenti belli condivisi con chi ami 💎",
            "category": "filosofia",
            "variables": [],
            "mood_compatibility": ["profondo", "amoroso", "essenziale"]
        },

        # Template di ispirazione quotidiana
        {
            "template_text": "Buongiorno! Ugo ti ricorda che oggi hai 86.400 secondi di possibilità davanti a te! ⏰✨",
            "category": "quotidiano",
            "variables": [],
            "mood_compatibility": ["motivante", "energico", "ottimista"]
        },
        {
            "template_text": "Prima di dormire, Ugo pensa sempre a tre cose belle della giornata. E tu? 🌙💭",
            "category": "quotidiano",
            "variables": [],
            "mood_compatibility": ["riflessivo", "grato", "sereno"]
        }
    ]

    with db.get_session() as session:
        for template_data in initial_templates:
            # Controlla se il template esiste già
            existing = session.query(WisdomTemplate).filter(
                WisdomTemplate.template_text == template_data["template_text"]
            ).first()

            if not existing:
                template = WisdomTemplate(
                    template_text=template_data["template_text"],
                    category=template_data["category"],
                    variables=template_data.get("variables", []),
                    mood_compatibility=template_data.get("mood_compatibility", []),
                    seasonal_weight=template_data.get("seasonal_weight", {}),
                    success_rate=0.8,  # Valore iniziale ottimistico
                    is_active=True,
                    created_by="system_init"
                )
                session.add(template)

        print(f"✅ Aggiunti {len(initial_templates)} template iniziali")

def populate_system_config():
    """Popola configurazioni di sistema iniziali"""
    print("⚙️ Configurando impostazioni di sistema...")

    db = WisdomDatabase()

    default_configs = [
        {
            "key": "daily_wisdom_enabled",
            "value": True,
            "description": "Abilitazione generazione automatica saggezza quotidiana"
        },
        {
            "key": "preferred_ai_engine",
            "value": "template",
            "description": "Motore AI preferito per generazione"
        },
        {
            "key": "max_wisdom_length",
            "value": 280,
            "description": "Lunghezza massima saggezze (caratteri)"
        },
        {
            "key": "quality_threshold",
            "value": 0.7,
            "description": "Soglia minima qualità per pubblicazione automatica"
        },
        {
            "key": "last_generation_date",
            "value": "never",
            "description": "Data ultima generazione automatica"
        },
        {
            "key": "social_posting_enabled",
            "value": False,
            "description": "Abilitazione posting automatico sui social"
        },
        {
            "key": "backup_frequency_hours",
            "value": 24,
            "description": "Frequenza backup automatico (ore)"
        },
        {
            "key": "analytics_tracking",
            "value": True,
            "description": "Abilitazione tracking analytics"
        }
    ]

    for config in default_configs:
        db.set_config(
            config["key"],
            config["value"],
            config["description"]
        )

    print("✅ Configurazioni di sistema impostate")

def reset_database():
    """Reset completo del database (ATTENZIONE: cancella tutto!)"""
    print("⚠️ ATTENZIONE: Reset completo del database in corso...")

    from sqlalchemy import create_engine
    from models.wisdom_models import Base
    from config.settings import settings

    engine = create_engine(settings.DATABASE_URL)
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    print("🗑️ Database resettato completamente")

def verify_database():
    """Verifica l'integrità del database"""
    print("🔍 Verificando integrità database...")

    db = WisdomDatabase()

    try:
        # Test connessione
        with db.get_session() as session:
            # Conta record in ogni tabella
            from models.wisdom_models import DailyWisdom, WisdomTemplate, GenerationLog

            wisdom_count = session.query(DailyWisdom).count()
            template_count = session.query(WisdomTemplate).count()
            log_count = session.query(GenerationLog).count()

            print(f"📊 Statistiche database:")
            print(f"  - Saggezze: {wisdom_count}")
            print(f"  - Template: {template_count}")
            print(f"  - Log generazione: {log_count}")

            if template_count == 0:
                print("⚠️ Nessun template trovato, popolo database...")
                populate_initial_templates()
                populate_system_config()

            print("✅ Database verificato e funzionante")
            return True

    except Exception as e:
        print(f"❌ Errore verifica database: {e}")
        return False

def create_sample_wisdom():
    """Crea alcune saggezze di esempio per testing"""
    print("🧪 Creando saggezze di esempio...")

    db = WisdomDatabase()

    sample_wisdom = [
        {
            "text": "Come un cane che aspetta il padrone, la pazienza trasforma l'attesa in gioia 🐕",
            "source_engine": "template",
            "category": "saggezza",
            "mood": "positivo",
            "context_data": {"weather": "sunny", "season": "spring"},
            "quality_score": 0.9,
            "sentiment_score": 0.8
        },
        {
            "text": "Oggi è una giornata splendida, ma Ugo sa che ogni giorno ha il suo momento speciale ☀️",
            "source_engine": "template",
            "category": "quotidiano",
            "mood": "energico",
            "context_data": {"weather": "sunny", "time_of_day": "morning"},
            "quality_score": 0.85,
            "sentiment_score": 0.9
        },
        {
            "text": "Un cane sa che la felicità si trova nelle piccole cose: una carezza, un gioco, un momento insieme 💕",
            "source_engine": "template",
            "category": "felicità",
            "mood": "amoroso",
            "context_data": {"emotion": "love"},
            "quality_score": 0.92,
            "sentiment_score": 0.95
        }
    ]

    for wisdom_data in sample_wisdom:
        wisdom_id = db.save_wisdom(wisdom_data)
        print(f"📝 Creata saggezza esempio con ID: {wisdom_id}")

    print("✅ Saggezze di esempio create")

def initialize_database():
    """Funzione principale per inizializzazione completa"""
    print("🚀 Inizializzazione completa database La Cuccia di Ugo...")
    print("=" * 60)

    # Step 1: Crea database
    db = create_database()

    # Step 2: Verifica
    if not verify_database():
        print("❌ Errore durante verifica, riprovando...")
        reset_database()
        db = create_database()

    # Step 3: Popola con dati iniziali
    populate_initial_templates()
    populate_system_config()
    create_sample_wisdom()

    # Step 4: Statistiche finali
    stats = db.get_database_stats()
    print("\n📊 Statistiche finali:")
    for key, value in stats.items():
        print(f"  - {key}: {value}")

    print("\n" + "=" * 60)
    print("🎉 DATABASE INIZIALIZZATO CON SUCCESSO!")
    print("🐕 Ugo è pronto a condividere la sua saggezza!")

    return db

if __name__ == "__main__":
    initialize_database()
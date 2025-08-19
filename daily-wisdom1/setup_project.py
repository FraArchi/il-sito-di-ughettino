
#!/usr/bin/env python3
"""
🐕 Setup automatico per La Cuccia di Ugo - Daily Wisdom System
Questo script prepara tutto l'ambiente di sviluppo in meno di 5 minuti
"""

import os
import sys
import subprocess
import sqlite3
from pathlib import Path

def create_project_structure():
    """Crea la struttura completa delle cartelle del progetto"""
    print("📁 Creando struttura cartelle...")
    
    folders = [
        'config',
        'models',
        'database',
        'utils',
        'ai',
        'context',
        'visual',
        'scheduler',
        'automation',
        'integration',
        'social',
        'analytics',
        'dashboard',
        'reports',
        'assets/templates',
        'assets/fonts',
        'assets/images/ugo',
        'examples',
        'logs',
        'backups'
    ]
    
    for folder in folders:
        Path(folder).mkdir(parents=True, exist_ok=True)
        # Crea file __init__.py per i package Python
        if not folder.startswith('assets') and not folder.startswith('examples'):
            init_file = Path(folder) / '__init__.py'
            if not init_file.exists():
                init_file.write_text('"""Daily Wisdom System module"""')
    
    print("✅ Struttura cartelle creata!")

def install_dependencies():
    """Installa tutte le dipendenze necessarie"""
    print("📦 Installando dipendenze...")
    
    try:
        subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'], 
                      check=True, capture_output=True)
        print("✅ Dipendenze installate!")
    except subprocess.CalledProcessError as e:
        print(f"❌ Errore installazione dipendenze: {e}")
        return False
    return True

def initialize_database():
    """Crea e inizializza il database SQLite"""
    print("🗄️ Inizializzando database...")
    
    try:
        from utils.db_init import create_database
        create_database()
        print("✅ Database inizializzato!")
    except Exception as e:
        print(f"❌ Errore database: {e}")
        return False
    return True

def verify_installation():
    """Verifica che tutto sia installato correttamente"""
    print("🔍 Verificando installazione...")
    
    checks = [
        ('SQLite', lambda: sqlite3.sqlite_version),
        ('Requests', lambda: __import__('requests').__version__),
        ('Pillow', lambda: __import__('PIL').__version__),
        ('BeautifulSoup', lambda: __import__('bs4').__version__),
        ('FastAPI', lambda: __import__('fastapi').__version__),
    ]
    
    all_good = True
    for name, check_func in checks:
        try:
            version = check_func()
            print(f"✅ {name}: {version}")
        except Exception as e:
            print(f"❌ {name}: Non installato - {e}")
            all_good = False
    
    return all_good

def create_demo_script():
    """Crea script demo per testare il sistema"""
    demo_content = '''#!/usr/bin/env python3
"""
Demo del Daily Wisdom System
Esegui questo script per generare la prima saggezza di Ugo!
"""

from ai.hybrid_engine import HybridWisdomEngine
from visual.quote_generator import QuoteGenerator
from database.wisdom_db import WisdomDatabase

def main():
    print("🐕 Generando la prima saggezza di Ugo...")
    
    # Inizializza i componenti
    engine = HybridWisdomEngine()
    generator = QuoteGenerator()
    db = WisdomDatabase()
    
    # Genera saggezza
    wisdom = engine.generate_wisdom()
    print(f"📝 Saggezza generata: {wisdom['text']}")
    
    # Crea immagine
    image_path = generator.create_quote_card(wisdom['text'])
    print(f"🖼️ Immagine creata: {image_path}")
    
    # Salva nel database
    wisdom_id = db.save_wisdom(wisdom)
    print(f"💾 Salvata nel database con ID: {wisdom_id}")
    
    print("\\n🎉 Il tuo sistema Daily Wisdom è pronto!")
    print("Visita http://localhost:5000 per vedere il dashboard")

if __name__ == "__main__":
    main()
'''
    
    with open('daily_wisdom_demo.py', 'w', encoding='utf-8') as f:
        f.write(demo_content)
    
    # Rendi eseguibile
    os.chmod('daily_wisdom_demo.py', 0o755)

def main():
    """Funzione principale di setup"""
    print("🐕 Benvenuto nel setup di La Cuccia di Ugo - Daily Wisdom System!")
    print("=" * 60)
    
    steps = [
        ("Creazione struttura progetto", create_project_structure),
        ("Installazione dipendenze", install_dependencies),
        ("Inizializzazione database", initialize_database),
        ("Verifica installazione", verify_installation),
        ("Creazione script demo", create_demo_script),
    ]
    
    for step_name, step_func in steps:
        print(f"\\n🔄 {step_name}...")
        if not step_func():
            print(f"❌ Errore durante: {step_name}")
            return False
    
    print("\\n" + "=" * 60)
    print("🎉 SETUP COMPLETATO CON SUCCESSO!")
    print("\\n📋 Prossimi passi:")
    print("1. Esegui: python daily_wisdom_demo.py")
    print("2. Visita: http://localhost:5000")
    print("3. Configura le API keys in config/settings.py")
    print("\\n🐕 Ugo è pronto a condividere la sua saggezza quotidiana!")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

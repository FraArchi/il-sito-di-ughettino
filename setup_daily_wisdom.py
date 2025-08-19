#!/usr/bin/env python3
"""
🐕 Setup automatico per integrazione Daily Wisdom con sito principale
Configura tutto l'ambiente senza Docker
"""

import os
import subprocess
import sys
from pathlib import Path
import shutil

def print_step(step, message):
    """Stampa un step colorato"""
    print(f"\n{'='*60}")
    print(f"🐕 STEP {step}: {message}")
    print(f"{'='*60}")

def run_command(cmd, description=""):
    """Esegue un comando con output"""
    print(f"🔧 {description}")
    print(f"💻 Comando: {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"❌ Errore: {result.stderr}")
        return False
    print(f"✅ Completato: {result.stdout}")
    return True

def main():
    """Setup principale"""
    print_step(1, "VERIFICA SISTEMA")
    
    # Verifica Python
    python_version = sys.version_info
    if python_version.major < 3 or python_version.minor < 8:
        print("❌ Python 3.8+ richiesto")
        sys.exit(1)
    print(f"✅ Python {python_version.major}.{python_version.minor} OK")
    
    # Verifica se siamo nella directory corretta
    if not Path("daily-wisdom1").exists():
        print("❌ Esegui questo script dalla directory principale del progetto")
        sys.exit(1)
    
    print_step(2, "CONFIGURAZIONE AMBIENTE VIRTUALE")
    
    # Crea ambiente virtuale
    venv_path = Path("daily-wisdom1/venv")
    if not venv_path.exists():
        if not run_command("cd daily-wisdom1 && python3 -m venv venv", "Creazione ambiente virtuale"):
            sys.exit(1)
    else:
        print("✅ Ambiente virtuale già esistente")
    
    print_step(3, "INSTALLAZIONE DIPENDENZE")
    
    # Installa dipendenze base
    base_packages = [
        "fastapi>=0.104.0",
        "uvicorn[standard]>=0.24.0", 
        "sqlalchemy>=2.0.0",
        "alembic>=1.12.0",
        "requests>=2.31.0",
        "pillow>=10.0.0",
        "python-dotenv>=1.0.0",
        "schedule>=1.2.0"
    ]
    
    for package in base_packages:
        if not run_command(f"cd daily-wisdom1 && source venv/bin/activate && pip install '{package}'", f"Installazione {package}"):
            print(f"⚠️ Errore installazione {package}, continuando...")
    
    print_step(4, "CONFIGURAZIONE FILE")
    
    # Copia .env.example a .env se non esiste
    env_example = Path("daily-wisdom1/.env.example")
    env_file = Path("daily-wisdom1/.env")
    
    if env_example.exists() and not env_file.exists():
        shutil.copy(env_example, env_file)
        print("✅ File .env creato da .env.example")
        print("📝 IMPORTANTE: Modifica daily-wisdom1/.env con le tue configurazioni!")
    
    print_step(5, "INIZIALIZZAZIONE DATABASE")
    
    # Inizializza database
    if not run_command("cd daily-wisdom1 && source venv/bin/activate && python3 -c 'from database.wisdom_db import WisdomDatabase; WisdomDatabase()'", "Inizializzazione database"):
        print("⚠️ Errore inizializzazione database, ma continuiamo...")
    
    print_step(6, "TEST SISTEMA")
    
    # Test rapido
    if run_command("cd daily-wisdom1 && source venv/bin/activate && python3 -c 'from ai.hybrid_engine import HybridWisdomEngine; print(\"Sistema OK\")'", "Test componenti"):
        print("✅ Sistema Daily Wisdom configurato correttamente!")
    else:
        print("⚠️ Potrebbero esserci problemi, controlla i log sopra")
    
    print_step(7, "ISTRUZIONI FINALI")
    
    print("""
🎯 SETUP COMPLETATO! Ecco cosa fare ora:

1️⃣ CONFIGURA LE VARIABILI:
   📝 Modifica: daily-wisdom1/.env
   🔑 Aggiungi le API keys che vuoi usare (opzionali)

2️⃣ AVVIA IL SERVER:
   💻 cd daily-wisdom1
   💻 source venv/bin/activate  
   💻 python3 integration_api.py

3️⃣ TESTA L'API:
   🌐 Apri: http://localhost:8001/docs
   🧪 Prova: http://localhost:8001/wisdom/today

4️⃣ INTEGRA NEL TUO SITO:
   📋 Leggi: daily-wisdom1/INTEGRATION_GUIDE.md
   🔗 Usa le API endpoint documentate

5️⃣ AUTOMAZIONE (opzionale):
   ⏰ Configura cron job per generazione automatica
   📱 Integra con social media

🆘 PROBLEMI?
   📖 Leggi: daily-wisdom1/TROUBLESHOOTING.md
   🐛 Controlla i log in: daily-wisdom1/logs/
   
🐕 Ugo è pronto a condividere la sua saggezza! 
""")

if __name__ == "__main__":
    main()

# 🐕 ISTRUZIONI COMPLETE - Cosa Devi Fare Tu

## 🎯 Panoramica
Hai ora a disposizione un **Daily Wisdom System completo** che genera automaticamente saggezze quotidiane di Ugo con immagini, senza necessità di Docker. Ecco esattamente cosa devi fare per far funzionare tutto.

---

## ✅ STEP 1: SETUP INIZIALE (5 minuti)

### **1.1 Esegui lo script di setup automatico**
```bash
# Dalla directory principale del progetto (dove c'è daily-wisdom1/)
python3 setup_daily_wisdom.py
```

**Cosa fa questo script:**
- ✅ Verifica Python 3.8+
- ✅ Crea ambiente virtuale
- ✅ Installa tutte le dipendenze
- ✅ Crea file .env da .env.example
- ✅ Inizializza database SQLite
- ✅ Testa che tutto funzioni

### **1.2 Se lo script ha problemi, fai manualmente:**
```bash
cd daily-wisdom1
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn sqlalchemy pillow python-dotenv schedule
cp .env.example .env
```

---

## ⚙️ STEP 2: CONFIGURAZIONE (opzionale ma consigliata)

### **2.1 Modifica il file .env**
```bash
cd daily-wisdom1
nano .env  # o usa VS Code, gedit, vim...
```

**Configurazioni importanti da cambiare:**
```bash
# Se vuoi usare in produzione
ENVIRONMENT=production
DEBUG=false

# Se hai un dominio specifico
MAIN_SITE_URL=https://tuo-dominio.com
CORS_ORIGINS=https://tuo-dominio.com,http://localhost:3000

# Orario generazione automatica
DAILY_GENERATION_TIME=08:00

# Per sicurezza (opzionale)
API_TOKEN=il_tuo_token_segreto_qui
```

### **2.2 API Keys opzionali (tutte gratuite)**
Se vuoi funzionalità avanzate, aggiungi nel .env:

**OpenWeatherMap (contesto meteo):**
1. Vai su https://openweathermap.org/api
2. Registrati gratis (1000 chiamate/giorno)
3. Copia la API key nel .env: `OPENWEATHER_API_KEY=tua_key_qui`

**Unsplash (immagini di sfondo):**
1. Vai su https://unsplash.com/developers
2. Registrati gratis (50 download/ora)
3. Copia la access key nel .env: `UNSPLASH_ACCESS_KEY=tua_key_qui`

**⚠️ NOTA:** Anche senza API keys il sistema funziona perfettamente!

---

## 🚀 STEP 3: AVVIA IL SISTEMA

### **3.1 Test rapido**
```bash
cd daily-wisdom1
source venv/bin/activate
python3 daily_wisdom_demo.py
```

**Deve mostrarti:**
- ✅ Generazione saggezza
- ✅ Creazione immagine  
- ✅ Salvataggio database
- ✅ Pipeline completa

### **3.2 Avvia il server API**
```bash
cd daily-wisdom1
source venv/bin/activate
python3 integration_api.py
```

**Il server sarà disponibile su:** http://localhost:8001

### **3.3 Verifica che funzioni**
Apri il browser e vai su:
- **Documentazione API:** http://localhost:8001/docs
- **Test saggezza oggi:** http://localhost:8001/wisdom/today
- **Health check:** http://localhost:8001/health

---

## 🔗 STEP 4: INTEGRA NEL TUO SITO

### **4.1 Per sito React/Next.js**

**Copia i file:**
```bash
# Copia il componente React nel tuo progetto
cp daily-wisdom1/examples/UgoWisdom.jsx tuo-sito/components/
cp daily-wisdom1/examples/UgoWisdom.css tuo-sito/components/
```

**Usa nel tuo sito:**
```jsx
import UgoWisdom from './components/UgoWisdom';

function HomePage() {
  return (
    <div>
      <h1>Il Sito di Ughettino</h1>
      <UgoWisdom 
        apiUrl="http://localhost:8001"
        showControls={true}
        theme="light"
      />
    </div>
  );
}
```

### **4.2 Per sito WordPress**

**Aggiungi al functions.php:**
```php
// Copia il codice da daily-wisdom1/USAGE_EXAMPLES.md
// Sezione "Widget WordPress (PHP)"
```

**Usa con shortcode:**
```
[ugo_wisdom api_url="http://localhost:8001"]
```

### **4.3 Per qualsiasi sito HTML**

**Copia e incolla:**
```html
<!-- Vedi daily-wisdom1/USAGE_EXAMPLES.md per il codice completo -->
<div id="ugo-wisdom"></div>
<script>
// JavaScript widget pronto all'uso
</script>
```

---

## ⏰ STEP 5: AUTOMAZIONE (opzionale)

### **5.1 Generazione automatica quotidiana**
```bash
# Aggiungi al crontab (crontab -e)
0 8 * * * cd /path/to/daily-wisdom1 && source venv/bin/activate && python3 -c "from automation.content_pipeline import ContentPipeline; ContentPipeline().generate_complete_content()"
```

### **5.2 Mantieni il server sempre attivo**
```bash
# Crea systemd service (Linux)
sudo nano /etc/systemd/system/ugo-wisdom.service

# Incolla:
[Unit]
Description=Ugo Daily Wisdom API
After=network.target

[Service]
Type=simple
User=tuo-username
WorkingDirectory=/path/to/daily-wisdom1
Environment=PATH=/path/to/daily-wisdom1/venv/bin
ExecStart=/path/to/daily-wisdom1/venv/bin/python integration_api.py
Restart=always

[Install]
WantedBy=multi-user.target

# Attiva:
sudo systemctl enable ugo-wisdom
sudo systemctl start ugo-wisdom
```

---

## 🌐 STEP 6: DEPLOY IN PRODUZIONE (opzionale)

### **6.1 Su VPS/Server**

**Configurazione Nginx:**
```nginx
# /etc/nginx/sites-available/ugo-wisdom
server {
    listen 80;
    server_name tuo-dominio.com;

    location /api/wisdom/ {
        proxy_pass http://localhost:8001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### **6.2 Configurazione produzione**
```bash
# Nel .env
ENVIRONMENT=production
DEBUG=false
DATABASE_URL=sqlite:///production_wisdom.db
```

---

## 🛠️ TROUBLESHOOTING - Se Qualcosa Non Funziona

### **Problema: Porta 8001 occupata**
```bash
# Cambia porta in integration_api.py (ultima riga):
uvicorn.run("integration_api:app", host="0.0.0.0", port=8002)
```

### **Problema: Errori import**
```bash
cd daily-wisdom1
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### **Problema: Database corrotto**
```bash
rm wisdom.db
python3 -c "from database.wisdom_db import WisdomDatabase; WisdomDatabase()"
```

### **Problema: Immagini non generate**
```bash
mkdir -p assets/output
chmod 755 assets/output
pip install pillow>=10.0.0
```

### **Test di diagnosi completo:**
```bash
cd daily-wisdom1
source venv/bin/activate

# Test 1: Import
python3 -c "from ai.hybrid_engine import HybridWisdomEngine; print('✅ Import OK')"

# Test 2: Database  
python3 -c "from database.wisdom_db import WisdomDatabase; WisdomDatabase(); print('✅ Database OK')"

# Test 3: Generazione
python3 -c "from ai.hybrid_engine import HybridWisdomEngine; result = HybridWisdomEngine().generate_wisdom(); print(f'✅ Generazione OK: {result[\"text\"][:50]}...')"
```

---

## 📱 ESEMPI PRONTI ALL'USO

**Nel tuo sito React:**
```jsx
<UgoWisdom 
  apiUrl="http://localhost:8001"
  theme="light"
  showControls={true}
/>
```

**Nel tuo sito WordPress:**
```
[ugo_wisdom]
```

**In qualsiasi pagina HTML:**
```html
<div id="ugo-wisdom-widget"></div>
<script src="ugo-widget.js"></script>
```

**Chiamata API diretta:**
```javascript
fetch('http://localhost:8001/wisdom/today')
  .then(r => r.json())
  .then(wisdom => console.log(wisdom.text));
```

---

## 📚 DOCUMENTAZIONE COMPLETA

- **📖 Guida integrazione:** `daily-wisdom1/INTEGRATION_GUIDE.md`
- **🆘 Troubleshooting:** `daily-wisdom1/TROUBLESHOOTING.md`
- **📱 Esempi uso:** `daily-wisdom1/USAGE_EXAMPLES.md`
- **⚙️ File config:** `daily-wisdom1/.env.example`

---

## 🎯 RIASSUNTO - QUELLO CHE DEVI FARE SUBITO

1. **Esegui:** `python3 setup_daily_wisdom.py`
2. **Configura:** Modifica `daily-wisdom1/.env` (opzionale)
3. **Avvia:** `cd daily-wisdom1 && source venv/bin/activate && python3 integration_api.py`
4. **Testa:** Vai su http://localhost:8001/docs
5. **Integra:** Copia i componenti examples/ nel tuo sito

**🐕 In 5 minuti avrai Ugo che condivide saggezze nel tuo sito!**

---

## 🚨 SUPPORTO

Se hai problemi:
1. ✅ Controlla `daily-wisdom1/TROUBLESHOOTING.md`
2. ✅ Esegui i test di diagnosi sopra
3. ✅ Controlla i log in `daily-wisdom1/logs/`
4. ✅ Assicurati che Python sia 3.8+

**Il sistema è progettato per essere plug-and-play. Se segui questi step funziona al 100%! 🐕**

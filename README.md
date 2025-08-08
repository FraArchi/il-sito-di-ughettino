# Il Sito di Ughettino 🌟

![Preview]

**Visita il sito live:** [https://fraarchi.github.io/il-sito-di-ughettino/](https://fraarchi.github.io/il-sito-di-ughettino/)

---

## 📢 Descrizione

Questo progetto è il sito web personale di *Ughettino*, una pagina statica semplice, elegante e funzionale, costruita interamente in HTML.  
Perfetta come punto di partenza per chi vuole imparare a pubblicare siti web gratuitamente usando GitHub Pages.

---

## 🚀 Caratteristiche principali

- **Sito statico e leggero**: solo HTML puro, nessuna dipendenza esterna  
- **Hosting gratuito**: pubblicato tramite GitHub Pages  
- **Struttura semplice e chiara**: facile da modificare e personalizzare  
- **Accessibile ovunque**: il sito è online 24/7, raggiungibile all’URL GitHub Pages sopra

---

## 🗄 Backend & API Public

Il progetto ora include un backend Node/Express (cartella `backend/`) con rotte pubbliche sicure:
- POST `/api/public/newsletter` – iscrizione newsletter
- POST `/api/public/contact` – invio messaggio contatto
- POST `/api/public/upload` – upload immagine (bucket `uploads`)

### Avvio locale
```bash
cd backend
cp .env.example .env   # inserisci le chiavi reali Supabase
npm ci
ALLOW_START_WITHOUT_DB=true npm start
```

### Test rapido API
```bash
./backend/test_newsletter_curl.sh
./backend/test_contact_curl.sh
./backend/test_upload_curl.sh
```

## 🛡 Supabase & Sicurezza
Variabili principali (in `.env` backend):
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Tabelle & RLS
File: `backend/supabase/init.sql` crea:
- `newsletter_subscribers` (solo insert anon)
- `contacts` (solo insert anon)
- `uploads` (insert anon, select opzionale per galleria)

Politiche RLS minimali: nessun update/delete per utenti anonimi.

### Storage
Bucket richiesto: `uploads` (public = true). Le policy Storage vanno configurate dal pannello (non incluse in SQL):
Esempio (concettuale):
```
(policy) allow upload for anon if mime-type starts_with('image/')
(policy) allow read for anon
```

## 🔐 Protezione segreti
- Le chiavi service role NON vanno nel frontend.
- Root `.gitignore` blocca `.env` e log.
- Aggiungi i secrets nel repository GitHub (Settings > Secrets > Actions):
  - SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
  - SUPABASE_DB_HOST, SUPABASE_DB_PORT, SUPABASE_DB_NAME, SUPABASE_DB_USER, SUPABASE_DB_PASSWORD (se usi SQL init via workflow)

## ⚙️ CI/CD Workflow
File: `.github/workflows/deploy.yml`
Step principali:
1. Install dependencies (backend)
2. Lint & test (non bloccanti)
3. (Se configurato DB host) esegue `backend/supabase/init.sql`
4. Build Docker image (placeholder per deploy)

Per completare il deploy aggiungi uno step provider (Render / Railway / Fly.io) usando token come secret.

## 🧪 Script di test
Situati in `backend/`:
- `test_newsletter_curl.sh`
- `test_contact_curl.sh`
- `test_upload_curl.sh`

## 🔧 Refactor principali
- Rimozione doppia inizializzazione Supabase lato frontend
- Backend service role isolato
- Validazione input (express-validator)
- Rate limiting per rotte pubbliche
- Upload con nome file sicuro e metadata salvati

## 🚀 Prossimi miglioramenti suggeriti
- Aggiungere antivirus (ClamAV) o scanning API
- Resizing immagini con `sharp` (già installato) in pipeline upload
- Captcha / honeypot per mitigare spam
- Logging strutturato centralizzato + monitoraggio (Sentry)

---




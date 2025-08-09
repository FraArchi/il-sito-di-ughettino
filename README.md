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

## 🔒 Sicurezza segreti (.env)
- I file .env non sono tracciati (root e backend .gitignore configurati).
- Non committare chiavi reali. Usa `.env.example` come guida e crea `.env` locali.
- Se chiavi fossero finite in history, rigenerale su Supabase e ripulisci la history (BFG).

Pulizia history (esempio):
```
bfg --delete-files .env --no-blob-protection
# oppure
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch **/.env' --prune-empty --tag-name-filter cat -- --all
```
Poi: force-push e ruota le chiavi sul provider.

## 🧰 CI/CD
- Workflow CI: `.github/workflows/ci.yml`
  - Lint + Test backend Node.js (v18, v20)
  - Setup Python 3.11 (se presente) e pytest
  - Build Docker di smoke test
- Workflow Deploy: `.github/workflows/deploy.yml` (se config DB disponibile esegue init.sql)

Esecuzione locale test backend:
```
cd backend
npm ci
npm run lint
npm test
```

## 🔍 Controllo dipendenze & sicurezza
- Audit Node: `make audit` o `npm audit --audit-level=high` (fix: `make audit-fix`)
- Dependabot abilitato (.github/dependabot.yml)
- Python (se presente): `pip install pip-audit && pip-audit` oppure `pip install safety && safety check`

## 🧭 Monitoraggio & Error Tracking
- Sentry (backend): set `SENTRY_DSN` in `.env`
- Metrics Prometheus: endpoint `/metrics` (prom-client). Esporta uptime, memory, http durations.
- Logging JSON (Winston). Opzionale invio HTTP impostando `LOG_HTTP_ENDPOINT`.

## 🗃 Backup database (linee guida)
- Postgres: pianifica `pg_dump` (cron) e invio a S3; retention (es. 7 daily, 4 weekly, 12 monthly).
- Restore: `psql < dump.sql` su staging; verifica applicazione migrazioni e integrità.

## ⚡ Performance & Caching
- Compressione gzip abilitata lato backend (compression).
- Frontend: usa immagini WebP/AVIF con `loading="lazy"`; distribuzione via CDN consigliata.

## 🔎 SEO & GDPR
- `docs/sitemap.xml` e `docs/robots.txt` presenti. Meta tag base in `docs/index.html`.
- Cookie banner opt-in già incluso in `docs/index.html` con Consent Mode per GA.

## 🧪 Test automatizzati
- Backend: `make test` (usa `npm test`), test di integrazione da aggiungere in `backend/tests`.
- Script curl già pronti: `backend/test_*.sh`.
- CI esegue lint+test su push/PR.

## 👩‍💻 Developer Experience
- Makefile con scorciatoie: `make dev`, `make prod`, `make lint`, `make test`, `make audit`, `make audit-fix`.
- Avvio stack dev rapido: `cp backend/.env.example backend/.env && (cd backend && npm ci && npm run dev)`.




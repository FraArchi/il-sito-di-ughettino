# Il Sito di Ughettino 🌟

![La Cuccia di Ugo - Official Website]

**Visita il sito ufficiale:** [https://lacucciadiugo.it](https://lacucciadiugo.it)

---

## 📢 Descrizione

Questo progetto è il sito web personale di *Ughettino*, una pagina statica semplice, elegante e funzionale.

---

## 🚀 Caratteristiche principali

- Sito statico leggero, hosting GitHub Pages
- Backend Node/Express sicuro per newsletter, contatti, upload
- RLS Supabase e bucket storage `uploads`
- UI moderna e responsive con sezioni: Hero, Chi è Ugo, Avventure, Community, Divertiti (Quiz/Photo Booth)

---

## 🗄 Backend & API Public

Rotte pubbliche:
- POST `/api/public/newsletter`
- POST `/api/public/contact`
- POST `/api/public/upload`

Avvio locale
```
cd backend
cp .env.example .env   # inserisci le chiavi reali Supabase
npm ci
ALLOW_START_WITHOUT_DB=true npm start
```

Test rapido API
```
./backend/test_newsletter_curl.sh
./backend/test_contact_curl.sh
./backend/test_upload_curl.sh
```

---

## 🛡 Supabase & Sicurezza

Env principali (`backend/.env`):
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Tabelle & RLS: `backend/supabase/init.sql`

Storage: bucket `uploads` (public = true)

---

## 🔒 Segreti
- `.env` non tracciati; usare `.env.example`
- Rigenera chiavi accidentalmente committate e ripulisci la history

---

## 🧰 CI/CD
- Workflow CI: `.github/workflows/ci.yml`
  - working-directory: `backend`
  - `npm ci` e poi `npm test`
  - env test ridotti: `NODE_ENV=test`, `LOG_LEVEL=error`, dummy `SUPABASE_*`, `SENTRY_DSN=""`, `ALLOW_START_WITHOUT_DB=true`
  - Lint, audit high, Docker build smoke
- Deploy: `.github/workflows/deploy.yml`

Esecuzione locale test backend
```
cd backend
npm ci
npm run lint
npm test
```

---

## 🔍 Dipendenze & sicurezza
- Audit Node: `make audit` o `npm audit --audit-level=high`
- Dependabot abilitato

---

## 🧭 Monitoraggio
- Sentry opzionale (`SENTRY_DSN`)
- Prometheus `/metrics`
- Logging JSON (Winston)

---

## ⚡ Performance & Caching
- Gzip lato backend
- Immagini ottimizzate e lazy loading

---

## 🔎 SEO & GDPR
- `docs/sitemap.xml`, `docs/robots.txt`
- Cookie banner con Consent Mode GA

---

## 🧪 Test automatizzati
- Backend: `make test` (usa `npm test`), test in `backend/tests`
- Script curl: `backend/test_*.sh`
- CI esegue lint + test su push/PR

---

## 👩‍💻 Developer Experience
- Makefile: `make dev`, `make prod`, `make lint`, `make test`, `make audit`, `make audit-fix`
- Avvio rapido: `cp backend/.env.example backend/.env && (cd backend && npm ci && npm run dev)`




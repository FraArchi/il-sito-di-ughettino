# Supabase setup (per il sito in `docs/`)

Segui questi passi per configurare Supabase e collegare il frontend.

## 1) Crea un progetto Supabase
- Vai su https://app.supabase.com e crea un nuovo progetto.
- Copia **URL** e **anon public key** (serve per il frontend).

## 2) Crea le tabelle (SQL)
Esegui questi comandi nella console SQL di Supabase:

```sql
-- Newsletter
create table if not exists public.newsletter_subscribers (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  created_at timestamptz default now()
);

-- Contacts
create table if not exists public.contacts (
  id uuid default gen_random_uuid() primary key,
  name text,
  email text,
  message text,
  created_at timestamptz default now()
);

-- Uploads metadata
create table if not exists public.uploads (
  id uuid default gen_random_uuid() primary key,
  path text,
  url text,
  filename text,
  content_type text,
  size bigint,
  created_at timestamptz default now()
);
```

## 3) Storage bucket

* Vai in **Storage** → **Create new bucket**
* Nome: `uploads`
* Public: `Public` (scegli "public" se vuoi che i file siano raggiungibili tramite URL pubblico; altrimenti lascia privato e crea policy per accedere)

## 4) RLS policies (consigliato)

Se abiliti RLS sulle tabelle, usa queste policy per permettere inserimenti tramite la API anon key:

```sql
-- Esempio per newsletter_subscribers
alter table public.newsletter_subscribers enable row level security;
create policy "Allow anon insert" on public.newsletter_subscribers
  for insert
  with check (auth.role() = 'anon');

-- Per contacts
alter table public.contacts enable row level security;
create policy "Allow anon insert" on public.contacts
  for insert
  with check (auth.role() = 'anon');

-- Per uploads metadata
alter table public.uploads enable row level security;
create policy "Allow anon insert" on public.uploads
  for insert
  with check (auth.role() = 'anon');
```

> Nota: le policy devono essere adattate alla tua sicurezza. L'uso dell'**anon key** espone la possibilità di inserire record pubblicamente. Per più sicurezza crea endpoint server-side (es: backend Node) che usano la **service_role_key**.

## 5) Aggiungi le chiavi al frontend

Nella root `docs/js/supabase-client.js` sostituisci:

* `SUPABASE_URL` con il tuo URL
* `SUPABASE_ANON_KEY` con la `anon` key

## 6) Test locale

Apri `docs/index.html` con un server locale (es: `npx http-server docs` oppure VSCode Live Server) e prova:

* Iscrizione newsletter
* Invia messaggio contatto
* Caricamento file

---

### NOTE ALLE PATCH
- Ricorda di sostituire `SUPABASE_URL` e `SUPABASE_ANON_KEY` in `docs/js/supabase-client.js` con i tuoi valori.
- Se preferisci che io apra una PR direttamente (creo branch, aggiungo file e file di commit), dimmi e preparo i file per la PR.
- Posso anche generare versioni minimali dei file o integrare le chiamate verso il backend Node già presente nel repo (consigliato per sicurezza), fammi sapere se preferisci server-side.

# 🐾 Progetto: La Cuccia di Ugo

**Data di esportazione:** mer 13 ago 2025, 11:51:57, CEST

## � Statistiche del progetto

- **File totali:** 10
- **Righe di codice totali:** 1,188
- **File più grande:** `./index.html` (16.4 KB)

### 📁 Distribuzione per tipo di file

- **.html**: 1 file
- **.json**: 2 file
- **.md**: 1 file
- **.py**: 3 file
- **.txt**: 1 file
- **.xml**: 2 file

---

## 🗂️ Struttura del progetto

| 📁 Percorso | 📏 Dimensione | 🔧 Tipo |
|-------------|---------------|----------|
| `./SUPABASE-SETUP.md` | 2.9 KB | .md |
| `./check_index_links.py` | 2.0 KB | .py |
| `./fix_css_paths.py` | 1.0 KB | .py |
| `./fix_links_optimized.py` | 5.0 KB | .py |
| `./index.html` | 16.4 KB | .html |
| `./manifest.json` | 1.5 KB | .json |
| `./package.json` | 469 B | .json |
| `./robots.txt` | 70 B | .txt |
| `./rss.xml` | 5.3 KB | .xml |
| `./sitemap.xml` | 7.9 KB | .xml |

---

## 📄 Contenuto dei file

*(Ordinati per percorso crescente)*

### 📄 `./SUPABASE-SETUP.md`

**📏 Dimensione:** 2.9 KB | **📝 Righe:** 94

```md
# Supabase setup (per il sito in `docs/`)

Segui questi passi per configurare Supabase e collegare il frontend.

## 1) Crea un progetto Supabase
- Vai su https://app.supabase.com e crea un nuovo progetto.
- Copia **URL** e **anon public key** (serve per il frontend).

## 2) Crea le tabelle (SQL)
Esegui questi comandi nella console SQL di Supabase:

````sql
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
````

## 3) Storage bucket

* Vai in **Storage** → **Create new bucket**
* Nome: `uploads`
* Public: `Public` (scegli "public" se vuoi che i file siano raggiungibili tramite URL pubblico; altrimenti lascia privato e crea policy per accedere)

## 4) RLS policies (consigliato)

Se abiliti RLS sulle tabelle, usa queste policy per permettere inserimenti tramite la API anon key:

````sql
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
````

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

```

---

### 📄 `./check_index_links.py`

**📏 Dimensione:** 2.0 KB | **📝 Righe:** 60

```py
#!/usr/bin/env python3

import re

# Leggi il file index.html
with open('/home/fra/Bloghettino-ughettino/il-sito-di-ughettino/docs/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

print("🔍 Verifica link nell'index.html:")
print("="*50)

# Controlla link CSS che NON iniziano con .CSS/
css_links = re.findall(r'href="([^"]*\.css)"', content)
print("📄 Link CSS trovati:")
for link in css_links:
    status = "✅" if link.startswith('.CSS/') or link.startswith('http') else "❌ DA CORREGGERE"
    print(f"   {link} {status}")

# Controlla link JS che NON iniziano con .JS/
js_links = re.findall(r'src="([^"]*\.js)"', content)
print("\n⚡ Link JS trovati:")
for link in js_links:
    status = "✅" if link.startswith('.JS/') or link.startswith('http') else "❌ DA CORREGGERE"
    print(f"   {link} {status}")

# Controlla link HTML che NON iniziano con .HTML/ (esclusi index.html e link esterni)
html_links = re.findall(r'href="([^"]*\.html)"', content)
print("\n📄 Link HTML trovati:")
for link in html_links:
    if link == 'index.html' or link.startswith('http'):
        status = "✅ (file root o esterno)"
    elif link.startswith('.HTML/'):
        status = "✅"
    else:
        status = "❌ DA CORREGGERE"
    print(f"   {link} {status}")

print("\n🎯 Riepilogo:")
corrections_needed = []
for link in css_links:
    if not link.startswith('.CSS/') and not link.startswith('http'):
        corrections_needed.append(f"CSS: {link}")
        
for link in js_links:
    if not link.startswith('.JS/') and not link.startswith('http'):
        corrections_needed.append(f"JS: {link}")
        
for link in html_links:
    if (link != 'index.html' and 
        not link.startswith('http') and 
        not link.startswith('.HTML/')):
        corrections_needed.append(f"HTML: {link}")

if corrections_needed:
    print("❌ Correzioni necessarie:")
    for correction in corrections_needed:
        print(f"   - {correction}")
else:
    print("✅ Tutti i link sono corretti!")

```

---

### 📄 `./fix_css_paths.py`

**📏 Dimensione:** 1.0 KB | **📝 Righe:** 32

```py
import os
import re

html_dir = "/home/fra/Bloghettino-ughettino/il-sito-di-ughettino/docs/.HTML"

# Pattern per trovare i link CSS con percorso errato
pattern = r'href="\.CSS/'
replacement = 'href="../.CSS/'

files_processed = 0

for filename in os.listdir(html_dir):
    if filename.endswith('.html') and filename != 'HTMLlettere.html':  # Escludo HTMLlettere.html
        filepath = os.path.join(html_dir, filename)
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Sostituisce solo se trova il pattern errato
        if re.search(pattern, content):
            new_content = re.sub(pattern, replacement, content)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            print(f"✅ Corretto: {filename}")
            files_processed += 1
        else:
            print(f"⏭️ Nessuna modifica necessaria: {filename}")

print(f"\n🎉 Processati {files_processed} file HTML")

```

---

### 📄 `./fix_links_optimized.py`

**📏 Dimensione:** 5.0 KB | **📝 Righe:** 138

```py
import os
import re

def fix_all_links():
    """
    Script ottimizzato per aggiornare tutti i link nei file HTML
    basandosi sulla struttura reale delle cartelle
    """
    
    # Directory base
    docs_dir = os.getcwd()
    print(f"📂 Directory base: {docs_dir}")
    
    # Verifica le cartelle esistenti
    folders = {
        'css': '',
        'js': '', 
        'html': ''
    }
    
    for item in os.listdir(docs_dir):
        if os.path.isdir(os.path.join(docs_dir, item)):
            item_lower = item.lower()
            if 'css' in item_lower:
                folders['css'] = item
                print(f"🎨 Cartella CSS trovata: {item}")
            elif 'js' in item_lower:
                folders['js'] = item
                print(f"⚡ Cartella JS trovata: {item}")
            elif 'html' in item_lower:
                folders['html'] = item
                print(f"📄 Cartella HTML trovata: {item}")
    
    def update_single_file(file_path):
        """Aggiorna i link in un singolo file HTML"""
        print(f"\n🔧 Processando: {os.path.basename(file_path)}")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        changes = 0
        
        # 1. Aggiorna i CSS
        if folders['css']:
            def replace_css(match):
                nonlocal changes
                old_path = match.group(1)
                filename = os.path.basename(old_path)
                new_path = f"{folders['css']}/{filename}"
                print(f"   CSS: {old_path} → {new_path}")
                changes += 1
                return f'href="{new_path}"'
            
            content = re.sub(r'href="([^"]*\.css)"', replace_css, content)
            content = re.sub(r"href='([^']*\.css)'", lambda m: f"href='{folders['css']}/{os.path.basename(m.group(1))}'" if folders['css'] else m.group(0), content)
        
        # 2. Aggiorna i JS
        if folders['js']:
            def replace_js(match):
                nonlocal changes
                old_path = match.group(1)
                filename = os.path.basename(old_path)
                new_path = f"{folders['js']}/{filename}"
                print(f"   JS: {old_path} → {new_path}")
                changes += 1
                return f'src="{new_path}"'
            
            content = re.sub(r'src="([^"]*\.js)"', replace_js, content)
            content = re.sub(r"src='([^']*\.js)'", lambda m: f"src='{folders['js']}/{os.path.basename(m.group(1))}'" if folders['js'] else m.group(0), content)
        
        # 3. Aggiorna i link HTML (escludi http, #, mailto, index.html nella root)
        if folders['html']:
            def replace_html(match):
                nonlocal changes
                old_path = match.group(1)
                
                # Skip se è già nel formato corretto
                if folders['html'] and old_path.startswith(folders['html'] + '/'):
                    return match.group(0)
                
                # Skip index.html, link esterni, anchor
                if (old_path == 'index.html' or 
                    old_path.startswith('http') or 
                    old_path.startswith('#') or
                    old_path.startswith('mailto:')):
                    return match.group(0)
                
                filename = os.path.basename(old_path)
                new_path = f"{folders['html']}/{filename}"
                print(f"   HTML: {old_path} → {new_path}")
                changes += 1
                return f'href="{new_path}"'
            
            content = re.sub(r'href="([^"]*\.html)"', replace_html, content)
        
        # Salva solo se ci sono state modifiche
        if changes > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ {changes} modifiche salvate in {os.path.basename(file_path)}")
        else:
            print(f"⚪ Nessuna modifica necessaria per {os.path.basename(file_path)}")
    
    # Processa tutti i file HTML
    html_files = []
    
    # File HTML nella root
    for file in os.listdir(docs_dir):
        if file.endswith('.html') and os.path.isfile(os.path.join(docs_dir, file)):
            html_files.append(os.path.join(docs_dir, file))
    
    # File HTML nelle sottocartelle
    for root, _, files in os.walk(docs_dir):
        for file in files:
            if file.endswith('.html'):
                file_path = os.path.join(root, file)
                # Evita duplicati della root
                if file_path not in html_files:
                    html_files.append(file_path)
    
    print(f"\n🎯 Trovati {len(html_files)} file HTML da processare:")
    for file_path in html_files:
        print(f"   - {os.path.relpath(file_path, docs_dir)}")
    
    print("\n" + "="*50)
    print("🚀 INIZIO ELABORAZIONE")
    print("="*50)
    
    for file_path in html_files:
        update_single_file(file_path)
    
    print("\n" + "="*50)
    print("🎉 ELABORAZIONE COMPLETATA!")
    print("="*50)

if __name__ == "__main__":
    fix_all_links()

```

---

### 📄 `./index.html`

**📏 Dimensione:** 16.4 KB | **📝 Righe:** 413

```html
<!DOCTYPE html>
<html lang="it">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>La Cuccia di Ugo – Il cane più buono del mondo</title>
  <meta name="description" content="Il blog di Ugo, il cane più buono del mondo. Pensieri, avventure e tante leccatine. Un mondo dove ogni cane ha una cuccia e un umano che lo ama.">
  <link rel="stylesheet" href=".CSS/style.css">
  <link rel="stylesheet" href=".CSS/ugoAI.css">
  <link rel="manifest" href="manifest.json">
  <meta name="theme-color" content="#b97a56">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="Mondo Ugo">
  <link rel="apple-touch-icon" href="icons/icon-192x192.png">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "CreativeWork",
  "name": "La Cuccia di Ugo",
  "description": "Il blog di Ugo, il cane più buono del mondo. Pensieri, avventure e tante leccatine.",
  "url": "https://lacucciadiugo.it",
  "creator": {
    "@type": "Person",
    "name": "Francesco"
  },
  "about": {
    "@type": "Animal",
    "name": "Ugo",
    "species": "Canis lupus familiaris",
    "breed": "Cuore d'oro"
  },
  "image": "https://fraarchi.github.io/il-sito-di-ughettino/assets/Ughettino.png",
  "audience": {
    "@type": "Audience",
    "audienceType": "Amanti dei cani, cuccioli in cerca di ispirazione, umani che hanno bisogno di un po' di bontà"
  }
}
</script>
<!-- Favicon -->
<!-- Favicon -->
<link rel="icon" href="/assets/favico.png" type="image/png">
<link rel="shortcut icon" href="/assets/favico.png" type="image/png">

<!-- Icone multiple (opzionale, per dispositivi) -->
<link rel="apple-touch-icon" sizes="180x180" href="/assets/favico.png">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favico.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/favico.png">

<link rel="icon" href="/path/to/favicon.ico" type="image/x-icon">
<!-- Favicon -->
<link rel="icon" href="/favicon-ugo.ico" type="image/x-icon">
<link rel="shortcut icon" href="/favicon-ugo.ico" type="image/x-icon">

<!-- Favicon in PNG (per dimensioni multiple) -->
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-ugo.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-ugo.png">

<!-- Apple Touch Icon (per iPhone, iPad) -->
<link rel="apple-touch-icon" href="/apple-touch-icon.png">

<!-- Web App Manifest (opzionale, per PWA) -->
<link rel="manifest" href="/site.webmanifest">

  <!-- Google tag (gtag.js) con Consent Mode -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-M7R4KXNLWL"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }

    // Default: tutto negato finché l'utente non decide
    gtag('js', new Date());
    gtag('consent', 'default', {
      'ad_storage': 'denied',
      'analytics_storage': 'denied'
    });

    // Config base: tracking con privacy se consenso mancante
    gtag('config', 'G-M7R4KXNLWL', {
      'anonymize_ip': true,
      'allow_ad_personalization_signals': false
    });
  </script>


<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Il Meraviglioso Mondo di Ugo",
  "url": "https://lacucciadiugo.it/index.html",
  "description": "Scopri le avventure, le foto e i pensieri filosofici di Ugo, un Cane speciale.",
  "mainEntity": {
    "@type": "Organization",
    "name": "La Cuccia di Ugo",
    "url": "https://lacucciadiugo.it",
    "logo": "https://fraarchi.github.io/il-sito-di-ughettino/assets/Ughettino.png"
  }
}
</script>


</head>



<body>
  <!-- Header fisso con navigazione -->
  <header class="header-sticky">
    <div class="header-content">
      <a href="index.html" class="logo">🐾 Ugo</a>
      
      <!-- Menu hamburger per mobile -->
      <div class="menu-toggle" id="menu-toggle">
        <span></span>
        <span></span>
        <span></span>
      </div>
      
      <nav>
        <ul id="nav-menu">
          <li><a href="index.html" class="active">Home</a></li>
          <li><a href=".HTML/dashboard.html">Dashboard</a></li>
          <li><a href=".HTML/ugo-stories.html">Storie</a></li>
          <li><a href=".HTML/giochi.html">Giochi</a></li>
          <li><a href=".HTML/foto.html">Galleria</a></li>
          <li><a href=".HTML/amici.html">Amici</a></li>
          <li><a href=".HTML/quiz.html">Quiz</a></li>
          <li><a href=".HTML/photobooth.html">Photo Booth</a></li>
          <li><a href=".HTML/faq.html">FAQ</a></li>
          <li><a href=".HTML/logo.html">Logo</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main>
    <header class="ugo-header">
      <h1>Il meraviglioso mondo di Ugo 🐾</h1>
      <p>di Francesco Archidiacono - compagno di vita di Ugo</p>
    </header>

    <div class="ugo-bg">
      <div class="ugo-overlay">
        <h1>Chi è Ugo?</h1>
        <p>Ugo è un cane speciale. Non morde, non distrugge, non scava. Abbaia solo per salutare. Gli piace il sole, le carezze, e scrivere pensieri profondi dal divano. Il suo sogno? Un mondo dove ogni cane abbia una cuccia, un nome e un umano che lo ama.</p>
        <h2>Le giornate tipo di Ugo</h2>
        <p>Dal risveglio alle 7:00 con un grande sbadiglio... fino al tramonto con una lunga passeggiata. Ugo vive ogni momento con la gioia pura di chi sa apprezzare le piccole cose: una crocchetta, una carezza, un raggio di sole.</p>
      </div>
    </div>

   <article style="max-width: 600px; margin: 40px auto; text-align: center; padding: 20px; background: #fffaf0; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
  <h1 style="color: #d4a76a; font-size: 1.8em; margin-bottom: 12px;">📬 La Posta di Ugo</h1>
  <p style="color: #5c4b37; line-height: 1.7; font-style: italic;">
    Ugo non parla. Ma ascolta.  
    Con le orecchie basse, gli occhi socchiusi, la coda che scodinzola piano.  
    Se vuoi dirgli qualcosa — una carezza in parole, un pensiero, un ringraziamento — questa è la sua casella.
  </p>
  <p style="margin: 20px 0;">
    <a href=".HTML/HTMLlettere.html" style="color: #8b5a2b; text-decoration: none; font-weight: bold; border-bottom: 2px solid #d4a76a; padding-bottom: 2px;">
      Scrivi una lettera a Ugo →
    </a>
  </p>
  <p style="font-size: 0.9em; color: #777;">
    Le lettere più belle appariranno qui, nella sua bacheca del cuore.
  </p>
</article>

    <article>
      <h1>Un messaggio da Ugo 🐾</h1>
      <p><em>"Cari amici umani e canini, oggi vi parlo di leccatine, di code che scodinzolano, e di come il mondo è più bello se lo guardi da terra, con gli occhi di un cane. Ricordatevi: ogni giorno è un dono, ogni carezza è un tesoro, e ogni biscotto... beh, quello è pura felicità!"</em></p>
      <p style="text-align: right; font-style: italic;">– Con amore, Ugo 🐕</p>
    </article>

    <article>
      <h1>Avventura nella via sopra casa con Ugo 🌳</h1>
      <p>Oggi Ugo è andato nel bosco e ha scoperto il segreto della felicità: annusare tutto, correre libero e tornare sempre dal suo umano preferito...</p>
    </article>

    <article>
      <h1>I 5 motivi per cui Ugo è un filosofo 🧠</h1>
      <ul>
        <li>Medita fissando il vuoto</li>
        <li>Ignora il caos, ma mai un biscotto</li>
        <li>Ha la pazienza di un saggio</li>
        <li>...</li>
      </ul>
    </article>

    <hr>
    <section>
      <h1>La semantica secondo Ugo 🐾</h1>
      <p>“Semantica? Grr... suona difficile, ma è più facile di quanto sembri!” – Ugo</p>
      <h2>Cos'è l'HTML semantico?</h2>
      <p>Usiamo tag come &lt;main&gt;, &lt;section&gt;, &lt;article&gt; per dare significato ai contenuti.</p>

      <figure>
        <picture>
          <source srcset="Ugo.webp" type="image/webp">
          <img src="Ugo.jpeg" alt="Ugo, il cane che ama l'HTML" width="300" height="400" class="ridotta" loading="lazy">
        </picture>
        <figcaption>Ugo riflette sul significato dei tag semantici</figcaption>
      </figure>

      <p>L'HTML semantico aiuta anche i lettori con disabilità visive...</p>
    </section>

  <div class="scuro" style="background-image: url('IMMAGINI DI UGOO/golden con sfondo nero.jpg'); background-size: cover; background-position: center; color: #fff; padding: 2em;">
      <div style="background: rgba(0,0,0,0.5); padding: 1em; border-radius: 10px;">
        <h1>Perché Ugo è così bello?</h1>
        <p>Ugo è così bello perché è autentico, vero, puro.</p>
        <aside>
          <h2>Post correlati</h2>
          <h3>Fai una domanda a Ugo!</h3>
          <ul>
            <li><a href=".HTML/faq.html">FAQ</a></li> 
          </ul>
        </aside>
      </div>
    </div>

    <!-- Sezione Chi Sono -->
    <section id="chi-sono">
      <h2>Chi c'è dietro al sito?</h2>
      <div class="chi-sono-content">
        <picture>
          <source srcset="ugo-bg.webp" type="image/webp">
          <img src="ugo-bg.jpg" alt="Francesco Archidiacono con Ugo" loading="lazy" class="chi-sono-img">
        </picture>
        <div>
          <h3>Francesco & Ugo: Una storia di amicizia</h3>
          <p>Ciao! Sono Francesco, un appassionato di tecnologia e da qualche anno, il compagno di avventure di Ugo. Questo sito è nato per condividere la gioia che un cane come lui sa portare nella vita di tutti i giorni. Qui troverete le sue (e le nostre) storie, i suoi pensieri profondi e, spero, un po' di ispirazione.</p>
          <p>Il nostro obiettivo? Creare una piccola community di amanti dei cani e celebrare i nostri amici a quattro zampe.</p>
        </div>
      </div>
    </section>

    <!-- Newsletter CTA -->
    <section id="newsletter" class="cta-section">
      <h2>Le Avventure di Ugo, ogni settimana!</h2>
      <p>Iscriviti alla nostra newsletter per non perdere gli ultimi post, foto esclusive e consigli per il tuo cane.</p>
      <form id="newsletter-form">
        <input type="email" name="email" placeholder="La tua email migliore" required aria-label="Indirizzo email per la newsletter">
        <button type="submit">Iscrivimi!</button>
      </form>
      <p id="newsletter-feedback" class="feedback-message"></p>
    </section>

    <!-- Ugo Quiz CTA -->
    <section id="quiz-cta" class="cta-section">
      <h2>Quanto conosci Ugo?</h2>
      <p>Mettiti alla prova con il nostro quiz e scopri se sei un vero fan di Ugo!</p>
      <a href=".HTML/quiz.html" class="button-cta">Inizia il Quiz!</a>
    </section>

    <!-- Photo Booth CTA -->
    <section id="photobooth-cta" class="cta-section">
      <h2>Crea un capolavoro con il tuo cane!</h2>
      <p>Usa il nostro Photo Booth per aggiungere cornici e adesivi a tema Ugo alle foto del tuo amico a quattro zampe.</p>
      <a href=".HTML/photobooth.html" class="button-cta">Prova il Photo Booth!</a>
    </section>

    <!-- Sezione Commenti Disqus -->
    <section id="commenti">
      <h2>Dite la vostra!</h2>
      <div id="disqus_thread"></div>
    </section>

    <!-- Assets Section -->
    <section id="assets">
      <h2>Assets del sito</h2>
      <div class="assets-container">
         <article>
           <h3>Logo</h3>
           <figure>
             <img src="IMMAGINI DI UGOO/logo-ugo1.png" alt="Logo Ugo">
             <figcaption>Logo ufficiale di Ugo</figcaption>
           </figure>
         </article>
         <article>
           <h3>Favicon</h3>
           <p>Favicon in formato ICO e PNG:</p>
           <div>
             <img src="favicon-ugo.ico" alt="Favicon ICO" style="width:64px;height:64px;">
             <img src="favicon-ugo.png" alt="Favicon PNG" style="width:64px;height:64px;">
           </div>
         </article>
         <article>
           <h3>Apple Touch Icon</h3>
           <figure>
             <img src="apple-touch-icon.png" alt="Apple Touch Icon" style="width:120px;height:120px;">
             <figcaption>Apple touch icon per iOS</figcaption>
           </figure>
         </article>
         <article>
           <h3>Manifest</h3>
           <p>Il file <code>manifest.json</code> definisce le icone e le proprietà per la PWA del sito.</p>
           <a href="manifest.json" target="_blank">Visualizza manifest.json</a>
         </article>
      </div>
    </section>
    <!-- Fine Assets Section -->

    <footer>
      <div class="footer-content">
        <div class="footer-links">
          <a href=".HTML/chi-siamo.html">Chi Siamo</a>
          <a href=".HTML/contatti.html">Contatti</a>
          <a href=".HTML/privacy.html">Privacy Policy</a>
        </div>
        <p>&copy; 2025 Il Meraviglioso Mondo di Ugo. Creato con ❤️ da Francesco Archidiacono.</p>
        <p>Seguimi su Instagram: <a href="https://instagram.com/fra.archi" target="_blank" rel="noopener noreferrer">@fra.archi</a></p>
      </div>
    </footer>
  </main>

  <!-- 🍪 Banner consenso -->
  <div id="cookie-banner" style="position:fixed;bottom:32px;left:50%;transform:translateX(-50%);background:#ffe4b2;color:#2d1c0f;padding:56px 80px 48px 80px;border-radius:32px;box-shadow:0 8px 48px #b97a5655;z-index:9999;display:none;font-family:'Segoe UI',Arial,sans-serif;font-size:2em;font-weight:700;letter-spacing:0.03em;min-width:520px;max-width:90vw;">
    <span style="font-size:1.2em;">🍪</span> Questo sito usa i cookie per migliorare la tua esperienza.<br>
    <button id="cookie-accept" style="background:#b97a56;color:#fff;border:none;border-radius:12px;padding:16px 32px;margin-top:18px;cursor:pointer;font-weight:bold;font-size:1.15em;box-shadow:0 2px 8px #b97a5633;">Accetta</button>
  </div>

  <script>
    function setCookie(name, value, days) {
      const expires = new Date(Date.now() + days * 864e5).toUTCString();
      document.cookie = name + "=" + encodeURIComponent(value) + "; expires=" + expires + "; path=/; SameSite=Lax; Secure";
    }

    function getCookie(name) {
      const value = "; " + document.cookie;
      const parts = value.split("; " + name + "=");
      if (parts.length === 2) return decodeURIComponent(parts.pop().split(";").shift());
    }

    // Mostra il banner solo se non c'è il cookie
    if (!getCookie('cookie_consent')) {
      document.getElementById('cookie-banner').style.display = 'block';
    }

    document.getElementById('cookie-accept').onclick = function () {
      setCookie('cookie_consent', 'accepted', 365);
      document.getElementById('cookie-banner').style.display = 'none';

      // Aggiorna lo stato del consenso
      if (typeof gtag === 'function') {
        gtag('consent', 'update', {
          'ad_storage': 'granted',
          'analytics_storage': 'granted'
        });

        // Ora si può eseguire il config
        gtag('config', 'G-M7R4KXNLWL');
      }
    };
  </script>
  <script src=".JS/cookie-demo.js"></script>
  <script src=".JS/notifications.js"></script>
  
  <!-- Menu hamburger script -->
  <script>
    document.getElementById('menu-toggle').addEventListener('click', function() {
      const navMenu = document.getElementById('nav-menu');
      const menuToggle = document.getElementById('menu-toggle');
      
      navMenu.classList.toggle('active');
      menuToggle.classList.toggle('active');
    });
    
    // Chiudi menu quando si clicca su un link
    document.querySelectorAll('nav a').forEach(link => {
      link.addEventListener('click', () => {
        document.getElementById('nav-menu').classList.remove('active');
        document.getElementById('menu-toggle').classList.remove('active');
      });
    });
  </script>

  <!-- Disqus Script -->
  <script>
    var disqus_config = function () {
      this.page.url = window.location.href;
      this.page.identifier = window.location.pathname;
    };
    (function() {
      var d = document, s = d.createElement('script');
      s.src = 'https://il-sito-di-ughettino.disqus.com/embed.js';
      s.setAttribute('data-timestamp', +new Date());
      (d.head || d.body).appendChild(s);
    })();
  </script>
  <noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript">comments powered by Disqus.</a></noscript>

  <!-- Newsletter Form Script -->
  <script>
    document.getElementById('newsletter-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const feedback = document.getElementById('newsletter-feedback');
      feedback.textContent = 'Grazie per esserti iscritto!';
      feedback.style.color = 'green';
      setTimeout(() => {
        feedback.textContent = '';
      }, 3000);
      this.reset();
    });
  </script>
  ugo che dorme!
  
  <!-- Ugo AI Companion -->
  <script src=".JS/ugoAICompanion.js"></script>
</body>
</html>
.0,1
```

---

### 📄 `./manifest.json`

**📏 Dimensione:** 1.5 KB | **📝 Righe:** 71

```json
{
  "name": "La Cuccia Di Ugo",
  "short_name": "Cuccia Ugo",
  "description": "Scopri le avventure di Ugo attraverso storie interattive, quiz e molto altro!",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f8f6f0",
  "theme_color": "#b97a56",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/favicon-ugo.ico",
      "sizes": "48x48",
      "type": "image/x-icon"
    },
    {
      "src": "/favicon-ugo.png",
      "sizes": "16x16",
      "type": "image/png"
    },
    {
      "src": "icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "icons/icon-1024x1536.png",
      "sizes": "1024x1536",
      "type": "image/png"
    },
    {
      "src": "/favicon-ugo.png",
      "sizes": "32x32",
      "type": "image/png"
    }
  ],
  "categories": ["entertainment", "lifestyle", "education"],
  "screenshots": [
    {
      "src": "screenshots/home.png",
      "sizes": "1280x720",
      "type": "image/png"
    }
  ]
}

```

---

### 📄 `./package.json`

**📏 Dimensione:** 469 B | **📝 Righe:** 19

```json
{
  "name": "ugo-frontend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build:css": "tailwindcss -i ./src/styles/main.css -o ./assets/tw.css --minify",
    "build:images": "node ./tools/convert-images.mjs",
    "build": "npm run build:css && npm run build:images"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.41",
    "sharp": "^0.33.5",
    "tailwindcss": "^3.4.10",
    "glob": "^11.0.0"
  }
}

```

---

### 📄 `./robots.txt`

**📏 Dimensione:** 70 B | **📝 Righe:** 5

```txt
User-agent: *
Allow: /

Sitemap: https://lacucciadiugo.it/sitemap.xml

```

---

### 📄 `./rss.xml`

**📏 Dimensione:** 5.3 KB | **📝 Righe:** 90

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Le Storie Interattive di Ugo</title>
    <description>Scopri le avventure quotidiane di Ugo, un Golden Retriever filosofo che ci insegna a vivere il presente attraverso storie autentiche e momenti di pura felicità.</description>
    <link>https://lacucciadiugo.it</link>
    <language>it-IT</language>
    <copyright>© 2025 Francesco Archidiacono - La Cuccia di Ugo</copyright>
    <managingEditor>info@lacucciadiugo.it (Francesco Archidiacono)</managingEditor>
    <webMaster>info@lacucciadiugo.it (Francesco Archidiacono)</webMaster>
    <lastBuildDate>Tue, 12 Aug 2025 10:00:00 +0200</lastBuildDate>
    <pubDate>Tue, 12 Aug 2025 10:00:00 +0200</pubDate>
    <generator>La Cuccia di Ugo RSS Generator</generator>
    <image>
      <url>https://lacucciadiugo.it/Ugo.jpeg</url>
      <title>Le Storie Interattive di Ugo</title>
      <link>https://lacucciadiugo.it</link>
      <width>144</width>
      <height>144</height>
    </image>
    <atom:link href="https://lacucciadiugo.it/rss.xml" rel="self" type="application/rss+xml" />

    <!-- Storia 1: Una passeggiata speciale -->
    <item>
      <title>Una Passeggiata Speciale nel Bosco di Autunno</title>
      <link>https://lacucciadiugo.it/ugo-stories.html#passeggiata-autunno</link>
      <description><![CDATA[Tra profumi di bosco e code che scodinzolano, Ugo ci accompagna in una passeggiata autunnale che diventa una lezione di vita. Piccole grandi felicità che scaldano il cuore.]]></description>
      <enclosure url="https://lacucciadiugo.it/ugo-bg.jpg" type="image/jpeg" length="245760" />
      <pubDate>Mon, 11 Aug 2025 09:30:00 +0200</pubDate>
      <guid isPermaLink="true">https://lacucciadiugo.it/ugo-stories.html#passeggiata-autunno</guid>
      <dc:creator>Francesco Archidiacono</dc:creator>
      <category>Avventure</category>
      <category>Natura</category>
    </item>

    <!-- Storia 2: Momenti di quiete -->
    <item>
      <title>Momenti di Quiete: La Filosofia di Ugo</title>
      <link>https://lacucciadiugo.it/ugo-stories.html#momenti-quiete</link>
      <description><![CDATA[Un raggio di sole, un prato morbido, un respiro profondo. Ugo ci insegna l'arte di fermarsi e apprezzare la bellezza dei momenti semplici, quelli che rendono la vita straordinaria.]]></description>
      <enclosure url="https://lacucciadiugo.it/ugo-curioso.jpeg" type="image/jpeg" length="198432" />
      <pubDate>Sun, 10 Aug 2025 16:45:00 +0200</pubDate>
      <guid isPermaLink="true">https://lacucciadiugo.it/ugo-stories.html#momenti-quiete</guid>
      <dc:creator>Francesco Archidiacono</dc:creator>
      <category>Filosofia</category>
      <category>Riflessioni</category>
    </item>

    <!-- Storia 3: Giochi e risate -->
    <item>
      <title>Giochi e Risate: L'Importanza del Divertimento</title>
      <link>https://lacucciadiugo.it/ugo-stories.html#giochi-risate</link>
      <description><![CDATA[Il divertimento è più bello se condiviso. Ugo ci ricorda che ridere e giocare non sono privilegi dell'infanzia, ma medicine per l'anima che non dovremmo mai smettere di prendere.]]></description>
      <enclosure url="https://lacucciadiugo.it/ugo-buffo.jpeg" type="image/jpeg" length="176256" />
      <pubDate>Sat, 09 Aug 2025 14:20:00 +0200</pubDate>
      <guid isPermaLink="true">https://lacucciadiugo.it/ugo-stories.html#giochi-risate</guid>
      <dc:creator>Francesco Archidiacono</dc:creator>
      <category>Divertimento</category>
      <category>Vita Quotidiana</category>
    </item>

    <!-- Storia 4: La curiosità di Ugo -->
    <item>
      <title>La Curiosità di Ugo: Esplorare con gli Occhi di un Bambino</title>
      <link>https://lacucciadiugo.it/ugo-stories.html#curiosita-esplorare</link>
      <description><![CDATA[Con il muso sempre pronto ad annusare nuovi profumi e gli occhi che brillano di meraviglia, Ugo ci insegna che la curiosità è il motore della felicità e della scoperta continua.]]></description>
      <enclosure url="https://lacucciadiugo.it/ugo-occhi.jpeg" type="image/jpeg" length="203840" />
      <pubDate>Fri, 08 Aug 2025 11:15:00 +0200</pubDate>
      <guid isPermaLink="true">https://lacucciadiugo.it/ugo-stories.html#curiosita-esplorare</guid>
      <dc:creator>Francesco Archidiacono</dc:creator>
      <category>Curiosità</category>
      <category>Scoperte</category>
    </item>

    <!-- Storia 5: Un amico dal cuore grande -->
    <item>
      <title>Un Amico dal Cuore Grande: L'Amore Incondizionato</title>
      <link>https://lacucciadiugo.it/ugo-stories.html#cuore-grande</link>
      <description><![CDATA[Ugo ci dimostra ogni giorno cosa significa amare senza condizioni. La sua lealtà e il suo affetto sincero sono un esempio di come dovrebbero essere tutti i rapporti autentici.]]></description>
      <enclosure url="https://lacucciadiugo.it/ugo-francesco.jpeg" type="image/jpeg" length="189632" />
      <pubDate>Thu, 07 Aug 2025 18:30:00 +0200</pubDate>
      <guid isPermaLink="true">https://lacucciadiugo.it/ugo-stories.html#cuore-grande</guid>
      <dc:creator>Francesco Archidiacono</dc:creator>
      <category>Amicizia</category>
      <category>Amore</category>
    </item>

  </channel>
</rss>

```

---

### 📄 `./sitemap.xml`

**📏 Dimensione:** 7.9 KB | **📝 Righe:** 266

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!-- 
  Sitemap ottimizzata per lacucciadiugo.it
  Focus SEO: "storie di cani blog", "avventure cane italiano", "community amanti cani"
  Target: 35 URL strategici per massimizzare ranking e crawling
-->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <!-- PRIORITY 1.0 - Homepage (Landing page principale) -->
  <url>
    <loc>https://lacucciadiugo.it/</loc>
    <lastmod>2025-08-13T08:32:55+00:00</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- PRIORITY 0.9 - Sezioni Storie e Contenuti Principali -->
  <url>
    <loc>https://lacucciadiugo.it/ugo-stories.html</loc>
    <lastmod>2025-08-13T08:32:55+00:00</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- PRIORITY 0.8 - Funzionalità Interattive e Community -->
  <url>
    <loc>https://lacucciadiugo.it/quiz.html</loc>
    <lastmod>2025-08-13T08:32:55+00:00</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>https://lacucciadiugo.it/photobooth.html</loc>
    <lastmod>2025-08-13T08:32:55+00:00</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>https://lacucciadiugo.it/ugo-ai.html</loc>
    <lastmod>2025-08-13T08:32:55+00:00</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- PRIORITY 0.7 - Utility e Servizi -->
  <url>
    <loc>https://lacucciadiugo.it/faq.html</loc>
    <lastmod>2025-08-13T08:32:55+00:00</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <url>
    <loc>https://lacucciadiugo.it/rss.xml</loc>
    <lastmod>2025-08-13T08:32:55+00:00</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>

  <!-- PRIORITY 0.6 - Dashboard e Analytics (Contenuti Evergreen) -->
  <url>
    <loc>https://lacucciadiugo.it/dashboard.html</loc>
    <lastmod>2025-08-13T08:32:55+00:00</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>

  <url>
    <loc>https://lacucciadiugo.it/analytics.html</loc>
    <lastmod>2025-08-13T08:32:55+00:00</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>

  <!-- PRIORITY 0.5 - Contenuti Specifici e Nicchie -->
  <!-- Storie individuali per long-tail SEO -->
  <url>
    <loc>https://lacucciadiugo.it/ugo-stories.html#passeggiata-bosco-autunnale</loc>
    <lastmod>2025-08-13T08:32:55+00:00</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>

  <url>
    <loc>https://lacucciadiugo.it/ugo-stories.html#filosofia-canina-presente</loc>
    <lastmod>2025-08-13T08:32:55+00:00</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>

  <url>
    <loc>https://lacucciadiugo.it/ugo-stories.html#avventure-quotidiane-ugo</loc>
    <lastmod>2025-08-13T08:32:55+00:00</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>

  <url>
    <loc>https://lacucciadiugo.it/ugo-stories.html#curiosita-cane-esploratore</loc>
    <lastmod>2025-08-13T08:32:55+00:00</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>

  <url>
    <loc>https://lacucciadiugo.it/ugo-stories.html#amicizia-uomo-cane</loc>
    <lastmod>2025-08-13T08:32:55+00:00</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>

  <!-- Quiz specifici per engagement -->
  <url>
    <loc>https://lacucciadiugo.it/quiz.html#test-personalita-cane</loc>
    <lastmod>2025-08-13T08:32:55+00:00</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>

  <url>
    <loc>https://lacucciadiugo.it/quiz.html#quanto-conosci-ugo</loc>
    <lastmod>2025-08-13T08:32:55+00:00</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>

  <!-- PRIORITY 0.4 - Archivi e Categorie Secondarie -->
  <!-- Sezioni fotogallery per visual SEO -->
  <url>
    <loc>https://lacucciadiugo.it/photobooth.html#galleria-foto-ugo</loc>
    <lastmod>2025-08-13T08:32:55+00:00</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.4</priority>
  </url>

  <url>
    <loc>https://lacucciadiugo.it/photobooth.html#foto-community-cani</loc>
    <lastmod>2025-08-13T08:32:55+00:00</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.4</priority>
  </url>

  <!-- Contenuti stagionali -->
  <url>
    <loc>https://lacucciadiugo.it/ugo-stories.html#passeggiate-bosco-primavera</loc>
    <lastmod>2025-08-13T08:32:55+00:00</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
  </url>

  <url>
    <loc>https://lacucciadiugo.it/ugo-stories.html#avventure-estate-2025</loc>
    <lastmod>2025-08-13T08:32:55+00:00</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
  </url>

  <!-- Consigli evergreen per long-tail -->
  <url>
    <loc>https://lacucciadiugo.it/ugo-ai.html#consigli-vita-cane-felice</loc>
    <lastmod>2025-08-13T08:32:55+00:00</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>

  <url>
    <loc>https://lacucciadiugo.it/ugo-ai.html#lezioni-cane-filosofo</loc>
    <lastmod>2025-08-13T08:32:55+00:00</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>

  <!-- Community features -->
  <url>
    <loc>https://lacucciadiugo.it/faq.html#community-amanti-cani</loc>
    <lastmod>2025-08-13T08:32:55+00:00</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>

  <url>
    <loc>https://lacucciadiugo.it/faq.html#partecipa-storie-ugo</loc>
    <lastmod>2025-08-13T08:32:55+00:00</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>

  <!-- Geo-targeting (assumendo location italiana) -->
  <url>
    <loc>https://lacucciadiugo.it/ugo-stories.html#storie-cani-italia</loc>
    <lastmod>2025-08-13T08:32:55+00:00</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>

  <url>
    <loc>https://lacucciadiugo.it/ugo-stories.html#passeggiate-cani-natura</loc>
    <lastmod>2025-08-13T08:32:55+00:00</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>

  <!-- User-generated content placeholders -->
  <url>
    <loc>https://lacucciadiugo.it/photobooth.html#foto-utenti-community</loc>
    <lastmod>2025-08-13T08:32:55+00:00</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.4</priority>
  </url>

  <url>
    <loc>https://lacucciadiugo.it/ugo-stories.html#testimonianze-proprietari</loc>
    <lastmod>2025-08-13T08:32:55+00:00</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.4</priority>
  </url>

  <!-- Newsletter e engagement -->
  <url>
    <loc>https://lacucciadiugo.it/index.html#newsletter-storie-ugo</loc>
    <lastmod>2025-08-13T08:32:55+00:00</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.4</priority>
  </url>

  <!-- Archivi temporali per crawling depth -->
  <url>
    <loc>https://lacucciadiugo.it/ugo-stories.html#storie-agosto-2025</loc>
    <lastmod>2025-08-13T08:32:55+00:00</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>

  <url>
    <loc>https://lacucciadiugo.it/ugo-stories.html#storie-luglio-2025</loc>
    <lastmod>2025-08-13T08:32:55+00:00</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>

  <!-- PRIORITY 0.3 - Pagine Legali e Documenti -->
  <url>
    <loc>https://lacucciadiugo.it/privacy-policy.html</loc>
    <lastmod>2025-08-13T08:32:55+00:00</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>

  <!-- Documenti di supporto -->
  <url>
    <loc>https://lacucciadiugo.it/faq.html#termini-uso</loc>
    <lastmod>2025-08-13T08:32:55+00:00</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>

  <url>
    <loc>https://lacucciadiugo.it/faq.html#cookie-policy</loc>
    <lastmod>2025-08-13T08:32:55+00:00</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>

</urlset>
```

---


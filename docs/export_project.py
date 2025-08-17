# export_project.py
import os
import re
from datetime import datetime

# Configurazione
ROOT_DIR = '..'  # Cambia per includere l'intero progetto (parent directory)
OUTPUT_FILE = 'progetto-lacucciadiugo-COMPLETO.md'

# Estensioni da includere (MOLTO più ampie)
INCLUDE_EXTS = [
    # Web Development
    '.html', '.css', '.js', '.jsx', '.ts', '.tsx', '.json', '.xml', '.svg',
    # Backend & Config
    '.py', '.php', '.rb', '.java', '.go', '.rs', '.c', '.cpp', '.h',
    # Config & Data
    '.yml', '.yaml', '.toml', '.ini', '.conf', '.config', '.env', '.env.example',
    # Documentation
    '.md', '.txt', '.rst', '.asciidoc',
    # Database & Scripts
    '.sql', '.prisma', '.sh', '.bash', '.bat', '.ps1',
    # Docker & Infrastructure  
    '.dockerfile', 'Dockerfile', '.dockerignore', 'docker-compose.yml',
    # Package managers
    '.lock', 'package.json', 'requirements.txt', 'Cargo.toml', 'pom.xml',
    # Misc important files
    '.gitignore', '.nojekyll', 'CNAME', 'robots.txt', 'sitemap.xml', 'manifest.json'
]

# Escludi file specifici (ridotto al minimo)
EXCLUDE_FILES = [
    'progetto-lacucciadiugo-COMPLETO.md', 'progetto-lacucciadiugo.md', 'export_project.py', 
    'Thumbs.db', '.DS_Store', 'desktop.ini',
    # File binari comuni
    '.ico', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.pdf'
]

# Escludi cartelle specifiche (ridotte)
EXCLUDE_DIRS = [
    '.git', '__pycache__', 'node_modules', '.vscode', '.idea', 
    'dist', 'build', '.next', 'coverage', '.nyc_output'
]

# Limite dimensione file aumentato
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB

# Mappa della struttura e statistiche
structure = []
content = []
stats = {
    'total_files': 0,
    'total_lines': 0,
    'file_types': {},
    'largest_file': ('', 0)
}

def get_file_size(filepath):
    """Ottiene la dimensione del file in bytes"""
    try:
        return os.path.getsize(filepath)
    except OSError:
        return 0

def is_text_file(filepath):
    """Verifica se un file è di testo leggibile"""
    try:
        # Controlla dimensione del file
        if get_file_size(filepath) > MAX_FILE_SIZE:
            return False
            
        with open(filepath, 'r', encoding='utf-8') as file:
            file.read(1024)
        return True
    except (UnicodeDecodeError, OSError):
        return False

def format_file_size(size_bytes):
    """Formatta la dimensione del file in modo leggibile"""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"

def should_include_file(filepath):
    """Determina se un file dovrebbe essere incluso nell'esportazione"""
    filename = os.path.basename(filepath)
    
    # Escludi file specifici
    if filename in EXCLUDE_FILES:
        return False
    
    # Includi file senza estensione importanti (Dockerfile, Makefile, ecc.)
    important_no_ext = [
        'Dockerfile', 'Makefile', 'CNAME', 'LICENSE', 'CHANGELOG', 
        'CONTRIBUTING', 'AUTHORS', 'INSTALL', 'TODO'
    ]
    if filename in important_no_ext:
        return True
    
    # Includi file con estensioni specifiche
    _, ext = os.path.splitext(filename)
    if ext.lower() in INCLUDE_EXTS:
        return True
        
    # Includi file che iniziano con punto importanti
    if filename.startswith('.') and filename in [
        '.gitignore', '.env.example', '.dockerignore', '.nojekyll',
        '.eslintrc', '.prettierrc', '.babelrc', '.editorconfig'
    ]:
        return True
    
    return False

def add_file(filepath):
    """Aggiunge un file alla struttura e al contenuto"""
    if not os.path.isfile(filepath):
        return
        
    if not should_include_file(filepath):
        return
        
    if not is_text_file(filepath):
        return

    filename = os.path.basename(filepath)
    _, ext = os.path.splitext(filename)

    # Aggiorna statistiche
    stats['total_files'] += 1
    file_size = get_file_size(filepath)
    
    if file_size > stats['largest_file'][1]:
        stats['largest_file'] = (filepath, file_size)
    
    ext_key = ext.lower() if ext else 'no_extension'
    if ext_key in stats['file_types']:
        stats['file_types'][ext_key] += 1
    else:
        stats['file_types'][ext_key] = 1

    structure.append({
        'path': filepath.replace('\\', '/'),
        'size': file_size,
        'ext': ext.lower() if ext else 'text'
    })

    try:
        with open(filepath, 'r', encoding='utf-8') as file:
            file_content = file.read()
            stats['total_lines'] += file_content.count('\n') + 1
    except (UnicodeDecodeError, OSError) as e:
        file_content = f"[Errore lettura file: {e}]"

    # Escaping per Markdown e limitazione lunghezza
    file_content_escaped = file_content.replace('```', '````')
    
    # Se il file è troppo lungo, tronca con informazione
    max_lines = 2000  # Aumentato il limite
    lines = file_content_escaped.split('\n')
    if len(lines) > max_lines:
        file_content_escaped = '\n'.join(lines[:max_lines]) + f"\n\n... [File troncato - mostrate solo le prime {max_lines} righe su {len(lines)} totali] ..."

    content.append({
        'path': filepath.replace('\\', '/'),
        'ext': ext[1:] if ext else 'text',
        'content': file_content_escaped,
        'size': file_size,
        'lines': len(lines)
    })

def scan_directory(directory):
    """Scansiona ricorsivamente una directory"""
    print(f"🔍 Scansionando: {directory}")
    
    for root, dirs, files in os.walk(directory):
        # Mostra progresso
        current_path = root.replace('\\', '/')
        print(f"  📁 {current_path}")
        
        # Rimuovi cartelle da escludere ma mantieni quelle importanti
        original_dirs = dirs.copy()
        dirs[:] = [d for d in dirs if not d.startswith('.') or d in ['.github']]
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        
        if len(dirs) != len(original_dirs):
            excluded = set(original_dirs) - set(dirs)
            print(f"    ⏭️  Saltate cartelle: {', '.join(excluded)}")
        
        # Conta i file in questa cartella
        valid_files = 0
        for file in files:
            filepath = os.path.join(root, file)
            if should_include_file(filepath) and is_text_file(filepath):
                valid_files += 1
                add_file(filepath)
        
        if valid_files > 0:
            print(f"    ✅ Trovati {valid_files} file validi")

def generate_tree_structure():
    """Genera una rappresentazione ad albero della struttura"""
    tree_lines = []
    sorted_files = sorted([item['path'] for item in structure])
    
    for filepath in sorted_files:
        # Calcola la profondità del file
        depth = filepath.count('/')
        indent = '  ' * depth
        filename = os.path.basename(filepath)
        tree_lines.append(f"{indent}- 📄 `{filename}`")
    
    return tree_lines

print("🚀 ESPORTAZIONE COMPLETA DEL PROGETTO LA CUCCIA DI UGO")
print("=" * 60)

# Pulisci output precedente
if os.path.exists(OUTPUT_FILE):
    os.remove(OUTPUT_FILE)
    print(f"🗑️  Rimosso file precedente: {OUTPUT_FILE}")

print(f"📂 Directory root: {os.path.abspath(ROOT_DIR)}")
print(f"📄 File output: {OUTPUT_FILE}")
print()

scan_directory(ROOT_DIR)

print()
print("📊 STATISTICHE FINALI:")
print(f"📄 File totali processati: {stats['total_files']}")
print(f"📝 Righe totali: {stats['total_lines']:,}")

if stats['total_files'] == 0:
    print("❌ Nessun file trovato! Controlla i criteri di inclusione.")
    exit(1)

# Ordina i contenuti per percorso
structure.sort(key=lambda x: x['path'])
content.sort(key=lambda x: x['path'])

# Genera il Markdown
print("📝 Generazione del file Markdown...")

with open(OUTPUT_FILE, 'w', encoding='utf-8') as output_file:
    # Header principale
    output_file.write("# 🐾 Progetto: La Cuccia di Ugo\n\n")
    output_file.write(f"**Data di esportazione:** {os.popen('date').read().strip()}\n\n")
    
    # Statistiche del progetto
    output_file.write("## � Statistiche del progetto\n\n")
    output_file.write(f"- **File totali:** {stats['total_files']}\n")
    output_file.write(f"- **Righe di codice totali:** {stats['total_lines']:,}\n")
    output_file.write(f"- **File più grande:** `{stats['largest_file'][0]}` ({format_file_size(stats['largest_file'][1])})\n\n")
    
    # Distribuzione per tipo di file
    output_file.write("### 📁 Distribuzione per tipo di file\n\n")
    for ext, count in sorted(stats['file_types'].items()):
        ext_display = ext if ext else 'senza estensione'
        output_file.write(f"- **{ext_display}**: {count} file\n")
    
    output_file.write("\n---\n\n")
    
    # Struttura del progetto (tabella)
    output_file.write("## 🗂️ Struttura del progetto\n\n")
    output_file.write("| 📁 Percorso | 📏 Dimensione | 🔧 Tipo |\n")
    output_file.write("|-------------|---------------|----------|\n")
    
    for item in structure:
        path_display = item['path']
        size_display = format_file_size(item['size'])
        ext_display = item['ext'] if item['ext'] else 'text'
        output_file.write(f"| `{path_display}` | {size_display} | {ext_display} |\n")
    
    output_file.write("\n---\n\n")
    
    # Contenuto dei file
    output_file.write("## 📄 Contenuto dei file\n\n")
    output_file.write("*(Ordinati per percorso crescente)*\n\n")
    
    for item in content:
        output_file.write(f"### 📄 `{item['path']}`\n\n")
        output_file.write(f"**📏 Dimensione:** {format_file_size(item['size'])} | ")
        output_file.write(f"**📝 Righe:** {item['lines']:,}\n\n")
        output_file.write(f"```{item['ext']}\n{item['content']}\n```\n\n")
        output_file.write("---\n\n")

print(f"✅ Esportazione completata!")
print(f"📄 File generato: {OUTPUT_FILE}")
print(f"📊 Processati {stats['total_files']} file")
print(f"📝 Totale righe: {stats['total_lines']:,}")
print(f"💾 Dimensione output: {format_file_size(get_file_size(OUTPUT_FILE))}")
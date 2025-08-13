import os
import re

# Percorso base (cartella docs)
BASE_DIR = os.path.join(os.getcwd(), "docs")

# Funzione per aggiornare i link
def update_paths_in_html(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Aggiorna i CSS
    content = re.sub(
        r'href=["\']([^"\']+\.css)["\']',
        lambda m: print(f"CSS trovato: {m.group(1)}") or f'href="CSS/{os.path.basename(m.group(1))}"',
        content
    )
    # Aggiorna i JS
    content = re.sub(
        r'src=["\']([^"\']+\.js)["\']',
        lambda m: print(f"JS trovato: {m.group(1)}") or f'src="JS/{os.path.basename(m.group(1))}"',
        content
    )
    # Aggiorna i link HTML
    content = re.sub(
        r'href=["\']((?!http)(?!#)[^"\']+\.html)["\']',
        lambda m: print(f"HTML trovato: {m.group(1)}") or (f'href="HTML/{os.path.basename(m.group(1))}"' if "index.html" not in m.group(1) else m.group(0)),
        content
    )

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"✅ Aggiornato: {file_path}")

# Scansiona tutti gli HTML nella cartella docs
for root, dirs, files in os.walk(BASE_DIR):
    for filename in files:
        if filename.lower().endswith(".html"):
            update_paths_in_html(os.path.join(root, filename))

print("\n🎉 Tutti i link aggiornati!")

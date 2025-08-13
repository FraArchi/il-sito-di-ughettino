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

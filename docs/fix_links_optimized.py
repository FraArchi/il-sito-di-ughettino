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

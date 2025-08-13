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

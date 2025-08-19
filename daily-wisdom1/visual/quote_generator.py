
"""
🐕 La Cuccia di Ugo - Quote Generator
Generazione automatica di belle immagini per le saggezze
"""

import os
import json
import random
from datetime import datetime
from typing import Dict, List, Tuple, Optional, Any
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
import requests
from io import BytesIO

from config.settings import settings

class QuoteGenerator:
    """Generatore di immagini belle per le quote di Ugo"""
    
    def __init__(self):
        self.assets_dir = settings.ASSETS_DIR
        self.output_dir = self.assets_dir / "output"
        self.fonts_dir = self.assets_dir / "fonts"
        self.images_dir = self.assets_dir / "images"
        
        # Crea directory se non esistono
        for directory in [self.output_dir, self.fonts_dir, self.images_dir]:
            directory.mkdir(parents=True, exist_ok=True)
        
        self.visual_config = settings.VISUAL_CONFIG
        self.unsplash_enabled = bool(settings.UNSPLASH_ACCESS_KEY)
        
        # Inizializza fonts
        self._setup_fonts()
        
        # Carica templates design
        self.design_templates = self._load_design_templates()
    
    def create_quote_card(self, wisdom_text: str, context: Dict[str, Any] = None) -> str:
        """Crea una bella immagine per la saggezza"""
        context = context or {}
        
        # Seleziona template appropriato
        template = self._select_template(wisdom_text, context)
        
        # Ottieni immagine di sfondo
        background = self._get_background_image(context, template)
        
        # Crea la composizione
        final_image = self._compose_quote_image(wisdom_text, background, template, context)
        
        # Salva l'immagine
        output_path = self._save_image(final_image, context)
        
        print(f"🖼️ Immagine creata: {output_path}")
        return str(output_path)
    
    def _setup_fonts(self):
        """Setup e download fonts necessari"""
        self.fonts = {}
        
        # Font di fallback del sistema
        fallback_fonts = [
            "/System/Library/Fonts/Arial.ttf",  # macOS
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",  # Linux
            "C:/Windows/Fonts/arial.ttf",  # Windows
        ]
        
        # Cerca font disponibili
        system_font = None
        for font_path in fallback_fonts:
            if os.path.exists(font_path):
                system_font = font_path
                break
        
        if not system_font:
            print("⚠️ Font di sistema non trovato, uso font di default PIL")
        
        # Carica font in diverse dimensioni
        font_sizes = {
            'title': 42,
            'subtitle': 32,
            'body': 24,
            'small': 18,
            'tiny': 14
        }
        
        for name, size in font_sizes.items():
            try:
                if system_font:
                    self.fonts[name] = ImageFont.truetype(system_font, size)
                else:
                    self.fonts[name] = ImageFont.load_default()
            except Exception as e:
                print(f"⚠️ Errore caricamento font {name}: {e}")
                self.fonts[name] = ImageFont.load_default()
    
    def _load_design_templates(self) -> List[Dict[str, Any]]:
        """Carica template di design predefiniti"""
        return [
            {
                "name": "minimalist_warm",
                "background_style": "gradient",
                "color_scheme": {
                    "primary": "#8B4513",
                    "secondary": "#F4A460", 
                    "accent": "#FFD700",
                    "text": "#2F4F4F",
                    "background": "#FFF8DC"
                },
                "layout": "centered",
                "overlay_opacity": 0.3,
                "border_style": "rounded",
                "mood_compatibility": ["sereno", "positivo", "amoroso"]
            },
            {
                "name": "nature_inspired",
                "background_style": "image",
                "color_scheme": {
                    "primary": "#228B22",
                    "secondary": "#90EE90",
                    "accent": "#FFFF00",
                    "text": "#FFFFFF",
                    "background": "#006400"
                },
                "layout": "bottom_aligned",
                "overlay_opacity": 0.6,
                "border_style": "none",
                "mood_compatibility": ["energico", "curioso", "libero"]
            },
            {
                "name": "cozy_home",
                "background_style": "solid",
                "color_scheme": {
                    "primary": "#CD853F",
                    "secondary": "#DEB887",
                    "accent": "#FF6347",
                    "text": "#4A4A4A",
                    "background": "#F5DEB3"
                },
                "layout": "card_style",
                "overlay_opacity": 0.0,
                "border_style": "soft_shadow",
                "mood_compatibility": ["tranquillo", "familiare", "protettivo"]
            },
            {
                "name": "playful_energy",
                "background_style": "pattern",
                "color_scheme": {
                    "primary": "#FF6347",
                    "secondary": "#FFB347",
                    "accent": "#32CD32",
                    "text": "#FFFFFF",
                    "background": "#FF7F50"
                },
                "layout": "dynamic",
                "overlay_opacity": 0.4,
                "border_style": "playful",
                "mood_compatibility": ["giocoso", "energico", "entusiasta"]
            }
        ]
    
    def _select_template(self, wisdom_text: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Seleziona il template più appropriato"""
        mood = context.get('final_mood', context.get('mood', 'positivo'))
        
        # Filtra template compatibili con il mood
        compatible_templates = []
        for template in self.design_templates:
            if mood in template.get('mood_compatibility', []):
                compatible_templates.append(template)
        
        # Se non troviamo template compatibili, usa tutti
        if not compatible_templates:
            compatible_templates = self.design_templates
        
        # Selezione basata su lunghezza testo
        text_length = len(wisdom_text)
        if text_length > 150:
            # Testo lungo: preferisci layout semplici
            preferred = [t for t in compatible_templates if t['layout'] in ['centered', 'card_style']]
            compatible_templates = preferred if preferred else compatible_templates
        
        return random.choice(compatible_templates)
    
    def _get_background_image(self, context: Dict[str, Any], template: Dict[str, Any]) -> Image.Image:
        """Ottiene immagine di sfondo appropriata"""
        background_style = template['background_style']
        
        if background_style == 'image':
            return self._get_nature_background(context)
        elif background_style == 'gradient':
            return self._create_gradient_background(template)
        elif background_style == 'pattern':
            return self._create_pattern_background(template)
        else:  # solid
            return self._create_solid_background(template)
    
    def _get_nature_background(self, context: Dict[str, Any]) -> Image.Image:
        """Ottiene immagine di natura da Unsplash o crea fallback"""
        
        if self.unsplash_enabled:
            image = self._fetch_unsplash_image(context)
            if image:
                return image
        
        # Fallback: genera sfondo natura artificiale
        return self._create_nature_fallback()
    
    def _fetch_unsplash_image(self, context: Dict[str, Any]) -> Optional[Image.Image]:
        """Recupera immagine da Unsplash"""
        try:
            # Seleziona query basata su contesto
            season = context.get('season', 'primavera')
            mood = context.get('final_mood', 'sereno')
            
            queries = {
                'primavera': ['spring flowers', 'green meadow', 'cherry blossom'],
                'estate': ['sunny meadow', 'summer landscape', 'blue sky'],
                'autunno': ['autumn leaves', 'golden forest', 'cozy landscape'],
                'inverno': ['winter snow', 'cozy home', 'warm light']
            }
            
            query = random.choice(queries.get(season, ['nature', 'peaceful landscape']))
            
            # API call
            headers = {'Authorization': f'Client-ID {settings.UNSPLASH_ACCESS_KEY}'}
            params = {
                'query': query,
                'orientation': 'landscape',
                'per_page': 30,
                'order_by': 'popular'
            }
            
            response = requests.get(
                f'{settings.UNSPLASH_BASE_URL}/search/photos',
                headers=headers,
                params=params,
                timeout=5
            )
            response.raise_for_status()
            
            data = response.json()
            if not data.get('results'):
                return None
            
            # Seleziona immagine casuale
            photo = random.choice(data['results'])
            image_url = photo['urls']['regular']
            
            # Scarica immagine
            img_response = requests.get(image_url, timeout=10)
            img_response.raise_for_status()
            
            image = Image.open(BytesIO(img_response.content))
            return image.resize((1080, 1080), Image.Resampling.LANCZOS)
            
        except Exception as e:
            print(f"⚠️ Errore download Unsplash: {e}")
            return None
    
    def _create_nature_fallback(self) -> Image.Image:
        """Crea sfondo natura artificiale"""
        # Crea sfondo gradiente naturale
        width, height = 1080, 1080
        image = Image.new('RGB', (width, height))
        draw = ImageDraw.Draw(image)
        
        # Gradiente cielo-terra
        sky_color = (135, 206, 235)  # Sky blue
        earth_color = (34, 139, 34)  # Forest green
        
        for y in range(height):
            ratio = y / height
            r = int(sky_color[0] * (1 - ratio) + earth_color[0] * ratio)
            g = int(sky_color[1] * (1 - ratio) + earth_color[1] * ratio)
            b = int(sky_color[2] * (1 - ratio) + earth_color[2] * ratio)
            
            draw.line([(0, y), (width, y)], fill=(r, g, b))
        
        # Aggiungi texture "colline"
        overlay = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        overlay_draw = ImageDraw.Draw(overlay)
        
        # Disegna colline semplici
        hill_color = (0, 100, 0, 50)  # Verde trasparente
        for i in range(5):
            y_base = height - (i * 150) - 200
            for x in range(0, width, 20):
                wave_y = y_base + int(30 * (1 + 0.5 * (x % 100) / 100))
                overlay_draw.ellipse([x-40, wave_y-20, x+40, wave_y+40], fill=hill_color)
        
        image = Image.alpha_composite(image.convert('RGBA'), overlay).convert('RGB')
        return image
    
    def _create_gradient_background(self, template: Dict[str, Any]) -> Image.Image:
        """Crea sfondo gradiente"""
        width, height = 1080, 1080
        image = Image.new('RGB', (width, height))
        draw = ImageDraw.Draw(image)
        
        colors = template['color_scheme']
        start_color = self._hex_to_rgb(colors['background'])
        end_color = self._hex_to_rgb(colors['secondary'])
        
        # Gradiente diagonale
        for y in range(height):
            for x in range(width):
                ratio = (x + y) / (width + height)
                r = int(start_color[0] * (1 - ratio) + end_color[0] * ratio)
                g = int(start_color[1] * (1 - ratio) + end_color[1] * ratio)
                b = int(start_color[2] * (1 - ratio) + end_color[2] * ratio)
                
                if x % 4 == 0 and y % 4 == 0:  # Ottimizzazione: non ogni pixel
                    draw.rectangle([x, y, x+4, y+4], fill=(r, g, b))
        
        return image
    
    def _create_pattern_background(self, template: Dict[str, Any]) -> Image.Image:
        """Crea sfondo con pattern"""
        width, height = 1080, 1080
        colors = template['color_scheme']
        
        base_color = self._hex_to_rgb(colors['background'])
        pattern_color = self._hex_to_rgb(colors['secondary'])
        
        image = Image.new('RGB', (width, height), base_color)
        draw = ImageDraw.Draw(image)
        
        # Pattern di pois/cerchi
        for x in range(0, width, 80):
            for y in range(0, height, 80):
                offset_x = (y // 80) % 2 * 40  # Pattern a nido d'ape
                circle_x = x + offset_x
                circle_y = y
                
                if circle_x < width and circle_y < height:
                    draw.ellipse([
                        circle_x - 15, circle_y - 15,
                        circle_x + 15, circle_y + 15
                    ], fill=pattern_color)
        
        return image
    
    def _create_solid_background(self, template: Dict[str, Any]) -> Image.Image:
        """Crea sfondo solido"""
        colors = template['color_scheme']
        color = self._hex_to_rgb(colors['background'])
        return Image.new('RGB', (1080, 1080), color)
    
    def _compose_quote_image(self, wisdom_text: str, background: Image.Image, template: Dict[str, Any], context: Dict[str, Any]) -> Image.Image:
        """Compone l'immagine finale con testo e decorazioni"""
        
        # Copia background
        image = background.copy()
        
        # Aggiungi overlay se necessario
        overlay_opacity = template.get('overlay_opacity', 0.0)
        if overlay_opacity > 0:
            overlay = Image.new('RGBA', image.size, (0, 0, 0, int(255 * overlay_opacity)))
            image = Image.alpha_composite(image.convert('RGBA'), overlay).convert('RGB')
        
        # Applica layout
        layout = template['layout']
        if layout == 'centered':
            image = self._apply_centered_layout(image, wisdom_text, template)
        elif layout == 'bottom_aligned':
            image = self._apply_bottom_layout(image, wisdom_text, template)
        elif layout == 'card_style':
            image = self._apply_card_layout(image, wisdom_text, template)
        elif layout == 'dynamic':
            image = self._apply_dynamic_layout(image, wisdom_text, template)
        
        # Aggiungi decorazioni
        image = self._add_decorations(image, template, context)
        
        return image
    
    def _apply_centered_layout(self, image: Image.Image, text: str, template: Dict[str, Any]) -> Image.Image:
        """Layout centrato classico"""
        draw = ImageDraw.Draw(image)
        colors = template['color_scheme']
        text_color = self._hex_to_rgb(colors['text'])
        
        # Dividi testo in righe
        lines = self._wrap_text(text, self.fonts['body'], 800)
        
        # Calcola dimensioni totali
        line_height = 50
        total_height = len(lines) * line_height
        start_y = (image.height - total_height) // 2
        
        # Disegna ogni riga centrata
        for i, line in enumerate(lines):
            bbox = draw.textbbox((0, 0), line, font=self.fonts['body'])
            text_width = bbox[2] - bbox[0]
            x = (image.width - text_width) // 2
            y = start_y + (i * line_height)
            
            # Ombra del testo
            draw.text((x+2, y+2), line, font=self.fonts['body'], fill=(0, 0, 0, 100))
            # Testo principale
            draw.text((x, y), line, font=self.fonts['body'], fill=text_color)
        
        return image
    
    def _apply_bottom_layout(self, image: Image.Image, text: str, template: Dict[str, Any]) -> Image.Image:
        """Layout in basso per sfondi fotografici"""
        # Crea area testo semi-trasparente
        overlay = Image.new('RGBA', image.size, (0, 0, 0, 0))
        overlay_draw = ImageDraw.Draw(overlay)
        
        text_area_height = 300
        overlay_draw.rectangle([
            0, image.height - text_area_height,
            image.width, image.height
        ], fill=(0, 0, 0, 180))
        
        image = Image.alpha_composite(image.convert('RGBA'), overlay).convert('RGB')
        
        # Aggiungi testo
        draw = ImageDraw.Draw(image)
        lines = self._wrap_text(text, self.fonts['body'], 900)
        
        line_height = 45
        total_height = len(lines) * line_height
        start_y = image.height - text_area_height + (text_area_height - total_height) // 2
        
        for i, line in enumerate(lines):
            bbox = draw.textbbox((0, 0), line, font=self.fonts['body'])
            text_width = bbox[2] - bbox[0]
            x = (image.width - text_width) // 2
            y = start_y + (i * line_height)
            
            draw.text((x, y), line, font=self.fonts['body'], fill=(255, 255, 255))
        
        return image
    
    def _apply_card_layout(self, image: Image.Image, text: str, template: Dict[str, Any]) -> Image.Image:
        """Layout stile card con bordi"""
        # Crea card centrale
        card_margin = 100
        card_padding = 60
        
        overlay = Image.new('RGBA', image.size, (0, 0, 0, 0))
        overlay_draw = ImageDraw.Draw(overlay)
        
        colors = template['color_scheme']
        card_color = self._hex_to_rgb(colors['background']) + (240,)  # Semi-trasparente
        
        # Disegna card con angoli arrotondati (simulati)
        card_coords = [
            card_margin, card_margin,
            image.width - card_margin, image.height - card_margin
        ]
        overlay_draw.rectangle(card_coords, fill=card_color)
        
        image = Image.alpha_composite(image.convert('RGBA'), overlay).convert('RGB')
        
        # Aggiungi testo nella card
        draw = ImageDraw.Draw(image)
        available_width = image.width - 2 * (card_margin + card_padding)
        lines = self._wrap_text(text, self.fonts['body'], available_width)
        
        line_height = 45
        total_height = len(lines) * line_height
        start_y = (image.height - total_height) // 2
        
        text_color = self._hex_to_rgb(colors['text'])
        
        for i, line in enumerate(lines):
            bbox = draw.textbbox((0, 0), line, font=self.fonts['body'])
            text_width = bbox[2] - bbox[0]
            x = (image.width - text_width) // 2
            y = start_y + (i * line_height)
            
            draw.text((x, y), line, font=self.fonts['body'], fill=text_color)
        
        return image
    
    def _apply_dynamic_layout(self, image: Image.Image, text: str, template: Dict[str, Any]) -> Image.Image:
        """Layout dinamico e giocoso"""
        draw = ImageDraw.Draw(image)
        colors = template['color_scheme']
        
        # Dividi testo in parole per layout dinamico
        words = text.split()
        
        # Posiziona parole in modo creativo
        x, y = 100, 200
        line_words = []
        current_line_width = 0
        max_width = 800
        
        text_color = self._hex_to_rgb(colors['text'])
        accent_color = self._hex_to_rgb(colors['accent'])
        
        for i, word in enumerate(words):
            bbox = draw.textbbox((0, 0), word + " ", font=self.fonts['body'])
            word_width = bbox[2] - bbox[0]
            
            if current_line_width + word_width > max_width:
                # Disegna linea corrente
                line_text = " ".join(line_words)
                
                # Alterna colori per varietà
                color = accent_color if len(line_words) % 2 == 0 else text_color
                
                # Ombra giocosa
                draw.text((x+3, y+3), line_text, font=self.fonts['body'], fill=(0, 0, 0, 50))
                draw.text((x, y), line_text, font=self.fonts['body'], fill=color)
                
                # Nuova riga
                line_words = [word]
                current_line_width = word_width
                y += 60
                x = random.randint(80, 150)  # Varia posizione X
            else:
                line_words.append(word)
                current_line_width += word_width
        
        # Disegna ultima riga
        if line_words:
            line_text = " ".join(line_words)
            color = accent_color if len(line_words) % 2 == 0 else text_color
            draw.text((x+3, y+3), line_text, font=self.fonts['body'], fill=(0, 0, 0, 50))
            draw.text((x, y), line_text, font=self.fonts['body'], fill=color)
        
        return image
    
    def _add_decorations(self, image: Image.Image, template: Dict[str, Any], context: Dict[str, Any]) -> Image.Image:
        """Aggiunge decorazioni finali"""
        draw = ImageDraw.Draw(image)
        colors = template['color_scheme']
        
        # Aggiungi emoji/icone negli angoli
        emojis = self._get_contextual_emojis(context)
        
        # Posizioni angoli
        positions = [
            (50, 50),      # Top-left
            (image.width - 100, 50),  # Top-right  
            (50, image.height - 100),  # Bottom-left
            (image.width - 100, image.height - 100)  # Bottom-right
        ]
        
        for i, emoji in enumerate(emojis[:4]):
            if i < len(positions):
                x, y = positions[i]
                try:
                    draw.text((x, y), emoji, font=self.fonts['title'], fill=self._hex_to_rgb(colors['accent']))
                except:
                    pass  # Skip se font non supporta emoji
        
        # Aggiungi signature "- Ugo" 
        signature = "- Ugo 🐕"
        bbox = draw.textbbox((0, 0), signature, font=self.fonts['small'])
        sig_width = bbox[2] - bbox[0]
        sig_x = image.width - sig_width - 30
        sig_y = image.height - 60
        
        draw.text((sig_x+1, sig_y+1), signature, font=self.fonts['small'], fill=(0, 0, 0, 100))
        draw.text((sig_x, sig_y), signature, font=self.fonts['small'], fill=self._hex_to_rgb(colors['primary']))
        
        return image
    
    def _get_contextual_emojis(self, context: Dict[str, Any]) -> List[str]:
        """Ottiene emoji appropriati per il contesto"""
        base_emojis = ['🐕', '🐾', '❤️', '✨']
        
        # Emoji stagionali
        season = context.get('season', 'primavera')
        seasonal_emojis = {
            'primavera': ['🌸', '🌱', '🦋', '🌷'],
            'estate': ['☀️', '🌻', '🏖️', '🌈'],
            'autunno': ['🍂', '🎃', '🌰', '🍁'],
            'inverno': ['❄️', '⭐', '🔥', '🏠']
        }
        
        # Emoji mood
        mood = context.get('final_mood', 'positivo')
        mood_emojis = {
            'felice': ['😊', '🎉', '🌟', '💖'],
            'sereno': ['😌', '🕊️', '💙', '🌙'],
            'energico': ['⚡', '🚀', '💪', '🎯'],
            'amoroso': ['💕', '🥰', '💗', '🤗'],
            'giocoso': ['🎾', '🎪', '🎭', '🎨']
        }
        
        result = base_emojis.copy()
        result.extend(seasonal_emojis.get(season, []))
        result.extend(mood_emojis.get(mood, []))
        
        return result[:8]  # Massimo 8 emoji
    
    def _wrap_text(self, text: str, font: ImageFont.ImageFont, max_width: int) -> List[str]:
        """Divide il testo in righe che si adattano alla larghezza"""
        words = text.split()
        lines = []
        current_line = []
        
        draw = ImageDraw.Draw(Image.new('RGB', (1, 1)))
        
        for word in words:
            test_line = current_line + [word]
            test_text = " ".join(test_line)
            
            bbox = draw.textbbox((0, 0), test_text, font=font)
            width = bbox[2] - bbox[0]
            
            if width <= max_width:
                current_line.append(word)
            else:
                if current_line:
                    lines.append(" ".join(current_line))
                    current_line = [word]
                else:
                    # Parola troppo lunga, forza su nuova riga
                    lines.append(word)
        
        if current_line:
            lines.append(" ".join(current_line))
        
        return lines
    
    def _hex_to_rgb(self, hex_color: str) -> Tuple[int, int, int]:
        """Converte colore hex in RGB"""
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    
    def _save_image(self, image: Image.Image, context: Dict[str, Any]) -> Path:
        """Salva l'immagine con nome appropriato"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        mood = context.get('final_mood', 'wisdom')
        filename = f"wisdom_{mood}_{timestamp}.png"
        
        output_path = self.output_dir / filename
        
        # Ottimizza qualità
        image.save(
            output_path, 
            'PNG', 
            optimize=True,
            quality=self.visual_config.get('quality', 95)
        )
        
        return output_path
    
    def create_social_variants(self, base_image_path: str) -> Dict[str, str]:
        """Crea varianti per diverse piattaforme social"""
        base_image = Image.open(base_image_path)
        variants = {}
        
        formats = self.visual_config['output_formats']
        
        for platform, (width, height) in formats.items():
            if platform == 'instagram_post':
                continue  # Già nella dimensione corretta
            
            # Ridimensiona mantenendo proporzioni
            if width == height:  # Quadrato
                resized = base_image.resize((width, height), Image.Resampling.LANCZOS)
            else:  # Rettangolare
                # Crop centrato
                aspect_ratio = width / height
                img_aspect = base_image.width / base_image.height
                
                if img_aspect > aspect_ratio:
                    # Immagine più larga, crop orizzontale
                    new_width = int(base_image.height * aspect_ratio)
                    left = (base_image.width - new_width) // 2
                    cropped = base_image.crop((left, 0, left + new_width, base_image.height))
                else:
                    # Immagine più alta, crop verticale  
                    new_height = int(base_image.width / aspect_ratio)
                    top = (base_image.height - new_height) // 2
                    cropped = base_image.crop((0, top, base_image.width, top + new_height))
                
                resized = cropped.resize((width, height), Image.Resampling.LANCZOS)
            
            # Salva variante
            variant_path = base_image_path.replace('.png', f'_{platform}.png')
            resized.save(variant_path, 'PNG', optimize=True, quality=95)
            variants[platform] = variant_path
        
        return variants
    
    def get_generator_stats(self) -> Dict[str, Any]:
        """Ottiene statistiche del generatore"""
        output_files = list(self.output_dir.glob('*.png'))
        
        return {
            "total_images_generated": len(output_files),
            "templates_available": len(self.design_templates),
            "fonts_loaded": len(self.fonts),
            "unsplash_enabled": self.unsplash_enabled,
            "last_generation": max([f.stat().st_mtime for f in output_files]) if output_files else None
        }

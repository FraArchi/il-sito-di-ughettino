
"""
🐕 La Cuccia di Ugo - Template Seeder
Popola il database con template di saggezze predefiniti
"""

from datetime import datetime
from database.wisdom_db import WisdomDatabase
from models.wisdom_models import WisdomTemplate

def seed_wisdom_templates():
    """Popola il database con template predefiniti"""
    
    db = WisdomDatabase()
    
    templates = [
        # Template Saggezza Generale
        {
            "name": "Saggezza Quotidiana",
            "template_text": "Come {animal_metaphor}, Ugo sa che {life_lesson}. {wisdom_core} {emoji}",
            "category": "saggezza",
            "variables": ["animal_metaphor", "life_lesson", "wisdom_core", "emoji"],
            "mood_compatibility": ["sereno", "riflessivo", "saggio"],
            "description": "Template per saggezze quotidiane generali"
        },
        {
            "name": "Natura e Connessione",
            "template_text": "Nel {natural_element}, {observation} insegna a Ugo che {life_truth}. {nature_wisdom} {emoji}",
            "category": "natura",
            "variables": ["natural_element", "observation", "life_truth", "nature_wisdom", "emoji"],
            "mood_compatibility": ["sereno", "contemplativo", "tranquillo"],
            "seasonal_weight": {"primavera": 1.5, "estate": 1.3, "autunno": 1.2, "inverno": 0.8}
        },
        {
            "name": "Amore e Affetto",
            "template_text": "L'amore {love_metaphor} {relationship_insight}. Ugo {action_verb} che {heartwarming_truth} {emoji}",
            "category": "amore",
            "variables": ["love_metaphor", "relationship_insight", "action_verb", "heartwarming_truth", "emoji"],
            "mood_compatibility": ["amoroso", "tenero", "dolce"]
        },
        {
            "name": "Energia e Gioco",
            "template_text": "Oggi {time_context}, Ugo {playful_action} e {discovery}! {play_wisdom} {emoji}",
            "category": "gioco",
            "variables": ["time_context", "playful_action", "discovery", "play_wisdom", "emoji"],
            "mood_compatibility": ["energico", "giocoso", "entusiasta"]
        },
        {
            "name": "Famiglia e Casa",
            "template_text": "A casa, {home_moment}. Ugo {family_action} che {home_wisdom} {emoji}",
            "category": "famiglia",
            "variables": ["home_moment", "family_action", "home_wisdom", "emoji"],
            "mood_compatibility": ["familiare", "protettivo", "accogliente"]
        },
        {
            "name": "Crescita Personale",
            "template_text": "{growth_metaphor}, Ugo {learns_verb} che {personal_insight}. {growth_wisdom} {emoji}",
            "category": "crescita",
            "variables": ["growth_metaphor", "learns_verb", "personal_insight", "growth_wisdom", "emoji"],
            "mood_compatibility": ["determinato", "motivato", "ispirante"]
        },
        {
            "name": "Gratitudine",
            "template_text": "Ugo {gratitude_action} per {blessing}. {gratitude_lesson} {emoji}",
            "category": "gratitudine",
            "variables": ["gratitude_action", "blessing", "gratitude_lesson", "emoji"],
            "mood_compatibility": ["grato", "riconoscente", "umile"]
        },
        {
            "name": "Stagioni",
            "template_text": "In {season}, {seasonal_observation}. Ugo {seasonal_action} che {seasonal_wisdom} {emoji}",
            "category": "stagioni",
            "variables": ["season", "seasonal_observation", "seasonal_action", "seasonal_wisdom", "emoji"],
            "seasonal_weight": {"primavera": 1.2, "estate": 1.2, "autunno": 1.2, "inverno": 1.2}
        },
        {
            "name": "Semplicità",
            "template_text": "Nelle piccole cose, {simple_joy}. Ugo {simple_action} che {simplicity_wisdom} {emoji}",
            "category": "semplicità",
            "variables": ["simple_joy", "simple_action", "simplicity_wisdom", "emoji"],
            "mood_compatibility": ["semplice", "autentico", "genuino"]
        },
        {
            "name": "Speranza",
            "template_text": "Anche quando {challenge}, Ugo {hope_action} che {hope_message}. {hope_wisdom} {emoji}",
            "category": "speranza",
            "variables": ["challenge", "hope_action", "hope_message", "hope_wisdom", "emoji"],
            "mood_compatibility": ["speranzoso", "ottimista", "resiliente"]
        }
    ]
    
    created_count = 0
    
    with db.get_session() as session:
        for template_data in templates:
            # Controlla se template esiste già
            existing = session.query(WisdomTemplate).filter(
                WisdomTemplate.name == template_data["name"]
            ).first()
            
            if existing:
                print(f"⏭️ Template '{template_data['name']}' già esistente")
                continue
            
            # Crea nuovo template
            template = WisdomTemplate(
                name=template_data["name"],
                template_text=template_data["template_text"],
                category=template_data["category"],
                variables=template_data["variables"],
                mood_compatibility=template_data.get("mood_compatibility", []),
                seasonal_weight=template_data.get("seasonal_weight", {}),
                description=template_data.get("description", ""),
                is_active=True,
                usage_count=0,
                success_rate=0.8,  # Default success rate
                created_at=datetime.utcnow()
            )
            
            session.add(template)
            created_count += 1
            print(f"✅ Template '{template_data['name']}' creato")
    
    print(f"🎉 Seeding completato: {created_count} nuovi template creati")
    return created_count

if __name__ == "__main__":
    seed_wisdom_templates()

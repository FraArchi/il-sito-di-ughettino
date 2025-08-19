
"""
🐕 La Cuccia di Ugo - Daily Wisdom System
Modelli database per saggezze quotidiane
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Float, JSON, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()

class DailyWisdom(Base):
    """Modello principale per le saggezze quotidiane di Ugo"""
    __tablename__ = 'daily_wisdom'
    
    id = Column(Integer, primary_key=True)
    uuid = Column(String(36), unique=True, default=lambda: str(uuid.uuid4()))
    
    # Contenuto
    text = Column(Text, nullable=False)
    source_engine = Column(String(50), nullable=False)  # template, ai, hybrid
    category = Column(String(50), default='general')
    mood = Column(String(30), default='positive')
    
    # Metadati temporali
    created_at = Column(DateTime, default=datetime.utcnow)
    published_at = Column(DateTime)
    scheduled_for = Column(DateTime)
    
    # Context data usato per generazione
    context_data = Column(JSON, default=dict)
    generation_params = Column(JSON, default=dict)
    
    # Performance metrics
    views = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    engagement_rate = Column(Float, default=0.0)
    sentiment_score = Column(Float, default=0.0)
    quality_score = Column(Float, default=0.0)
    
    # Flags
    is_published = Column(Boolean, default=False)
    is_featured = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    # Relazioni
    generation_logs = relationship("GenerationLog", back_populates="wisdom")
    social_posts = relationship("SocialPost", back_populates="wisdom")
    analytics = relationship("WisdomAnalytics", back_populates="wisdom")
    
    def __repr__(self):
        return f"<DailyWisdom(id={self.id}, text='{self.text[:50]}...', date={self.created_at.date()})>"
    
    def to_dict(self):
        """Converte in dizionario per API responses"""
        return {
            'id': self.id,
            'uuid': self.uuid,
            'text': self.text,
            'source_engine': self.source_engine,
            'category': self.category,
            'mood': self.mood,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'published_at': self.published_at.isoformat() if self.published_at else None,
            'context_data': self.context_data,
            'metrics': {
                'views': self.views,
                'shares': self.shares,
                'likes': self.likes,
                'engagement_rate': self.engagement_rate,
                'sentiment_score': self.sentiment_score,
                'quality_score': self.quality_score
            },
            'is_published': self.is_published,
            'is_featured': self.is_featured
        }

class WisdomTemplate(Base):
    """Template predefiniti per fallback e variazioni"""
    __tablename__ = 'wisdom_templates'
    
    id = Column(Integer, primary_key=True)
    
    # Template content
    template_text = Column(Text, nullable=False)
    variables = Column(JSON, default=list)  # Lista delle variabili nel template
    category = Column(String(50), nullable=False)
    subcategory = Column(String(50))
    
    # Metadati
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(100), default='system')
    
    # Usage stats
    usage_count = Column(Integer, default=0)
    last_used = Column(DateTime)
    success_rate = Column(Float, default=0.0)
    avg_engagement = Column(Float, default=0.0)
    
    # Configurazione
    min_context_score = Column(Float, default=0.0)
    seasonal_weight = Column(JSON, default=dict)  # Peso per stagioni
    mood_compatibility = Column(JSON, default=list)  # Mood compatibili
    
    # Flags
    is_active = Column(Boolean, default=True)
    is_premium = Column(Boolean, default=False)
    requires_context = Column(Boolean, default=False)
    
    def __repr__(self):
        return f"<WisdomTemplate(id={self.id}, category='{self.category}', text='{self.template_text[:30]}...')>"
    
    def get_variables(self):
        """Estrae le variabili dal template"""
        import re
        return re.findall(r'\{(\w+)\}', self.template_text)
    
    def render(self, context: dict = None):
        """Renderizza il template con il contesto fornito"""
        if not context:
            context = {}
        
        try:
            return self.template_text.format(**context)
        except KeyError as e:
            # Gestisce variabili mancanti con valori di default
            default_context = {
                'weather': 'sereno',
                'season': 'primavera',
                'emotion': 'gioia',
                'time_of_day': 'mattina',
                'mood': 'positivo'
            }
            default_context.update(context)
            return self.template_text.format(**default_context)

class GenerationLog(Base):
    """Log delle generazioni AI per debugging e ottimizzazione"""
    __tablename__ = 'generation_logs'
    
    id = Column(Integer, primary_key=True)
    wisdom_id = Column(Integer, ForeignKey('daily_wisdom.id'))
    
    # Generazione info
    engine_type = Column(String(50), nullable=False)
    model_name = Column(String(100))
    prompt_used = Column(Text)
    generation_time = Column(Float)  # Secondi
    
    # Input context
    input_context = Column(JSON, default=dict)
    context_score = Column(Float, default=0.0)
    
    # Output
    raw_output = Column(Text)
    processed_output = Column(Text)
    post_processing_applied = Column(JSON, default=list)
    
    # Quality metrics
    quality_checks = Column(JSON, default=dict)
    passed_quality = Column(Boolean, default=True)
    quality_issues = Column(JSON, default=list)
    
    # Performance
    tokens_input = Column(Integer, default=0)
    tokens_output = Column(Integer, default=0)
    cost_estimate = Column(Float, default=0.0)
    
    # Timestamps
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    
    # Relazioni
    wisdom = relationship("DailyWisdom", back_populates="generation_logs")
    
    def __repr__(self):
        return f"<GenerationLog(id={self.id}, engine='{self.engine_type}', time={self.generation_time:.2f}s)>"

class SocialPost(Base):
    """Tracking dei post sui social media"""
    __tablename__ = 'social_posts'
    
    id = Column(Integer, primary_key=True)
    wisdom_id = Column(Integer, ForeignKey('daily_wisdom.id'))
    
    # Platform info
    platform = Column(String(50), nullable=False)  # instagram, facebook, twitter
    post_id = Column(String(200))  # ID del post sulla piattaforma
    post_url = Column(String(500))
    
    # Content
    formatted_text = Column(Text)
    hashtags = Column(JSON, default=list)
    image_url = Column(String(500))
    
    # Scheduling
    scheduled_for = Column(DateTime)
    posted_at = Column(DateTime)
    status = Column(String(30), default='pending')  # pending, posted, failed
    
    # Performance
    reach = Column(Integer, default=0)
    impressions = Column(Integer, default=0)
    engagement = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    
    # Relazioni
    wisdom = relationship("DailyWisdom", back_populates="social_posts")
    
    def __repr__(self):
        return f"<SocialPost(id={self.id}, platform='{self.platform}', status='{self.status}')>"

class WisdomAnalytics(Base):
    """Analytics dettagliate per ogni saggezza"""
    __tablename__ = 'wisdom_analytics'
    
    id = Column(Integer, primary_key=True)
    wisdom_id = Column(Integer, ForeignKey('daily_wisdom.id'))
    
    # Traffic analytics
    page_views = Column(Integer, default=0)
    unique_visitors = Column(Integer, default=0)
    time_on_page = Column(Float, default=0.0)
    bounce_rate = Column(Float, default=0.0)
    
    # Social analytics
    total_shares = Column(Integer, default=0)
    facebook_shares = Column(Integer, default=0)
    twitter_shares = Column(Integer, default=0)
    instagram_shares = Column(Integer, default=0)
    other_shares = Column(Integer, default=0)
    
    # Engagement
    comments_count = Column(Integer, default=0)
    positive_reactions = Column(Integer, default=0)
    negative_reactions = Column(Integer, default=0)
    sentiment_analysis = Column(JSON, default=dict)
    
    # Source tracking
    traffic_sources = Column(JSON, default=dict)  # organic, social, direct, referral
    referrer_domains = Column(JSON, default=dict)
    
    # Geographic data
    countries = Column(JSON, default=dict)
    cities = Column(JSON, default=dict)
    
    # Device data
    desktop_views = Column(Integer, default=0)
    mobile_views = Column(Integer, default=0)
    tablet_views = Column(Integer, default=0)
    
    # Timestamps
    date = Column(DateTime, default=datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    # Relazioni
    wisdom = relationship("DailyWisdom", back_populates="analytics")
    
    def __repr__(self):
        return f"<WisdomAnalytics(wisdom_id={self.wisdom_id}, views={self.page_views}, shares={self.total_shares})>"

class SystemConfig(Base):
    """Configurazioni di sistema persistenti"""
    __tablename__ = 'system_config'
    
    id = Column(Integer, primary_key=True)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(Text)
    data_type = Column(String(20), default='string')  # string, int, float, json, bool
    description = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<SystemConfig(key='{self.key}', value='{self.value}')>"
    
    def get_typed_value(self):
        """Restituisce il valore nel tipo corretto"""
        if self.data_type == 'int':
            return int(self.value)
        elif self.data_type == 'float':
            return float(self.value)
        elif self.data_type == 'bool':
            return self.value.lower() in ('true', '1', 'yes')
        elif self.data_type == 'json':
            import json
            return json.loads(self.value)
        else:
            return self.value

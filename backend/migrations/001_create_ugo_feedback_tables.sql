-- Migrazione: Tabella Feedback per Ugo AI
-- Creata: 2024-12-19
-- Descrizione: Tabella per raccogliere feedback sulle risposte di Ugo
-- Supporta GDPR compliance e opt-in consent

-- Crea tabella feedback se non esiste
CREATE TABLE IF NOT EXISTS ugo_feedback (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    message_id VARCHAR(100),
    
    -- Feedback data
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    feedback_type VARCHAR(50) DEFAULT 'general' CHECK (feedback_type IN ('general', 'accuracy', 'personality', 'helpfulness', 'bug_report')),
    
    -- Context data
    user_message TEXT,
    ugo_response TEXT,
    mood VARCHAR(20),
    behavior_data JSONB,
    
    -- Metadata
    model_version VARCHAR(50) DEFAULT 'mistral-7b-q4',
    latency_ms INTEGER,
    sentiment_score NUMERIC(3,2),
    
    -- Privacy & Consent
    consent_given BOOLEAN DEFAULT FALSE,
    consent_timestamp TIMESTAMP,
    can_use_for_training BOOLEAN DEFAULT FALSE,
    
    -- Tracking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_ugo_feedback_user_id ON ugo_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ugo_feedback_session_id ON ugo_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_ugo_feedback_created_at ON ugo_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_ugo_feedback_rating ON ugo_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_ugo_feedback_consent ON ugo_feedback(consent_given);

-- Indice composito per analisi
CREATE INDEX IF NOT EXISTS idx_ugo_feedback_analytics 
ON ugo_feedback(rating, feedback_type, created_at) 
WHERE consent_given = TRUE;

-- Tabella per consent management (GDPR)
CREATE TABLE IF NOT EXISTS user_consent (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) UNIQUE NOT NULL,
    
    -- Consent flags
    analytics_consent BOOLEAN DEFAULT FALSE,
    training_data_consent BOOLEAN DEFAULT FALSE,
    conversation_storage_consent BOOLEAN DEFAULT FALSE,
    
    -- Consent metadata
    consent_version VARCHAR(10) DEFAULT '1.0',
    consent_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    consent_method VARCHAR(50) DEFAULT 'ui', -- 'ui', 'api', 'import'
    consent_ip INET,
    
    -- Tracking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indici per user consent
CREATE INDEX IF NOT EXISTS idx_user_consent_user_id ON user_consent(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consent_updated ON user_consent(updated_at);

-- Tabella per conversation history (con TTL automatico)
CREATE TABLE IF NOT EXISTS ugo_conversations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    
    -- Message data
    user_message TEXT NOT NULL,
    ugo_response TEXT NOT NULL,
    
    -- AI metadata
    mood VARCHAR(20),
    behavior JSONB,
    sentiment_analysis JSONB,
    emotional_state JSONB,
    
    -- Technical metadata
    model_backend VARCHAR(50) DEFAULT 'local',
    generation_time_ms INTEGER,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    
    -- Privacy
    can_store BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP, -- Auto-deletion timestamp
    
    -- Tracking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indici per conversations
CREATE INDEX IF NOT EXISTS idx_ugo_conversations_user_session 
ON ugo_conversations(user_id, session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ugo_conversations_expires 
ON ugo_conversations(expires_at) WHERE expires_at IS NOT NULL;

-- Auto-delete conversations older than 7 days (GDPR compliance)
CREATE OR REPLACE FUNCTION cleanup_old_conversations()
RETURNS void AS $$
BEGIN
    DELETE FROM ugo_conversations 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    -- Log cleanup
    RAISE NOTICE 'Cleaned up expired conversations at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger per auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger ai feedback e consent
CREATE TRIGGER update_feedback_updated_at 
    BEFORE UPDATE ON ugo_feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consent_updated_at 
    BEFORE UPDATE ON user_consent
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View per analytics (solo con consent)
CREATE OR REPLACE VIEW ugo_feedback_analytics AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_feedback,
    AVG(rating) as avg_rating,
    COUNT(*) FILTER (WHERE rating >= 4) as positive_feedback,
    COUNT(*) FILTER (WHERE rating <= 2) as negative_feedback,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT session_id) as unique_sessions,
    AVG(latency_ms) as avg_latency_ms,
    mode() WITHIN GROUP (ORDER BY mood) as most_common_mood
FROM ugo_feedback 
WHERE consent_given = TRUE 
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- View per mood analytics  
CREATE OR REPLACE VIEW ugo_mood_distribution AS
SELECT 
    mood,
    COUNT(*) as frequency,
    AVG(rating) as avg_rating,
    ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER() * 100, 2) as percentage
FROM ugo_feedback 
WHERE consent_given = TRUE AND mood IS NOT NULL
GROUP BY mood 
ORDER BY frequency DESC;

-- Seed consent predefinito per utenti di sviluppo
INSERT INTO user_consent (user_id, analytics_consent, conversation_storage_consent, consent_method)
VALUES 
    ('dev-user-1', TRUE, TRUE, 'migration'),
    ('test-user-1', TRUE, TRUE, 'migration')
ON CONFLICT (user_id) DO NOTHING;

-- Esempi di feedback per testing (solo development)
INSERT INTO ugo_feedback (
    user_id, session_id, rating, comment, user_message, ugo_response, 
    mood, consent_given, can_use_for_training, model_version
) VALUES 
    ('dev-user-1', 'session-1', 5, 'Ugo è adorabile!', 'Ciao Ugo!', 
     'Woof! Ciao! *scodinzola felice*', 'gioia', TRUE, TRUE, 'mistral-7b-q4'),
    ('dev-user-1', 'session-1', 4, 'Molto carino', 'Come stai?', 
     'Sto benissimo! *saltella*', 'gioia', TRUE, TRUE, 'mistral-7b-q4'),
    ('test-user-1', 'session-2', 3, 'Un po\' ripetitivo', 'Raccontami una storia', 
     'Ti racconto di quando...', 'neutro', TRUE, FALSE, 'mistral-7b-q4')
ON CONFLICT DO NOTHING;

-- Commit changes
COMMIT;

-- Informazioni sulla migrazione
SELECT 'UGO_FEEDBACK_MIGRATION_COMPLETE' as status, NOW() as timestamp;

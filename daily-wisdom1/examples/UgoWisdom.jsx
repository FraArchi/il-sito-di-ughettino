// components/UgoWisdom.jsx
// Componente React per integrare le saggezze di Ugo nel tuo sito

import React, { useState, useEffect } from 'react';
import './UgoWisdom.css'; // Vedi CSS sotto

const UgoWisdom = ({ 
  apiUrl = 'http://localhost:8001',
  showControls = true,
  autoRefresh = false,
  refreshInterval = 3600000, // 1 ora
  theme = 'light' // 'light' | 'dark' | 'custom'
}) => {
  const [wisdom, setWisdom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Fetch saggezza del giorno
  const fetchTodayWisdom = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${apiUrl}/wisdom/today`);
      if (!response.ok) throw new Error('Errore nel caricamento');
      
      const data = await response.json();
      setWisdom(data);
      setImageLoaded(false); // Reset image loading
    } catch (err) {
      setError('🐕 Ugo sta riposando... riprova tra poco!');
      console.error('Errore fetch wisdom:', err);
    } finally {
      setLoading(false);
    }
  };

  // Genera nuova saggezza
  const generateNewWisdom = async (category = 'motivational', mood = 'positive') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${apiUrl}/wisdom/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          mood,
          context: {
            time_of_day: new Date().getHours() < 12 ? 'morning' : 'evening',
            timestamp: new Date().toISOString()
          }
        })
      });
      
      if (!response.ok) throw new Error('Errore nella generazione');
      
      const data = await response.json();
      setWisdom(data);
      setImageLoaded(false);
    } catch (err) {
      setError('🐕 Ugo non riesce a pensare ora... riprova!');
      console.error('Errore generate wisdom:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch saggezza casuale
  const fetchRandomWisdom = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${apiUrl}/wisdom/random`);
      if (!response.ok) throw new Error('Errore nel caricamento');
      
      const data = await response.json();
      setWisdom(data);
      setImageLoaded(false);
    } catch (err) {
      setError('🐕 Ugo ha perso il filo... riprova!');
      console.error('Errore fetch random wisdom:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carica saggezza all'avvio
  useEffect(() => {
    fetchTodayWisdom();
  }, [apiUrl]);

  // Auto-refresh opzionale
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(fetchTodayWisdom, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Condividi saggezza
  const shareWisdom = async () => {
    if (!wisdom) return;
    
    const shareData = {
      title: '🐕 Saggezza di Ugo',
      text: wisdom.text,
      url: window.location.href
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copia in clipboard
        await navigator.clipboard.writeText(`${wisdom.text}\n\n🐕 Dalla Cuccia di Ugo`);
        alert('Saggezza copiata negli appunti!');
      }
    } catch (err) {
      console.error('Errore condivisione:', err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`ugo-wisdom ${theme}`}>
        <div className="ugo-loading">
          <div className="ugo-loading-spinner">🐕</div>
          <p>Ugo sta pensando...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`ugo-wisdom ${theme}`}>
        <div className="ugo-error">
          <p>{error}</p>
          {showControls && (
            <button 
              onClick={fetchTodayWisdom}
              className="ugo-btn ugo-btn-retry"
            >
              🔄 Riprova
            </button>
          )}
        </div>
      </div>
    );
  }

  // Main component
  return (
    <div className={`ugo-wisdom ${theme}`}>
      <div className="ugo-wisdom-header">
        <h3>
          <span className="ugo-icon">🐕</span>
          La Saggezza di Ugo
        </h3>
        <div className="ugo-wisdom-meta">
          <span className="ugo-category">{wisdom?.category}</span>
          <span className="ugo-quality">
            ⭐ {Math.round(wisdom?.quality_score * 100)}%
          </span>
        </div>
      </div>

      <div className="ugo-wisdom-content">
        {wisdom?.image_url && (
          <div className="ugo-image-container">
            <img
              src={`${apiUrl}${wisdom.image_url}`}
              alt="Saggezza di Ugo"
              className={`ugo-image ${imageLoaded ? 'loaded' : ''}`}
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                e.target.style.display = 'none';
                console.warn('Immagine non caricata');
              }}
            />
            {!imageLoaded && (
              <div className="ugo-image-placeholder">
                🖼️ Caricamento...
              </div>
            )}
          </div>
        )}

        <div className="ugo-text-container">
          <blockquote className="ugo-text">
            "{wisdom?.text}"
          </blockquote>
          <div className="ugo-attribution">
            <small>
              🐕 Ugo, {new Date(wisdom?.created_at).toLocaleDateString('it-IT')}
            </small>
          </div>
        </div>
      </div>

      {showControls && (
        <div className="ugo-controls">
          <button 
            onClick={() => generateNewWisdom('motivational', 'positive')}
            className="ugo-btn ugo-btn-generate"
            title="Genera nuova saggezza motivazionale"
          >
            ✨ Motiva
          </button>
          
          <button 
            onClick={() => generateNewWisdom('philosophical', 'thoughtful')}
            className="ugo-btn ugo-btn-generate"
            title="Genera saggezza filosofica"
          >
            🤔 Rifletti
          </button>
          
          <button 
            onClick={fetchRandomWisdom}
            className="ugo-btn ugo-btn-random"
            title="Saggezza casuale"
          >
            🎲 A caso
          </button>
          
          <button 
            onClick={shareWisdom}
            className="ugo-btn ugo-btn-share"
            title="Condividi saggezza"
          >
            📤 Condividi
          </button>
        </div>
      )}

      <div className="ugo-footer">
        <small>
          Aggiornato: {new Date().toLocaleTimeString('it-IT')} • 
          <a 
            href={`${apiUrl}/docs`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="ugo-api-link"
          >
            API Docs
          </a>
        </small>
      </div>
    </div>
  );
};

// Hook personalizzato per uso avanzato
export const useUgoWisdom = (apiUrl = 'http://localhost:8001') => {
  const [wisdom, setWisdom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWisdom = async (endpoint = '/wisdom/today') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${apiUrl}${endpoint}`);
      if (!response.ok) throw new Error('Fetch failed');
      
      const data = await response.json();
      setWisdom(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateWisdom = async (options = {}) => {
    const { category = 'general', mood = 'positive', context = {} } = options;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${apiUrl}/wisdom/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, mood, context })
      });
      
      if (!response.ok) throw new Error('Generation failed');
      
      const data = await response.json();
      setWisdom(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    wisdom,
    loading,
    error,
    fetchWisdom,
    generateWisdom,
    fetchToday: () => fetchWisdom('/wisdom/today'),
    fetchRandom: () => fetchWisdom('/wisdom/random')
  };
};

export default UgoWisdom;

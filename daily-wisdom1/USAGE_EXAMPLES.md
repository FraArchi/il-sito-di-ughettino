# 🐕 Esempi di Integrazione - Daily Wisdom System

## 📱 React/Next.js - Utilizzo Base

```jsx
// pages/index.js o components/HomePage.jsx
import UgoWisdom from '../components/UgoWisdom';

export default function HomePage() {
  return (
    <div className="homepage">
      <h1>Benvenuto nel Sito di Ughettino</h1>
      
      {/* Saggezza del giorno - versione base */}
      <UgoWisdom 
        apiUrl="http://localhost:8001"
        showControls={true}
        theme="light"
      />
      
      {/* Altri contenuti del sito... */}
    </div>
  );
}
```

## 🎛️ React - Utilizzo Avanzato con Hook

```jsx
// components/AdvancedWisdomPage.jsx
import React, { useState } from 'react';
import { useUgoWisdom } from '../components/UgoWisdom';

const AdvancedWisdomPage = () => {
  const { 
    wisdom, 
    loading, 
    error, 
    fetchToday, 
    fetchRandom, 
    generateWisdom 
  } = useUgoWisdom();
  
  const [category, setCategory] = useState('motivational');
  const [mood, setMood] = useState('positive');

  const handleCustomGeneration = async () => {
    const context = {
      user_mood: mood,
      time_of_day: new Date().getHours() < 12 ? 'morning' : 'evening',
      weather: 'sunny', // Potresti integrare API meteo
      special_occasion: isWeekend() ? 'weekend' : 'weekday'
    };

    try {
      await generateWisdom({ category, mood, context });
    } catch (err) {
      console.error('Errore generazione personalizzata:', err);
    }
  };

  const isWeekend = () => {
    const day = new Date().getDay();
    return day === 0 || day === 6;
  };

  return (
    <div className="wisdom-page">
      <h1>🐕 Centro Saggezza di Ugo</h1>
      
      {/* Controlli personalizzati */}
      <div className="wisdom-controls">
        <div className="control-group">
          <label>Categoria:</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="motivational">Motivazionale</option>
            <option value="philosophical">Filosofica</option>
            <option value="humorous">Divertente</option>
            <option value="inspirational">Ispirazionale</option>
          </select>
        </div>
        
        <div className="control-group">
          <label>Mood:</label>
          <select value={mood} onChange={(e) => setMood(e.target.value)}>
            <option value="positive">Positivo</option>
            <option value="thoughtful">Riflessivo</option>
            <option value="energetic">Energico</option>
            <option value="calm">Tranquillo</option>
          </select>
        </div>
        
        <button onClick={handleCustomGeneration} disabled={loading}>
          ✨ Genera Personalizzata
        </button>
      </div>

      {/* Display wisdom */}
      {loading && <div className="loading">🐕 Ugo sta pensando...</div>}
      {error && <div className="error">Errore: {error}</div>}
      
      {wisdom && (
        <div className="wisdom-display">
          <h2>💫 {wisdom.text}</h2>
          {wisdom.image_url && (
            <img 
              src={`http://localhost:8001${wisdom.image_url}`} 
              alt="Saggezza visiva" 
            />
          )}
          <div className="wisdom-meta">
            <p>Categoria: {wisdom.category}</p>
            <p>Qualità: {Math.round(wisdom.quality_score * 100)}%</p>
            <p>Creata: {new Date(wisdom.created_at).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Azioni rapide */}
      <div className="quick-actions">
        <button onClick={fetchToday}>📅 Oggi</button>
        <button onClick={fetchRandom}>🎲 Casuale</button>
        <button onClick={() => generateWisdom({ category: 'motivational' })}>
          💪 Motivami
        </button>
      </div>
    </div>
  );
};

export default AdvancedWisdomPage;
```

## 📱 React Native - App Mobile

```jsx
// components/MobileUgoWisdom.jsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Share,
  Alert 
} from 'react-native';

const MobileUgoWisdom = ({ apiUrl = 'http://localhost:8001' }) => {
  const [wisdom, setWisdom] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWisdom = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/wisdom/today`);
      const data = await response.json();
      setWisdom(data);
    } catch (error) {
      Alert.alert('Errore', 'Ugo non riesce a connettersi 🐕');
    } finally {
      setLoading(false);
    }
  };

  const shareWisdom = async () => {
    if (!wisdom) return;
    
    try {
      await Share.share({
        message: `🐕 "${wisdom.text}" - Ugo dalla Cuccia`,
        title: 'Saggezza di Ugo'
      });
    } catch (error) {
      console.error('Errore condivisione:', error);
    }
  };

  useEffect(() => {
    fetchWisdom();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>Ugo sta pensando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🐕 Saggezza di Ugo</Text>
      </View>

      {wisdom?.image_url && (
        <Image 
          source={{ uri: `${apiUrl}${wisdom.image_url}` }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      <View style={styles.textContainer}>
        <Text style={styles.wisdomText}>"{wisdom?.text}"</Text>
        <Text style={styles.attribution}>
          - Ugo, {new Date(wisdom?.created_at).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={fetchWisdom}>
          <Text style={styles.buttonText}>🔄 Nuova</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={shareWisdom}>
          <Text style={styles.buttonText}>📤 Condividi</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF8DC',
    borderRadius: 15,
    padding: 20,
    margin: 15,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  wisdomText: {
    fontSize: 18,
    fontStyle: 'italic',
    textAlign: 'center',
    color: '#2C1810',
    marginBottom: 10,
    lineHeight: 26,
  },
  attribution: {
    fontSize: 14,
    color: '#8B4513',
    textAlign: 'right',
    width: '100%',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 10,
    color: '#8B4513',
    fontSize: 16,
  },
});

export default MobileUgoWisdom;
```

## 🌐 HTML/JavaScript Vanilla

```html
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🐕 Saggezza di Ugo</title>
    <style>
        .ugo-widget {
            max-width: 500px;
            margin: 20px auto;
            background: #FFF8DC;
            border: 2px solid #D2B48C;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 4px 12px rgba(139, 69, 19, 0.1);
            font-family: Arial, sans-serif;
        }
        
        .ugo-header {
            text-align: center;
            color: #8B4513;
            margin-bottom: 20px;
        }
        
        .ugo-image {
            width: 100%;
            height: auto;
            border-radius: 10px;
            margin-bottom: 15px;
        }
        
        .ugo-text {
            font-size: 18px;
            font-style: italic;
            text-align: center;
            color: #2C1810;
            margin-bottom: 15px;
            line-height: 1.6;
        }
        
        .ugo-controls {
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .ugo-btn {
            background: #8B4513;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 20px;
            cursor: pointer;
            font-weight: bold;
            transition: background 0.3s;
        }
        
        .ugo-btn:hover {
            background: #A0522D;
        }
        
        .loading {
            text-align: center;
            color: #8B4513;
        }
    </style>
</head>
<body>
    <div class="ugo-widget" id="ugoWidget">
        <div class="ugo-header">
            <h2>🐕 La Saggezza di Ugo</h2>
        </div>
        <div id="ugoContent" class="loading">
            Ugo sta pensando...
        </div>
    </div>

    <script>
        class UgoWisdomWidget {
            constructor(apiUrl = 'http://localhost:8001') {
                this.apiUrl = apiUrl;
                this.container = document.getElementById('ugoContent');
                this.init();
            }

            async init() {
                await this.fetchTodayWisdom();
            }

            async fetchTodayWisdom() {
                this.showLoading();
                try {
                    const response = await fetch(`${this.apiUrl}/wisdom/today`);
                    const wisdom = await response.json();
                    this.displayWisdom(wisdom);
                } catch (error) {
                    this.showError('🐕 Ugo non riesce a connettersi...');
                }
            }

            async generateNewWisdom() {
                this.showLoading();
                try {
                    const response = await fetch(`${this.apiUrl}/wisdom/generate`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            category: 'motivational',
                            mood: 'positive'
                        })
                    });
                    const wisdom = await response.json();
                    this.displayWisdom(wisdom);
                } catch (error) {
                    this.showError('🐕 Ugo non riesce a pensare ora...');
                }
            }

            displayWisdom(wisdom) {
                const imageHtml = wisdom.image_url 
                    ? `<img src="${this.apiUrl}${wisdom.image_url}" alt="Saggezza di Ugo" class="ugo-image">`
                    : '';

                this.container.innerHTML = `
                    ${imageHtml}
                    <div class="ugo-text">"${wisdom.text}"</div>
                    <div class="ugo-controls">
                        <button class="ugo-btn" onclick="ugoWidget.fetchTodayWisdom()">
                            📅 Del Giorno
                        </button>
                        <button class="ugo-btn" onclick="ugoWidget.generateNewWisdom()">
                            ✨ Nuova
                        </button>
                        <button class="ugo-btn" onclick="ugoWidget.shareWisdom('${wisdom.text}')">
                            📤 Condividi
                        </button>
                    </div>
                `;
            }

            showLoading() {
                this.container.innerHTML = '<div class="loading">🐕 Ugo sta pensando...</div>';
            }

            showError(message) {
                this.container.innerHTML = `<div class="loading">${message}</div>`;
            }

            shareWisdom(text) {
                if (navigator.share) {
                    navigator.share({
                        title: '🐕 Saggezza di Ugo',
                        text: text,
                        url: window.location.href
                    });
                } else {
                    // Fallback: copia negli appunti
                    navigator.clipboard.writeText(`"${text}" - Ugo dalla Cuccia`);
                    alert('Saggezza copiata negli appunti!');
                }
            }
        }

        // Inizializza widget
        const ugoWidget = new UgoWisdomWidget();
    </script>
</body>
</html>
```

## 📱 Widget WordPress (PHP)

```php
<?php
/**
 * Plugin Name: Ugo Wisdom Widget
 * Description: Widget per mostrare le saggezze quotidiane di Ugo
 */

class Ugo_Wisdom_Widget extends WP_Widget {
    
    public function __construct() {
        parent::__construct(
            'ugo_wisdom_widget',
            '🐕 Saggezza di Ugo',
            array('description' => 'Mostra la saggezza quotidiana di Ugo')
        );
    }

    public function widget($args, $instance) {
        $api_url = $instance['api_url'] ?? 'http://localhost:8001';
        $show_image = $instance['show_image'] ?? true;
        $auto_refresh = $instance['auto_refresh'] ?? false;
        
        echo $args['before_widget'];
        
        if (!empty($instance['title'])) {
            echo $args['before_title'] . $instance['title'] . $args['after_title'];
        }
        
        $this->display_wisdom($api_url, $show_image, $auto_refresh);
        
        echo $args['after_widget'];
    }

    private function display_wisdom($api_url, $show_image, $auto_refresh) {
        $wisdom = $this->get_cached_wisdom($api_url);
        
        if (!$wisdom) {
            echo '<div class="ugo-error">🐕 Ugo sta riposando...</div>';
            return;
        }
        
        $refresh_script = $auto_refresh ? $this->get_refresh_script() : '';
        
        echo "<div class='ugo-wisdom-widget' data-api-url='{$api_url}'>";
        echo "<div class='ugo-wisdom-content'>";
        
        if ($show_image && !empty($wisdom['image_url'])) {
            echo "<img src='{$api_url}{$wisdom['image_url']}' alt='Saggezza di Ugo' class='ugo-image'>";
        }
        
        echo "<blockquote class='ugo-text'>\"{$wisdom['text']}\"</blockquote>";
        echo "<cite class='ugo-attribution'>- Ugo, " . date('j M Y', strtotime($wisdom['created_at'])) . "</cite>";
        
        echo "<div class='ugo-controls'>";
        echo "<button onclick='ugoRefreshWisdom(this)' class='ugo-btn'>🔄 Nuova</button>";
        echo "<button onclick='ugoShareWisdom(\"{$wisdom['text']}\")' class='ugo-btn'>📤 Condividi</button>";
        echo "</div>";
        
        echo "</div>";
        echo $refresh_script;
        echo "</div>";
        
        $this->add_widget_styles();
        $this->add_widget_scripts();
    }

    private function get_cached_wisdom($api_url) {
        $cache_key = 'ugo_wisdom_' . md5($api_url);
        $wisdom = get_transient($cache_key);
        
        if (false === $wisdom) {
            $response = wp_remote_get($api_url . '/wisdom/today');
            
            if (is_wp_error($response)) {
                return false;
            }
            
            $wisdom = json_decode(wp_remote_retrieve_body($response), true);
            set_transient($cache_key, $wisdom, HOUR_IN_SECONDS);
        }
        
        return $wisdom;
    }

    private function get_refresh_script() {
        return "
        <script>
        setInterval(function() {
            location.reload();
        }, 3600000); // Refresh ogni ora
        </script>
        ";
    }

    private function add_widget_styles() {
        echo "
        <style>
        .ugo-wisdom-widget {
            background: #FFF8DC;
            border: 2px solid #D2B48C;
            border-radius: 10px;
            padding: 15px;
            margin: 15px 0;
            text-align: center;
        }
        .ugo-image {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin-bottom: 10px;
        }
        .ugo-text {
            font-style: italic;
            font-size: 16px;
            color: #2C1810;
            margin: 10px 0;
            border: none;
            background: none;
        }
        .ugo-attribution {
            font-size: 12px;
            color: #8B4513;
            display: block;
            margin-bottom: 10px;
        }
        .ugo-controls {
            margin-top: 10px;
        }
        .ugo-btn {
            background: #8B4513;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 15px;
            margin: 0 5px;
            cursor: pointer;
            font-size: 12px;
        }
        .ugo-btn:hover {
            background: #A0522D;
        }
        </style>
        ";
    }

    private function add_widget_scripts() {
        echo "
        <script>
        function ugoRefreshWisdom(button) {
            const widget = button.closest('.ugo-wisdom-widget');
            const apiUrl = widget.dataset.apiUrl;
            
            widget.innerHTML = '<div>🐕 Ugo sta pensando...</div>';
            
            fetch(apiUrl + '/wisdom/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: 'motivational', mood: 'positive' })
            })
            .then(response => response.json())
            .then(wisdom => {
                location.reload(); // Semplice reload per aggiornare il widget
            })
            .catch(error => {
                widget.innerHTML = '<div>🐕 Errore di connessione...</div>';
            });
        }
        
        function ugoShareWisdom(text) {
            if (navigator.share) {
                navigator.share({
                    title: '🐕 Saggezza di Ugo',
                    text: text
                });
            } else {
                prompt('Copia questa saggezza:', '\"' + text + '\" - Ugo dalla Cuccia');
            }
        }
        </script>
        ";
    }

    public function form($instance) {
        $title = !empty($instance['title']) ? $instance['title'] : '🐕 Saggezza di Ugo';
        $api_url = !empty($instance['api_url']) ? $instance['api_url'] : 'http://localhost:8001';
        $show_image = !empty($instance['show_image']) ? $instance['show_image'] : true;
        $auto_refresh = !empty($instance['auto_refresh']) ? $instance['auto_refresh'] : false;
        ?>
        <p>
            <label for="<?php echo $this->get_field_id('title'); ?>">Titolo:</label>
            <input class="widefat" id="<?php echo $this->get_field_id('title'); ?>" 
                   name="<?php echo $this->get_field_name('title'); ?>" type="text" 
                   value="<?php echo esc_attr($title); ?>">
        </p>
        <p>
            <label for="<?php echo $this->get_field_id('api_url'); ?>">URL API:</label>
            <input class="widefat" id="<?php echo $this->get_field_id('api_url'); ?>" 
                   name="<?php echo $this->get_field_name('api_url'); ?>" type="url" 
                   value="<?php echo esc_attr($api_url); ?>">
        </p>
        <p>
            <input class="checkbox" type="checkbox" <?php checked($show_image); ?> 
                   id="<?php echo $this->get_field_id('show_image'); ?>" 
                   name="<?php echo $this->get_field_name('show_image'); ?>">
            <label for="<?php echo $this->get_field_id('show_image'); ?>">Mostra immagine</label>
        </p>
        <p>
            <input class="checkbox" type="checkbox" <?php checked($auto_refresh); ?> 
                   id="<?php echo $this->get_field_id('auto_refresh'); ?>" 
                   name="<?php echo $this->get_field_name('auto_refresh'); ?>">
            <label for="<?php echo $this->get_field_id('auto_refresh'); ?>">Auto-refresh</label>
        </p>
        <?php
    }

    public function update($new_instance, $old_instance) {
        $instance = array();
        $instance['title'] = (!empty($new_instance['title'])) ? strip_tags($new_instance['title']) : '';
        $instance['api_url'] = (!empty($new_instance['api_url'])) ? esc_url_raw($new_instance['api_url']) : '';
        $instance['show_image'] = !empty($new_instance['show_image']);
        $instance['auto_refresh'] = !empty($new_instance['auto_refresh']);
        
        // Pulisci cache quando aggiornato
        delete_transient('ugo_wisdom_' . md5($instance['api_url']));
        
        return $instance;
    }
}

// Registra il widget
function register_ugo_wisdom_widget() {
    register_widget('Ugo_Wisdom_Widget');
}
add_action('widgets_init', 'register_ugo_wisdom_widget');

// Shortcode per uso nei post
function ugo_wisdom_shortcode($atts) {
    $atts = shortcode_atts(array(
        'api_url' => 'http://localhost:8001',
        'show_image' => 'true',
        'category' => 'motivational'
    ), $atts);
    
    $widget = new Ugo_Wisdom_Widget();
    ob_start();
    $widget->display_wisdom($atts['api_url'], $atts['show_image'] === 'true', false);
    return ob_get_clean();
}
add_shortcode('ugo_wisdom', 'ugo_wisdom_shortcode');
?>
```

## 🔧 Utilizzo degli Esempi

### **1. React Component**
```jsx
// Uso base
<UgoWisdom />

// Uso personalizzato
<UgoWisdom 
  apiUrl="https://your-domain.com/api/wisdom"
  theme="dark"
  autoRefresh={true}
  refreshInterval={1800000} // 30 minuti
/>
```

### **2. WordPress Shortcode**
```
[ugo_wisdom api_url="http://localhost:8001" show_image="true" category="philosophical"]
```

### **3. HTML Widget**
```html
<!-- Includi il widget in qualsiasi pagina HTML -->
<script src="path/to/ugo-widget.js"></script>
<div id="ugo-wisdom-container"></div>
<script>
  new UgoWisdomWidget('http://localhost:8001');
</script>
```

🐕 **Ogni esempio è pronto all'uso e completamente personalizzabile!**

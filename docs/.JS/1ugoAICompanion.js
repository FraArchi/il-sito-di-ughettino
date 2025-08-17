/**
 * UGO AI COMPANION - Frontend Integration
 * 
 * Integrazione completa del sistema AI di Ugo nel frontend
 * - Chat interface reattiva
 * - Personality indicator
 * - Emotion display
 * - Memory stats
 */

class UgoAICompanion {
    constructor() {
        this.apiUrl = '/api/ugo-ai';
        this.sessionId = this.generateSessionId();
        this.isInitialized = false;
        this.currentMood = 'happy';
        this.personality = {};
        this.conversationHistory = [];
        
        // UI Elements
        this.chatContainer = null;
        this.chatInput = null;
        this.sendButton = null;
        this.moodIndicator = null;
        this.personalityDisplay = null;
        this.memoryStats = null;
        
        this.init();
    }

    async init() {
        try {
            // Check AI service health
            await this.checkHealth();
            
            // Initialize UI
            this.initializeUI();
            
            // Load conversation history
            await this.loadConversationHistory();
            
            // Get current personality state
            await this.updatePersonalityDisplay();
            
            this.isInitialized = true;
            console.log('🐕 UgoAI Companion initialized successfully');
            
            // Welcome message
            this.displayWelcomeMessage();
            
        } catch (error) {
            console.error('Failed to initialize UgoAI Companion:', error);
            this.showError('Errore durante l\'inizializzazione di Ugo AI');
        }
    }

    initializeUI() {
        // Create chat container if not exists
        if (!document.getElementById('ugo-ai-chat')) {
            this.createChatInterface();
        }
        
        this.chatContainer = document.getElementById('ugo-chat-messages');
        this.chatInput = document.getElementById('ugo-chat-input');
        this.sendButton = document.getElementById('ugo-send-button');
        this.moodIndicator = document.getElementById('ugo-mood-indicator');
        this.personalityDisplay = document.getElementById('ugo-personality-display');
        this.memoryStats = document.getElementById('ugo-memory-stats');
        
        // Event listeners
        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => this.sendMessage());
        }
        
        if (this.chatInput) {
            this.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            // Auto-resize textarea
            this.chatInput.addEventListener('input', () => {
                this.chatInput.style.height = 'auto';
                this.chatInput.style.height = this.chatInput.scrollHeight + 'px';
            });
        }
    }

    createChatInterface() {
        const chatHTML = `
            <div id="ugo-ai-chat" class="ugo-ai-chat">
                <div class="ugo-chat-header">
                    <div class="ugo-header-info">
                        <img src="../Immagini/Ugo.jpeg" alt="Ugo" class="ugo-avatar">
                        <div class="ugo-status">
                            <h3>Ugo AI Companion</h3>
                            <div id="ugo-mood-indicator" class="ugo-mood">
                                <span class="mood-icon">🐕</span>
                                <span class="mood-text">happy</span>
                            </div>
                        </div>
                    </div>
                    <div class="ugo-controls">
                        <button id="ugo-personality-btn" class="btn-icon" title="Personalità">
                            <i class="fas fa-brain"></i>
                        </button>
                        <button id="ugo-memory-btn" class="btn-icon" title="Memoria">
                            <i class="fas fa-history"></i>
                        </button>
                        <button id="ugo-settings-btn" class="btn-icon" title="Impostazioni">
                            <i class="fas fa-cog"></i>
                        </button>
                    </div>
                </div>
                
                <div id="ugo-chat-messages" class="ugo-chat-messages">
                    <!-- Messages will be loaded here -->
                </div>
                
                <div class="ugo-chat-input-container">
                    <textarea 
                        id="ugo-chat-input" 
                        class="ugo-chat-input" 
                        placeholder="Scrivi un messaggio a Ugo..."
                        rows="1"
                        maxlength="500"
                    ></textarea>
                    <button id="ugo-send-button" class="ugo-send-button">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
                
                <div class="ugo-typing-indicator" id="ugo-typing" style="display: none;">
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <span class="typing-text">Ugo sta pensando...</span>
                </div>
            </div>
            
            <!-- Personality Modal -->
            <div id="ugo-personality-modal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>🧠 Personalità di Ugo</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div id="ugo-personality-display" class="personality-display">
                        <!-- Personality data will be loaded here -->
                    </div>
                </div>
            </div>
            
            <!-- Memory Modal -->
            <div id="ugo-memory-modal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>🧠 Memoria di Ugo</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div id="ugo-memory-stats" class="memory-stats">
                        <!-- Memory stats will be loaded here -->
                    </div>
                </div>
            </div>
        `;
        
        // Find appropriate container or create one
        let container = document.querySelector('.ugo-ai-container') || 
                       document.querySelector('#ugo-ai-section') || 
                       document.querySelector('.main-content');
        
        if (!container) {
            container = document.createElement('div');
            container.className = 'ugo-ai-container';
            document.body.appendChild(container);
        }
        
        container.innerHTML = chatHTML;
        
        // Add event listeners for modals
        this.initializeModals();
    }

    initializeModals() {
        // Personality modal
        const personalityBtn = document.getElementById('ugo-personality-btn');
        const personalityModal = document.getElementById('ugo-personality-modal');
        
        if (personalityBtn && personalityModal) {
            personalityBtn.addEventListener('click', () => {
                this.showPersonalityModal();
            });
        }
        
        // Memory modal
        const memoryBtn = document.getElementById('ugo-memory-btn');
        const memoryModal = document.getElementById('ugo-memory-modal');
        
        if (memoryBtn && memoryModal) {
            memoryBtn.addEventListener('click', () => {
                this.showMemoryModal();
            });
        }
        
        // Close modal handlers
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') || e.target.classList.contains('modal')) {
                this.closeModals();
            }
        });
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message || !this.isInitialized) return;
        
        try {
            // Clear input and disable
            this.chatInput.value = '';
            this.chatInput.disabled = true;
            this.sendButton.disabled = true;
            
            // Add user message to chat
            this.addMessageToChat('user', message);
            
            // Show typing indicator
            this.showTypingIndicator();
            
            // Send to API
            const response = await fetch(`${this.apiUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    message: message,
                    sessionId: this.sessionId
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Add Ugo's response to chat
                this.addMessageToChat('ugo', data.data.message, {
                    mood: data.data.mood,
                    personality: data.data.personality,
                    context: data.data.context
                });
                
                // Update mood indicator
                this.updateMoodIndicator(data.data.mood);
                
                // Store in conversation history
                this.conversationHistory.push({
                    userMessage: message,
                    ugoResponse: data.data.message,
                    mood: data.data.mood,
                    timestamp: new Date(data.data.timestamp)
                });
                
            } else {
                throw new Error(data.message || 'Errore nella risposta');
            }
            
        } catch (error) {
            console.error('Chat error:', error);
            this.addMessageToChat('system', 'Scusa, ho avuto un problema... *gratta dietro l\'orecchio confuso* 🐕', { isError: true });
        } finally {
            // Re-enable input
            this.chatInput.disabled = false;
            this.sendButton.disabled = false;
            this.chatInput.focus();
            this.hideTypingIndicator();
        }
    }

    addMessageToChat(sender, message, metadata = {}) {
        if (!this.chatContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}-message`;
        
        const timestamp = new Date().toLocaleTimeString('it-IT', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        if (sender === 'user') {
            messageDiv.innerHTML = `
                <div class="message-content user-content">
                    <div class="message-text">${this.escapeHtml(message)}</div>
                    <div class="message-time">${timestamp}</div>
                </div>
                <div class="message-avatar">
                    <i class="fas fa-user"></i>
                </div>
            `;
        } else if (sender === 'ugo') {
            const moodIcon = this.getMoodIcon(metadata.mood || 'happy');
            const personalityInfo = metadata.personality ? 
                `<span class="personality-trait" title="Tratto dominante: ${metadata.personality.dominantTrait?.trait}">${metadata.personality.personalityArchetype || 'companion'}</span>` : '';
            
            messageDiv.innerHTML = `
                <div class="message-avatar ugo-avatar">
                    <img src="../Immagini/Ugo.jpeg" alt="Ugo">
                    <span class="mood-badge">${moodIcon}</span>
                </div>
                <div class="message-content ugo-content">
                    <div class="message-header">
                        <span class="sender-name">Ugo</span>
                        ${personalityInfo}
                        <span class="message-time">${timestamp}</span>
                    </div>
                    <div class="message-text">${this.formatUgoMessage(message)}</div>
                    <div class="message-actions">
                        <button class="feedback-btn positive" onclick="ugoAI.giveFeedback('positive', '${this.conversationHistory.length}')">
                            <i class="fas fa-thumbs-up"></i>
                        </button>
                        <button class="feedback-btn negative" onclick="ugoAI.giveFeedback('negative', '${this.conversationHistory.length}')">
                            <i class="fas fa-thumbs-down"></i>
                        </button>
                    </div>
                </div>
            `;
        } else if (sender === 'system') {
            messageDiv.innerHTML = `
                <div class="message-content system-content ${metadata.isError ? 'error' : ''}">
                    <div class="message-text">
                        <i class="fas fa-info-circle"></i>
                        ${this.escapeHtml(message)}
                    </div>
                    <div class="message-time">${timestamp}</div>
                </div>
            `;
        }
        
        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatUgoMessage(message) {
        // Convert *actions* to emphasized text
        message = message.replace(/\*([^*]+)\*/g, '<em class="ugo-action">$1</em>');
        
        // Convert emoji
        message = message.replace(/🐕/g, '<span class="emoji">🐕</span>');
        message = message.replace(/🐾/g, '<span class="emoji">🐾</span>');
        message = message.replace(/🦴/g, '<span class="emoji">🦴</span>');
        message = message.replace(/🎾/g, '<span class="emoji">🎾</span>');
        message = message.replace(/❤️/g, '<span class="emoji">❤️</span>');
        message = message.replace(/✨/g, '<span class="emoji">✨</span>');
        
        return message;
    }

    getMoodIcon(mood) {
        const moodIcons = {
            excited: '🤩',
            happy: '😊',
            curious: '🤔',
            playful: '😄',
            calm: '😌',
            affectionate: '🥰',
            alert: '👀',
            confused: '😕'
        };
        
        return moodIcons[mood] || '🐕';
    }

    updateMoodIndicator(mood) {
        if (!this.moodIndicator) return;
        
        const moodIcon = this.getMoodIcon(mood);
        const moodText = mood.charAt(0).toUpperCase() + mood.slice(1);
        
        this.moodIndicator.innerHTML = `
            <span class="mood-icon">${moodIcon}</span>
            <span class="mood-text">${moodText}</span>
        `;
        
        // Add mood-specific class
        this.moodIndicator.className = `ugo-mood mood-${mood}`;
        this.currentMood = mood;
    }

    showTypingIndicator() {
        const typingIndicator = document.getElementById('ugo-typing');
        if (typingIndicator) {
            typingIndicator.style.display = 'flex';
            this.scrollToBottom();
        }
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('ugo-typing');
        if (typingIndicator) {
            typingIndicator.style.display = 'none';
        }
    }

    scrollToBottom() {
        if (this.chatContainer) {
            this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
        }
    }

    displayWelcomeMessage() {
        const welcomeMessages = [
            "*scodinzola eccitato* Ciao! Sono Ugo, il tuo compagno AI! Pronto per chiacchierare? 🐕",
            "*inclina la testa curioso* Ehi! Ho sentito che volevi parlare con me! *annusa l'aria* Cosa facciamo oggi? 🐾",
            "*si siede elegante* Woof! Sono qui e pronto per le nostre avventure insieme! Raccontami tutto! ✨",
            "*corre in cerchio* CIAO CIAO CIAO! *si ferma ansimando felice* Scusa, sono sempre così quando incontro qualcuno! 🎾"
        ];
        
        const randomWelcome = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
        
        setTimeout(() => {
            this.addMessageToChat('ugo', randomWelcome, { mood: 'excited' });
            this.updateMoodIndicator('excited');
        }, 1000);
    }

    async loadConversationHistory() {
        try {
            const response = await fetch(`${this.apiUrl}/conversation/history?limit=10&sessionId=${this.sessionId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.conversationHistory = data.data.conversations || [];
                
                // Display recent conversations
                this.conversationHistory.slice(-5).forEach(conv => {
                    this.addMessageToChat('user', conv.userMessage);
                    this.addMessageToChat('ugo', conv.ugoResponse, { mood: conv.mood });
                });
            }
        } catch (error) {
            console.warn('Could not load conversation history:', error);
        }
    }

    async updatePersonalityDisplay() {
        try {
            const response = await fetch(`${this.apiUrl}/personality`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.personality = data.data.personality;
                this.updateMoodIndicator(data.data.emotions.currentMood);
            }
        } catch (error) {
            console.warn('Could not load personality data:', error);
        }
    }

    async showPersonalityModal() {
        const modal = document.getElementById('ugo-personality-modal');
        const display = document.getElementById('ugo-personality-display');
        
        if (!modal || !display) return;
        
        try {
            const response = await fetch(`${this.apiUrl}/personality`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                display.innerHTML = this.renderPersonalityData(data.data);
            }
            
            modal.style.display = 'flex';
        } catch (error) {
            console.error('Error loading personality data:', error);
            display.innerHTML = '<p class="error">Errore nel caricamento dei dati della personalità</p>';
            modal.style.display = 'flex';
        }
    }

    async showMemoryModal() {
        const modal = document.getElementById('ugo-memory-modal');
        const display = document.getElementById('ugo-memory-stats');
        
        if (!modal || !display) return;
        
        try {
            const response = await fetch(`${this.apiUrl}/memory/stats`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                display.innerHTML = this.renderMemoryData(data.data);
            }
            
            modal.style.display = 'flex';
        } catch (error) {
            console.error('Error loading memory data:', error);
            display.innerHTML = '<p class="error">Errore nel caricamento dei dati della memoria</p>';
            modal.style.display = 'flex';
        }
    }

    renderPersonalityData(data) {
        const personality = data.personality;
        const emotions = data.emotions;
        
        const traitsHTML = Object.entries(personality.traits)
            .map(([trait, value]) => `
                <div class="trait-item">
                    <span class="trait-name">${trait}</span>
                    <div class="trait-bar">
                        <div class="trait-fill" style="width: ${value * 100}%"></div>
                    </div>
                    <span class="trait-value">${Math.round(value * 100)}%</span>
                </div>
            `).join('');
        
        const emotionsHTML = emotions.dominantEmotions
            .map(emotion => `
                <div class="emotion-item">
                    <span class="emotion-name">${emotion.emotion}</span>
                    <span class="emotion-intensity">${emotion.intensity}%</span>
                </div>
            `).join('');
        
        return `
            <div class="personality-section">
                <h4>🎭 Stato Attuale</h4>
                <div class="current-state">
                    <div class="mood-display">
                        <span class="mood-icon">${this.getMoodIcon(emotions.currentMood)}</span>
                        <span class="mood-name">${emotions.currentMood}</span>
                    </div>
                    <div class="archetype">${personality.personalityArchetype || 'balanced-companion'}</div>
                </div>
            </div>
            
            <div class="personality-section">
                <h4>🧠 Tratti Personalità</h4>
                <div class="traits-list">
                    ${traitsHTML}
                </div>
            </div>
            
            <div class="personality-section">
                <h4>❤️ Emozioni Dominanti</h4>
                <div class="emotions-list">
                    ${emotionsHTML}
                </div>
            </div>
            
            <div class="personality-section">
                <h4>💡 Suggerimenti Interazione</h4>
                <div class="suggestions">
                    ${data.interactionSuggestions.map(suggestion => 
                        `<div class="suggestion">${suggestion}</div>`
                    ).join('')}
                </div>
            </div>
        `;
    }

    renderMemoryData(data) {
        const memory = data.memory;
        const patterns = data.patterns;
        
        return `
            <div class="memory-section">
                <h4>📊 Statistiche Memoria</h4>
                <div class="memory-stats">
                    <div class="stat-item">
                        <span class="stat-label">Conversazioni Totali</span>
                        <span class="stat-value">${memory.totalConversations}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Memoria Breve Termine</span>
                        <span class="stat-value">${memory.shortTermMemory}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Memoria Lungo Termine</span>
                        <span class="stat-value">${memory.longTermMemory}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Efficienza Memoria</span>
                        <span class="stat-value">${Math.round(memory.memoryEfficiency * 100)}%</span>
                    </div>
                </div>
            </div>
            
            <div class="memory-section">
                <h4>🎯 Pattern Conversazionali</h4>
                <div class="patterns-list">
                    <div class="pattern-item">
                        <span class="pattern-label">Argomenti Preferiti</span>
                        <div class="pattern-tags">
                            ${patterns.preferences.preferredTopics.map(topic => 
                                `<span class="tag">${topic}</span>`
                            ).join('')}
                        </div>
                    </div>
                    <div class="pattern-item">
                        <span class="pattern-label">Stile Comunicazione</span>
                        <span class="pattern-value">${patterns.preferences.communicationStyle}</span>
                    </div>
                    <div class="pattern-item">
                        <span class="pattern-label">Tono Emotivo</span>
                        <span class="pattern-value">${patterns.preferences.emotionalTone}</span>
                    </div>
                </div>
            </div>
            
            <div class="memory-section">
                <h4>🧠 Insights di Ugo</h4>
                <div class="insights-list">
                    ${patterns.insights.map(insight => 
                        `<div class="insight">${insight}</div>`
                    ).join('')}
                </div>
            </div>
        `;
    }

    closeModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    }

    async giveFeedback(type, conversationIndex) {
        try {
            const response = await fetch(`${this.apiUrl}/personality/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    feedback: type,
                    interactionType: this.currentMood,
                    conversationId: conversationIndex
                })
            });
            
            if (response.ok) {
                // Show feedback confirmation
                this.showFeedbackConfirmation(type);
            }
        } catch (error) {
            console.error('Error giving feedback:', error);
        }
    }

    showFeedbackConfirmation(type) {
        const messages = {
            positive: "*scodinzola felicissimo* Grazie! Sto imparando che ti è piaciuto! 🐕❤️",
            negative: "*abbassa le orecchie* Oh... farò meglio la prossima volta! *ti guarda con occhi dolci* 🐕"
        };
        
        this.addMessageToChat('system', messages[type] || 'Grazie per il feedback!');
    }

    async checkHealth() {
        const response = await fetch(`${this.apiUrl}/health`);
        if (!response.ok) {
            throw new Error('AI service not available');
        }
        
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || 'AI service unhealthy');
        }
        
        return data.data;
    }

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        if (this.chatContainer) {
            this.addMessageToChat('system', message, { isError: true });
        } else {
            console.error(message);
        }
    }
}

// Initialize global instance
let ugoAI;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize only if user is authenticated
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
        ugoAI = new UgoAICompanion();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UgoAICompanion;
}

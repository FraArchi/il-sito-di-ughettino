/**
 * Ugo AI Companion - Frontend Interface
 * Handles AI chat interface and companion interactions
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🤖 Ugo AI Companion inizializzato!');
    
    // Initialize AI companion
    initializeAICompanion();
    setupChatInterface();
    loadChatHistory();
});

/**
 * AI Companion state
 */
const UgoAI = {
    isActive: false,
    isTyping: false,
    chatHistory: [],
    personality: {
        name: 'Ugo',
        traits: ['friendly', 'playful', 'helpful', 'curious'],
        responses: {
            greetings: [
                'Ciao! Sono Ugo! 🐾 Come stai oggi?',
                'Bau bau! Che bello vederti! 🐕',
                'Ehi! Vuoi giocare o chiacchierare? 🎾',
                'Ciao amico! Cosa ti va di fare oggi? 😊'
            ],
            questions: [
                'Dimmi tutto! Le orecchie di Ugo sono sempre aperte! 👂',
                'Sono molto curioso! Raccontami di più! 🤔',
                'Oh, che interessante! Continua pure! ✨',
                'Le mie orecchie drizzano sempre quando sento storie! 📖'
            ],
            encouragement: [
                'Sei fantastico! Ugo è fiero di te! 🌟',
                'Bravo! Meriti una coccola! 🤗',
                'Che bravo! Ti darei un biscottino se potessi! 🍪',
                'Uau! Sei davvero speciale! ⭐'
            ],
            farewell: [
                'A presto! Ugo ti aspetterà sempre qui! 👋',
                'Buona giornata! Torna presto a trovarmi! 🌈',
                'Ciao ciao! Sogna sempre i cani che volano! 💫',
                'Bau bau! Che la forza della coda sia con te! 🐕'
            ]
        }
    }
};

/**
 * Initialize AI companion
 */
function initializeAICompanion() {
    // Create floating AI button if not exists
    if (!document.querySelector('.ai-companion-toggle')) {
        createAIToggleButton();
    }
    
    // Create chat interface if not exists
    if (!document.querySelector('.ai-chat-interface')) {
        createChatInterface();
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize with welcome message after a delay
    setTimeout(() => {
        if (!localStorage.getItem('ugo-ai-welcomed')) {
            showWelcomeMessage();
            localStorage.setItem('ugo-ai-welcomed', 'true');
        }
    }, 5000);
}

/**
 * Create AI toggle button
 */
function createAIToggleButton() {
    const button = document.createElement('div');
    button.className = 'ai-companion-toggle';
    button.innerHTML = `
        <div class="ai-toggle-content">
            <span class="ai-toggle-icon">🐕</span>
            <span class="ai-toggle-text">Parla con Ugo</span>
        </div>
        <div class="ai-status-indicator"></div>
    `;
    
    button.onclick = toggleAIChat;
    document.body.appendChild(button);
}

/**
 * Create chat interface
 */
function createChatInterface() {
    const chatInterface = document.createElement('div');
    chatInterface.className = 'ai-chat-interface';
    chatInterface.innerHTML = `
        <div class="ai-chat-header">
            <div class="ai-avatar">🐕</div>
            <div class="ai-info">
                <h3>Ugo AI</h3>
                <span class="ai-status">Online e pronto a giocare!</span>
            </div>
            <button class="ai-close-btn" onclick="closeAIChat()">×</button>
        </div>
        
        <div class="ai-chat-messages" id="ai-chat-messages">
            <div class="ai-welcome-message">
                <div class="ai-message ai">
                    <div class="ai-message-avatar">🐕</div>
                    <div class="ai-message-content">
                        <p>Ciao! Sono Ugo, il tuo compagno AI! 🐾</p>
                        <p>Posso aiutarti con:</p>
                        <ul>
                            <li>🎮 Giocare insieme</li>
                            <li>📚 Raccontare storie</li>
                            <li>💡 Dare consigli</li>
                            <li>🤗 Chiacchierare</li>
                        </ul>
                        <p>Cosa ti va di fare?</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="ai-typing-indicator" id="ai-typing" style="display: none;">
            <div class="ai-message ai">
                <div class="ai-message-avatar">🐕</div>
                <div class="ai-message-content typing">
                    <span>Ugo sta pensando</span>
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="ai-quick-actions">
            <button class="quick-action-btn" onclick="sendQuickMessage('Ciao Ugo!')">
                👋 Saluta
            </button>
            <button class="quick-action-btn" onclick="sendQuickMessage('Raccontami una storia')">
                📖 Storia
            </button>
            <button class="quick-action-btn" onclick="sendQuickMessage('Giochiamo!')">
                🎮 Gioca
            </button>
            <button class="quick-action-btn" onclick="sendQuickMessage('Come stai?')">
                💭 Chat
            </button>
        </div>
        
        <div class="ai-chat-input">
            <input type="text" 
                   id="ai-input" 
                   placeholder="Scrivi un messaggio a Ugo..." 
                   onkeypress="handleInputKeypress(event)">
            <button class="ai-send-btn" onclick="sendMessage()">
                <span class="send-icon">📤</span>
            </button>
        </div>
    `;
    
    document.body.appendChild(chatInterface);
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Listen for escape key to close chat
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && UgoAI.isActive) {
            closeAIChat();
        }
    });
    
    // Auto-resize input
    const input = document.getElementById('ai-input');
    if (input) {
        input.addEventListener('input', autoResizeInput);
    }
    
    // Listen for page interactions to show smart suggestions
    document.addEventListener('click', handlePageInteraction);
}

/**
 * Toggle AI chat
 */
function toggleAIChat() {
    if (UgoAI.isActive) {
        closeAIChat();
    } else {
        openAIChat();
    }
}

/**
 * Open AI chat
 */
function openAIChat() {
    const chatInterface = document.querySelector('.ai-chat-interface');
    const toggleButton = document.querySelector('.ai-companion-toggle');
    
    chatInterface.classList.add('active');
    toggleButton.classList.add('chat-open');
    
    UgoAI.isActive = true;
    
    // Focus input
    setTimeout(() => {
        document.getElementById('ai-input')?.focus();
    }, 300);
    
    // Update status
    updateAIStatus('Online');
}

/**
 * Close AI chat
 */
function closeAIChat() {
    const chatInterface = document.querySelector('.ai-chat-interface');
    const toggleButton = document.querySelector('.ai-companion-toggle');
    
    chatInterface.classList.remove('active');
    toggleButton.classList.remove('chat-open');
    
    UgoAI.isActive = false;
    
    // Update status
    updateAIStatus('Disponibile');
}

/**
 * Handle input keypress
 */
function handleInputKeypress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

/**
 * Send message
 */
function sendMessage() {
    const input = document.getElementById('ai-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    addMessage(message, 'user');
    
    // Clear input
    input.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    // Generate AI response
    setTimeout(() => {
        const response = generateAIResponse(message);
        hideTypingIndicator();
        addMessage(response, 'ai');
        
        // Save to history
        saveChatHistory();
    }, 1000 + Math.random() * 2000); // Realistic delay
}

/**
 * Send quick message
 */
function sendQuickMessage(message) {
    const input = document.getElementById('ai-input');
    input.value = message;
    sendMessage();
}

/**
 * Add message to chat
 */
function addMessage(text, sender) {
    const messagesContainer = document.getElementById('ai-chat-messages');
    const messageElement = document.createElement('div');
    
    messageElement.className = `ai-message ${sender}`;
    messageElement.innerHTML = `
        <div class="ai-message-avatar">${sender === 'user' ? '👤' : '🐕'}</div>
        <div class="ai-message-content">
            <p>${text}</p>
            <span class="ai-message-time">${new Date().toLocaleTimeString()}</span>
        </div>
    `;
    
    messagesContainer.appendChild(messageElement);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Add to history
    UgoAI.chatHistory.push({
        text,
        sender,
        timestamp: Date.now()
    });
    
    // Animate in
    setTimeout(() => {
        messageElement.classList.add('show');
    }, 100);
}

/**
 * Generate AI response
 */
function generateAIResponse(userMessage) {
    const message = userMessage.toLowerCase();
    let response = '';
    
    // Detect intent
    if (message.includes('ciao') || message.includes('salve') || message.includes('buongiorno')) {
        response = getRandomResponse('greetings');
    } else if (message.includes('storia') || message.includes('racconto')) {
        response = generateStoryResponse();
    } else if (message.includes('gioc') || message.includes('giocare')) {
        response = generateGameResponse();
    } else if (message.includes('come stai') || message.includes('che fai')) {
        response = generateStatusResponse();
    } else if (message.includes('aiuto') || message.includes('help')) {
        response = generateHelpResponse();
    } else if (message.includes('grazie')) {
        response = "Di niente! È sempre un piacere aiutare! 🐾 Se hai bisogno di altro, Ugo è qui!";
    } else if (message.includes('brava') || message.includes('bravo') || message.includes('bene')) {
        response = getRandomResponse('encouragement');
    } else if (message.includes('ciao') && (message.includes('vai') || message.includes('addio'))) {
        response = getRandomResponse('farewell');
    } else {
        response = generateContextualResponse(message);
    }
    
    return response;
}

/**
 * Get random response from category
 */
function getRandomResponse(category) {
    const responses = UgoAI.personality.responses[category];
    return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Generate story response
 */
function generateStoryResponse() {
    const stories = [
        "C'era una volta un cane di nome Ugo che scoprì un portale magico nel parco... 🌟 Vuoi sapere cosa successe dopo?",
        "Ti racconto di quando Ugo salvò tutti i gatti del quartiere dall'albero più alto! 🐱🌳",
        "Una volta Ugo trovò un tesoro sepolto in giardino... erano i suoi biscotti dimenticati! 🍪😄",
        "La storia di come Ugo divenne il miglior amico di uno scoiattolo parlante! 🐿️💫"
    ];
    
    return stories[Math.floor(Math.random() * stories.length)];
}

/**
 * Generate game response
 */
function generateGameResponse() {
    const games = [
        "Giochiamo a indovinelli! Pensavo a qualcosa di peloso, con quattro zampe e che fa 'bau'... 🤔🐕",
        "Che ne dici di un gioco di parole? Dimmi una parola e io ne invento una in rima! 🎵",
        "Facciamo finta di essere esploratori! Dove vuoi andare oggi? 🗺️⭐",
        "Giochiamo a 'Vero o Falso'! I cani possono vedere i colori? 🌈👀"
    ];
    
    return games[Math.floor(Math.random() * games.length)];
}

/**
 * Generate status response
 */
function generateStatusResponse() {
    const statuses = [
        "Sto benissimo! Ho appena finito di rincorrere la mia coda! 🌪️😄",
        "Fantastico! Sto imparando nuove parole da tutti gli amici che incontro! 📚✨",
        "Alla grande! Oggi ho aiutato 7 persone e ho ricevuto infinite coccole virtuali! 🤗💫",
        "Perfetto! Sto aspettando la prossima avventura con la coda che scodinzola! 🎯🐾"
    ];
    
    return statuses[Math.floor(Math.random() * statuses.length)];
}

/**
 * Generate help response
 */
function generateHelpResponse() {
    return `Certo che ti aiuto! 🦮 Ecco cosa posso fare:

🎮 **Giocare**: Indovinelli, giochi di parole, avventure immaginarie
📚 **Raccontare storie**: Favole di Ugo e racconti interattivi  
💡 **Dare consigli**: Su animali, amicizia e vita quotidiana
🤗 **Chiacchierare**: Di tutto e di niente, sempre con la coda che scodinzola!

Dimmi solo cosa ti serve! 🐾`;
}

/**
 * Generate contextual response
 */
function generateContextualResponse(message) {
    // Simple contextual responses
    if (message.includes('cane') || message.includes('cani')) {
        return "Oh, adoro parlare di cani! 🐕 Siamo fantastici, vero? Cosa vuoi sapere di noi?";
    } else if (message.includes('gatto') || message.includes('gatti')) {
        return "I gatti sono amici speciali! 🐱 Anche se a volte ci fanno correre, li amiamo! Hai un gatto?";
    } else if (message.includes('mangiare') || message.includes('cibo')) {
        return "Mmm, il cibo! 🍖 Le mie crocchette preferite e... ah, i biscottini! Ne vuoi parlare?";
    } else if (message.includes('passeggiata') || message.includes('correre')) {
        return "PASSEGGIATA! 🚶‍♂️🐕 Questa è la parola magica! Adoro correre e esplorare! Tu ami camminare?";
    } else {
        return getRandomResponse('questions');
    }
}

/**
 * Show typing indicator
 */
function showTypingIndicator() {
    const typingIndicator = document.getElementById('ai-typing');
    const messagesContainer = document.getElementById('ai-chat-messages');
    
    UgoAI.isTyping = true;
    typingIndicator.style.display = 'block';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Hide typing indicator
 */
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('ai-typing');
    
    UgoAI.isTyping = false;
    typingIndicator.style.display = 'none';
}

/**
 * Update AI status
 */
function updateAIStatus(status) {
    const statusElement = document.querySelector('.ai-status');
    if (statusElement) {
        statusElement.textContent = status;
    }
}

/**
 * Auto resize input
 */
function autoResizeInput() {
    const input = document.getElementById('ai-input');
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
}

/**
 * Handle page interaction for smart suggestions
 */
function handlePageInteraction(event) {
    // Add smart suggestions based on page context
    const target = event.target;
    
    if (target.closest('.story-card')) {
        setTimeout(() => suggestStoryChat(), 1000);
    } else if (target.closest('.achievement-card')) {
        setTimeout(() => suggestAchievementChat(), 1000);
    }
}

/**
 * Suggest story chat
 */
function suggestStoryChat() {
    if (!UgoAI.isActive && Math.random() > 0.7) {
        showAISuggestion("Ti è piaciuta la storia? Chiedimi di raccontartene un'altra! 📖🐾");
    }
}

/**
 * Suggest achievement chat
 */
function suggestAchievementChat() {
    if (!UgoAI.isActive && Math.random() > 0.8) {
        showAISuggestion("Complimenti per l'achievement! Vuoi celebrare insieme? 🏆✨");
    }
}

/**
 * Show AI suggestion bubble
 */
function showAISuggestion(message) {
    const suggestion = document.createElement('div');
    suggestion.className = 'ai-suggestion';
    suggestion.innerHTML = `
        <div class="ai-suggestion-content">
            <span class="ai-suggestion-avatar">🐕</span>
            <span class="ai-suggestion-text">${message}</span>
            <button class="ai-suggestion-btn" onclick="acceptSuggestion('${message}')">💬</button>
        </div>
    `;
    
    document.body.appendChild(suggestion);
    
    setTimeout(() => {
        suggestion.classList.add('show');
    }, 100);
    
    // Auto remove after 8 seconds
    setTimeout(() => {
        suggestion.classList.remove('show');
        setTimeout(() => suggestion.remove(), 300);
    }, 8000);
}

/**
 * Accept suggestion
 */
function acceptSuggestion(message) {
    // Remove suggestion
    document.querySelector('.ai-suggestion')?.remove();
    
    // Open chat and send message
    openAIChat();
    setTimeout(() => {
        document.getElementById('ai-input').value = message;
        sendMessage();
    }, 500);
}

/**
 * Save chat history
 */
function saveChatHistory() {
    localStorage.setItem('ugo-ai-history', JSON.stringify(UgoAI.chatHistory.slice(-50))); // Keep last 50 messages
}

/**
 * Load chat history
 */
function loadChatHistory() {
    const history = localStorage.getItem('ugo-ai-history');
    if (history) {
        UgoAI.chatHistory = JSON.parse(history);
    }
}

/**
 * Show welcome message
 */
function showWelcomeMessage() {
    setTimeout(() => {
        showAISuggestion("Ciao! Sono Ugo, il tuo nuovo amico AI! Vuoi chiacchierare? 🐾👋");
    }, 2000);
}

// Global functions
window.toggleAIChat = toggleAIChat;
window.openAIChat = openAIChat;
window.closeAIChat = closeAIChat;
window.sendMessage = sendMessage;
window.sendQuickMessage = sendQuickMessage;
window.handleInputKeypress = handleInputKeypress;
window.acceptSuggestion = acceptSuggestion;

// Expose public API
window.UgoAICompanion = {
    toggle: toggleAIChat,
    open: openAIChat,
    close: closeAIChat,
    sendMessage: (message) => {
        document.getElementById('ai-input').value = message;
        sendMessage();
    },
    isActive: () => UgoAI.isActive
};

// CSS Styles
const aiCompanionStyles = `
<style>
.ai-companion-toggle {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: linear-gradient(135deg, #b97a56, #f97316);
    color: white;
    border-radius: 50px;
    padding: 16px 20px;
    cursor: pointer;
    box-shadow: 0 8px 32px rgba(185, 122, 86, 0.3);
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    z-index: 9999;
    user-select: none;
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 60px;
    max-width: 200px;
    overflow: hidden;
}

.ai-companion-toggle:hover {
    transform: translateY(-4px) scale(1.05);
    box-shadow: 0 12px 40px rgba(185, 122, 86, 0.4);
}

.ai-companion-toggle.chat-open {
    transform: scale(0.9);
    opacity: 0.7;
}

.ai-toggle-content {
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
}

.ai-toggle-icon {
    font-size: 24px;
    animation: bounce 2s infinite;
}

.ai-toggle-text {
    font-weight: 600;
    font-size: 14px;
    white-space: nowrap;
    opacity: 0;
    width: 0;
    transition: all 0.3s ease;
}

.ai-companion-toggle:hover .ai-toggle-text {
    opacity: 1;
    width: auto;
    margin-left: 8px;
}

.ai-status-indicator {
    width: 12px;
    height: 12px;
    background: #10b981;
    border-radius: 50%;
    border: 2px solid white;
    position: absolute;
    top: -2px;
    right: -2px;
    animation: pulse 2s infinite;
}

.ai-chat-interface {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 380px;
    height: 600px;
    background: white;
    border-radius: 24px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(185, 122, 86, 0.1);
    z-index: 10000;
    display: flex;
    flex-direction: column;
    transform: translateY(100%) scale(0.8);
    opacity: 0;
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    overflow: hidden;
}

.ai-chat-interface.active {
    transform: translateY(0) scale(1);
    opacity: 1;
}

.ai-chat-header {
    background: linear-gradient(135deg, #b97a56, #f97316);
    color: white;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-radius: 24px 24px 0 0;
    position: relative;
}

.ai-chat-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="30" r="1.5" fill="rgba(255,255,255,0.1)"/></svg>');
    pointer-events: none;
}

.ai-avatar {
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
    position: relative;
    z-index: 1;
}

.ai-info {
    flex: 1;
    position: relative;
    z-index: 1;
}

.ai-info h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
}

.ai-status {
    font-size: 12px;
    opacity: 0.9;
}

.ai-close-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 20px;
    transition: all 0.2s ease;
    position: relative;
    z-index: 1;
}

.ai-close-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
}

.ai-chat-messages {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    scroll-behavior: smooth;
}

.ai-message {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 16px;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s ease;
}

.ai-message.show {
    opacity: 1;
    transform: translateY(0);
}

.ai-message.user {
    flex-direction: row-reverse;
}

.ai-message-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
    background: #f3f4f6;
}

.ai-message.user .ai-message-avatar {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
}

.ai-message.ai .ai-message-avatar {
    background: linear-gradient(135deg, #b97a56, #f97316);
    color: white;
}

.ai-message-content {
    background: #f3f4f6;
    padding: 12px 16px;
    border-radius: 18px;
    max-width: 260px;
    word-wrap: break-word;
    position: relative;
}

.ai-message.user .ai-message-content {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    border-radius: 18px 4px 18px 18px;
}

.ai-message.ai .ai-message-content {
    background: #f3f4f6;
    color: #1f2937;
    border-radius: 4px 18px 18px 18px;
}

.ai-message-content p {
    margin: 0 0 8px 0;
    line-height: 1.4;
}

.ai-message-content p:last-child {
    margin-bottom: 0;
}

.ai-message-content ul {
    margin: 8px 0;
    padding-left: 16px;
}

.ai-message-content li {
    margin-bottom: 4px;
}

.ai-message-time {
    font-size: 10px;
    opacity: 0.6;
    margin-top: 4px;
    display: block;
}

.typing {
    display: flex;
    align-items: center;
    gap: 8px;
}

.typing-dots {
    display: flex;
    gap: 4px;
}

.typing-dots span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #9ca3af;
    animation: typingAnimation 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }

.ai-quick-actions {
    padding: 0 20px 16px 20px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.quick-action-btn {
    background: rgba(185, 122, 86, 0.1);
    border: 2px solid rgba(185, 122, 86, 0.2);
    color: #b97a56;
    padding: 8px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
}

.quick-action-btn:hover {
    background: rgba(185, 122, 86, 0.2);
    border-color: rgba(185, 122, 86, 0.4);
    transform: translateY(-1px);
}

.ai-chat-input {
    padding: 20px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    gap: 12px;
    align-items: flex-end;
}

#ai-input {
    flex: 1;
    border: 2px solid #e5e7eb;
    border-radius: 20px;
    padding: 12px 16px;
    font-size: 14px;
    resize: none;
    min-height: 44px;
    max-height: 120px;
    outline: none;
    transition: all 0.2s ease;
    font-family: inherit;
}

#ai-input:focus {
    border-color: #b97a56;
    box-shadow: 0 0 0 3px rgba(185, 122, 86, 0.1);
}

.ai-send-btn {
    background: linear-gradient(135deg, #b97a56, #f97316);
    border: none;
    color: white;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
}

.ai-send-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(185, 122, 86, 0.3);
}

.send-icon {
    font-size: 16px;
}

.ai-suggestion {
    position: fixed;
    bottom: 100px;
    right: 24px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border: 2px solid rgba(185, 122, 86, 0.1);
    z-index: 9998;
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.3s ease;
    max-width: 280px;
}

.ai-suggestion.show {
    transform: translateX(0);
    opacity: 1;
}

.ai-suggestion-content {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
}

.ai-suggestion-avatar {
    font-size: 20px;
    flex-shrink: 0;
}

.ai-suggestion-text {
    flex: 1;
    font-size: 13px;
    color: #374151;
    line-height: 1.4;
}

.ai-suggestion-btn {
    background: linear-gradient(135deg, #b97a56, #f97316);
    border: none;
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
    flex-shrink: 0;
}

.ai-suggestion-btn:hover {
    transform: scale(1.1);
}

/* Animations */
@keyframes bounce {
    0%, 20%, 53%, 80%, 100% {
        transform: scale(1);
    }
    40%, 43% {
        transform: scale(1.1);
    }
    70% {
        transform: scale(1.05);
    }
    90% {
        transform: scale(1.02);
    }
}

@keyframes pulse {
    0%, 100% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.7;
        transform: scale(1.1);
    }
}

@keyframes typingAnimation {
    0%, 80%, 100% {
        transform: scale(0);
        opacity: 0.5;
    }
    40% {
        transform: scale(1);
        opacity: 1;
    }
}

/* Mobile responsive */
@media (max-width: 480px) {
    .ai-chat-interface {
        width: calc(100vw - 32px);
        height: calc(100vh - 64px);
        bottom: 16px;
        right: 16px;
        left: 16px;
        border-radius: 16px;
    }
    
    .ai-companion-toggle {
        bottom: 16px;
        right: 16px;
    }
    
    .ai-suggestion {
        right: 16px;
        left: 16px;
        max-width: none;
        bottom: 80px;
    }
    
    .quick-action-btn {
        flex: 1;
        text-align: center;
    }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    .ai-chat-interface {
        background: #1f2937;
        border-color: #374151;
    }
    
    .ai-chat-messages {
        background: #1f2937;
    }
    
    .ai-message.ai .ai-message-content {
        background: #374151;
        color: #f9fafb;
    }
    
    #ai-input {
        background: #374151;
        border-color: #4b5563;
        color: #f9fafb;
    }
    
    .ai-chat-input {
        border-color: #374151;
    }
    
    .ai-suggestion {
        background: #1f2937;
        border-color: #374151;
    }
    
    .ai-suggestion-text {
        color: #f9fafb;
    }
}

/* Print styles */
@media print {
    .ai-companion-toggle,
    .ai-chat-interface,
    .ai-suggestion {
        display: none !important;
    }
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', aiCompanionStyles);

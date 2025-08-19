/**
 * Cookie Demo and Management for Ugo Site
 * Handles cookie consent, demonstration, and management
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🍪 Cookie Demo inizializzato!');
    
    // Initialize cookie management
    initializeCookieConsent();
    initializeCookieDemo();
    setupCookieSettings();
});

/**
 * Initialize cookie consent banner
 */
function initializeCookieConsent() {
    // Check if consent has already been given
    const consentGiven = localStorage.getItem('ugo-cookie-consent');
    
    if (!consentGiven) {
        showCookieBanner();
    } else {
        // Enable analytics if consent was given
        const consentData = JSON.parse(consentGiven);
        if (consentData.analytics) {
            enableAnalytics();
        }
    }
}

/**
 * Show cookie consent banner
 */
function showCookieBanner() {
    const banner = createCookieBanner();
    document.body.appendChild(banner);
    
    // Add entrance animation
    setTimeout(() => {
        banner.classList.add('show');
    }, 500);
}

/**
 * Create cookie consent banner
 */
function createCookieBanner() {
    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.innerHTML = `
        <div class="cookie-content">
            <div class="cookie-icon">🍪</div>
            <div class="cookie-text">
                <h3>Ciao dal mondo di Ugo!</h3>
                <p>Questo sito usa i cookie per offrirti la migliore esperienza possibile. 
                Come Ugo ama i suoi biscottini, noi amiamo migliorare la tua visita!</p>
            </div>
            <div class="cookie-actions">
                <button class="cookie-btn cookie-btn-accept" onclick="acceptCookies()">
                    🐾 Accetta tutti
                </button>
                <button class="cookie-btn cookie-btn-necessary" onclick="acceptNecessary()">
                    Solo necessari
                </button>
                <button class="cookie-btn cookie-btn-settings" onclick="showCookieSettings()">
                    ⚙️ Impostazioni
                </button>
            </div>
        </div>
    `;
    
    return banner;
}

/**
 * Accept all cookies
 */
function acceptCookies() {
    const consent = {
        necessary: true,
        analytics: true,
        marketing: false, // Disabled for privacy
        timestamp: Date.now()
    };
    
    localStorage.setItem('ugo-cookie-consent', JSON.stringify(consent));
    enableAnalytics();
    hideCookieBanner();
    showThankYouMessage();
}

/**
 * Accept only necessary cookies
 */
function acceptNecessary() {
    const consent = {
        necessary: true,
        analytics: false,
        marketing: false,
        timestamp: Date.now()
    };
    
    localStorage.setItem('ugo-cookie-consent', JSON.stringify(consent));
    hideCookieBanner();
    showThankYouMessage('Solo i cookie necessari sono stati abilitati.');
}

/**
 * Hide cookie banner
 */
function hideCookieBanner() {
    const banner = document.querySelector('.cookie-banner');
    if (banner) {
        banner.classList.add('hide');
        setTimeout(() => {
            banner.remove();
        }, 300);
    }
}

/**
 * Show thank you message
 */
function showThankYouMessage(customMessage = null) {
    const message = customMessage || 'Grazie! Ugo è felice che tu sia qui! 🐾';
    
    const toast = document.createElement('div');
    toast.className = 'cookie-toast';
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">🎉</span>
            <span class="toast-message">${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Enable analytics
 */
function enableAnalytics() {
    // Update Google Analytics consent
    if (typeof gtag !== 'undefined') {
        gtag('consent', 'update', {
            'analytics_storage': 'granted'
        });
    }
    
    console.log('📊 Analytics abilitata');
}

/**
 * Show cookie settings modal
 */
function showCookieSettings() {
    const modal = createCookieSettingsModal();
    document.body.appendChild(modal);
    
    setTimeout(() => {
        modal.classList.add('show');
    }, 100);
}

/**
 * Create cookie settings modal
 */
function createCookieSettingsModal() {
    const modal = document.createElement('div');
    modal.className = 'cookie-modal';
    modal.innerHTML = `
        <div class="cookie-modal-overlay" onclick="hideCookieSettings()">
            <div class="cookie-modal-content" onclick="event.stopPropagation()">
                <div class="cookie-modal-header">
                    <h2>🍪 Impostazioni Cookie</h2>
                    <button class="cookie-modal-close" onclick="hideCookieSettings()">×</button>
                </div>
                <div class="cookie-modal-body">
                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <h3>Cookie Necessari</h3>
                            <label class="cookie-switch">
                                <input type="checkbox" checked disabled>
                                <span class="slider"></span>
                            </label>
                        </div>
                        <p>Questi cookie sono essenziali per il funzionamento del sito. Come il cibo per Ugo, sono indispensabili!</p>
                    </div>
                    
                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <h3>Cookie Analitici</h3>
                            <label class="cookie-switch">
                                <input type="checkbox" id="analytics-toggle">
                                <span class="slider"></span>
                            </label>
                        </div>
                        <p>Ci aiutano a capire come utilizzi il sito, per migliorare l'esperienza di Ugo e dei suoi amici.</p>
                    </div>
                    
                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <h3>Cookie di Marketing</h3>
                            <label class="cookie-switch">
                                <input type="checkbox" disabled>
                                <span class="slider"></span>
                            </label>
                        </div>
                        <p>Non utilizziamo cookie di marketing. Ugo preferisce le coccole agli annunci! 🐕</p>
                    </div>
                </div>
                <div class="cookie-modal-footer">
                    <button class="cookie-btn cookie-btn-save" onclick="saveCookieSettings()">
                        💾 Salva Impostazioni
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Set current analytics setting
    const consent = localStorage.getItem('ugo-cookie-consent');
    if (consent) {
        const consentData = JSON.parse(consent);
        modal.querySelector('#analytics-toggle').checked = consentData.analytics;
    }
    
    return modal;
}

/**
 * Hide cookie settings modal
 */
function hideCookieSettings() {
    const modal = document.querySelector('.cookie-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

/**
 * Save cookie settings
 */
function saveCookieSettings() {
    const analyticsEnabled = document.querySelector('#analytics-toggle').checked;
    
    const consent = {
        necessary: true,
        analytics: analyticsEnabled,
        marketing: false,
        timestamp: Date.now()
    };
    
    localStorage.setItem('ugo-cookie-consent', JSON.stringify(consent));
    
    if (analyticsEnabled) {
        enableAnalytics();
    } else {
        disableAnalytics();
    }
    
    hideCookieSettings();
    showThankYouMessage('Impostazioni salvate! 🎉');
}

/**
 * Disable analytics
 */
function disableAnalytics() {
    if (typeof gtag !== 'undefined') {
        gtag('consent', 'update', {
            'analytics_storage': 'denied'
        });
    }
    
    console.log('📊 Analytics disabilitata');
}

/**
 * Initialize cookie demo functionality
 */
function initializeCookieDemo() {
    // Add demo buttons if they exist
    const demoContainer = document.querySelector('.cookie-demo-container');
    if (demoContainer) {
        setupCookieDemo(demoContainer);
    }
}

/**
 * Setup cookie demo
 */
function setupCookieDemo(container) {
    container.innerHTML = `
        <div class="demo-section">
            <h3>🍪 Demo Cookie di Ugo</h3>
            <p>Ugo vuole mostrarti come funzionano i cookie! Prova questi esempi:</p>
            
            <div class="demo-actions">
                <button class="demo-btn" onclick="demoCookieSet()">
                    🐾 Salva preferenza di Ugo
                </button>
                <button class="demo-btn" onclick="demoCookieGet()">
                    👀 Leggi preferenza
                </button>
                <button class="demo-btn" onclick="demoCookieDelete()">
                    🗑️ Cancella preferenza
                </button>
                <button class="demo-btn" onclick="demoShowAll()">
                    📋 Mostra tutti i cookie
                </button>
            </div>
            
            <div class="demo-output" id="demo-output">
                <p>I risultati appariranno qui! 🐕</p>
            </div>
        </div>
    `;
}

/**
 * Demo: Set a cookie
 */
function demoCookieSet() {
    const favorites = ['crocchette', 'pallina', 'coccole', 'passeggiata'];
    const randomFavorite = favorites[Math.floor(Math.random() * favorites.length)];
    
    setCookie('ugo-favorite', randomFavorite, 30);
    
    updateDemoOutput(`🎉 Salvato! Ugo ama: <strong>${randomFavorite}</strong>`, 'success');
}

/**
 * Demo: Get a cookie
 */
function demoCookieGet() {
    const favorite = getCookie('ugo-favorite');
    
    if (favorite) {
        updateDemoOutput(`🐾 La cosa preferita di Ugo è: <strong>${favorite}</strong>`, 'info');
    } else {
        updateDemoOutput(`🤔 Ugo non ha ancora una preferenza salvata!`, 'warning');
    }
}

/**
 * Demo: Delete a cookie
 */
function demoCookieDelete() {
    deleteCookie('ugo-favorite');
    updateDemoOutput(`🗑️ Preferenza cancellata! Ugo ha dimenticato...`, 'warning');
}

/**
 * Demo: Show all cookies
 */
function demoShowAll() {
    const cookies = document.cookie.split(';').filter(cookie => cookie.trim());
    
    if (cookies.length === 0) {
        updateDemoOutput(`🍽️ Nessun cookie trovato! Ugo ha fame...`, 'info');
        return;
    }
    
    let output = `📋 <strong>Cookie trovati (${cookies.length}):</strong><br>`;
    cookies.forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        output += `• <code>${name}</code>: ${value}<br>`;
    });
    
    updateDemoOutput(output, 'info');
}

/**
 * Update demo output
 */
function updateDemoOutput(message, type = 'info') {
    const output = document.getElementById('demo-output');
    if (output) {
        output.innerHTML = `<div class="demo-message ${type}">${message}</div>`;
    }
}

/**
 * Cookie utility functions
 */
function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/**
 * Setup cookie settings management
 */
function setupCookieSettings() {
    // Add settings link to footer or header if needed
    const settingsLinks = document.querySelectorAll('[data-cookie-settings]');
    settingsLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showCookieSettings();
        });
    });
}

// Global functions for inline onclick handlers
window.acceptCookies = acceptCookies;
window.acceptNecessary = acceptNecessary;
window.showCookieSettings = showCookieSettings;
window.hideCookieSettings = hideCookieSettings;
window.saveCookieSettings = saveCookieSettings;
window.demoCookieSet = demoCookieSet;
window.demoCookieGet = demoCookieGet;
window.demoCookieDelete = demoCookieDelete;
window.demoShowAll = demoShowAll;

// CSS Styles (injected via JavaScript)
const cookieStyles = `
<style>
.cookie-banner {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #b97a56, #f97316);
    color: white;
    z-index: 10000;
    transform: translateY(100%);
    transition: transform 0.3s ease;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
}

.cookie-banner.show {
    transform: translateY(0);
}

.cookie-banner.hide {
    transform: translateY(100%);
}

.cookie-content {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    max-width: 1200px;
    margin: 0 auto;
    flex-wrap: wrap;
}

.cookie-icon {
    font-size: 2rem;
    flex-shrink: 0;
}

.cookie-text {
    flex: 1;
    min-width: 200px;
}

.cookie-text h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.2rem;
}

.cookie-text p {
    margin: 0;
    opacity: 0.9;
    font-size: 0.9rem;
    line-height: 1.4;
}

.cookie-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.cookie-btn {
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.85rem;
    font-weight: 500;
    white-space: nowrap;
}

.cookie-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
}

.cookie-btn-accept {
    background: rgba(255, 255, 255, 0.9);
    color: #b97a56;
    border-color: transparent;
}

.cookie-btn-accept:hover {
    background: white;
    transform: translateY(-2px) scale(1.05);
}

.cookie-toast {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    z-index: 10001;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    max-width: 300px;
}

.cookie-toast.show {
    transform: translateX(0);
}

.toast-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
}

.toast-icon {
    font-size: 1.5rem;
}

.toast-message {
    color: #333;
    font-size: 0.9rem;
}

.cookie-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10002;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
}

.cookie-modal.show {
    opacity: 1;
    visibility: visible;
}

.cookie-modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
}

.cookie-modal-content {
    background: white;
    border-radius: 16px;
    max-width: 500px;
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
    transform: scale(0.8);
    transition: transform 0.3s ease;
}

.cookie-modal.show .cookie-modal-content {
    transform: scale(1);
}

.cookie-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #eee;
}

.cookie-modal-header h2 {
    margin: 0;
    color: #b97a56;
    font-size: 1.4rem;
}

.cookie-modal-close {
    background: none;
    border: none;
    font-size: 2rem;
    cursor: pointer;
    color: #999;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.3s ease;
}

.cookie-modal-close:hover {
    background: #f5f5f5;
    color: #333;
}

.cookie-modal-body {
    padding: 1.5rem;
}

.cookie-category {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 12px;
}

.cookie-category-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.cookie-category h3 {
    margin: 0;
    color: #333;
    font-size: 1.1rem;
}

.cookie-switch {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 24px;
}

.cookie-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: 0.3s;
    border-radius: 24px;
}

.slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
}

input:checked + .slider {
    background-color: #b97a56;
}

input:focus + .slider {
    box-shadow: 0 0 1px #b97a56;
}

input:checked + .slider:before {
    transform: translateX(26px);
}

input:disabled + .slider {
    opacity: 0.6;
    cursor: not-allowed;
}

.cookie-modal-footer {
    padding: 1.5rem;
    border-top: 1px solid #eee;
    text-align: center;
}

.cookie-btn-save {
    background: linear-gradient(135deg, #b97a56, #f97316);
    color: white;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.cookie-btn-save:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(185, 122, 86, 0.3);
}

.demo-section {
    background: #f8f9fa;
    padding: 2rem;
    border-radius: 16px;
    margin: 2rem 0;
}

.demo-section h3 {
    color: #b97a56;
    margin-bottom: 1rem;
}

.demo-actions {
    display: flex;
    gap: 0.5rem;
    margin: 1rem 0;
    flex-wrap: wrap;
}

.demo-btn {
    background: linear-gradient(135deg, #b97a56, #f97316);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.85rem;
}

.demo-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(185, 122, 86, 0.3);
}

.demo-output {
    background: white;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    padding: 1rem;
    margin-top: 1rem;
    min-height: 60px;
    display: flex;
    align-items: center;
}

.demo-message {
    padding: 0.75rem;
    border-radius: 8px;
    width: 100%;
}

.demo-message.success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.demo-message.info {
    background: #d1ecf1;
    color: #0c5460;
    border: 1px solid #bee5eb;
}

.demo-message.warning {
    background: #fff3cd;
    color: #856404;
    border: 1px solid #ffeaa7;
}

@media (max-width: 768px) {
    .cookie-content {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
    }
    
    .cookie-actions {
        justify-content: center;
    }
    
    .cookie-btn {
        flex: 1;
        min-width: 120px;
    }
    
    .demo-actions {
        flex-direction: column;
    }
    
    .demo-btn {
        width: 100%;
    }
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', cookieStyles);

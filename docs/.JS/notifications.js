/**
 * Notifications System for Ugo Site
 * Handles push notifications, browser notifications, and in-app notifications
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔔 Sistema notifiche di Ugo inizializzato!');
    
    // Initialize notification system
    initializeNotifications();
    setupNotificationHandlers();
    checkNotificationPermission();
});

/**
 * Initialize notification system
 */
function initializeNotifications() {
    // Create notification container if it doesn't exist
    if (!document.querySelector('.notification-container')) {
        createNotificationContainer();
    }
    
    // Setup service worker for push notifications
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        initializePushNotifications();
    }
    
    // Show welcome notification for new visitors
    const isFirstVisit = !localStorage.getItem('ugo-visited');
    if (isFirstVisit) {
        setTimeout(() => {
            showWelcomeNotification();
            localStorage.setItem('ugo-visited', 'true');
        }, 3000);
    }
}

/**
 * Create notification container
 */
function createNotificationContainer() {
    const container = document.createElement('div');
    container.className = 'notification-container';
    document.body.appendChild(container);
}

/**
 * Initialize push notifications
 */
function initializePushNotifications() {
    navigator.serviceWorker.ready.then(registration => {
        console.log('🔔 Service Worker pronto per le notifiche');
        
        // Check if user is already subscribed
        return registration.pushManager.getSubscription();
    }).then(subscription => {
        if (subscription) {
            console.log('✅ Utente già iscritto alle notifiche push');
        } else {
            console.log('📝 Utente non ancora iscritto alle notifiche push');
        }
    }).catch(error => {
        console.error('❌ Errore nell\'inizializzazione push notifications:', error);
    });
}

/**
 * Check notification permission status
 */
function checkNotificationPermission() {
    if ('Notification' in window) {
        const permission = Notification.permission;
        console.log(`🔔 Permessi notifiche: ${permission}`);
        
        // Show notification settings if permission is default
        if (permission === 'default') {
            setTimeout(() => {
                showNotificationPermissionPrompt();
            }, 5000);
        }
    }
}

/**
 * Show welcome notification for new visitors
 */
function showWelcomeNotification() {
    showInAppNotification({
        title: 'Benvenuto nel mondo di Ugo! 🐾',
        message: 'Ciao! Sono Ugo e sono felice che tu sia qui. Esplora il mio mondo pieno di avventure!',
        type: 'welcome',
        icon: '🐕',
        duration: 6000,
        actions: [
            {
                text: 'Inizia l\'avventura! 🚀',
                action: () => {
                    document.querySelector('#main')?.scrollIntoView({ behavior: 'smooth' });
                }
            }
        ]
    });
}

/**
 * Show notification permission prompt
 */
function showNotificationPermissionPrompt() {
    showInAppNotification({
        title: 'Vuoi ricevere le novità di Ugo? 🔔',
        message: 'Abilita le notifiche per non perdere mai le nuove storie e avventure!',
        type: 'permission',
        icon: '🔔',
        duration: 0, // Persistent until action
        actions: [
            {
                text: '✅ Sì, grazie!',
                action: requestNotificationPermission,
                primary: true
            },
            {
                text: '❌ No, grazie',
                action: () => {
                    localStorage.setItem('ugo-notifications-declined', 'true');
                }
            }
        ]
    });
}

/**
 * Request notification permission
 */
function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                localStorage.setItem('ugo-notifications-enabled', 'true');
                showInAppNotification({
                    title: 'Perfetto! 🎉',
                    message: 'Ora riceverai le notifiche di Ugo. Bau bau!',
                    type: 'success',
                    icon: '✅',
                    duration: 4000
                });
                
                // Show a test notification
                setTimeout(() => {
                    showBrowserNotification({
                        title: '🐾 Ugo dice ciao!',
                        body: 'Questa è una notifiche di prova. Funziona tutto!',
                        icon: '/icons/icon-192x192.png',
                        tag: 'welcome-test'
                    });
                }, 2000);
                
            } else {
                showInAppNotification({
                    title: 'Nessun problema! 😊',
                    message: 'Ugo rispetta la tua scelta. Potrai sempre abilitarle in seguito!',
                    type: 'info',
                    icon: '👍',
                    duration: 4000
                });
                localStorage.setItem('ugo-notifications-declined', 'true');
            }
        });
    }
}

/**
 * Show in-app notification
 */
function showInAppNotification(options) {
    const {
        title,
        message,
        type = 'info',
        icon = '📢',
        duration = 5000,
        actions = []
    } = options;
    
    const notification = document.createElement('div');
    notification.className = `ugo-notification ugo-notification-${type}`;
    
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">${icon}</div>
            <div class="notification-text">
                <h4 class="notification-title">${title}</h4>
                <p class="notification-message">${message}</p>
            </div>
            <button class="notification-close" onclick="closeNotification(this)">×</button>
        </div>
        ${actions.length > 0 ? `
            <div class="notification-actions">
                ${actions.map((action, index) => `
                    <button class="notification-btn ${action.primary ? 'primary' : ''}" 
                            onclick="handleNotificationAction(this, ${index})"
                            data-action="${index}">
                        ${action.text}
                    </button>
                `).join('')}
            </div>
        ` : ''}
    `;
    
    // Store actions for later use
    notification._actions = actions;
    
    const container = document.querySelector('.notification-container');
    container.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto remove if duration is set
    if (duration > 0) {
        setTimeout(() => {
            removeNotification(notification);
        }, duration);
    }
    
    return notification;
}

/**
 * Show browser notification
 */
function showBrowserNotification(options) {
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(options.title, {
            body: options.body,
            icon: options.icon || '/icons/icon-192x192.png',
            tag: options.tag || 'ugo-notification',
            badge: '/icons/icon-96x96.png',
            vibrate: [200, 100, 200],
            actions: options.actions || []
        });
        
        notification.onclick = function() {
            window.focus();
            notification.close();
            if (options.onClick) {
                options.onClick();
            }
        };
        
        // Auto close after 6 seconds
        setTimeout(() => {
            notification.close();
        }, 6000);
        
        return notification;
    }
}

/**
 * Handle notification action click
 */
function handleNotificationAction(button, actionIndex) {
    const notification = button.closest('.ugo-notification');
    const actions = notification._actions;
    
    if (actions && actions[actionIndex] && actions[actionIndex].action) {
        actions[actionIndex].action();
    }
    
    removeNotification(notification);
}

/**
 * Close notification
 */
function closeNotification(button) {
    const notification = button.closest('.ugo-notification');
    removeNotification(notification);
}

/**
 * Remove notification
 */
function removeNotification(notification) {
    notification.classList.add('removing');
    setTimeout(() => {
        notification.remove();
    }, 300);
}

/**
 * Setup notification handlers
 */
function setupNotificationHandlers() {
    // Listen for custom events
    document.addEventListener('ugo:notify', function(event) {
        showInAppNotification(event.detail);
    });
    
    // Listen for form submissions
    document.addEventListener('submit', function(event) {
        const form = event.target;
        if (form.classList.contains('newsletter-form')) {
            event.preventDefault();
            handleNewsletterSubmission(form);
        }
    });
    
    // Listen for achievement unlocks
    document.addEventListener('ugo:achievement', function(event) {
        showAchievementNotification(event.detail);
    });
    
    // Setup notification settings toggle
    const notificationToggle = document.querySelector('[data-notification-toggle]');
    if (notificationToggle) {
        notificationToggle.addEventListener('click', toggleNotificationSettings);
    }
}

/**
 * Handle newsletter subscription
 */
function handleNewsletterSubmission(form) {
    const email = form.querySelector('input[type="email"]').value;
    
    // Simulate API call
    showInAppNotification({
        title: 'Iscrizione in corso... 📧',
        message: 'Ugo sta elaborando la tua richiesta...',
        type: 'loading',
        icon: '⏳',
        duration: 2000
    });
    
    setTimeout(() => {
        showInAppNotification({
            title: 'Benvenuto nella famiglia di Ugo! 🎉',
            message: `Grazie ${email.split('@')[0]}! Riceverai tutte le novità di Ugo direttamente nella tua casella.`,
            type: 'success',
            icon: '📧',
            duration: 6000,
            actions: [
                {
                    text: '📱 Abilita notifiche push',
                    action: requestNotificationPermission,
                    primary: true
                }
            ]
        });
        
        // Reset form
        form.reset();
        
        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
            showBrowserNotification({
                title: '📧 Iscrizione completata!',
                body: 'Benvenuto nella famiglia di Ugo! Riceverai tutte le novità.',
                tag: 'newsletter-success'
            });
        }
    }, 2000);
}

/**
 * Show achievement notification
 */
function showAchievementNotification(achievement) {
    showInAppNotification({
        title: `🏆 Achievement sbloccato!`,
        message: `Hai ottenuto: ${achievement.title}`,
        type: 'achievement',
        icon: achievement.icon || '🏆',
        duration: 8000,
        actions: [
            {
                text: '👀 Vedi dettagli',
                action: () => {
                    // Open achievement modal or navigate to achievements page
                    window.location.href = '.HTML/dashboard.html#achievements';
                },
                primary: true
            }
        ]
    });
    
    // Show browser notification for achievements
    if (Notification.permission === 'granted') {
        showBrowserNotification({
            title: '🏆 Nuovo Achievement!',
            body: `Hai sbloccato: ${achievement.title}`,
            tag: 'achievement-' + achievement.id,
            onClick: () => {
                window.location.href = '.HTML/dashboard.html#achievements';
            }
        });
    }
}

/**
 * Toggle notification settings
 */
function toggleNotificationSettings() {
    const enabled = localStorage.getItem('ugo-notifications-enabled');
    
    if (enabled) {
        // Disable notifications
        localStorage.removeItem('ugo-notifications-enabled');
        localStorage.setItem('ugo-notifications-declined', 'true');
        
        showInAppNotification({
            title: 'Notifiche disabilitate 🔕',
            message: 'Non riceverai più notifiche da Ugo. Potrai riattivarle in qualsiasi momento.',
            type: 'info',
            icon: '🔕',
            duration: 4000
        });
    } else {
        // Enable notifications
        requestNotificationPermission();
    }
}

/**
 * Send daily wisdom notification
 */
function sendDailyWisdomNotification() {
    const wisdoms = [
        'Ogni giorno è una nuova avventura! 🌟',
        'La felicità è una cuccia calda e un amico vicino 🏠',
        'Non dimenticare mai di giocare! 🎾',
        'Le coccole rendono tutto migliore 🤗',
        'Sii curioso, annusa tutto! 👃',
        'Un sorriso può illuminare la giornata di qualcuno 😊'
    ];
    
    const randomWisdom = wisdoms[Math.floor(Math.random() * wisdoms.length)];
    
    showInAppNotification({
        title: '💡 Saggezza del giorno da Ugo',
        message: randomWisdom,
        type: 'wisdom',
        icon: '💡',
        duration: 8000,
        actions: [
            {
                text: '💾 Salva questa saggezza',
                action: () => {
                    localStorage.setItem('ugo-daily-wisdom-' + Date.now(), randomWisdom);
                    showInAppNotification({
                        title: 'Saggezza salvata! 💾',
                        message: 'Potrai rileggerla quando vuoi.',
                        type: 'success',
                        icon: '✅',
                        duration: 3000
                    });
                }
            }
        ]
    });
}

/**
 * Schedule daily notifications
 */
function scheduleDailyNotifications() {
    // Check if we should show daily wisdom (once per day)
    const lastWisdom = localStorage.getItem('ugo-last-wisdom-date');
    const today = new Date().toDateString();
    
    if (lastWisdom !== today) {
        // Wait a bit for the page to load
        setTimeout(() => {
            sendDailyWisdomNotification();
            localStorage.setItem('ugo-last-wisdom-date', today);
        }, 10000);
    }
}

// Global functions
window.closeNotification = closeNotification;
window.handleNotificationAction = handleNotificationAction;

// Initialize daily notifications
if (localStorage.getItem('ugo-notifications-enabled')) {
    scheduleDailyNotifications();
}

// Expose public API
window.UgoNotifications = {
    show: showInAppNotification,
    showBrowser: showBrowserNotification,
    requestPermission: requestNotificationPermission,
    sendDailyWisdom: sendDailyWisdomNotification
};

// CSS Styles
const notificationStyles = `
<style>
.notification-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 400px;
    width: 100%;
    pointer-events: none;
}

.ugo-notification {
    background: white;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border: 2px solid transparent;
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    pointer-events: auto;
    overflow: hidden;
    position: relative;
}

.ugo-notification::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #b97a56, #f97316);
}

.ugo-notification.show {
    transform: translateX(0);
    opacity: 1;
}

.ugo-notification.removing {
    transform: translateX(100%);
    opacity: 0;
}

.ugo-notification-welcome::before {
    background: linear-gradient(90deg, #10b981, #06b6d4);
}

.ugo-notification-success::before {
    background: linear-gradient(90deg, #10b981, #22c55e);
}

.ugo-notification-error::before {
    background: linear-gradient(90deg, #ef4444, #dc2626);
}

.ugo-notification-warning::before {
    background: linear-gradient(90deg, #f59e0b, #d97706);
}

.ugo-notification-achievement::before {
    background: linear-gradient(90deg, #8b5cf6, #a855f7);
}

.ugo-notification-wisdom::before {
    background: linear-gradient(90deg, #3b82f6, #1d4ed8);
}

.notification-content {
    display: flex;
    align-items: flex-start;
    padding: 1.25rem;
    gap: 1rem;
}

.notification-icon {
    font-size: 1.75rem;
    flex-shrink: 0;
    margin-top: 0.125rem;
}

.notification-text {
    flex: 1;
}

.notification-title {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
    line-height: 1.3;
}

.notification-message {
    margin: 0;
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.4;
}

.notification-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #9ca3af;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s ease;
    flex-shrink: 0;
}

.notification-close:hover {
    background: #f3f4f6;
    color: #374151;
}

.notification-actions {
    padding: 0 1.25rem 1.25rem 1.25rem;
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.notification-btn {
    background: rgba(185, 122, 86, 0.1);
    border: 2px solid rgba(185, 122, 86, 0.2);
    color: #b97a56;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    flex: 1;
    min-width: 100px;
}

.notification-btn:hover {
    background: rgba(185, 122, 86, 0.2);
    border-color: rgba(185, 122, 86, 0.4);
    transform: translateY(-1px);
}

.notification-btn.primary {
    background: linear-gradient(135deg, #b97a56, #f97316);
    border-color: transparent;
    color: white;
}

.notification-btn.primary:hover {
    background: linear-gradient(135deg, #a66945, #ea580c);
    transform: translateY(-1px) scale(1.02);
    box-shadow: 0 4px 12px rgba(185, 122, 86, 0.3);
}

.ugo-notification-loading .notification-icon {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.ugo-notification-achievement {
    border-color: #8b5cf6;
    background: linear-gradient(135deg, #faf5ff, #ffffff);
}

.ugo-notification-achievement .notification-icon {
    animation: bounce 0.6s ease-in-out;
}

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

.ugo-notification-wisdom {
    border-color: #3b82f6;
    background: linear-gradient(135deg, #eff6ff, #ffffff);
}

.ugo-notification-wisdom .notification-icon {
    animation: glow 2s ease-in-out infinite alternate;
}

@keyframes glow {
    from {
        text-shadow: 0 0 5px #3b82f6;
    }
    to {
        text-shadow: 0 0 20px #3b82f6, 0 0 30px #1d4ed8;
    }
}

/* Mobile responsive */
@media (max-width: 480px) {
    .notification-container {
        top: 10px;
        right: 10px;
        left: 10px;
        max-width: none;
    }
    
    .notification-actions {
        flex-direction: column;
    }
    
    .notification-btn {
        flex: none;
        width: 100%;
    }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    .ugo-notification {
        background: #1f2937;
        color: #f9fafb;
        border-color: #374151;
    }
    
    .notification-title {
        color: #f9fafb;
    }
    
    .notification-message {
        color: #d1d5db;
    }
    
    .notification-close {
        color: #9ca3af;
    }
    
    .notification-close:hover {
        background: #374151;
        color: #f3f4f6;
    }
}

/* Print hide notifications */
@media print {
    .notification-container {
        display: none !important;
    }
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', notificationStyles);

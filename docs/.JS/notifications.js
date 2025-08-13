// Sistema avanzato di notifiche e PWA
class UgoNotificationSystem {
    constructor() {
        this.swRegistration = null;
        this.isSubscribed = false;
        this.applicationServerKey = null; // Sostituisci con la tua chiave VAPID
        
        this.init();
    }

    async init() {
        if ('serviceWorker' in navigator) {
            try {
                this.swRegistration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registrato');
                
                // Inizializza notifiche push
                await this.initializeNotifications();
                
                // Setup PWA install prompt
                this.setupPWAInstall();
                
            } catch (error) {
                console.error('Errore registrazione Service Worker:', error);
            }
        }
    }

    async initializeNotifications() {
        if (!('Notification' in window)) {
            console.log('Questo browser non supporta le notifiche');
            return;
        }

        if (!('PushManager' in window)) {
            console.log('Questo browser non supporta push messaging');
            return;
        }

        // Controlla se l'utente è già iscritto
        const subscription = await this.swRegistration.pushManager.getSubscription();
        this.isSubscribed = !(subscription === null);
        
        if (this.isSubscribed) {
            console.log('Utente già iscritto alle notifiche');
        }

        this.setupNotificationUI();
    }

    setupNotificationUI() {
        // Aggiungi pulsante per abilitare notifiche
        const notificationBtn = document.createElement('button');
        notificationBtn.id = 'enable-notifications';
        notificationBtn.textContent = this.isSubscribed ? '🔔 Notifiche Attive' : '🔕 Abilita Notifiche';
        notificationBtn.className = 'notification-btn';
        notificationBtn.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 20px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            border: none;
            padding: 1rem 1.5rem;
            border-radius: 25px;
            cursor: pointer;
            font-weight: 600;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 9998;
            transition: all 0.3s ease;
        `;

        if (!this.isSubscribed) {
            notificationBtn.addEventListener('click', () => this.subscribeToNotifications());
        }

        document.body.appendChild(notificationBtn);
    }

    async subscribeToNotifications() {
        try {
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                // Qui dovresti usare la tua chiave VAPID
                const subscription = await this.swRegistration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this.urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY_HERE')
                });

                console.log('Utente iscritto alle notifiche:', subscription);
                
                // Invia subscription al server (implementa questa parte)
                await this.sendSubscriptionToServer(subscription);
                
                this.isSubscribed = true;
                this.updateNotificationButton();
                
                // Mostra notifica di conferma
                this.showLocalNotification('Notifiche Abilitate!', 'Riceverai aggiornamenti sulle avventure di Ugo 🐾');
                
            } else {
                console.log('Permesso notifiche negato');
            }
        } catch (error) {
            console.error('Errore iscrizione notifiche:', error);
        }
    }

    updateNotificationButton() {
        const btn = document.getElementById('enable-notifications');
        if (btn) {
            btn.textContent = '🔔 Notifiche Attive';
            btn.style.background = 'linear-gradient(135deg, #6b7280, #4b5563)';
            btn.onclick = null;
        }
    }

    async sendSubscriptionToServer(subscription) {
        // Implementa l'invio al tuo server
        // Per ora salviamo in localStorage come demo
        localStorage.setItem('pushSubscription', JSON.stringify(subscription));
    }

    showLocalNotification(title, body) {
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-72x72.png'
            });
        }
    }

    setupPWAInstall() {
        let deferredPrompt;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Mostra pulsante di installazione personalizzato
            this.showInstallButton(deferredPrompt);
        });

        window.addEventListener('appinstalled', () => {
            console.log('PWA installata');
            deferredPrompt = null;
            this.hideInstallButton();
        });
    }

    showInstallButton(deferredPrompt) {
        const installBtn = document.createElement('button');
        installBtn.id = 'pwa-install';
        installBtn.innerHTML = '📱 Installa App';
        installBtn.className = 'install-btn';
        installBtn.style.cssText = `
            position: fixed;
            bottom: 170px;
            right: 20px;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            border: none;
            padding: 1rem 1.5rem;
            border-radius: 25px;
            cursor: pointer;
            font-weight: 600;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 9998;
            transition: all 0.3s ease;
        `;

        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                
                if (outcome === 'accepted') {
                    console.log('Utente ha accettato installazione');
                } else {
                    console.log('Utente ha rifiutato installazione');
                }
                
                deferredPrompt = null;
                installBtn.remove();
            }
        });

        document.body.appendChild(installBtn);
    }

    hideInstallButton() {
        const installBtn = document.getElementById('pwa-install');
        if (installBtn) {
            installBtn.remove();
        }
    }

    // Programma notifiche intelligenti
    scheduleSmartNotifications() {
        // Notifica quotidiana basata sull'ultimo accesso
        const lastVisit = localStorage.getItem('lastVisit');
        const now = new Date();
        
        if (lastVisit) {
            const lastVisitDate = new Date(lastVisit);
            const daysSinceLastVisit = Math.floor((now - lastVisitDate) / (1000 * 60 * 60 * 24));
            
            if (daysSinceLastVisit >= 3) {
                setTimeout(() => {
                    this.showLocalNotification(
                        'Ugo ti ha aspettato!',
                        `Sono passati ${daysSinceLastVisit} giorni dalla tua ultima visita. Ugo ha delle sorprese per te! 🎁`
                    );
                }, 5000);
            }
        }
        
        // Salva timestamp visita corrente
        localStorage.setItem('lastVisit', now.toISOString());
    }

    // Notifiche basate sul comportamento
    setupBehavioralNotifications() {
        // Notifica dopo completamento quiz
        window.addEventListener('quizCompleted', (e) => {
            const score = e.detail.score;
            if (score >= 80) {
                setTimeout(() => {
                    this.showLocalNotification(
                        'Ottimo punteggio! 🏆',
                        'Hai dimostrato di conoscere bene Ugo! Che ne dici di provare una storia interattiva?'
                    );
                }, 2000);
            }
        });

        // Notifica dopo storia completata
        window.addEventListener('storyCompleted', (e) => {
            setTimeout(() => {
                this.showLocalNotification(
                    'Storia completata! 📚',
                    'Ti è piaciuta l\'avventura? Ugo ne ha molte altre da condividere con te!'
                );
            }, 1000);
        });
    }

    // Utility per convertire VAPID key
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
}

// Inizializza il sistema di notifiche
document.addEventListener('DOMContentLoaded', () => {
    window.ugoNotifications = new UgoNotificationSystem();
    
    // Setup behavioral notifications
    setTimeout(() => {
        window.ugoNotifications.setupBehavioralNotifications();
        window.ugoNotifications.scheduleSmartNotifications();
    }, 2000);
});

// CSS per i pulsanti
const style = document.createElement('style');
style.textContent = `
    .notification-btn:hover, .install-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    }
    
    .notification-btn:active, .install-btn:active {
        transform: translateY(0);
    }
`;
document.head.appendChild(style);

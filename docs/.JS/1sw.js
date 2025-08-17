// Service Worker per PWA e notifiche
const CACHE_NAME = 'ugo-world-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/dashboard.html',
  '/dashboard-style.css',
  '/dashboard.js',
  '/ugo-stories.html',
  '/stories-style.css',
  '/stories.js',
  '/quiz.html',
  '/quiz-style.css',
  '/quiz.js',
  '/photobooth.html',
  '/photobooth-style.css',
  '/photobooth.js',
  'Immagini/Ugo.jpeg',
  'Immagini/golden con sfondo nero.jpg',
  'Immagini/impronta stupenda.jpg',
  'Immagini/ugo-bg.jpg'
];

// Installazione del Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch eventi - servire contenuti dalla cache
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Ritorna cached version o fetch da network
        return response || fetch(event.request);
      }
    )
  );
});

// Gestione notifiche push
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Ugo ha qualcosa di nuovo da mostrarti! 🐾',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    },
    actions: [
      {
        action: 'explore',
        title: 'Esplora',
        icon: '/icons/explore-icon.png'
      },
      {
        action: 'close',
        title: 'Chiudi',
        icon: '/icons/close-icon.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Il Mondo di Ugo', options)
  );
});

// Gestione click notifiche
self.addEventListener('notificationclick', event => {
  console.log('Notification click received.');

  event.notification.close();

  if (event.action === 'explore') {
    // Apri la app
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Non fare nulla, solo chiudi
    console.log('Notification dismissed');
  } else {
    // Default action - apri la app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background Sync per funzionalità offline
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  return new Promise((resolve, reject) => {
    // Sincronizza dati quando la connessione è ripristinata
    console.log('Background sync completed');
    resolve();
  });
}

// Notifiche periodiche (se supportate)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'daily-ugo-notification') {
    event.waitUntil(showDailyNotification());
  }
});

function showDailyNotification() {
  const dailyMessages = [
    'Ugo ti manda un abbraccio virtuale! 🤗',
    'È il momento di visitare Ugo! 🐕',
    'Ugo ha imparato un nuovo trucco oggi! 🎪',
    'Le avventure di Ugo ti aspettano! 🌟',
    'Ugo dice: "Woof! Mi manchi!" 💝'
  ];
  
  const randomMessage = dailyMessages[Math.floor(Math.random() * dailyMessages.length)];
  
  return self.registration.showNotification('Il tuo amico Ugo', {
    body: randomMessage,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'daily-notification'
  });
}

// Sistema di Analytics Avanzato per il Mondo di Ugo
class UgoAnalytics {
    constructor() {
        this.data = this.loadAnalyticsData();
        this.charts = {};
        this.realTimeEvents = [];
        
        this.init();
        this.startRealTimeSimulation();
    }

    loadAnalyticsData() {
        // Simula dati analytics realistici
        return {
            totalUsers: 1247,
            storiesRead: 3456,
            achievementsUnlocked: 892,
            avgSessionTime: 12, // minuti
            dailyVisitors: [45, 52, 38, 67, 84, 91, 73, 68, 79, 95, 103, 88, 76, 82],
            popularPages: {
                'Home': 35,
                'Storie Interattive': 28,
                'Quiz': 18,
                'Dashboard': 12,
                'Photo Booth': 7
            },
            hourlyEngagement: Array.from({length: 24}, (_, i) => Math.floor(Math.random() * 100) + 20),
            devices: {
                'Mobile': 68,
                'Desktop': 25,
                'Tablet': 7
            },
            userJourney: ['Home', 'Dashboard', 'Storie', 'Quiz', 'Photo Booth'],
            sentimentScore: 8.7
        };
    }

    init() {
        this.updateKPIs();
        this.createCharts();
        this.createHeatmap();
        this.setupRealTimeFeed();
        this.renderUserJourney();
    }

    updateKPIs() {
        document.getElementById('total-users').textContent = this.data.totalUsers.toLocaleString();
        document.getElementById('stories-read').textContent = this.data.storiesRead.toLocaleString();
        document.getElementById('achievements-unlocked').textContent = this.data.achievementsUnlocked.toLocaleString();
        document.getElementById('avg-session').textContent = `${this.data.avgSessionTime}m`;
    }

    createCharts() {
        this.createDailyVisitorsChart();
        this.createPopularPagesChart();
        this.createHourlyEngagementChart();
        this.createDeviceChart();
    }

    createDailyVisitorsChart() {
        const ctx = document.getElementById('daily-visitors-chart').getContext('2d');
        
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(185, 122, 86, 0.6)');
        gradient.addColorStop(1, 'rgba(185, 122, 86, 0.1)');

        this.charts.dailyVisitors = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.generateDateLabels(14),
                datasets: [{
                    label: 'Visitatori',
                    data: this.data.dailyVisitors,
                    borderColor: '#b97a56',
                    backgroundColor: gradient,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#b97a56',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    createPopularPagesChart() {
        const ctx = document.getElementById('popular-pages-chart').getContext('2d');
        
        this.charts.popularPages = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(this.data.popularPages),
                datasets: [{
                    data: Object.values(this.data.popularPages),
                    backgroundColor: [
                        '#b97a56',
                        '#d35400',
                        '#3b82f6',
                        '#10b981',
                        '#f59e0b'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    createHourlyEngagementChart() {
        const ctx = document.getElementById('hourly-engagement-chart').getContext('2d');
        
        this.charts.hourlyEngagement = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Array.from({length: 24}, (_, i) => `${i}:00`),
                datasets: [{
                    label: 'Engagement',
                    data: this.data.hourlyEngagement,
                    backgroundColor: '#b97a56',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    createDeviceChart() {
        const ctx = document.getElementById('device-chart').getContext('2d');
        
        this.charts.devices = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(this.data.devices),
                datasets: [{
                    data: Object.values(this.data.devices),
                    backgroundColor: [
                        '#3b82f6',
                        '#10b981',
                        '#f59e0b'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    createHeatmap() {
        const grid = document.getElementById('heatmap-grid');
        grid.innerHTML = '';
        
        // Genera 200 celle per la heatmap
        for (let i = 0; i < 200; i++) {
            const cell = document.createElement('div');
            cell.className = 'heatmap-cell';
            
            // Simula intensità basata su pattern realistici
            const intensity = this.calculateHeatmapIntensity(i);
            cell.classList.add(intensity);
            
            // Tooltip con informazioni
            cell.title = `Posizione: ${i % 20}, ${Math.floor(i / 20)} - Intensità: ${intensity}`;
            
            grid.appendChild(cell);
        }
    }

    calculateHeatmapIntensity(index) {
        const x = index % 20;
        const y = Math.floor(index / 20);
        
        // Simula hotspots in zone specifiche
        const hotspots = [
            {x: 10, y: 5, radius: 3}, // Centro pagina
            {x: 5, y: 2, radius: 2},  // Menu area
            {x: 15, y: 8, radius: 2}  // CTA area
        ];
        
        let maxIntensity = 0;
        hotspots.forEach(hotspot => {
            const distance = Math.sqrt(Math.pow(x - hotspot.x, 2) + Math.pow(y - hotspot.y, 2));
            if (distance <= hotspot.radius) {
                const intensity = 1 - (distance / hotspot.radius);
                maxIntensity = Math.max(maxIntensity, intensity);
            }
        });
        
        if (maxIntensity > 0.6) return 'high';
        if (maxIntensity > 0.3) return 'medium';
        return 'low';
    }

    setupRealTimeFeed() {
        const feed = document.getElementById('realtime-feed');
        
        // Aggiungi alcuni eventi iniziali
        this.addRealTimeEvent('user-action', 'Nuovo utente ha visitato la homepage', 'Appena ora');
        this.addRealTimeEvent('achievement', 'Maria ha sbloccato "Quiz Master"', '2 minuti fa');
        this.addRealTimeEvent('interaction', 'Luca ha accarezzato Ugo 5 volte', '3 minuti fa');
        this.addRealTimeEvent('user-action', 'Giulia ha completato una storia', '5 minuti fa');
    }

    addRealTimeEvent(type, title, time) {
        const feed = document.getElementById('realtime-feed');
        
        const event = document.createElement('div');
        event.className = 'realtime-event';
        
        const icons = {
            'user-action': '👤',
            'achievement': '🏆',
            'interaction': '🤚'
        };
        
        event.innerHTML = `
            <div class="event-icon ${type}">
                ${icons[type]}
            </div>
            <div class="event-content">
                <div class="event-title">${title}</div>
                <div class="event-time">${time}</div>
            </div>
        `;
        
        feed.insertBefore(event, feed.firstChild);
        
        // Mantieni solo gli ultimi 10 eventi
        while (feed.children.length > 10) {
            feed.removeChild(feed.lastChild);
        }
    }

    startRealTimeSimulation() {
        // Simula eventi in tempo reale
        setInterval(() => {
            const events = [
                {type: 'user-action', title: 'Nuovo utente registrato', time: 'Appena ora'},
                {type: 'achievement', title: 'Achievement "Esploratore" sbloccato', time: 'Appena ora'},
                {type: 'interaction', title: 'Interazione con Ugo completata', time: 'Appena ora'},
                {type: 'user-action', title: 'Quiz completato con successo', time: 'Appena ora'},
                {type: 'user-action', title: 'Storia interattiva iniziata', time: 'Appena ora'}
            ];
            
            const randomEvent = events[Math.floor(Math.random() * events.length)];
            this.addRealTimeEvent(randomEvent.type, randomEvent.title, randomEvent.time);
            
            // Aggiorna anche alcuni KPI
            this.updateRealTimeKPIs();
            
        }, 10000); // Ogni 10 secondi
    }

    updateRealTimeKPIs() {
        // Simula piccoli incrementi nei KPI
        this.data.totalUsers += Math.floor(Math.random() * 3);
        this.data.storiesRead += Math.floor(Math.random() * 5);
        this.data.achievementsUnlocked += Math.floor(Math.random() * 2);
        
        this.updateKPIs();
    }

    renderUserJourney() {
        const journey = document.getElementById('user-journey');
        journey.innerHTML = '';
        
        this.data.userJourney.forEach((step, index) => {
            const stepElement = document.createElement('div');
            stepElement.className = 'journey-step';
            stepElement.textContent = step;
            journey.appendChild(stepElement);
        });
    }

    generateDateLabels(days) {
        const labels = [];
        const today = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }));
        }
        
        return labels;
    }

    // Export dei dati per report
    exportData() {
        const exportData = {
            timestamp: new Date().toISOString(),
            ...this.data,
            realTimeEvents: this.realTimeEvents
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ugo-analytics-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }
}

// Inizializza analytics quando la pagina è caricata
document.addEventListener('DOMContentLoaded', () => {
    window.ugoAnalytics = new UgoAnalytics();
    
    // Aggiungi pulsante export (opzionale)
    const exportBtn = document.createElement('button');
    exportBtn.textContent = '📊 Esporta Dati';
    exportBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--primary-color);
        color: white;
        border: none;
        padding: 1rem 2rem;
        border-radius: 25px;
        cursor: pointer;
        font-weight: 600;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 1000;
    `;
    
    exportBtn.addEventListener('click', () => {
        window.ugoAnalytics.exportData();
    });
    
    document.body.appendChild(exportBtn);
});

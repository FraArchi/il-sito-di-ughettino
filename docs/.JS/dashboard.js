// Sistema di gamification avanzato
class UgoDashboard {
    constructor() {
        this.userData = this.loadUserData();
        this.achievements = this.initializeAchievements();
        this.dailyChallenges = this.initializeChallenges();
        this.ugoMoods = ['😊', '😴', '🤩', '🥳', '😇', '🤔', '😋'];
        this.currentTheme = localStorage.getItem('ugoTheme') || 'default';
        
        this.init();
    }

    loadUserData() {
        const defaultData = {
            firstVisit: new Date().toISOString(),
            totalVisits: 0,
            ugoPoints: 0,
            completedStories: JSON.parse(localStorage.getItem('ugoStoryEndings')) || [],
            lastInteraction: null,
            achievements: JSON.parse(localStorage.getItem('ugoAchievements')) || [],
            dailyStreak: 0
        };
        
        const stored = localStorage.getItem('ugoDashboard');
        return stored ? {...defaultData, ...JSON.parse(stored)} : defaultData;
    }

    saveUserData() {
        localStorage.setItem('ugoDashboard', JSON.stringify(this.userData));
    }

    initializeAchievements() {
        return [
            {
                id: 'first_visit',
                title: 'Primo Incontro',
                description: 'Hai visitato il mondo di Ugo per la prima volta',
                icon: '🎉',
                points: 10,
                condition: () => true
            },
            {
                id: 'story_explorer',
                title: 'Esploratore di Storie',
                description: 'Completa la tua prima storia interattiva',
                icon: '📚',
                points: 25,
                condition: () => this.userData.completedStories.length > 0
            },
            {
                id: 'quiz_master',
                title: 'Quiz Master',
                description: 'Ottieni il punteggio perfetto nel quiz',
                icon: '🧠',
                points: 30,
                condition: () => localStorage.getItem('perfectQuizScore') === 'true'
            },
            {
                id: 'daily_visitor',
                title: 'Visitatore Quotidiano',
                description: 'Visita il sito per 7 giorni consecutivi',
                icon: '🗓️',
                points: 50,
                condition: () => this.userData.dailyStreak >= 7
            },
            {
                id: 'ugo_whisperer',
                title: 'Sussurratore di Ugo',
                description: 'Interagisci con Ugo 20 volte',
                icon: '🐕‍🦺',
                points: 40,
                condition: () => (this.userData.ugoInteractions || 0) >= 20
            },
            {
                id: 'completionist',
                title: 'Completista',
                description: 'Sblocca tutti i finali delle storie',
                icon: '🏆',
                points: 100,
                condition: () => {
                    const allEndings = ['friendship', 'hero'];
                    return allEndings.every(ending => this.userData.completedStories.includes(ending));
                }
            }
        ];
    }

    initializeChallenges() {
        const challenges = [
            {
                title: 'Accarezza Ugo 5 volte',
                description: 'Mostra affetto al nostro amico peloso',
                target: 5,
                current: 0,
                type: 'pet',
                reward: 15
            },
            {
                title: 'Leggi una storia completa',
                description: 'Esplora le avventure interattive di Ugo',
                target: 1,
                current: 0,
                type: 'story',
                reward: 25
            },
            {
                title: 'Cambia tema del sito',
                description: 'Personalizza la tua esperienza',
                target: 1,
                current: 0,
                type: 'theme',
                reward: 10
            }
        ];

        const today = new Date().toDateString();
        const storedChallenge = localStorage.getItem('dailyChallenge');
        const storedDate = localStorage.getItem('dailyChallengeDate');

        if (storedDate !== today) {
            // Nuova sfida quotidiana
            const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
            localStorage.setItem('dailyChallenge', JSON.stringify(randomChallenge));
            localStorage.setItem('dailyChallengeDate', today);
            return randomChallenge;
        }

        return storedChallenge ? JSON.parse(storedChallenge) : challenges[0];
    }

    init() {
        this.updateVisitCount();
        this.updateStats();
        this.renderAchievements();
        this.renderDailyChallenge();
        this.setupMoodSystem();
        this.setupThemeSelector();
        this.createActivityChart();
        this.checkNewAchievements();
        
        // Auto-save ogni 30 secondi
        setInterval(() => this.saveUserData(), 30000);
    }

    updateVisitCount() {
        this.userData.totalVisits++;
        this.updateDailyStreak();
        this.saveUserData();
    }

    updateDailyStreak() {
        const today = new Date().toDateString();
        const lastVisit = this.userData.lastInteraction;
        
        if (lastVisit) {
            const lastVisitDate = new Date(lastVisit).toDateString();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastVisitDate === today) {
                // Già visitato oggi, non cambiare streak
                return;
            } else if (lastVisitDate === yesterday.toDateString()) {
                // Visitato ieri, incrementa streak
                this.userData.dailyStreak++;
            } else {
                // Non visitato ieri, reset streak
                this.userData.dailyStreak = 1;
            }
        } else {
            this.userData.dailyStreak = 1;
        }
        
        this.userData.lastInteraction = new Date().toISOString();
    }

    updateStats() {
        const firstVisit = new Date(this.userData.firstVisit);
        const daysSince = Math.floor((new Date() - firstVisit) / (1000 * 60 * 60 * 24));
        
        document.getElementById('days-since-first-visit').textContent = daysSince;
        document.getElementById('total-achievements').textContent = this.userData.achievements.length;
        document.getElementById('ugo-points').textContent = this.userData.ugoPoints;
        document.getElementById('stories-completed').textContent = this.userData.completedStories.length;
    }

    renderAchievements() {
        const grid = document.getElementById('achievements-grid');
        grid.innerHTML = '';

        this.achievements.forEach(achievement => {
            const isUnlocked = this.userData.achievements.includes(achievement.id);
            const div = document.createElement('div');
            div.className = `achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`;
            
            div.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-title">${achievement.title}</div>
                <div class="achievement-description">${achievement.description}</div>
                <div class="achievement-points">+${achievement.points} punti</div>
            `;
            
            grid.appendChild(div);
        });
    }

    renderDailyChallenge() {
        const container = document.getElementById('daily-challenge');
        const challenge = this.initializeChallenges();
        
        const progress = Math.min((challenge.current / challenge.target) * 100, 100);
        
        container.innerHTML = `
            <div class="challenge-title">${challenge.title}</div>
            <div class="challenge-description">${challenge.description}</div>
            <div class="challenge-progress">
                <div class="challenge-progress-bar" style="width: ${progress}%"></div>
            </div>
            <div class="challenge-status">${challenge.current}/${challenge.target} - ${challenge.reward} punti</div>
        `;
    }

    setupMoodSystem() {
        this.updateUgoMood();
        // Cambia l'umore di Ugo ogni 5 minuti
        setInterval(() => this.updateUgoMood(), 5 * 60 * 1000);
    }

    updateUgoMood() {
        const moodIndicator = document.getElementById('mood-indicator');
        const moodMessage = document.getElementById('mood-message');
        
        const randomMood = this.ugoMoods[Math.floor(Math.random() * this.ugoMoods.length)];
        const messages = {
            '😊': 'Ugo è felice di vederti!',
            '😴': 'Ugo sta facendo un pisolino...',
            '🤩': 'Ugo è entusiasta delle tue visite!',
            '🥳': 'Ugo sta festeggiando!',
            '😇': 'Ugo è in modalità angelo oggi',
            '🤔': 'Ugo sta riflettendo profondamente...',
            '😋': 'Ugo sta pensando ai biscotti!'
        };
        
        moodIndicator.textContent = randomMood;
        moodMessage.textContent = messages[randomMood];
    }

    setupThemeSelector() {
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                this.changeTheme(theme);
                
                // Update active button
                document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update challenge progress
                this.updateChallengeProgress('theme', 1);
            });
        });
        
        // Set current theme as active
        document.querySelector(`[data-theme="${this.currentTheme}"]`)?.classList.add('active');
    }

    changeTheme(theme) {
        this.currentTheme = theme;
        localStorage.setItem('ugoTheme', theme);
        
        const themes = {
            default: {},
            dark: {
                '--bg-primary': '#1a1a1a',
                '--bg-secondary': '#2d2d2d',
                '--text-primary': '#ffffff',
                '--text-secondary': '#cccccc'
            },
            playful: {
                '--primary-color': '#ff6b6b',
                '--accent-color': '#4ecdc4',
                '--bg-primary': '#fff8e1'
            },
            autumn: {
                '--primary-color': '#d2691e',
                '--accent-color': '#cd853f',
                '--bg-primary': '#fdf6e3'
            }
        };
        
        const root = document.documentElement;
        Object.entries(themes[theme] || {}).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });
    }

    createActivityChart() {
        const canvas = document.getElementById('activity-chart');
        const ctx = canvas.getContext('2d');
        
        // Dati simulati per la settimana passata
        const days = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
        const visits = [3, 5, 2, 8, 6, 12, 9]; // Dati di esempio
        
        const maxVisits = Math.max(...visits);
        const barWidth = canvas.width / days.length - 20;
        const barMaxHeight = canvas.height - 40;
        
        ctx.fillStyle = '#b97a56';
        
        days.forEach((day, index) => {
            const barHeight = (visits[index] / maxVisits) * barMaxHeight;
            const x = index * (barWidth + 20) + 10;
            const y = canvas.height - barHeight - 20;
            
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // Labels
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(day, x + barWidth/2, canvas.height - 5);
            ctx.fillText(visits[index], x + barWidth/2, y - 5);
            
            ctx.fillStyle = '#b97a56';
        });
    }

    checkNewAchievements() {
        this.achievements.forEach(achievement => {
            if (!this.userData.achievements.includes(achievement.id) && achievement.condition()) {
                this.unlockAchievement(achievement);
            }
        });
    }

    unlockAchievement(achievement) {
        this.userData.achievements.push(achievement.id);
        this.userData.ugoPoints += achievement.points;
        this.saveUserData();
        
        this.showAchievementNotification(achievement);
        this.renderAchievements();
        this.updateStats();
    }

    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #fbbf24, #f59e0b);
            color: white;
            padding: 1rem 2rem;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: achievementSlide 0.5s ease-out;
            max-width: 300px;
        `;
        
        notification.innerHTML = `
            <div style="font-size: 2rem; text-align: center; margin-bottom: 0.5rem;">${achievement.icon}</div>
            <div style="font-weight: bold; margin-bottom: 0.5rem;">Achievement Sbloccato!</div>
            <div style="font-size: 0.9rem;">${achievement.title}</div>
            <div style="font-size: 0.8rem; opacity: 0.9;">+${achievement.points} Ugo Points!</div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    updateChallengeProgress(type, amount) {
        const challenge = JSON.parse(localStorage.getItem('dailyChallenge'));
        if (challenge && challenge.type === type) {
            challenge.current = Math.min(challenge.current + amount, challenge.target);
            localStorage.setItem('dailyChallenge', JSON.stringify(challenge));
            
            if (challenge.current >= challenge.target) {
                this.userData.ugoPoints += challenge.reward;
                this.saveUserData();
                this.updateStats();
                
                // Show completion notification
                this.showChallengeCompletionNotification(challenge);
            }
            
            this.renderDailyChallenge();
        }
    }

    showChallengeCompletionNotification(challenge) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 1rem 2rem;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: achievementSlide 0.5s ease-out;
        `;
        
        notification.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 0.5rem;">🎯 Sfida Completata!</div>
            <div style="font-size: 0.9rem;">${challenge.title}</div>
            <div style="font-size: 0.8rem; opacity: 0.9;">+${challenge.reward} punti guadagnati!</div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }
}

// Funzione globale per l'interazione con Ugo
function interactWithUgo(action) {
    const dashboard = window.ugoDashboard;
    if (!dashboard.userData.ugoInteractions) {
        dashboard.userData.ugoInteractions = 0;
    }
    
    dashboard.userData.ugoInteractions++;
    dashboard.saveUserData();
    
    // Update challenge progress
    if (action === 'pet') {
        dashboard.updateChallengeProgress('pet', 1);
    }
    
    // Show interaction feedback
    const avatar = document.getElementById('ugo-avatar');
    avatar.style.transform = 'scale(1.1)';
    setTimeout(() => {
        avatar.style.transform = 'scale(1)';
    }, 200);
    
    // Random positive messages
    const messages = {
        pet: ['Ugo ama le tue carezze! 🥰', 'Woof! Che belle coccole!', 'Ugo è al settimo cielo! ☁️'],
        treat: ['Ugo dice grazie per il premietto! 🦴', 'Yum yum! Delizioso!', 'Ugo è felicissimo! 🎉'],
        play: ['Ugo vuole giocare ancora! 🎾', 'Che divertimento!', 'Ugo è pieno di energia! ⚡']
    };
    
    const randomMessage = messages[action][Math.floor(Math.random() * messages[action].length)];
    document.getElementById('mood-message').textContent = randomMessage;
    
    // Check for new achievements
    dashboard.checkNewAchievements();
}

// CSS per le animazioni
const style = document.createElement('style');
style.textContent = `
    @keyframes achievementSlide {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    #ugo-avatar {
        transition: transform 0.2s ease;
    }
`;
document.head.appendChild(style);

// Inizializza la dashboard quando la pagina è caricata
document.addEventListener('DOMContentLoaded', () => {
    window.ugoDashboard = new UgoDashboard();
});

let unlockedEndings = JSON.parse(localStorage.getItem('ugoStoryEndings')) || [];

function goToScene(sceneNumber) {
    // Nascondi tutte le scene
    document.querySelectorAll('.story-scene').forEach(scene => {
        scene.classList.remove('active');
    });
    
    // Mostra la scena richiesta
    document.getElementById(`scene-${sceneNumber}`).classList.add('active');
    
    // Controlla se è un finale
    if (sceneNumber === 4) {
        unlockEnding('friendship');
    } else if (sceneNumber === 5) {
        unlockEnding('hero');
    }
    
    // Scroll verso l'alto
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function unlockEnding(endingType) {
    if (!unlockedEndings.includes(endingType)) {
        unlockedEndings.push(endingType);
        localStorage.setItem('ugoStoryEndings', JSON.stringify(unlockedEndings));
        updateAchievements();
        showUnlockNotification(endingType);
    }
}

function updateAchievements() {
    unlockedEndings.forEach(ending => {
        const achievement = document.getElementById(`achievement-${ending}`);
        if (achievement) {
            achievement.classList.add('unlocked');
            achievement.querySelector('.achievement-status').textContent = '✅';
        }
    });
}

function showUnlockNotification(endingType) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #4CAF50, #45a049);
        color: white;
        padding: 1rem 2rem;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.5s ease-out;
    `;
    
    const endings = {
        friendship: '🏆 Finale Amicizia Sbloccato!',
        hero: '🌟 Finale Eroismo Sbloccato!'
    };
    
    notification.textContent = endings[endingType];
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Inizializza gli achievement al caricamento
document.addEventListener('DOMContentLoaded', () => {
    updateAchievements();
});

// Aggiungi CSS per l'animazione
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

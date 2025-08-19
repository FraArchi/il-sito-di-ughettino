/**
 * Dashboard JavaScript for Ugo
 * Handles dashboard interactions, animations, and data visualization
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🐾 Dashboard di Ugo caricata!');
    
    // Initialize dashboard components
    initializeStats();
    initializeProgressBars();
    initializeAchievements();
    initializeActivityFeed();
    initializeAnimations();
    
    // Initialize interactions
    setupInteractions();
});

/**
 * Initialize statistics with counting animation
 */
function initializeStats() {
    const statCards = document.querySelectorAll('.stat-card');
    
    statCards.forEach(card => {
        const statNumber = card.querySelector('.stat-number');
        if (statNumber) {
            const finalValue = parseInt(statNumber.textContent) || 0;
            animateCounter(statNumber, 0, finalValue, 2000);
        }
    });
}

/**
 * Animate counter from start to end value
 */
function animateCounter(element, start, end, duration) {
    const startTime = Date.now();
    const range = end - start;
    
    function updateCounter() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(start + (range * easeOutQuart));
        
        element.textContent = currentValue;
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = end; // Ensure final value is exact
        }
    }
    
    requestAnimationFrame(updateCounter);
}

/**
 * Initialize progress bars with animation
 */
function initializeProgressBars() {
    const progressBars = document.querySelectorAll('.progress-fill');
    
    // Animate progress bars on scroll into view
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const progressBar = entry.target;
                const percentage = progressBar.dataset.progress || '0';
                
                setTimeout(() => {
                    progressBar.style.width = percentage + '%';
                }, 200);
                
                observer.unobserve(progressBar);
            }
        });
    }, observerOptions);
    
    progressBars.forEach(bar => {
        // Store original width and reset
        const width = bar.style.width || '0%';
        bar.dataset.progress = width.replace('%', '');
        bar.style.width = '0%';
        
        observer.observe(bar);
    });
}

/**
 * Initialize achievements with hover effects
 */
function initializeAchievements() {
    const achievementCards = document.querySelectorAll('.achievement-card');
    
    achievementCards.forEach(card => {
        // Add click handler for achievement details
        card.addEventListener('click', function() {
            const title = card.querySelector('.achievement-title')?.textContent;
            const description = card.querySelector('.achievement-description')?.textContent;
            
            showAchievementModal(title, description);
        });
        
        // Add sparkle effect on hover
        card.addEventListener('mouseenter', function() {
            addSparkleEffect(card);
        });
    });
}

/**
 * Add sparkle effect to achievement cards
 */
function addSparkleEffect(element) {
    const sparkles = 5;
    
    for (let i = 0; i < sparkles; i++) {
        setTimeout(() => {
            createSparkle(element);
        }, i * 100);
    }
}

/**
 * Create individual sparkle element
 */
function createSparkle(parent) {
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle';
    sparkle.innerHTML = '✨';
    
    // Random position within the parent
    const rect = parent.getBoundingClientRect();
    const x = Math.random() * rect.width;
    const y = Math.random() * rect.height;
    
    sparkle.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        pointer-events: none;
        animation: sparkleFloat 1s ease-out forwards;
        z-index: 10;
    `;
    
    parent.style.position = 'relative';
    parent.appendChild(sparkle);
    
    // Remove sparkle after animation
    setTimeout(() => {
        sparkle.remove();
    }, 1000);
}

/**
 * Initialize activity feed with real-time updates
 */
function initializeActivityFeed() {
    const activityList = document.querySelector('.activity-list');
    if (!activityList) return;
    
    // Simulate real-time activity updates
    setInterval(() => {
        if (Math.random() > 0.8) { // 20% chance every interval
            addNewActivity();
        }
    }, 30000); // Check every 30 seconds
    
    // Add click handlers to activity items
    const activityItems = document.querySelectorAll('.activity-item');
    activityItems.forEach(item => {
        item.addEventListener('click', function() {
            item.classList.toggle('expanded');
            // You can add more details expansion here
        });
    });
}

/**
 * Add new activity to the feed
 */
function addNewActivity() {
    const activities = [
        { icon: '🎯', title: 'Nuovo obiettivo completato', description: 'Hai completato la sfida giornaliera!', time: 'Ora' },
        { icon: '⭐', title: 'Livello aumentato', description: 'Sei passato al livello successivo!', time: 'Ora' },
        { icon: '🏆', title: 'Achievement sbloccato', description: 'Hai ottenuto un nuovo traguardo!', time: 'Ora' },
        { icon: '📚', title: 'Nuova storia letta', description: 'Hai letto una storia di Ugo!', time: 'Ora' }
    ];
    
    const activity = activities[Math.floor(Math.random() * activities.length)];
    const activityList = document.querySelector('.activity-list');
    
    const newItem = document.createElement('li');
    newItem.className = 'activity-item new-activity';
    newItem.innerHTML = `
        <span class="activity-icon">${activity.icon}</span>
        <div class="activity-content">
            <div class="activity-title">${activity.title}</div>
            <div class="activity-description">${activity.description}</div>
        </div>
        <span class="activity-time">${activity.time}</span>
    `;
    
    // Add to top of list
    activityList.insertBefore(newItem, activityList.firstChild);
    
    // Animate in
    newItem.style.transform = 'translateX(-100%)';
    newItem.style.opacity = '0';
    
    setTimeout(() => {
        newItem.style.transition = 'all 0.5s ease-out';
        newItem.style.transform = 'translateX(0)';
        newItem.style.opacity = '1';
    }, 100);
    
    // Remove 'new' class after animation
    setTimeout(() => {
        newItem.classList.remove('new-activity');
    }, 1000);
    
    // Keep only last 10 activities
    const items = activityList.querySelectorAll('.activity-item');
    if (items.length > 10) {
        items[items.length - 1].remove();
    }
}

/**
 * Initialize scroll animations
 */
function initializeAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.stat-card, .progress-item, .achievement-card, .activity-item');
    animatedElements.forEach(el => {
        observer.observe(el);
    });
}

/**
 * Setup interactive elements
 */
function setupInteractions() {
    // Add hover effects to cards
    const cards = document.querySelectorAll('.stat-card, .achievement-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
    
    // Add click ripple effect
    const clickableElements = document.querySelectorAll('.stat-card, .achievement-card, .progress-item');
    clickableElements.forEach(element => {
        element.addEventListener('click', createRippleEffect);
    });
    
    // Setup keyboard navigation
    setupKeyboardNavigation();
    
    // Setup data refresh
    setupDataRefresh();
}

/**
 * Create ripple effect on click
 */
function createRippleEffect(e) {
    const ripple = document.createElement('span');
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(185, 122, 86, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
    `;
    
    this.style.position = 'relative';
    this.style.overflow = 'hidden';
    this.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
}

/**
 * Setup keyboard navigation
 */
function setupKeyboardNavigation() {
    const focusableElements = document.querySelectorAll('.stat-card, .achievement-card, .activity-item');
    
    focusableElements.forEach((element, index) => {
        element.setAttribute('tabindex', '0');
        
        element.addEventListener('keydown', function(e) {
            switch(e.key) {
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    this.click();
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                    e.preventDefault();
                    focusNext(index, focusableElements);
                    break;
                case 'ArrowLeft':
                case 'ArrowUp':
                    e.preventDefault();
                    focusPrevious(index, focusableElements);
                    break;
            }
        });
    });
}

/**
 * Focus next element
 */
function focusNext(currentIndex, elements) {
    const nextIndex = (currentIndex + 1) % elements.length;
    elements[nextIndex].focus();
}

/**
 * Focus previous element
 */
function focusPrevious(currentIndex, elements) {
    const prevIndex = currentIndex === 0 ? elements.length - 1 : currentIndex - 1;
    elements[prevIndex].focus();
}

/**
 * Setup data refresh functionality
 */
function setupDataRefresh() {
    // Add refresh button if it exists
    const refreshButton = document.querySelector('.refresh-button');
    if (refreshButton) {
        refreshButton.addEventListener('click', refreshDashboardData);
    }
    
    // Auto-refresh every 5 minutes
    setInterval(refreshDashboardData, 300000);
}

/**
 * Refresh dashboard data
 */
function refreshDashboardData() {
    console.log('🔄 Aggiornamento dati dashboard...');
    
    // Show loading state
    document.body.classList.add('loading');
    
    // Simulate API call
    setTimeout(() => {
        // Update stats with new random values (simulated)
        updateStats();
        updateProgress();
        
        document.body.classList.remove('loading');
        console.log('✅ Dashboard aggiornata!');
    }, 1000);
}

/**
 * Update statistics with new values
 */
function updateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(stat => {
        const currentValue = parseInt(stat.textContent);
        const newValue = currentValue + Math.floor(Math.random() * 5); // Small increment
        animateCounter(stat, currentValue, newValue, 1000);
    });
}

/**
 * Update progress bars
 */
function updateProgress() {
    const progressBars = document.querySelectorAll('.progress-fill');
    progressBars.forEach(bar => {
        const currentWidth = parseInt(bar.style.width) || 0;
        const increment = Math.floor(Math.random() * 10);
        const newWidth = Math.min(currentWidth + increment, 100);
        
        bar.style.width = newWidth + '%';
        bar.dataset.progress = newWidth;
    });
}

/**
 * Show achievement modal
 */
function showAchievementModal(title, description) {
    // Create modal if it doesn't exist
    let modal = document.querySelector('.achievement-modal');
    if (!modal) {
        modal = createAchievementModal();
        document.body.appendChild(modal);
    }
    
    // Update modal content
    modal.querySelector('.modal-title').textContent = title;
    modal.querySelector('.modal-description').textContent = description;
    
    // Show modal
    modal.classList.add('active');
    modal.querySelector('.modal-content').focus();
}

/**
 * Create achievement modal
 */
function createAchievementModal() {
    const modal = document.createElement('div');
    modal.className = 'achievement-modal';
    modal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content" tabindex="-1">
                <div class="modal-header">
                    <h3 class="modal-title"></h3>
                    <button class="modal-close" aria-label="Chiudi">&times;</button>
                </div>
                <div class="modal-body">
                    <p class="modal-description"></p>
                    <div class="modal-celebration">🎉</div>
                </div>
                <div class="modal-footer">
                    <button class="btn-ugo modal-confirm">Fantastico!</button>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners
    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.querySelector('.modal-confirm').addEventListener('click', closeModal);
    modal.querySelector('.modal-overlay').addEventListener('click', closeModal);
    
    // Prevent modal content click from closing modal
    modal.querySelector('.modal-content').addEventListener('click', e => e.stopPropagation());
    
    return modal;
}

/**
 * Close modal
 */
function closeModal() {
    const modal = document.querySelector('.achievement-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// CSS for dynamic elements (added via JavaScript)
const dynamicStyles = `
    <style>
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        @keyframes sparkleFloat {
            0% {
                transform: translateY(0) scale(0);
                opacity: 1;
            }
            100% {
                transform: translateY(-20px) scale(1);
                opacity: 0;
            }
        }
        
        .animate-in {
            animation: fadeInUp 0.6s ease-out forwards;
        }
        
        .new-activity {
            background: rgba(185, 122, 86, 0.1) !important;
        }
        
        .loading .stat-number {
            opacity: 0.5;
        }
        
        .achievement-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1000;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }
        
        .achievement-modal.active {
            opacity: 1;
            visibility: visible;
        }
        
        .modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .modal-content {
            background: white;
            border-radius: 20px;
            padding: 2rem;
            max-width: 500px;
            width: 90%;
            transform: scale(0.8);
            transition: transform 0.3s ease;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        
        .achievement-modal.active .modal-content {
            transform: scale(1);
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }
        
        .modal-title {
            margin: 0;
            color: #b97a56;
            font-size: 1.5rem;
        }
        
        .modal-close {
            background: none;
            border: none;
            font-size: 2rem;
            cursor: pointer;
            color: #999;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .modal-close:hover {
            color: #b97a56;
        }
        
        .modal-celebration {
            font-size: 3rem;
            text-align: center;
            margin: 1rem 0;
            animation: bounce 1s infinite;
        }
        
        .modal-footer {
            text-align: center;
            margin-top: 1.5rem;
        }
        
        @keyframes bounce {
            0%, 20%, 53%, 80%, 100% {
                transform: translate3d(0,0,0);
            }
            40%, 43% {
                transform: translate3d(0,-15px,0);
            }
            70% {
                transform: translate3d(0,-7px,0);
            }
            90% {
                transform: translate3d(0,-2px,0);
            }
        }
    </style>
`;

// Inject dynamic styles
document.head.insertAdjacentHTML('beforeend', dynamicStyles);

// Export functions for external use
window.UgoDashboard = {
    refreshData: refreshDashboardData,
    addActivity: addNewActivity,
    showAchievement: showAchievementModal
};

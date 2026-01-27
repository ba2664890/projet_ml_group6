// GSAP Animations for Dashboard
gsap.registerPlugin(ScrollTrigger);

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initPageAnimations();
    initScrollAnimations();
    initHoverAnimations();
});

// Page Load Animations
function initPageAnimations() {
    // Note: Animations désactivées car le contenu est maintenant chargé dynamiquement par le router
    // Les animations seront gérées par le router lors du chargement de chaque page

    /* Animations désactivées - contenu dynamique
    gsap.from('#hero h1', {
        duration: 1,
        y: 50,
        opacity: 0,
        ease: 'power3.out'
    });

    gsap.from('#hero p', {
        duration: 1,
        y: 30,
        opacity: 0,
        delay: 0.3,
        ease: 'power3.out'
    });

    gsap.from('#hero .inline-flex', {
        duration: 1,
        y: 30,
        opacity: 0,
        delay: 0.6,
        stagger: 0.2,
        ease: 'power3.out'
    });

    // Animate stats cards
    gsap.from('#hero .grid > div', {
        duration: 1,
        y: 50,
        opacity: 0,
        delay: 0.9,
        stagger: 0.15,
        ease: 'power3.out'
    });

    // Animate feature cards
    gsap.from('.feature-card', {
        scrollTrigger: {
            trigger: '#overview',
            start: 'top 80%'
        },
        duration: 0.8,
        y: 60,
        opacity: 0,
        stagger: 0.15,
        ease: 'power3.out'
    });
    */
}

// Scroll-triggered Animations
function initScrollAnimations() {
    // Note: Animations désactivées car le contenu est dynamique

    /* Animations désactivées - contenu dynamique
    // Animate sections on scroll
    const sections = document.querySelectorAll('section');

    sections.forEach(section => {
        const heading = section.querySelector('h2');
        if (heading) {
            gsap.from(heading, {
                scrollTrigger: {
                    trigger: section,
                    start: 'top 80%',
                    toggleActions: 'play none none reverse'
                },
                duration: 0.8,
                y: 30,
                opacity: 0,
                ease: 'power2.out'
            });
        }
    });

    // Parallax effect for hero background
    gsap.to('#hero', {
        scrollTrigger: {
            trigger: '#hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true
        },
        y: 100,
        opacity: 0.8
    });
    */
}

// Hover Animations
function initHoverAnimations() {
    // Feature cards hover effect
    const featureCards = document.querySelectorAll('.feature-card > div');

    featureCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            gsap.to(card, {
                duration: 0.3,
                y: -8,
                scale: 1.02,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
                ease: 'power2.out'
            });
        });

        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                duration: 0.3,
                y: 0,
                scale: 1,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                ease: 'power2.out'
            });
        });
    });
}

// Number Counter Animation
function animateCounter(element, target, duration = 2) {
    const obj = { value: 0 };

    gsap.to(obj, {
        value: target,
        duration: duration,
        ease: 'power2.out',
        onUpdate: () => {
            element.textContent = Math.round(obj.value).toLocaleString();
        }
    });
}

// Fade In Animation
function fadeIn(element, delay = 0) {
    gsap.from(element, {
        duration: 0.6,
        opacity: 0,
        y: 20,
        delay: delay,
        ease: 'power2.out'
    });
}

// Slide In Animation
function slideIn(element, direction = 'left', delay = 0) {
    const x = direction === 'left' ? -50 : direction === 'right' ? 50 : 0;
    const y = direction === 'up' ? 50 : direction === 'down' ? -50 : 0;

    gsap.from(element, {
        duration: 0.8,
        x: x,
        y: y,
        opacity: 0,
        delay: delay,
        ease: 'power3.out'
    });
}

// Scale Animation
function scaleIn(element, delay = 0) {
    gsap.from(element, {
        duration: 0.6,
        scale: 0.8,
        opacity: 0,
        delay: delay,
        ease: 'back.out(1.7)'
    });
}

// Stagger Animation for Lists
function staggerAnimation(elements, delay = 0) {
    gsap.from(elements, {
        duration: 0.6,
        y: 30,
        opacity: 0,
        stagger: 0.1,
        delay: delay,
        ease: 'power2.out'
    });
}

// Loading Animation
function showLoading(container) {
    const spinner = document.createElement('div');
    spinner.className = 'spinner mx-auto';
    spinner.id = 'loading-spinner';
    container.innerHTML = '';
    container.appendChild(spinner);

    gsap.from(spinner, {
        duration: 0.3,
        scale: 0,
        opacity: 0,
        ease: 'back.out(1.7)'
    });
}

function hideLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        gsap.to(spinner, {
            duration: 0.3,
            scale: 0,
            opacity: 0,
            ease: 'power2.in',
            onComplete: () => spinner.remove()
        });
    }
}

// Success Animation
function showSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'toast bg-emerald-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3';
    toast.innerHTML = `
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span class="font-medium">${message}</span>
    `;

    document.body.appendChild(toast);

    gsap.from(toast, {
        duration: 0.5,
        x: 100,
        opacity: 0,
        ease: 'power3.out'
    });

    setTimeout(() => {
        gsap.to(toast, {
            duration: 0.5,
            x: 100,
            opacity: 0,
            ease: 'power3.in',
            onComplete: () => toast.remove()
        });
    }, 3000);
}

// Error Animation
function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'toast bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3';
    toast.innerHTML = `
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
        <span class="font-medium">${message}</span>
    `;

    document.body.appendChild(toast);

    gsap.from(toast, {
        duration: 0.5,
        x: 100,
        opacity: 0,
        ease: 'power3.out'
    });

    setTimeout(() => {
        gsap.to(toast, {
            duration: 0.5,
            x: 100,
            opacity: 0,
            ease: 'power3.in',
            onComplete: () => toast.remove()
        });
    }, 4000);
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        animateCounter,
        fadeIn,
        slideIn,
        scaleIn,
        staggerAnimation,
        showLoading,
        hideLoading,
        showSuccess,
        showError
    };
}

// ============================================
// SOCIAL PROOF & TESTIMONIALS
// ============================================

let testimonialsData = null;
let currentTestimonialIndex = 0;
let testimonialAutoplayInterval = null;

// Load testimonials on page load
document.addEventListener('DOMContentLoaded', () => {
    loadTestimonials();
    initializeStatsCounter();
    setupCarouselControls();
});

async function loadTestimonials() {
    try {
        const response = await fetch('testimonials.json');
        testimonialsData = await response.json();
        renderTestimonials();
        startTestimonialAutoplay();
    } catch (error) {
        console.error('Failed to load testimonials:', error);
    }
}

function renderTestimonials() {
    if (!testimonialsData || !testimonialsData.testimonials) return;

    const track = document.getElementById('testimonialsTrack');
    if (!track) return;

    track.innerHTML = '';

    testimonialsData.testimonials.forEach(testimonial => {
        const card = createTestimonialCard(testimonial);
        track.appendChild(card);
    });

    // Create carousel dots
    createCarouselDots();
}

function createTestimonialCard(testimonial) {
    const card = document.createElement('div');
    card.className = 'testimonial-card';

    const stars = '★'.repeat(testimonial.rating);
    const starElements = stars.split('').map(star => `<span class="star">${star}</span>`).join('');

    card.innerHTML = `
        <div class="testimonial-header">
            <div class="testimonial-avatar">${testimonial.avatar}</div>
            <div class="testimonial-info">
                <h4>${testimonial.name}</h4>
                <p class="testimonial-role">${testimonial.role}</p>
                <p class="testimonial-company">${testimonial.company}</p>
            </div>
        </div>
        <div class="testimonial-rating">
            ${starElements}
        </div>
        <p class="testimonial-text">${testimonial.text}</p>
        <span class="testimonial-use-case">${testimonial.useCase}</span>
    `;

    return card;
}

function createCarouselDots() {
    const dotsContainer = document.getElementById('carouselDots');
    if (!dotsContainer || !testimonialsData) return;

    dotsContainer.innerHTML = '';

    // Calculate number of pages (show 3 testimonials at a time on desktop)
    const itemsPerPage = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1;
    const totalPages = Math.ceil(testimonialsData.testimonials.length / itemsPerPage);

    for (let i = 0; i < totalPages; i++) {
        const dot = document.createElement('div');
        dot.className = `carousel-dot ${i === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => goToTestimonialPage(i));
        dotsContainer.appendChild(dot);
    }
}

function setupCarouselControls() {
    const prevBtn = document.getElementById('prevTestimonial');
    const nextBtn = document.getElementById('nextTestimonial');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            navigateTestimonials('prev');
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            navigateTestimonials('next');
        });
    }
}

function navigateTestimonials(direction) {
    const track = document.getElementById('testimonialsTrack');
    if (!track || !testimonialsData) return;

    const itemsPerPage = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1;
    const totalPages = Math.ceil(testimonialsData.testimonials.length / itemsPerPage);

    if (direction === 'next') {
        currentTestimonialIndex = (currentTestimonialIndex + 1) % totalPages;
    } else {
        currentTestimonialIndex = (currentTestimonialIndex - 1 + totalPages) % totalPages;
    }

    updateCarouselPosition();
    updateCarouselDots();
    resetTestimonialAutoplay();
}

function goToTestimonialPage(pageIndex) {
    currentTestimonialIndex = pageIndex;
    updateCarouselPosition();
    updateCarouselDots();
    resetTestimonialAutoplay();
}

function updateCarouselPosition() {
    const track = document.getElementById('testimonialsTrack');
    if (!track) return;

    const itemsPerPage = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1;
    const cardWidth = track.querySelector('.testimonial-card')?.offsetWidth || 0;
    const gap = 32;
    const scrollAmount = (cardWidth + gap) * itemsPerPage * currentTestimonialIndex;

    track.style.transform = `translateX(-${scrollAmount}px)`;
    track.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
}

function updateCarouselDots() {
    const dots = document.querySelectorAll('.carousel-dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentTestimonialIndex);
    });
}

function startTestimonialAutoplay() {
    testimonialAutoplayInterval = setInterval(() => {
        navigateTestimonials('next');
    }, 5000); // Auto-advance every 5 seconds
}

function resetTestimonialAutoplay() {
    clearInterval(testimonialAutoplayInterval);
    startTestimonialAutoplay();
}

// ============================================
// ANIMATED STATISTICS COUNTER
// ============================================

function initializeStatsCounter() {
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateStatCounters();
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const statsSection = document.querySelector('.stats');
    if (statsSection) {
        observer.observe(statsSection);
    }
}

function animateStatCounters() {
    const statNumbers = document.querySelectorAll('.stat-number[data-count]');

    statNumbers.forEach(element => {
        const targetValue = parseFloat(element.getAttribute('data-count'));
        const isDecimal = targetValue % 1 !== 0;
        const duration = 2000; // 2 seconds
        const startTime = Date.now();
        const startValue = 0;

        function updateCounter() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = startValue + (targetValue - startValue) * easeOut;

            if (isDecimal) {
                element.textContent = currentValue.toFixed(1) + '%';
            } else {
                const formattedValue = Math.floor(currentValue).toLocaleString();
                element.textContent = formattedValue + '+';
            }

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                // Final value
                if (isDecimal) {
                    element.textContent = targetValue.toFixed(1) + '%';
                } else {
                    element.textContent = targetValue.toLocaleString() + '+';
                }
            }
        }

        updateCounter();
    });
}

// Handle window resize for responsive carousel
window.addEventListener('resize', () => {
    if (testimonialsData) {
        createCarouselDots();
        updateCarouselPosition();
    }
});

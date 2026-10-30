// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add scroll effect to header
let lastScroll = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        header.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
    } else {
        header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    }
    
    lastScroll = currentScroll;
});

// Add animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements with animation
document.querySelectorAll('.info-card, .curriculum-card, .benefit-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'all 0.6s ease';
    observer.observe(el);
});

// Active bottom nav on scroll
const sections = document.querySelectorAll('section[id]');
const navItems = document.querySelectorAll('.bottom-nav-item');

function setActiveNav() {
    const scrollPosition = window.pageYOffset + 200;
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            navItems.forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('href') === `#${sectionId}`) {
                    item.classList.add('active');
                }
            });
        }
    });
}

window.addEventListener('scroll', setActiveNav);
setActiveNav();

// 신청자 수 불러오기
async function loadApplicantCount() {
    try {
        let count = 0;
        let loadedFromApi = false;
        try {
            const response = await fetch('tables/applications?limit=1');
            if (response.ok) {
                const data = await response.json();
                count = data.total || 0;
                loadedFromApi = true;
            }
        } catch (apiError) {
            // Static hosting fallback
        }

        if (!loadedFromApi) {
            const stored = JSON.parse(localStorage.getItem('kfceo_applications') || '[]');
            count = stored.length;
        }
        
        // 신청자가 1명 이상일 때만 표시
        if (count > 0) {
            const counterElement = document.getElementById('applicantCounter');
            const countElement = document.getElementById('applicantCount');
            
            if (counterElement && countElement) {
                countElement.textContent = count;
                counterElement.style.display = 'inline-flex';
            }
        }
    } catch (error) {
        console.error('신청자 수 로드 오류:', error);
    }
}

// 페이지 로드 시 신청자 수 표시
loadApplicantCount();

// 30초마다 신청자 수 업데이트
setInterval(loadApplicantCount, 30000);

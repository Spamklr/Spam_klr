// Enhanced SPAMKLR JavaScript with Professional Animations

// Mobile menu toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            
            // Toggle hamburger to X icon
            const icon = this.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
        
        // Close mobile menu when clicking on nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                const icon = mobileMenuToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            });
        });
    }
});

// Navbar scroll effect
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80; // Account for fixed navbar
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Intersection Observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animated');
            
            // Special handling for stat counters
            if (entry.target.classList.contains('stat-number')) {
                animateCounter(entry.target);
            }
        }
    });
}, observerOptions);

// Add animation classes to elements
document.addEventListener('DOMContentLoaded', function() {
    // Add animate-on-scroll class to various elements
    const animatedElements = document.querySelectorAll(
        '.about-card, .contact-card, .help-category, .docs-card, .stat-card, .legal-section-content'
    );
    
    animatedElements.forEach(el => {
        el.classList.add('animate-on-scroll');
        observer.observe(el);
    });
    
    // Observe stat numbers for counter animation
    document.querySelectorAll('.stat-number').forEach(el => {
        observer.observe(el);
    });
});

// Counter animation for statistics
function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-target'));
    const increment = target / 100; // Animate over 100 steps
    let current = 0;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        
        // Format the number appropriately
        if (target >= 1000000) {
            element.textContent = (current / 1000000).toFixed(1) + 'M+';
        } else if (target >= 1000) {
            element.textContent = (current / 1000).toFixed(0) + 'K+';
        } else if (target === 99.9) {
            element.textContent = current.toFixed(1) + '%';
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 20);
}

// Contact Form Functionality
document.getElementById('contactForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const data = Object.fromEntries(formData);
    const responseDiv = document.getElementById('contactResponse');
    const submitBtn = this.querySelector('button[type="submit"]');
    
    // Show loading state
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;
    
    try {
        // Simulate API call (replace with actual endpoint)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        responseDiv.innerHTML = `
            <div class="alert alert-success">
                <i class="fas fa-check-circle"></i>
                Thank you for your message! We'll get back to you within 24 hours.
            </div>
        `;
        responseDiv.style.display = 'block';
        
        // Reset form
        this.reset();
        
    } catch (error) {
        responseDiv.innerHTML = `
            <div class="alert alert-error">
                <i class="fas fa-exclamation-circle"></i>
                Sorry, there was an error sending your message. Please try again.
            </div>
        `;
        responseDiv.style.display = 'block';
    } finally {
        submitBtn.innerHTML = '<span>Send Message</span><i class="fas fa-paper-plane"></i>';
        submitBtn.disabled = false;
    }
});

// Documentation Tabs Functionality
document.querySelectorAll('.docs-nav-item').forEach(item => {
    item.addEventListener('click', function() {
        const tabId = this.getAttribute('data-tab');
        
        // Remove active class from all tabs and panels
        document.querySelectorAll('.docs-nav-item').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.docs-panel').forEach(panel => panel.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding panel
        this.classList.add('active');
        document.getElementById(tabId + '-panel').classList.add('active');
    });
});

// Code Example Tabs
document.querySelectorAll('.example-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        const lang = this.getAttribute('data-lang');
        
        // Remove active class from all tabs
        document.querySelectorAll('.example-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        // Update code content based on selected language
        const codeContent = document.getElementById('code-content');
        const examples = {
            javascript: `// JavaScript Example
const spamklr = require('spamklr-sdk');

const client = new spamklr.Client({
  apiKey: 'your-api-key'
});

const result = await client.detectSpam({
  phoneNumber: '+1234567890'
});

console.log(result.isSpam); // true/false`,
            
            python: `# Python Example
import spamklr

client = spamklr.Client(api_key='your-api-key')

result = client.detect_spam(phone_number='+1234567890')

print(result.is_spam)  # True/False`,
            
            curl: `# cURL Example
curl -X POST https://api.spamklr.com/v1/detect \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{"phoneNumber": "+1234567890"}'`
        };
        
        codeContent.textContent = examples[lang];
    });
});

// Help Search Functionality
document.getElementById('helpSearch').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const helpItems = document.querySelectorAll('.help-item');
    
    helpItems.forEach(item => {
        const title = item.querySelector('h4').textContent.toLowerCase();
        const description = item.querySelector('p').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || description.includes(searchTerm)) {
            item.style.display = 'block';
            item.parentElement.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
    
    // Hide categories with no visible items
    document.querySelectorAll('.help-category').forEach(category => {
        const visibleItems = category.querySelectorAll('.help-item[style*="block"]');
        if (visibleItems.length === 0 && searchTerm) {
            category.style.display = 'none';
        } else {
            category.style.display = 'block';
        }
    });
});

// Legal Navigation Scroll Spy
function updateLegalNav() {
    const sections = document.querySelectorAll('.legal-section-content');
    const navLinks = document.querySelectorAll('.legal-nav-link');
    
    let currentSection = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.offsetHeight;
        
        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
            currentSection = section.id;
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + currentSection) {
            link.classList.add('active');
        }
    });
}

window.addEventListener('scroll', updateLegalNav);

// Chat functionality (placeholder)
function openChat() {
    alert('Live chat will be available soon! For now, please use our contact form or email support@spamklr.com');
}

// Navbar scroll effect
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(11, 20, 38, 0.98)';
        navbar.style.backdropFilter = 'blur(20px)';
    } else {
        navbar.style.background = 'rgba(11, 20, 38, 0.95)';
        navbar.style.backdropFilter = 'blur(10px)';
    }
});

// Form validation styles
document.querySelectorAll('input, textarea, select').forEach(input => {
    input.addEventListener('blur', function() {
        if (this.checkValidity()) {
            this.classList.remove('invalid');
            this.classList.add('valid');
        } else {
            this.classList.remove('valid');
            this.classList.add('invalid');
        }
    });
});

// Lazy loading for images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Preloader (if needed)
window.addEventListener('load', function() {
    const preloader = document.querySelector('.preloader');
    if (preloader) {
        preloader.style.opacity = '0';
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 300);
    }
});

// Enhanced form validation for contact form
document.getElementById('contactForm').addEventListener('input', function(e) {
    const target = e.target;
    
    // Real-time validation
    if (target.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(target.value)) {
            target.classList.add('valid');
            target.classList.remove('invalid');
        } else if (target.value.length > 0) {
            target.classList.add('invalid');
            target.classList.remove('valid');
        }
    }
    
    if (target.type === 'text' && target.value.length > 0) {
        if (target.value.length >= 2) {
            target.classList.add('valid');
            target.classList.remove('invalid');
        } else {
            target.classList.add('invalid');
            target.classList.remove('valid');
        }
    }
});

// Mobile menu toggle (if mobile menu is added later)
function toggleMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-menu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('active');
    }
}

// Keyboard navigation accessibility
document.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
    }
});

document.addEventListener('mousedown', function() {
    document.body.classList.remove('keyboard-navigation');
});

// Waitlist Form Functionality
document.getElementById('waitlistForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const responseDiv = document.getElementById('responseMessage');
    const submitBtn = this.querySelector('button[type="submit"]');
    
    // Show loading state
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Joining...';
    submitBtn.disabled = true;
    
    // Clear previous response
    responseDiv.innerHTML = '';
    responseDiv.style.display = 'none';
    
    try {
        const response = await fetch('/join', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            responseDiv.innerHTML = `
                <div class="alert alert-success">
                    <i class="fas fa-check-circle"></i>
                    ${result.message}
                </div>
            `;
            this.reset(); // Clear the form
        } else {
            responseDiv.innerHTML = `
                <div class="alert alert-error">
                    <i class="fas fa-exclamation-circle"></i>
                    ${result.message || 'An error occurred. Please try again.'}
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Waitlist submission error:', error);
        responseDiv.innerHTML = `
            <div class="alert alert-error">
                <i class="fas fa-exclamation-circle"></i>
                Unable to join waitlist. Please check your connection and try again.
            </div>
        `;
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        responseDiv.style.display = 'block';
    }
});

console.log('SPAMKLR Enhanced JavaScript loaded successfully!');

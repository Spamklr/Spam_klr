/**
 * SPAMKLR Landing Page JavaScript
 * Handles waitlist form submission and client-side interactions
 * Updated for professional layered architecture
 */

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
  initializeWaitlistForm();
  initializeSmoothScrolling();
  initializeNavigation();
  initializeStatsAnimation();
  initializeScrollEffects();
  initializeContactForm();
  initializeDocumentationTabs();
  initializeHelpSearch();
  initializeLegalNavigation();
  initializeImageLazyLoading();
  initializeAccessibility();
});

/**
 * Initialize the waitlist form
 */
function initializeWaitlistForm() {
  const form = document.getElementById('waitlistForm');
  if (!form) return;

  form.addEventListener('submit', handleWaitlistSubmission);

  // Add real-time validation
  const nameField = document.getElementById('name');
  const emailField = document.getElementById('email');

  if (nameField) {
    nameField.addEventListener('input', validateNameField);
    nameField.addEventListener('blur', validateNameField);
  }

  if (emailField) {
    emailField.addEventListener('input', validateEmailField);
    emailField.addEventListener('blur', validateEmailField);
  }
}

/**
 * Handle waitlist form submission
 */
async function handleWaitlistSubmission(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  const name = formData.get('name')?.trim();
  const email = formData.get('email')?.trim();
  
  const submitBtn = form.querySelector('.submit-btn') || form.querySelector('button[type="submit"]');
  const responseMessage = document.getElementById('responseMessage');

  // Clear previous messages
  clearResponseMessage();

  // Client-side validation
  const validationErrors = validateFormData(name, email);
  
  if (validationErrors.length > 0) {
    showResponseMessage(validationErrors.join('. '), 'error');
    return;
  }

  // Show loading state
  setLoadingState(submitBtn, true);

  try {
    const response = await submitToWaitlist({ name, email });
    
    if (response.success) {
      showResponseMessage(response.message, 'success');
      form.reset();
      
      // Show additional success info
      if (response.data?.position) {
        setTimeout(() => {
          const currentMessage = responseMessage.textContent;
          showResponseMessage(`${currentMessage} You are #${response.data.position} on the waitlist!`, 'success');
        }, 2000);
      }
      
      // Track successful signup
      trackEvent('waitlist_join', {
        position: response.data?.position
      });
    } else {
      showResponseMessage(response.message || 'An error occurred. Please try again.', 'error');
    }

  } catch (error) {
    console.error('Form submission error:', error);
    handleSubmissionError(error);
  } finally {
    setLoadingState(submitBtn, false);
  }
}

/**
 * Submit data to waitlist API
 */
async function submitToWaitlist(data) {
  const response = await fetch('/api/waitlist/join', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(data)
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw new ApiError(responseData.message || 'Request failed', response.status, responseData);
  }

  return responseData;
}

/**
 * Initialize smooth scrolling
 */
function initializeSmoothScrolling() {
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
}

/**
 * Initialize navigation
 */
function initializeNavigation() {
  const mobileToggle = document.querySelector('.mobile-menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', function() {
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
        const icon = mobileToggle.querySelector('i');
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
      });
    });
  }
}

/**
 * Initialize scroll effects
 */
function initializeScrollEffects() {
  // Navbar scroll effect
  window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
        navbar.style.background = 'rgba(11, 20, 38, 0.98)';
        navbar.style.backdropFilter = 'blur(20px)';
      } else {
        navbar.classList.remove('scrolled');
        navbar.style.background = 'rgba(11, 20, 38, 0.95)';
        navbar.style.backdropFilter = 'blur(10px)';
      }
    }
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
  const animatedElements = document.querySelectorAll(
    '.about-card, .contact-card, .help-category, .docs-card, .stat-card, .legal-section-content, .animate-on-scroll'
  );
  
  animatedElements.forEach(el => {
    el.classList.add('animate-on-scroll');
    observer.observe(el);
  });
}

/**
 * Initialize stats animation
 */
function initializeStatsAnimation() {
  const stats = document.querySelectorAll('.stat-number');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  });

  stats.forEach(stat => observer.observe(stat));
}

/**
 * Animate counter for statistics
 */
function animateCounter(element) {
  const target = parseInt(element.getAttribute('data-target')) || 
                 parseInt(element.textContent.replace(/[^0-9]/g, ''));
  
  if (!target || isNaN(target)) return;
  
  const increment = target / 100;
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
    } else if (element.textContent.includes('%')) {
      element.textContent = current.toFixed(1) + '%';
    } else {
      element.textContent = Math.floor(current).toLocaleString();
    }
  }, 20);
}

/**
 * Initialize contact form
 */
function initializeContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', handleContactSubmission);
  
  // Real-time validation for contact form
  form.addEventListener('input', function(e) {
    const target = e.target;
    
    if (target.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      updateFieldValidation(target, emailRegex.test(target.value));
    }
    
    if (target.type === 'text' && target.value.length > 0) {
      updateFieldValidation(target, target.value.length >= 2);
    }
  });
}

/**
 * Handle contact form submission
 */
async function handleContactSubmission(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  const responseDiv = document.getElementById('contactResponse');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  // Show loading state
  const originalContent = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
  submitBtn.disabled = true;
  
  try {
    // Send to contact API endpoint
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      responseDiv.innerHTML = `
        <div class="alert alert-success">
          <i class="fas fa-check-circle"></i>
          ${result.message || 'Thank you for your message! We\'ll get back to you within 24 hours.'}
        </div>
      `;
      e.target.reset();
    } else {
      throw new Error(result.message || 'Failed to send message');
    }
    
  } catch (error) {
    responseDiv.innerHTML = `
      <div class="alert alert-error">
        <i class="fas fa-exclamation-circle"></i>
        ${error.message || 'Sorry, there was an error sending your message. Please try again.'}
      </div>
    `;
  } finally {
    submitBtn.innerHTML = originalContent;
    submitBtn.disabled = false;
    responseDiv.style.display = 'block';
  }
}

/**
 * Initialize documentation tabs
 */
function initializeDocumentationTabs() {
  // Documentation navigation tabs
  document.querySelectorAll('.docs-nav-item').forEach(item => {
    item.addEventListener('click', function() {
      const tabId = this.getAttribute('data-tab');
      
      // Remove active class from all tabs and panels
      document.querySelectorAll('.docs-nav-item').forEach(tab => tab.classList.remove('active'));
      document.querySelectorAll('.docs-panel').forEach(panel => panel.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding panel
      this.classList.add('active');
      const panel = document.getElementById(tabId + '-panel');
      if (panel) panel.classList.add('active');
    });
  });

  // Code example tabs
  document.querySelectorAll('.example-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      const lang = this.getAttribute('data-lang');
      
      // Remove active class from all tabs
      document.querySelectorAll('.example-tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      // Update code content based on selected language
      updateCodeExample(lang);
    });
  });
}

/**
 * Update code example content
 */
function updateCodeExample(language) {
  const codeContent = document.getElementById('code-content');
  if (!codeContent) return;
  
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
  
  codeContent.textContent = examples[language] || examples.javascript;
}

/**
 * Initialize help search
 */
function initializeHelpSearch() {
  const helpSearch = document.getElementById('helpSearch');
  if (!helpSearch) return;
  
  helpSearch.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const helpItems = document.querySelectorAll('.help-item');
    
    helpItems.forEach(item => {
      const title = item.querySelector('h4')?.textContent.toLowerCase() || '';
      const description = item.querySelector('p')?.textContent.toLowerCase() || '';
      
      if (title.includes(searchTerm) || description.includes(searchTerm)) {
        item.style.display = 'block';
        if (item.parentElement) item.parentElement.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
    
    // Hide categories with no visible items
    document.querySelectorAll('.help-category').forEach(category => {
      const visibleItems = category.querySelectorAll('.help-item[style*="block"]');
      category.style.display = (visibleItems.length === 0 && searchTerm) ? 'none' : 'block';
    });
  });
}

/**
 * Initialize legal navigation
 */
function initializeLegalNavigation() {
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
}

/**
 * Validate form data
 */
function validateFormData(name, email) {
  const errors = [];

  // Name validation
  if (!name || name.length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  if (name && name.length > 50) {
    errors.push('Name must be less than 50 characters');
  }
  if (name && !/^[a-zA-Z\s\-'\.]+$/.test(name)) {
    errors.push('Name can only contain letters, spaces, hyphens, apostrophes, and periods');
  }

  // Email validation
  if (!email) {
    errors.push('Email is required');
  } else if (!isValidEmail(email)) {
    errors.push('Please enter a valid email address');
  } else if (email.length > 254) {
    errors.push('Email is too long');
  }

  return errors;
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate name field
 */
function validateNameField(e) {
  const name = e.target.value.trim();
  const isValid = name.length === 0 || (name.length >= 2 && /^[a-zA-Z\s\-'\.]+$/.test(name));
  updateFieldValidation(e.target, isValid);
}

/**
 * Validate email field
 */
function validateEmailField(e) {
  const email = e.target.value.trim();
  const isValid = email.length === 0 || isValidEmail(email);
  updateFieldValidation(e.target, isValid);
}

/**
 * Update field validation visual state
 */
function updateFieldValidation(field, isValid) {
  if (field.value.length > 0) {
    if (isValid) {
      field.classList.add('valid');
      field.classList.remove('invalid');
    } else {
      field.classList.add('invalid');
      field.classList.remove('valid');
    }
  } else {
    field.classList.remove('valid', 'invalid');
  }
}

/**
 * Show response message
 */
function showResponseMessage(message, type = 'info') {
  const responseMessage = document.getElementById('responseMessage');
  if (!responseMessage) return;
  
  responseMessage.textContent = message;
  responseMessage.className = `response-message ${type}-message`;
  responseMessage.style.display = 'block';
}

/**
 * Clear response message
 */
function clearResponseMessage() {
  const responseMessage = document.getElementById('responseMessage');
  if (!responseMessage) return;
  
  responseMessage.textContent = '';
  responseMessage.className = 'response-message';
  responseMessage.style.display = 'none';
}

/**
 * Set loading state for buttons
 */
function setLoadingState(button, isLoading) {
  if (!button) return;
  
  if (isLoading) {
    const loadingText = button.dataset.loadingText || 'Processing...';
    button.innerHTML = `<span>${loadingText}</span><i class="fas fa-spinner fa-spin"></i>`;
    button.disabled = true;
    button.classList.add('loading');
  } else {
    const originalText = button.dataset.originalText || button.textContent;
    button.innerHTML = originalText;
    button.disabled = false;
    button.classList.remove('loading');
  }
}

/**
 * Handle submission errors
 */
function handleSubmissionError(error) {
  let errorMessage = 'An unexpected error occurred. Please try again.';
  
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        errorMessage = error.message || 'Please check your input and try again.';
        break;
      case 409:
        errorMessage = error.message || 'This email is already registered!';
        break;
      case 429:
        errorMessage = error.message || 'Too many requests. Please wait before trying again.';
        break;
      case 500:
        errorMessage = 'Server error. Please try again later.';
        break;
      default:
        errorMessage = error.message || errorMessage;
    }
  } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
    errorMessage = 'Unable to connect to server. Please check your connection and try again.';
  } else if (error.name === 'AbortError') {
    errorMessage = 'Request timeout. Please try again.';
  }
  
  showResponseMessage(errorMessage, 'error');
}

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Initialize image lazy loading
 */
function initializeImageLazyLoading() {
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
}

/**
 * Initialize accessibility features
 */
function initializeAccessibility() {
  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-navigation');
    }
  });

  document.addEventListener('mousedown', function() {
    document.body.classList.remove('keyboard-navigation');
  });
  
  // Field validation on blur
  document.querySelectorAll('input, textarea, select').forEach(input => {
    input.addEventListener('blur', function() {
      updateFieldValidation(this, this.checkValidity());
    });
  });
}

/**
 * Chat functionality (placeholder)
 */
function openChat() {
  alert('Live chat will be available soon! For now, please use our contact form or email support@spamklr.com');
}

/**
 * Track events (placeholder for analytics)
 */
function trackEvent(eventName, properties = {}) {
  // This is where you would integrate with your analytics service
  console.log('Event tracked:', eventName, properties);
  
  // Example: Google Analytics 4
  if (typeof gtag !== 'undefined') {
    gtag('event', eventName, properties);
  }
  
  // Example: Facebook Pixel
  if (typeof fbq !== 'undefined') {
    fbq('track', eventName, properties);
  }
}

// Preloader handling
window.addEventListener('load', function() {
  const preloader = document.querySelector('.preloader');
  if (preloader) {
    preloader.style.opacity = '0';
    setTimeout(() => {
      preloader.style.display = 'none';
    }, 300);
  }
});

// Error boundary for JavaScript errors
window.addEventListener('error', function(e) {
  console.error('JavaScript error:', e.error);
  // Could send to error tracking service here
});

console.log('SPAMKLR Enhanced JavaScript loaded successfully!');

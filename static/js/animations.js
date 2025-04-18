document.addEventListener('DOMContentLoaded', function() {
    // Fade in elements with the animate-fade-in class
    const fadeElements = document.querySelectorAll('.animate-fade-in');
    fadeElements.forEach((el, i) => {
      el.style.opacity = '0';
      setTimeout(() => {
        el.style.animation = 'fadeIn 0.5s ease forwards';
      }, i * 100);
    });
    
    // Handle staggered animations
    const staggerItems = document.querySelectorAll('.stagger-item');
    staggerItems.forEach((el) => {
      el.style.opacity = '0';
      el.classList.add('animate-fade-in');
    });
    
    // Button ripple effect
    document.querySelectorAll('.btn-ripple').forEach(button => {
      button.addEventListener('click', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        this.appendChild(ripple);
        
        setTimeout(() => {
          ripple.remove();
        }, 600);
      });
    });
    
    // Typing animation for chat
    function initTypingAnimation() {
      const typingIndicators = document.querySelectorAll('.typing');
      if (typingIndicators.length > 0) {
        typingIndicators.forEach(indicator => {
          if (!indicator.querySelector('.typing-dot')) {
            for (let i = 0; i < 3; i++) {
              const dot = document.createElement('div');
              dot.className = 'typing-dot';
              indicator.appendChild(dot);
            }
          }
        });
      }
    }
    
    initTypingAnimation();
    
    // Scroll to reveal animations
    const revealOnScroll = () => {
      const elementsToReveal = document.querySelectorAll('.reveal-on-scroll');
      
      elementsToReveal.forEach(element => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < windowHeight - elementVisible) {
          element.classList.add('animate-fade-in');
        }
      });
    };
    
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll();
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          window.scrollTo({
            top: targetElement.offsetTop - 100,
            behavior: 'smooth'
          });
        }
      });
    });
    
    // Animation for stat counters
    function animateStatCounters() {
      const statValues = document.querySelectorAll('.stat-value');
      
      statValues.forEach(stat => {
        const targetValue = parseInt(stat.getAttribute('data-value'), 10);
        let currentValue = 0;
        const duration = 1500;
        const stepTime = Math.abs(Math.floor(duration / targetValue));
        
        const counter = setInterval(() => {
          currentValue += 1;
          stat.textContent = currentValue;
          
          if (currentValue >= targetValue) {
            clearInterval(counter);
            stat.textContent = targetValue;
          }
        }, stepTime);
      });
    }
    
    if (document.querySelector('.stat-value')) {
      animateStatCounters();
    }
  });
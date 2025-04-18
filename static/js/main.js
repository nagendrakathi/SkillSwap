document.addEventListener('DOMContentLoaded', function() {
    // Mobile navigation toggle
    const navbarToggle = document.querySelector('.navbar-toggle');
    const navbarMenu = document.querySelector('.navbar-menu');
    
    if (navbarToggle && navbarMenu) {
      navbarToggle.addEventListener('click', function() {
        navbarMenu.classList.toggle('active');
      });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
      if (navbarMenu && navbarMenu.classList.contains('active')) {
        if (!event.target.closest('.navbar-menu') && !event.target.closest('.navbar-toggle')) {
          navbarMenu.classList.remove('active');
        }
      }
    });
    
    // Modal functionality
    const modalTriggers = document.querySelectorAll('[data-modal-target]');
    const modalCloseButtons = document.querySelectorAll('.modal-close');
    
    modalTriggers.forEach(trigger => {
      trigger.addEventListener('click', function() {
        const modalId = this.getAttribute('data-modal-target');
        const modal = document.getElementById(modalId);
        
        if (modal) {
          modal.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
      });
    });
    
    modalCloseButtons.forEach(button => {
      button.addEventListener('click', function() {
        const modal = this.closest('.modal-backdrop');
        
        if (modal) {
          modal.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    });
    
    // Close modal when clicking outside of it
    document.addEventListener('click', function(event) {
      if (event.target.classList.contains('modal-backdrop')) {
        event.target.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
    
    // Escape key closes modal
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') {
        const activeModal = document.querySelector('.modal-backdrop.active');
        if (activeModal) {
          activeModal.classList.remove('active');
          document.body.style.overflow = '';
        }
      }
    });
    
    // Notifications auto-dismiss
    const notifications = document.querySelectorAll('.notification');
    notifications.forEach(notification => {
      setTimeout(() => {
        notification.remove();
      }, 3000);
    });
    
    // Form validation
    const forms = document.querySelectorAll('form[data-validate]');
    
    forms.forEach(form => {
      form.addEventListener('submit', function(event) {
        const requiredFields = form.querySelectorAll('[required]');
        let valid = true;
        
        requiredFields.forEach(field => {
          if (!field.value.trim()) {
            valid = false;
            field.classList.add('is-invalid');
            
            const errorMessage = field.getAttribute('data-error-message') || 'This field is required';
            let errorElement = field.nextElementSibling;
            
            if (!errorElement || !errorElement.classList.contains('form-error')) {
              errorElement = document.createElement('div');
              errorElement.className = 'form-error text-danger mt-1';
              field.parentNode.insertBefore(errorElement, field.nextSibling);
            }
            
            errorElement.textContent = errorMessage;
          }
        });
        
        if (!valid) {
          event.preventDefault();
        }
      });
      
      // Clear validation errors on input
      form.querySelectorAll('input, textarea, select').forEach(field => {
        field.addEventListener('input', function() {
          this.classList.remove('is-invalid');
          const errorElement = this.nextElementSibling;
          if (errorElement && errorElement.classList.contains('form-error')) {
            errorElement.textContent = '';
          }
        });
      });
    });
    
    // Active link highlighting in navbar
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.navbar-menu a');
    
    navLinks.forEach(link => {
      const linkPath = link.getAttribute('href');
      if (linkPath === currentPath || (linkPath !== '/' && currentPath.startsWith(linkPath))) {
        link.classList.add('active');
      }
    });
  });
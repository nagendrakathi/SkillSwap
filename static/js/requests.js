// Helper function for making fetch requests
const fetchAPI = async (url, options = {}) => {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Fetch error:', error);
      showNotification('An error occurred. Please try again.', 'danger');
      throw error;
    }
  };
  
  // Show notification
  const showNotification = (message, type = 'info') => {
    const notificationsContainer = document.querySelector('.notifications');
    
    if (!notificationsContainer) {
      const container = document.createElement('div');
      container.className = 'notifications';
      document.body.appendChild(container);
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = message;
    
    document.querySelector('.notifications').appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.5s ease forwards';
      setTimeout(() => {
        notification.remove();
      }, 500);
    }, 3000);
  };
  
  // Handle skill request actions
  document.addEventListener('DOMContentLoaded', function() {
    // Accept skill request
    document.querySelectorAll('.accept-request').forEach(button => {
      button.addEventListener('click', async function() {
        const requestId = this.getAttribute('data-request-id');
        
        try {
          const result = await fetchAPI(`/api/requests/${requestId}/accept`, {
            method: 'POST'
          });
          
          if (result.success) {
            const requestItem = this.closest('.request-item');
            requestItem.querySelector('.request-status').textContent = 'Accepted';
            requestItem.querySelector('.request-status').className = 'request-status accepted';
            
            this.disabled = true;
            requestItem.querySelector('.reject-request').disabled = true;
            
            showNotification('Request accepted successfully!', 'success');
          }
        } catch (error) {
          // Error handled in fetchAPI
        }
      });
    });
    
    // Reject skill request
    document.querySelectorAll('.reject-request').forEach(button => {
      button.addEventListener('click', async function() {
        const requestId = this.getAttribute('data-request-id');
        
        try {
          const result = await fetchAPI(`/api/requests/${requestId}/reject`, {
            method: 'POST'
          });
          
          if (result.success) {
            const requestItem = this.closest('.request-item');
            requestItem.querySelector('.request-status').textContent = 'Rejected';
            requestItem.querySelector('.request-status').className = 'request-status rejected';
            
            this.disabled = true;
            requestItem.querySelector('.accept-request').disabled = true;
            
            showNotification('Request rejected.', 'info');
          }
        } catch (error) {
          // Error handled in fetchAPI
        }
      });
    });
    
    // Send skill request
    const requestForm = document.getElementById('skill-request-form');
    if (requestForm) {
      requestForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const skillId = this.getAttribute('data-skill-id');
        const messageField = document.getElementById('request-message');
        const message = messageField.value.trim();
        
        try {
          const button = this.querySelector('button[type="submit"]');
          button.disabled = true;
          button.classList.add('btn-loading');
          
          const result = await fetchAPI('/api/requests/create', {
            method: 'POST',
            body: JSON.stringify({
              skill_id: skillId,
              message: message
            })
          });
          
          if (result.success) {
            showNotification('Your request has been sent!', 'success');
            messageField.value = '';
            
            // Close modal if exists
            const modal = this.closest('.modal-backdrop');
            if (modal) {
              modal.classList.remove('active');
              document.body.style.overflow = '';
            }
          }
        } catch (error) {
          // Error handled in fetchAPI
        } finally {
          const button = this.querySelector('button[type="submit"]');
          button.disabled = false;
          button.classList.remove('btn-loading');
        }
      });
    }
    
    // Send message in conversation
    const messageForm = document.getElementById('message-form');
    if (messageForm) {
      messageForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const conversationId = this.getAttribute('data-conversation-id');
        const messageField = document.getElementById('message-input');
        const message = messageField.value.trim();
        
        if (!message) return;
        
        try {
          const button = this.querySelector('button[type="submit"]');
          button.disabled = true;
          
          const result = await fetchAPI('/api/messages/send', {
            method: 'POST',
            body: JSON.stringify({
              conversation_id: conversationId,
              message: message
            })
          });
          
          if (result.success) {
            // Add message to the chat
            const messagesBody = document.querySelector('.messages-body');
            const messageElement = document.createElement('div');
            messageElement.className = 'message message-sent';
            messageElement.innerHTML = `
              ${message}
              <div class="message-time">Just now</div>
            `;
            messagesBody.appendChild(messageElement);
            
            // Clear input and scroll to bottom
            messageField.value = '';
            messagesBody.scrollTop = messagesBody.scrollHeight;
          }
        } catch (error) {
          // Error handled in fetchAPI
        } finally {
          const button = this.querySelector('button[type="submit"]');
          button.disabled = false;
        }
      });
    }
    
    // Load more skills (pagination)
    const loadMoreBtn = document.getElementById('load-more-skills');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', async function() {
        const page = parseInt(this.getAttribute('data-page'), 10) + 1;
        const category = this.getAttribute('data-category') || '';
        
        try {
          this.disabled = true;
          this.textContent = 'Loading...';
          
          const result = await fetchAPI(`/api/skills?page=${page}&category=${category}`);
          
          if (result.skills && result.skills.length > 0) {
            const skillsGrid = document.querySelector('.skills-grid');
            
            result.skills.forEach(skill => {
              const skillCard = document.createElement('div');
              skillCard.className = 'skill-card card';
              skillCard.innerHTML = `
                <div class="card-body skill-card-body">
                  <div class="skill-category">
                    <span class="badge badge-primary">${skill.category}</span>
                  </div>
                  <h3 class="skill-title">${skill.title}</h3>
                  <p class="skill-description">${skill.description}</p>
                  <div class="skill-meta">
                    <span class="skill-teacher">By ${skill.teacher_name}</span>
                    <a href="/skills/${skill.id}" class="btn btn-sm btn-primary">Details</a>
                  </div>
                </div>
              `;
              skillsGrid.appendChild(skillCard);
            });
            
            this.setAttribute('data-page', page);
            
            if (result.has_more) {
              this.disabled = false;
              this.textContent = 'Load More';
            } else {
              this.remove();
            }
          } else {
            this.remove();
          }
        } catch (error) {
          this.disabled = false;
          this.textContent = 'Load More';
        }
      });
    }
  });
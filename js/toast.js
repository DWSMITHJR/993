/**
 * Shows a toast notification
 * @param {string} message - The message to display
 * @param {string} [type='info'] - The type of notification ('success', 'error', 'warning', 'info')
 * @param {number} [duration=3000] - Duration in milliseconds to show the toast
 */
function showToast(message, type = 'info', duration = 2000) {
    try {
        // Validate input
        if (!message || typeof message !== 'string') {
            console.error('Toast message must be a non-empty string');
            return;
        }

        // Get or create the toast container
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer && document.body) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        if (!toastContainer) {
            console.error('Could not create toast container');
            return;
        }
        
        // Add styles if not already added
        if (!document.getElementById('toast-styles') && document.head) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                #toast-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    max-width: 350px;
                    pointer-events: none;
                }
                
                .toast {
                    position: relative;
                    padding: 12px 20px;
                    border-radius: 4px;
                    color: white;
                    font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-size: 14px;
                    line-height: 1.5;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    opacity: 0;
                    transform: translateX(100%);
                    transition: opacity 0.3s ease, transform 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    pointer-events: auto;
                }
                
                .toast.show {
                    opacity: 1;
                    transform: translateX(0);
                }
                
                .toast.success {
                    background-color: #2ecc71;
                    border-left: 4px solid #27ae60;
                }
                
                .toast.error {
                    background-color: #e74c3c;
                    border-left: 4px solid #c0392b;
                }
                
                .toast.warning {
                    background-color: #f39c12;
                    border-left: 4px solid #d35400;
                    color: #1a1a1a;
                }
                
                .toast.info {
                    background-color: #3498db;
                    border-left: 4px solid #2980b9;
                }
                
                .toast-icon {
                    font-size: 18px;
                    flex-shrink: 0;
                }
                
                .toast-message {
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                }
            `;
            document.head.appendChild(style);
        }
    } catch (error) {
        console.error('Error initializing toast container:', error);
        return;
    }

    // Create the toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Set icon based on type
    let icon = 'ℹ️';
    switch(type) {
        case 'success':
            icon = '✓';
            break;
        case 'error':
            icon = '✕';
            break;
        case 'warning':
            icon = '⚠️';
            break;
    }
    
    // Add content to toast
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Trigger reflow to enable the show transition
    void toast.offsetWidth;
    
    // Show the toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Auto-hide after duration
    const hideTimeout = setTimeout(() => {
        hideToast(toast);
    }, duration);
    
    // No hover behavior - always auto-close after duration
    
    // Hide and remove the toast
    function hideToast(toastElement) {
        if (!toastElement) return;
        
        toastElement.classList.remove('show');
        
        // Remove after the transition ends
        toastElement.addEventListener('transitionend', function handler() {
            toastElement.remove();
            toastElement.removeEventListener('transitionend', handler);
        });
    }
}

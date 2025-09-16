/**
 * Shows a toast notification
 * @param {string} message - The message to display
 * @param {string} [type='info'] - The type of notification ('success', 'error', 'warning', 'info')
 * @param {number} [duration=3000] - Duration in milliseconds to show the toast
 */
function showToast(message, type = 'info', duration = 2000) {
    // Get or create the toast container
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
        
        // Add styles if not already added
        if (!document.getElementById('toast-styles')) {
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
                }
                
                .toast {
                    position: relative;
                    padding: 12px 20px;
                    border-radius: 4px;
                    color: white;
                    font-family: 'Montserrat', sans-serif;
                    font-size: 14px;
                    line-height: 1.5;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    opacity: 0;
                    transform: translateX(100%);
                    transition: opacity 0.3s ease, transform 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 10px;
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
                
                .toast-close {
                    margin-left: auto;
                    background: none;
                    border: none;
                    color: inherit;
                    cursor: pointer;
                    font-size: 16px;
                    opacity: 0.7;
                    padding: 0 0 0 10px;
                }
                
                .toast-close:hover {
                    opacity: 1;
                }
                
                .toast-icon {
                    font-size: 18px;
                }
            `;
            document.head.appendChild(style);
        }
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
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'toast-close';
    closeButton.innerHTML = '&times;';
    closeButton.onclick = () => {
        hideToast(toast);
    };
    
    // Add content to toast
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;
    toast.appendChild(closeButton);
    
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
    
    // Pause auto-hide on hover
    toast.addEventListener('mouseenter', () => {
        clearTimeout(hideTimeout);
    });
    
    // Resume auto-hide when mouse leaves
    toast.addEventListener('mouseleave', () => {
        setTimeout(() => {
            hideToast(toast);
        }, 1000);
    });
    
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

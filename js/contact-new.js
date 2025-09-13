// Import the email service
import { emailService } from './email-service.js';

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('inquiry-form');
    if (!form) return;
    
    // Prevent context menu on form fields to avoid duplicate ID errors
    const formFields = form.querySelectorAll('input, textarea, select');
    formFields.forEach(field => {
        field.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        }, false);
    });
    
    const emailInput = document.getElementById('email');
    const modal = document.getElementById('email-preview-modal');
    const closeModal = document.querySelector('.close-modal');
    const sendButton = document.getElementById('send-email');
    const editButton = document.getElementById('edit-email');
    const emailPreview = document.getElementById('email-preview');
    const submitButton = form.querySelector('button[type="submit"]');
    const buttonText = submitButton?.querySelector('.button-text');
    const buttonLoading = submitButton?.querySelector('.button-loading');

    // Email validation pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Validate email format
    function validateEmail(email) {
        return emailRegex.test(email);
    }

    // Show error message
    function showError(input, message) {
        const formGroup = input.closest('.form-group');
        formGroup.classList.add('invalid');
        
        let error = formGroup.querySelector('.error-message');
        if (!error) {
            error = document.createElement('div');
            error.className = 'error-message';
            formGroup.appendChild(error);
        }
        
        error.textContent = message;
        input.focus();
    }

    // Remove error message
    function removeError(input) {
        const formGroup = input.closest('.form-group');
        formGroup.classList.remove('invalid');
        
        const error = formGroup.querySelector('.error-message');
        if (error) {
            error.remove();
        }
    }

    // Validate form fields
    function validateForm() {
        let isValid = true;
        
        // Reset all error messages and field styles
        document.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
            el.className = 'error-message';
        });
        
        document.querySelectorAll('.form-group input, .form-group select, .form-group textarea').forEach(field => {
            field.classList.remove('error');
            const errorElement = field.parentElement.querySelector('.error-message');
            if (errorElement) {
                errorElement.textContent = '';
            }
        });
        
        // Validate name
        const name = document.getElementById('name');
        if (!name.value.trim()) {
            showError(name, 'Please enter your name');
            isValid = false;
        } else if (!/^[A-Za-z\s-]{2,}$/.test(name.value.trim())) {
            showError(name, 'Name must be at least 2 characters long and contain only letters, spaces, or hyphens');
            isValid = false;
        }
        
        // Validate email
        const email = document.getElementById('email');
        if (!email.value.trim()) {
            showError(email, 'Please enter your email address');
            isValid = false;
        } else if (!validateEmail(email.value.trim())) {
            showError(email, 'Please enter a valid email address (e.g., yourname@example.com)');
            isValid = false;
        }
        
        // Validate message
        const message = document.getElementById('message');
        if (!message.value.trim()) {
            showError(message, 'Please enter your message');
            isValid = false;
        } else if (message.value.trim().length < 10) {
            showError(message, 'Message must be at least 10 characters long');
            isValid = false;
        } else if (message.value.trim().length > 1000) {
            showError(message, 'Message cannot exceed 1000 characters');
            isValid = false;
        }
        
        // Scroll to first error if any
        if (!isValid) {
            const firstError = document.querySelector('.error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        
        return isValid;
    }

    // Close modal function
    function closeModalFunc() {
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        // Show loading state
        if (submitButton) {
            submitButton.disabled = true;
            if (buttonText) buttonText.textContent = 'Sending...';
            if (buttonLoading) buttonLoading.style.display = 'inline-block';
        }
        
        try {
            // Create FormData object
            const formData = new FormData(form);
            
            // Send the email
            const success = await emailService.sendEmail(formData);

            if (success) {
                closeModalFunc();
                
                // Show success message
                const successMessage = document.getElementById('success-message');
                if (successMessage) {
                    successMessage.style.display = 'block';
                    
                    // Hide success message after 5 seconds
                    setTimeout(() => {
                        successMessage.style.display = 'none';
                        
                        // Reset the form
                        form.reset();
                        
                        // Scroll to top
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }, 5000);
                }
            }
        } catch (error) {
            console.error('Error sending email:', error);
            alert('Failed to send email. Please try again or contact don@dwsjr.com directly.');
        } finally {
            // Reset button state
            if (submitButton) {
                submitButton.disabled = false;
                if (buttonText) buttonText.textContent = 'Send Message';
                if (buttonLoading) buttonLoading.style.display = 'none';
            }
        }
    });

    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModalFunc();
            }
        });
    }

    // Close modal with escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.style.display === 'block') {
            closeModalFunc();
        }
    });

    // Close button in modal
    if (closeModal) {
        closeModal.addEventListener('click', closeModalFunc);
    }

    // Edit button in preview modal
    if (editButton) {
        editButton.addEventListener('click', closeModalFunc);
    }
});

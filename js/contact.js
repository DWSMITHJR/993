document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('inquiry-form');
    const emailInput = document.getElementById('email');
    const modal = document.getElementById('email-preview-modal');
    const closeModal = document.querySelector('.close-modal');
    const sendButton = document.getElementById('send-email');
    const editButton = document.getElementById('edit-email');
    const emailPreview = document.getElementById('email-preview');
    const submitButton = form.querySelector('button[type="submit"]');
    const buttonText = submitButton.querySelector('.button-text');
    const buttonLoading = submitButton.querySelector('.button-loading');

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
        
        // Validate phone
        const phone = document.getElementById('phone');
        if (!phone.value.trim()) {
            showError(phone, 'Please enter your phone number');
            isValid = false;
        } else if (!/^[0-9\-\+\(\)\s]{10,}$/.test(phone.value.trim())) {
            showError(phone, 'Please enter a valid phone number (at least 10 digits)');
            isValid = false;
        }
        
        // Validate subject
        const subject = document.getElementById('subject');
        if (!subject.value) {
            showError(subject, 'Please select an inquiry type');
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

    // Create editable field
    function createEditableField(label, value, fieldName, type = 'text') {
        const wrapper = document.createElement('div');
        wrapper.className = 'editable-field';
        wrapper.innerHTML = `
            <div class="field-display">
                <strong>${label}:</strong> 
                <span class="field-value">${value || 'Not provided'}</span>
                <button type="button" class="edit-field" data-field="${fieldName}">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
            <div class="field-edit" style="display: none;">
                ${type === 'select' ? 
                    `<select class="form-control" name="${fieldName}">
                        <option value="" disabled>Select Inquiry Type</option>
                        <option value="Purchase Inquiry">Purchase Inquiry</option>
                        <option value="Request More Info">Request More Info</option>
                        <option value="Schedule Viewing">Schedule Viewing</option>
                        <option value="Other">Other</option>
                    </select>` : 
                    type === 'textarea' ? 
                    `<textarea class="form-control" name="${fieldName}" rows="3"></textarea>` :
                    `<input type="${type}" class="form-control" name="${fieldName}" value="${value || ''}">`
                }
                <div class="edit-actions">
                    <button type="button" class="save-edit">Save</button>
                    <button type="button" class="cancel-edit">Cancel</button>
                </div>
            </div>
        `;
        
        // Set the selected value for dropdown
        if (type === 'select') {
            const select = wrapper.querySelector('select');
            if (select) {
                select.value = value;
            }
        } else if (type === 'textarea') {
            const textarea = wrapper.querySelector('textarea');
            if (textarea) {
                textarea.value = value;
            }
        }
        
        return wrapper;
    }

    // Update email preview with editable fields
    function updateEmailPreview() {
        const formData = new FormData(form);
        const previewContainer = document.createElement('div');
        
        const header = document.createElement('div');
        header.className = 'preview-header';
        header.innerHTML = `
            <h4>Your Message</h4>
            <p>Please review your information before sending. Click the edit icon to make changes.</p>
        `;
        
        const content = document.createElement('div');
        content.className = 'preview-content';
        
        // Add editable fields
        content.appendChild(createEditableField('Name', formData.get('name'), 'name'));
        content.appendChild(createEditableField('Email', formData.get('email'), 'email', 'email'));
        content.appendChild(createEditableField('Phone', formData.get('phone'), 'phone', 'tel'));
        content.appendChild(createEditableField('Inquiry Type', formData.get('subject'), 'subject', 'select'));
        
        // Add message field
        const messageField = createEditableField('Message', formData.get('message'), 'message', 'textarea');
        messageField.classList.add('message-field');
        content.appendChild(messageField);
        
        previewContainer.appendChild(header);
        previewContainer.appendChild(content);
        
        // Clear and update the preview
        emailPreview.innerHTML = '';
        emailPreview.appendChild(previewContainer);
        
        // Set up edit handlers
        setupEditHandlers();
    }
    
    // Set up edit handlers for the preview
    function setupEditHandlers() {
        // Edit button click
        document.querySelectorAll('.edit-field').forEach(button => {
            button.addEventListener('click', function() {
                const fieldWrapper = this.closest('.editable-field');
                const display = fieldWrapper.querySelector('.field-display');
                const edit = fieldWrapper.querySelector('.field-edit');
                
                display.style.display = 'none';
                edit.style.display = 'block';
                
                // Focus the first input in the edit section
                const input = edit.querySelector('input, select, textarea');
                if (input) input.focus();
            });
        });
        
        // Save edit
        document.querySelectorAll('.save-edit').forEach(button => {
            button.addEventListener('click', function() {
                const fieldWrapper = this.closest('.editable-field');
                const display = fieldWrapper.querySelector('.field-display');
                const edit = fieldWrapper.querySelector('.field-edit');
                const input = edit.querySelector('input, select, textarea');
                const valueDisplay = display.querySelector('.field-value');
                const fieldName = input.name;
                
                // Update the display
                if (input.tagName === 'TEXTAREA') {
                    valueDisplay.innerHTML = input.value.replace(/\n/g, '<br>');
                } else if (input.tagName === 'SELECT') {
                    valueDisplay.textContent = input.options[input.selectedIndex].text;
                } else {
                    valueDisplay.textContent = input.value || 'Not provided';
                }
                
                // Update the original form field
                const formField = form.querySelector(`[name="${fieldName}"]`);
                if (formField) {
                    if (formField.tagName === 'SELECT') {
                        formField.value = input.value;
                    } else {
                        formField.value = input.value;
                    }
                }
                
                // Toggle back to display mode
                display.style.display = 'flex';
                edit.style.display = 'none';
            });
        });
        
        // Cancel edit
        document.querySelectorAll('.cancel-edit').forEach(button => {
            button.addEventListener('click', function() {
                const fieldWrapper = this.closest('.editable-field');
                const display = fieldWrapper.querySelector('.field-display');
                const edit = fieldWrapper.querySelector('.field-edit');
                
                display.style.display = 'flex';
                edit.style.display = 'none';
            });
        });
        
        // Handle Enter key in edit fields
        document.querySelectorAll('.field-edit input, .field-edit textarea').forEach(input => {
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const saveBtn = this.closest('.field-edit').querySelector('.save-edit');
                    if (saveBtn) saveBtn.click();
                }
            });
        });
    }

    // Format form data for email
    function formatFormDataForEmail(formData) {
        let emailBody = "New Inquiry from Porsche 911 Carrera 4S Website\n\n";
        
        // Add all form fields to email body
        emailBody += `Name: ${formData.get('name') || 'Not provided'}\n`;
        emailBody += `Email: ${formData.get('email') || 'Not provided'}\n`;
        emailBody += `Phone: ${formData.get('phone') || 'Not provided'}\n`;
        emailBody += `Inquiry Type: ${formData.get('subject') || 'Not specified'}\n\n`;
        emailBody += `Message:\n${formData.get('message') || 'No message provided'}\n\n`;
        
        // Add timestamp
        emailBody += `\n---\n`;
        emailBody += `Sent on: ${new Date().toLocaleString()}\n`;
        emailBody += `User Agent: ${navigator.userAgent}`;
        
        return emailBody;
    }
    
    // Format form data for display in preview
    function formatFormDataForPreview(formData) {
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });
        return data;
    }

    // Update the preview content
    function updatePreviewContent(formData) {
        const previewContent = document.getElementById('preview-content');
        if (!previewContent) return;
        
        const previewHTML = `
            <div class="preview-section">
                <h4>Contact Information</h4>
                <p><strong>Name:</strong> ${formData.name || 'Not provided'}</p>
                <p><strong>Email:</strong> ${formData.email || 'Not provided'}</p>
                <p><strong>Phone:</strong> ${formData.phone || 'Not provided'}</p>
                <p><strong>Inquiry Type:</strong> ${formData.subject || 'Not specified'}</p>
            </div>
            <div class="preview-section">
                <h4>Message</h4>
                <p>${formData.message.replace(/\n/g, '<br>') || 'No message provided'}</p>
            </div>
        `;
        
        previewContent.innerHTML = previewHTML;
        
        // Set up event listeners for the modal buttons
        const editButton = document.getElementById('edit-preview');
        const sendButton = document.getElementById('confirm-send');
        
        if (editButton) {
            editButton.onclick = function() {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            };
        }
        
        if (sendButton) {
            sendButton.onclick = function() {
                sendEmail(formData);
            };
        }
    }
    
    // Send email using mailto
    function sendEmail(formData) {
        const subject = `Inquiry about 1997 Porsche 911 Carrera 4S - ${formData.subject || 'General Inquiry'}`;
        const body = `
Name: ${formData.name || 'Not provided'}
Email: ${formData.email || 'Not provided'}
Phone: ${formData.phone || 'Not provided'}

Message:
${formData.message || 'No message provided'}

---
This message was sent from the 1997 Porsche 911 Carrera 4S contact form`;
        
        const mailtoLink = `mailto:phdproton@pm.me?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        // Show the success message
        const successMessage = document.getElementById('success-message');
        successMessage.classList.add('visible');
        
        // Open the default email client
        window.open(mailtoLink, '_blank');
        
        // Reset the form
        form.reset();
        
        // Hide the modal and show the form container
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        document.getElementById('form-container').style.display = 'block';
        
        // Hide the success message after 60 seconds
        setTimeout(() => {
            successMessage.classList.remove('visible');
        }, 60000);
    }

    // Handle form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // First, trigger HTML5 validation
        if (!form.checkValidity()) {
            // If HTML5 validation fails, trigger our custom validation
            if (!validateForm()) {
                return false;
            }
        }
        
        // Get form data
        const formData = new FormData(form);
        const formDataObj = formatFormDataForPreview(formData);
        
        // Update and show the preview modal
        updatePreviewContent(formDataObj);
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        return false;
    });
    
    // Handle "Send Another" button click
    document.getElementById('send-another').addEventListener('click', function() {
        // Show the form and hide success message
        document.getElementById('form-container').style.display = 'block';
        document.getElementById('success-message').style.display = 'none';
        
        // Clear any form messages
        const formMessage = document.getElementById('form-message');
        if (formMessage) {
            formMessage.textContent = '';
            formMessage.className = 'form-message';
        }
    });
    
    // Close modal when clicking outside the content
    function handleOutsideClick(e) {
        if (e.target === modal) {
            closeModalFunc();
        }
    }
    
    // Close modal with escape key
    function handleEscapeKey(e) {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            closeModalFunc();
        }
    }
    
    // Function to close the modal
    function closeModalFunc() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    // Set up event listeners for the modal
    if (closeModal) {
        closeModal.addEventListener('click', closeModalFunc);
    }
    
    window.addEventListener('click', handleOutsideClick);
    document.addEventListener('keydown', handleEscapeKey);
    
    // Clean up event listeners when the page is unloaded
    window.addEventListener('beforeunload', function() {
        if (closeModal) {
            closeModal.removeEventListener('click', closeModalFunc);
        }
        window.removeEventListener('click', handleOutsideClick);
        document.removeEventListener('keydown', handleEscapeKey);
    });
    
    // Character counter for message textarea
    const messageInput = document.getElementById('message');
    const charCount = document.getElementById('message-count');
    
    if (messageInput && charCount) {
        messageInput.addEventListener('input', function() {
            charCount.textContent = this.value.length;
        });
    }
    
    // Initialize form validation on input
    const formInputs = form.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.required || this.value.trim() !== '') {
                if (this.type === 'email' && !validateEmail(this.value)) {
                    showError(this, 'Please enter a valid email address');
                } else {
                    removeError(this);
                }
            }
        });
    });
});

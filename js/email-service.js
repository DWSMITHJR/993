/**
 * Email Service for Porsche 993 Contact Form
 * Handles sending emails via mailto: links with proper cleanup
 */

class EmailService {
    constructor() {
        this.currentLink = null;
        this.timeoutId = null;
    }

    /**
     * Send an email using the browser's mailto: functionality
     * @param {FormData} formData - The form data containing email details
     * @returns {Promise<boolean>} - Resolves when email is sent
     */
    sendEmail(formData) {
        return new Promise((resolve) => {
            try {
                // Format email subject and body with proper line breaks
                const subject = this.cleanSubject(`Inquiry about 1997 Porsche 911 Carrera 4S - ${formData.get('subject') || 'General Inquiry'}`);
                const body = this.formatEmailBody(formData);
                
                // Create mailto link with proper encoding
                const mailtoLink = this.createMailtoLink({
                    to: 'donald@donaldwsmithjr.com',
                    cc: 'u4theD@proton.me',
                    subject: subject,
                    body: body
                });

                // Clean up any previous link and timeout
                this.cleanup();

                // Create a hidden iframe to handle the mailto link
                // This prevents issues with popup blockers
                const iframeId = `email-iframe-${Date.now()}`;
                const iframe = document.createElement('iframe');
                iframe.id = iframeId;
                iframe.name = iframeId;
                iframe.style.display = 'none';
                document.body.appendChild(iframe);

                // Create and trigger the link with a unique ID
                const linkId = `email-link-${Date.now()}`;
                this.currentLink = document.createElement('a');
                this.currentLink.id = linkId;
                this.currentLink.href = mailtoLink;
                this.currentLink.style.display = 'none';
                
                // Add target to ensure it works in all browsers
                this.currentLink.target = iframeId;
                
                // Append to body and click
                document.body.appendChild(this.currentLink);
                
                // Use requestAnimationFrame to ensure the element is in the DOM
                requestAnimationFrame(() => {
                    this.currentLink.click();
                });

                // Schedule cleanup with a bit longer timeout to ensure the email client opens
                this.timeoutId = setTimeout(() => {
                    this.cleanup();
                    resolve(true);
                }, 2000); // Increased timeout to 2 seconds

            } catch (error) {
                console.error('Error sending email:', error);
                this.cleanup();
                resolve(false);
            }
        });
    }

    /**
     * Clean and format the email subject
     * @private
     */
    cleanSubject(subject) {
        // Remove any line breaks and extra spaces
        return subject.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    }

    /**
     * Format the email body from form data with proper line breaks
     * @private
     */
    formatEmailBody(formData) {
        const name = formData.get('name')?.trim() || 'Not provided';
        const email = formData.get('email')?.trim() || 'Not provided';
        const phone = formData.get('phone')?.trim() || 'Not provided';
        const message = formData.get('message')?.trim() || 'No message provided';
        
        return [
            `Name: ${name}`,
            `Email: ${email}`,
            `Phone: ${phone}`,
            '',
            message
        ].join('\n');
    }

    /**
     * Create a mailto: URL with proper encoding
     * @private
     */
    createMailtoLink({ to, cc = '', subject = '', body = '' }) {
        const params = [];
        
        // Encode each parameter separately
        if (cc) params.push(`cc=${encodeURIComponent(cc)}`);
        if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
        if (body) params.push(`body=${encodeURIComponent(body)}`);
        
        // Join parameters with & and ensure no double-encoding
        const queryString = params.length ? '?' + params.join('&') : '';
        
        // Return the complete mailto URL
        return `mailto:${to}${queryString}`;
    }

    /**
     * Clean up any created DOM elements and timeouts
     * @private
     */
    cleanup() {
        // Clear any pending timeouts
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        
        // Remove the link if it exists
        if (this.currentLink && document.body.contains(this.currentLink)) {
            try {
                document.body.removeChild(this.currentLink);
            } catch (e) {
                console.warn('Error removing email link:', e);
            }
        }
        this.currentLink = null;
        
        // Remove any iframes we might have created
        const iframes = document.querySelectorAll('iframe[style*="display: none"]');
        iframes.forEach(iframe => {
            try {
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
            } catch (e) {
                console.warn('Error removing iframe:', e);
            }
        });
    }
}

// Export a singleton instance
export const emailService = new EmailService();

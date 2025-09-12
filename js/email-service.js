/**
 * Email Service for Porsche 993 Contact Form
 * Handles sending emails via mailto: links with proper cleanup
 */

class EmailService {
    constructor() {
        this.currentLink = null;
    }

    /**
     * Send an email using the browser's mailto: functionality
     * @param {FormData} formData - The form data containing email details
     * @returns {Promise<boolean>} - Resolves when email is sent
     */
    sendEmail(formData) {
        return new Promise((resolve) => {
            try {
                // Format email subject and body
                const subject = `Inquiry about 1997 Porsche 911 Carrera 4S - ${formData.get('subject') || 'General Inquiry'}`;
                const body = this.formatEmailBody(formData);
                
                // Create mailto link
                const mailtoLink = this.createMailtoLink({
                    to: 'donald@donaldwsmithjr.com',
                    cc: 'u4theD@proton.me',
                    subject: subject,
                    body: body
                });

                // Clean up any previous link
                this.cleanup();

                // Create and trigger the link
                this.currentLink = document.createElement('a');
                this.currentLink.href = mailtoLink;
                this.currentLink.style.display = 'none';
                document.body.appendChild(this.currentLink);
                
                // Trigger the click
                this.currentLink.click();

                // Schedule cleanup
                setTimeout(() => {
                    this.cleanup();
                    resolve(true);
                }, 1000);

            } catch (error) {
                console.error('Error sending email:', error);
                this.cleanup();
                resolve(false);
            }
        });
    }

    /**
     * Format the email body from form data
     * @private
     */
    formatEmailBody(formData) {
        return [
            `Name: ${formData.get('name') || 'Not provided'}`,
            `Email: ${formData.get('email') || 'Not provided'}`,
            `Phone: ${formData.get('phone') || 'Not provided'}`,
            '',
            formData.get('message') || 'No message provided'
        ].join('\n');
    }

    /**
     * Create a mailto: URL with proper encoding
     * @private
     */
    createMailtoLink({ to, cc = '', subject = '', body = '' }) {
        const params = [];
        if (cc) params.push(`cc=${encodeURIComponent(cc)}`);
        if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
        if (body) params.push(`body=${encodeURIComponent(body)}`);
        
        return `mailto:${to}${params.length ? '?' + params.join('&') : ''}`;
    }

    /**
     * Clean up any created DOM elements
     * @private
     */
    cleanup() {
        if (this.currentLink && document.body.contains(this.currentLink)) {
            document.body.removeChild(this.currentLink);
        }
        this.currentLink = null;
    }
}

// Export a singleton instance
export const emailService = new EmailService();

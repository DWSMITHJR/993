// Configuration for different environments
const config = {
    // Development configuration (file:// protocol)
    development: {
        pdfPath: 'images/inside/window.pdf',
        usePdfJsWorker: true,
        fallbackToObjectTag: true
    },
    // Production configuration (http:// or https:// protocol)
    production: {
        pdfPath: '/images/inside/window.pdf', // Absolute path for production
        usePdfJsWorker: true,
        fallbackToObjectTag: false
    },
    // Get current environment
    get isProduction() {
        return window.location.protocol.startsWith('http');
    },
    // Get current configuration
    get current() {
        return this.isProduction ? this.production : this.development;
    }
};

export default config;

/**
 * Application Configuration
 * Handles environment-specific settings and path resolution
 */

const config = {
    // Environment detection
    environment: (() => {
        if (window.location.hostname === 'localhost' || 
            window.location.protocol === 'file:') {
            return 'development';
        }
        return 'production';
    })(),
    
    // Base paths for different environments
    paths: {
        development: {
            base: window.location.href.split('/').slice(0, -1).join('/') + '/',
            assets: 'images/'
        },
        production: {
            base: window.location.origin + '/',  // For GitHub Pages: 'https://donaldsmithjr.github.io/993/'
            assets: 'images/'
        }
    },
    
    // PDF configuration
    pdf: {
        defaultFile: 'inside/window.pdf',
        usePdfJsWorker: true,
        fallbackToObjectTag: true
    },
    
    // Get current environment configuration
    get currentEnv() {
        return this[this.environment];
    },
    
    // Resolve a resource path
    resolvePath(relativePath) {
        const env = this.paths[this.environment];
        // Remove leading slash if present
        const cleanPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
        return `${env.base}${env.assets}${cleanPath}`;
    },
    
    // Get full PDF URL
    getPdfUrl(customPath = '') {
        const pdfPath = customPath || this.pdf.defaultFile;
        return this.resolvePath(pdfPath);
    },
    
    // Check if running locally
    get isLocal() {
        return this.environment === 'development';
    },
    
    // Get current configuration
    get current() {
        return this[this.environment];
    }
};

export default config;

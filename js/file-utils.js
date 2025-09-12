import config from './config.js';

/**
 * File utilities for handling different environments
 */
const fileUtils = {
    /**
     * Get the full URL for a resource
     * @param {string} relativePath - Path relative to assets directory
     * @returns {string} Full URL to the resource
     */
    getResourceUrl(relativePath) {
        if (!relativePath) return '';
        
        // Handle absolute URLs and data URIs
        if (relativePath.startsWith('http') || 
            relativePath.startsWith('blob:') || 
            relativePath.startsWith('data:')) {
            return relativePath;
        }
        
        return config.resolvePath(relativePath);
    },
    
    /**
     * Check if a file exists at the given URL
     * @param {string} url - URL to check
     * @returns {Promise<boolean>} True if file exists
     */
    async checkFileExists(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch (e) {
            console.warn(`File not found: ${url}`, e);
            return false;
        }
    },
    
    /**
     * Load a file as ArrayBuffer
     * @param {string} url - URL of the file to load
     * @returns {Promise<ArrayBuffer>} File content as ArrayBuffer
     */
    async loadFileAsArrayBuffer(url) {
        try {
            if (config.isLocal) {
                // Use XHR for local files to handle CORS
                return new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('GET', url, true);
                    xhr.responseType = 'arraybuffer';
                    xhr.onload = () => {
                        if (xhr.status === 200) {
                            resolve(xhr.response);
                        } else {
                            reject(new Error(`Failed to load file: ${xhr.statusText}`));
                        }
                    };
                    xhr.onerror = () => reject(new Error('Network error while loading file'));
                    xhr.send();
                });
            } else {
                // Use fetch for remote files
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.arrayBuffer();
            }
        } catch (error) {
            console.error('Error loading file:', url, error);
            throw error;
        }
    },
    
    /**
     * Get PDF.js loading options
     * @param {string} url - PDF URL
     * @returns {Object} PDF.js loading options
     */
    async getPdfLoadingOptions(url) {
        const options = {
            url: url,
            withCredentials: false,
            // Add CORS headers if needed
            httpHeaders: {}
        };
        
        // For local files, we need to load the file first
        if (config.isLocal) {
            options.data = await this.loadFileAsArrayBuffer(url);
        }
        
        return options;
    }
};

export default fileUtils;

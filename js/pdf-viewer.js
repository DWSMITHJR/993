import config from './config.js';
import fileUtils from './file-utils.js';

/**
 * PDF Viewer Component
 * Handles PDF rendering and navigation
 */
class PdfViewer {
    constructor(options = {}) {
        // Merge default options with provided options
        this.options = {
            container: document.body,
            canvasId: 'pdf-canvas',
            loadingId: 'pdf-loading',
            errorId: 'pdf-error',
            prevButtonId: 'prev-page',
            nextButtonId: 'next-page',
            pageNumId: 'page-num',
            pageCountId: 'page-count',
            pdfUrl: '',
            scale: 1.5,
            ...options
        };
        
        // Initialize properties
        this.pdfDoc = null;
        this.pageNum = 1;
        this.pageRendering = false;
        this.pageNumPending = null;
        
        // Initialize the viewer
        this.init();
    }
    
    /**
     * Initialize the PDF viewer
     */
    init() {
        // Get DOM elements
        this.canvas = document.getElementById(this.options.canvasId) || this.createCanvas();
        this.ctx = this.canvas.getContext('2d');
        this.loadingEl = document.getElementById(this.options.loadingId) || this.createLoadingElement();
        this.errorEl = document.getElementById(this.options.errorId) || this.createErrorElement();
        
        // Navigation elements
        this.prevBtn = document.getElementById(this.options.prevButtonId);
        this.nextBtn = document.getElementById(this.options.nextButtonId);
        this.pageNumEl = document.getElementById(this.options.pageNumId);
        this.pageCountEl = document.getElementById(this.options.pageCountId);
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load the PDF
        this.loadPdf(this.options.pdfUrl || config.getPdfUrl());
    }
    
    /**
     * Create canvas element if it doesn't exist
     */
    createCanvas() {
        const canvas = document.createElement('canvas');
        canvas.id = this.options.canvasId;
        this.options.container.appendChild(canvas);
        return canvas;
    }
    
    /**
     * Create loading element if it doesn't exist
     */
    createLoadingElement() {
        const div = document.createElement('div');
        div.id = this.options.loadingId;
        div.className = 'loading';
        div.textContent = 'Loading PDF...';
        this.options.container.appendChild(div);
        return div;
    }
    
    /**
     * Create error element if it doesn't exist
     */
    createErrorElement() {
        const div = document.createElement('div');
        div.id = this.options.errorId;
        div.className = 'error-message';
        this.options.container.appendChild(div);
        return div;
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Navigation buttons
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.prevPage());
        }
        
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.nextPage());
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowLeft':
                    this.prevPage();
                    break;
                case 'ArrowRight':
                    this.nextPage();
                    break;
            }
        });
        
        // Handle window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (this.pdfDoc) {
                    this.renderPage(this.pageNum);
                }
            }, 250);
        });
    }
    
    /**
     * Check if a URL is a local file
     * @param {string} url - URL to check
     */
    isLocalFileUrl(url) {
        return url.startsWith('file:') || 
               url.startsWith('blob:') || 
               !/^https?:\/\//.test(url);
    }

    /**
     * Open PDF in browser's built-in viewer
     * @param {string} url - URL of the PDF to open
     */
    openInBrowserViewer(url) {
        // For local files, we need to create an object URL
        const pdfUrl = url.startsWith('blob:') ? url : 
                      (url.startsWith('file:') ? url : 
                      URL.createObjectURL(new Blob([url], { type: 'application/pdf' })));
        
        // Open in new tab with browser's built-in viewer
        window.open(pdfUrl, '_blank');
        
        // Clean up object URL if we created one
        if (pdfUrl !== url) {
            URL.revokeObjectURL(pdfUrl);
        }
        
        return false; // Prevent default behavior
    }

    /**
     * Load a PDF from a URL or file object
     * @param {string|File} source - URL or file object of the PDF to load
     */
    async loadPdf(source) {
        try {
            this.showLoading();
            this.clearError();
            
            // If source is a file object, create object URL
            const pdfUrl = source instanceof File ? URL.createObjectURL(source) : source;
            
            // For local files, always use browser's built-in viewer
            if (this.isLocalFileUrl(pdfUrl)) {
                this.openInBrowserViewer(pdfUrl);
                return;
            }
            
            // For remote URLs, use PDF.js
            const loadingTask = window.pdfjsLib.getDocument({
                url: pdfUrl,
                withCredentials: false,
                cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
                cMapPacked: true
            });
            
            this.pdfDoc = await loadingTask.promise;
            
            // Update UI
            this.updatePageCount(this.pdfDoc.numPages);
            this.currentPage = 1;
            await this.renderPage(this.currentPage);
            
            // Clean up object URL if we created one
            if (source instanceof File) {
                URL.revokeObjectURL(pdfUrl);
            }
            
        } catch (error) {
            console.error('Error loading PDF:', error);
            this.showError('Error loading PDF: ' + (error.message || 'Unknown error'));
            
            // If PDF.js fails, try opening in browser's viewer as fallback
            if (source && !(source instanceof File)) {
                this.openInBrowserViewer(source);
            }
        } finally {
            this.hideLoading();
        }
    }
    
    /**
     * Render a specific page
     * @param {number} num - Page number (1-based)
     */
    async renderPage(num) {
        if (this.pageRendering) {
            this.pageNumPending = num;
            return;
        }
        
        this.pageRendering = true;
        this.pageNum = num;
        
        try {
            const page = await this.pdfDoc.getPage(num);
            const viewport = page.getViewport({ scale: this.options.scale });
            
            // Adjust canvas size
            this.canvas.height = viewport.height;
            this.canvas.width = viewport.width;
            
            // Render PDF page
            const renderContext = {
                canvasContext: this.ctx,
                viewport: viewport
            };
            
            await page.render(renderContext).promise;
            
            // Update UI
            this.updatePageNum();
            
            // Handle any pending page render
            if (this.pageNumPending !== null) {
                this.renderPage(this.pageNumPending);
                this.pageNumPending = null;
            }
            
        } catch (error) {
            console.error('Error rendering page:', error);
            this.showError(`Error rendering page: ${error.message}`);
        } finally {
            this.pageRendering = false;
        }
    }
    
    /**
     * Go to the previous page
     */
    prevPage() {
        if (this.pageNum <= 1 || this.pageRendering) return;
        this.renderPage(this.pageNum - 1);
        window.scrollTo(0, 0);
    }
    
    /**
     * Go to the next page
     */
    nextPage() {
        if (!this.pdfDoc || this.pageNum >= this.pdfDoc.numPages || this.pageRendering) return;
        this.renderPage(this.pageNum + 1);
        window.scrollTo(0, 0);
    }
    
    /**
     * Update the page number display
     */
    updatePageNum() {
        if (this.pageNumEl) {
            this.pageNumEl.textContent = this.pageNum;
        }
        
        // Update button states
        if (this.prevBtn) {
            this.prevBtn.disabled = this.pageNum <= 1;
        }
        
        if (this.nextBtn) {
            this.nextBtn.disabled = this.pageNum >= this.pdfDoc.numPages;
        }
    }
    
    /**
     * Update the page count display
     */
    updatePageCount() {
        if (this.pageCountEl && this.pdfDoc) {
            this.pageCountEl.textContent = this.pdfDoc.numPages;
        }
    }
    
    /**
     * Show loading indicator
     */
    showLoading() {
        if (this.loadingEl) {
            this.loadingEl.style.display = 'flex';
        }
    }
    
    /**
     * Hide loading indicator
     */
    hideLoading() {
        if (this.loadingEl) {
            this.loadingEl.style.display = 'none';
        }
    }
    
    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        if (this.errorEl) {
            this.errorEl.textContent = message;
            this.errorEl.style.display = 'block';
        }
    }
    
    /**
     * Hide error message
     */
    hideError() {
        if (this.errorEl) {
            this.errorEl.style.display = 'none';
        }
    }
}

export default PdfViewer;

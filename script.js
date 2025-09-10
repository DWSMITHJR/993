// Global variables for slideshow
let slideshowInterval = null;
let isPlaying = false;
let currentSlideIndex = 0;

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const mainImage = document.getElementById('main-image');
    const thumbnails = document.querySelectorAll('.thumbnail:not(.pdf-thumbnail)');
    const slideshowBtn = document.getElementById('slideshow-btn');
    const pdfModal = document.getElementById('pdfModal');
    const pdfViewer = document.getElementById('pdfViewer');
    const closePdfBtn = document.querySelector('.close-pdf');
    
    // Initialize event listeners
    if (slideshowBtn) {
        slideshowBtn.addEventListener('click', toggleSlideshow);
    }
    
    if (closePdfBtn) {
        closePdfBtn.addEventListener('click', closePdfModal);
    }
    
    // Initialize thumbnail click handlers
    const allThumbnails = document.querySelectorAll('.thumbnail');
    if (allThumbnails.length > 0) {
        allThumbnails.forEach((thumb, index) => {
            thumb.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Check if this is a PDF thumbnail
                if (thumb.classList.contains('pdf-thumbnail') || (thumb.getAttribute('data-full') || '').toLowerCase().endsWith('.pdf')) {
                    const pdfPath = thumb.getAttribute('data-full');
                    const caption = thumb.getAttribute('data-caption') || 'Document';
                    openPdfViewer(pdfPath, caption);
                    return;
                }
                
                // Handle regular image thumbnails
                currentSlideIndex = index;
                showSlide(currentSlideIndex);
                
                // If slideshow is playing, restart the interval
                if (isPlaying) {
                    stopSlideshow();
                    startSlideshow();
                }
            });
        });
    }
    
    // Initialize modal functionality
    const modal = document.getElementById('modal');
    if (modal) {
        const modalImg = document.getElementById('modal-image');
        
        // Click on main image to open modal
        const galleryMain = document.querySelector('.gallery-main');
        if (galleryMain) {
            galleryMain.addEventListener('click', function(e) {
                // Don't trigger modal if clicking on the zoom button
                if (e.target.closest('.image-zoom')) return;
                
                modal.style.display = 'flex';
                setTimeout(() => {
                    modal.style.opacity = '1';
                }, 10);
                modalImg.src = mainImage.src;
                document.body.style.overflow = 'hidden';
            });
        }
        
        // Close modal
        const closeBtn = document.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                closeModal(modal);
            });
        }
        
        // Close modal when clicking outside the image
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    }
    
    // Initialize animations
    initAnimations();
    
    // Initialize form with test data
    populateFormWithTestData();
});

// Toggle slideshow on/off
function toggleSlideshow() {
    if (isPlaying) {
        stopSlideshow();
    } else {
        startSlideshow();
        // Immediately show next slide when starting
        nextSlide();
    }
}

// Start the slideshow
function startSlideshow() {
    const thumbnails = document.querySelectorAll('.thumbnail:not(.pdf-thumbnail)');
    if (thumbnails.length === 0) return;
    
    // If already playing, do nothing
    if (isPlaying) return;
    
    isPlaying = true;
    updateSlideshowButton(true);
    
    // Show first image immediately if none is active
    if (!document.querySelector('.thumbnail.active') && thumbnails.length > 0) {
        currentSlideIndex = 0;
        showSlide(currentSlideIndex);
    }
    
    // Start slideshow interval (5 seconds per slide)
    slideshowInterval = setInterval(nextSlide, 5000);
}

// Stop the slideshow
function stopSlideshow() {
    if (slideshowInterval) {
        clearInterval(slideshowInterval);
        slideshowInterval = null;
    }
    isPlaying = false;
    updateSlideshowButton(false);
}

// Show next slide
function nextSlide() {
    const thumbnails = document.querySelectorAll('.thumbnail:not(.pdf-thumbnail)');
    if (thumbnails.length === 0) {
        stopSlideshow();
        return;
    }
    
    // Remove active class from current thumbnail
    const currentActive = document.querySelector('.thumbnail.active');
    if (currentActive) {
        currentActive.classList.remove('active');
    }
    
    // Move to next slide
    currentSlideIndex = (currentSlideIndex + 1) % thumbnails.length;
    
    // Show the new slide
    showSlide(currentSlideIndex);
}

// Show slide at specific index
function showSlide(index) {
    const thumbnails = document.querySelectorAll('.thumbnail:not(.pdf-thumbnail)');
    if (index < 0 || index >= thumbnails.length) return;
    
    const thumbnail = thumbnails[index];
    const mainImage = document.getElementById('main-image');
    const caption = document.querySelector('.image-caption');
    
    if (thumbnail && mainImage && caption) {
        // Fade out
        mainImage.style.opacity = '0';
        
        // After fade out, change image and fade in
        setTimeout(() => {
            mainImage.src = thumbnail.getAttribute('data-full');
            mainImage.alt = thumbnail.alt;
            caption.textContent = thumbnail.getAttribute('data-caption');
            
            // Update active state
            document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
            thumbnail.classList.add('active');
            
            // Fade in
            mainImage.style.opacity = '1';
        }, 200);
    }
}

// Update slideshow button state
function updateSlideshowButton(playing) {
    const btn = document.getElementById('slideshow-btn');
    if (!btn) return;
    
    if (playing) {
        btn.innerHTML = '<i class="fas fa-pause"></i> Stop Slideshow';
        btn.classList.add('playing');
    } else {
        btn.innerHTML = '<i class="fas fa-play"></i> Start Slideshow';
        btn.classList.remove('playing');
    }
}

// Close modal
function closeModal(modal) {
    if (!modal) return;
    
    modal.style.opacity = '0';
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
    document.body.style.overflow = 'auto';
}

// Open PDF viewer
function openPdfViewer(pdfPath, title) {
    const pdfModal = document.getElementById('pdfModal');
    const pdfViewer = document.getElementById('pdfViewer');
    const pdfTitle = document.getElementById('pdf-title');
    const pdfContainer = document.querySelector('.pdf-container');
    
    if (!pdfModal || !pdfViewer || !pdfTitle || !pdfContainer) return;
    
    try {
        // Set the title
        pdfTitle.textContent = title || 'Document';
        
        // Show loading state
        pdfViewer.style.opacity = '0';
        
        // Handle both relative and absolute paths
        const fullPdfPath = pdfPath.startsWith('http') || pdfPath.startsWith('/') 
            ? pdfPath 
            : `./${pdfPath.replace(/\\/g, '/')}`;
        
        // Set up error handling for the iframe
        const onPdfLoad = () => {
            pdfViewer.style.opacity = '1';
            pdfViewer.removeEventListener('error', onPdfError);
        };
        
        const onPdfError = () => {
            console.error('Failed to load PDF:', fullPdfPath);
            alert('Unable to load the document. Please try again later.');
            closePdfModal();
        };
        
        pdfViewer.addEventListener('load', onPdfLoad, { once: true });
        pdfViewer.addEventListener('error', onPdfError, { once: true });
        
        // Set the PDF source
        pdfViewer.src = fullPdfPath + '#toolbar=1&navpanes=1&scrollbar=1';
        
        // Show the modal with animation
        pdfModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Focus trap for accessibility
        pdfModal.setAttribute('aria-hidden', 'false');
        
        // Close modal when clicking outside the content
        const handleOutsideClick = (e) => {
            if (e.target === pdfModal) {
                closePdfModal();
            }
        };
        
        // Close with Escape key
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                closePdfModal();
            }
        };
        
        pdfModal.addEventListener('click', handleOutsideClick);
        document.addEventListener('keydown', handleKeyDown);
        
        // Store event listeners for cleanup
        pdfModal._clickHandler = handleOutsideClick;
        document._keyDownHandler = handleKeyDown;
        
        // Pause slideshow if playing
        if (isPlaying) {
            stopSlideshow();
        }
        
        // Set focus to the close button for better keyboard navigation
        const closeBtn = pdfModal.querySelector('.close-pdf');
        if (closeBtn) {
            setTimeout(() => closeBtn.focus(), 100);
        }
    } catch (error) {
        console.error('Error opening PDF viewer:', error);
        alert('An error occurred while trying to open the document.');
    }
}

// Close PDF modal
function closePdfModal() {
    const pdfModal = document.getElementById('pdfModal');
    const pdfViewer = document.getElementById('pdfViewer');
    
    if (!pdfModal || !pdfViewer) return;
    
    try {
        // Remove event listeners
        if (pdfModal._clickHandler) {
            pdfModal.removeEventListener('click', pdfModal._clickHandler);
            delete pdfModal._clickHandler;
        }
        
        if (document._keyDownHandler) {
            document.removeEventListener('keydown', document._keyDownHandler);
            delete document._keyDownHandler;
        }
        
        // Hide modal with animation
        pdfModal.style.opacity = '0';
        pdfModal.setAttribute('aria-hidden', 'true');
        
        setTimeout(() => {
            pdfModal.style.display = 'none';
            // Reset the iframe source when closing to prevent memory leaks
            pdfViewer.src = 'about:blank';
        }, 300);
        
        // Restore body scrolling
        document.body.style.overflow = 'auto';
        
        // Return focus to the element that opened the modal
        const activeElement = document.activeElement;
        if (activeElement && activeElement.classList.contains('thumbnail')) {
            activeElement.focus();
        }
    } catch (error) {
        console.error('Error closing PDF viewer:', error);
    }
}

// Initialize animations
function initAnimations() {
    // Set initial state for animation
    document.querySelectorAll('.spec-item, .feature, .gallery-container, .contact-container > div').forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'all 0.6s ease-out';
    });
    
    // Run animation on load and scroll
    animateOnScroll();
    window.addEventListener('scroll', animateOnScroll);
    
    // Add parallax effect to hero section
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero');
        if (hero) {
            hero.style.backgroundPositionY = -(scrolled * 0.5) + 'px';
        }
    });
}

// Animate elements on scroll
function animateOnScroll() {
    const elements = document.querySelectorAll('.spec-item, .feature, .gallery-container, .contact-container > div');
    
    elements.forEach(element => {
        const elementPosition = element.getBoundingClientRect().top;
        const screenPosition = window.innerHeight / 1.2;
        
        if (elementPosition < screenPosition) {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }
    });
}

// Function to populate form with test data
function populateFormWithTestData() {
    // This function can be used to populate form fields with test data if needed
    const testData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(123) 456-7890',
        message: 'I\'m interested in learning more about this vehicle.'
    };
    
    // Only populate if we're in development or testing
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        Object.keys(testData).forEach(key => {
            const input = document.querySelector(`[name="${key}"]`);
            if (input) {
                input.value = testData[key];
            }
        });
    }
}

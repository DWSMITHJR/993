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
    
    // Initialize event listeners
    if (slideshowBtn) {
        slideshowBtn.addEventListener('click', toggleSlideshow);
    }
    
    // Add click handler for window sticker link in footer
    const windowStickerLink = document.getElementById('window-sticker-link');
    if (windowStickerLink) {
        windowStickerLink.addEventListener('click', function(e) {
            e.preventDefault();
            openPdfViewer('images/inside/window.pdf', 'Window Sticker');
        });
    }
    
    // Add click handler for PDF thumbnails
    document.addEventListener('click', function(e) {
        try {
            // Check if the clicked element is a PDF thumbnail or a child of one
            const pdfThumbnail = e.target.closest('.pdf-thumbnail, [data-full$=".pdf"]');
            if (pdfThumbnail) {
                console.log('PDF thumbnail clicked:', pdfThumbnail);
                e.preventDefault();
                e.stopPropagation();
                
                const pdfPath = pdfThumbnail.getAttribute('data-full');
                const title = pdfThumbnail.getAttribute('data-caption') || 'Document';
                
                console.log('PDF Path:', pdfPath);
                console.log('Title:', title);
                
                if (!pdfPath) {
                    console.error('No PDF path found in data-full attribute');
                    return false;
                }
                
                openPdfViewer(pdfPath, title);
                return false;
            }
        } catch (error) {
            console.error('Error handling PDF thumbnail click:', error);
        }
    });
    
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
    
    // Initialize image modal functionality
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-image');
    const modalCaption = document.querySelector('.modal-caption');
    
    if (modal && modalImg) {
        // Click on thumbnails to open modal
        document.querySelectorAll('.thumbnail:not(.pdf-thumbnail)').forEach(thumb => {
            thumb.addEventListener('click', function(e) {
                e.preventDefault();
                const imgSrc = this.getAttribute('data-full') || this.getAttribute('src');
                const caption = this.getAttribute('data-caption') || this.getAttribute('alt') || '';
                
                if (imgSrc) {
                    modalImg.src = imgSrc;
                    modalCaption.textContent = caption;
                    
                    // Show modal with animation
                    modal.style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                    
                    // Add active class after a short delay for smooth transition
                    setTimeout(() => {
                        modal.classList.add('active');
                    }, 10);
                }
            });
        });
        
        // Close modal when clicking the close button
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                closeImageModal();
            });
        }
        
        // Close modal when clicking outside the image
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeImageModal();
            }
        });
        
        // Close with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeImageModal();
            }
        });
    }
    
    // Function to close the image modal
    function closeImageModal() {
        const modal = document.getElementById('image-modal');
        if (modal) {
            modal.classList.remove('active');
            
            // Wait for the fade-out animation to complete before hiding
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }, 300);
        }
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

// Open PDF in the browser's native viewer
function openPdfViewer(pdfPath, title) {
    console.log('openPdfViewer called with:', { pdfPath, title });
    
    // Check if we have a valid path
    if (!pdfPath) {
        console.error('No PDF path provided');
        return;
    }
    
    // For local development, use the direct path
    // For GitHub Pages, the path will be relative to the repository root
    let fullPdfUrl = pdfPath;
    
    // If it's not an absolute URL or a data URL
    if (!pdfPath.startsWith('http') && !pdfPath.startsWith('blob:') && !pdfPath.startsWith('data:')) {
        // Remove any leading ./ or / from the path
        const cleanPath = pdfPath.replace(/^\.?\//, '');
        
        // For GitHub Pages, we need to ensure the path is relative to the repository root
        if (window.location.hostname.includes('github.io')) {
            // On GitHub Pages, the base URL includes the repository name
            fullPdfUrl = cleanPath;
        } else {
            // For local development, use a relative path
            fullPdfUrl = cleanPath;
        }
    }

    console.log('Opening PDF:', fullPdfUrl);

    // Calculate 80% of screen dimensions
    const width = Math.floor(window.screen.availWidth * 0.8);
    const height = Math.floor(window.screen.availHeight * 0.8);

    // Center the window on the screen
    const left = Math.floor((window.screen.availWidth - width) / 2);
    const top = Math.floor((window.screen.availHeight - height) / 2);

    // Open in a new window sized to 80% of screen
    const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;
    window.open(fullPdfUrl, '_blank', features);
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

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

// Open PDF in a modal
function openPdfViewer(pdfPath, title) {
    console.log('Opening PDF:', pdfPath); // Debug log
    
    // Ensure the path is correct
    if (!pdfPath) {
        console.error('No PDF path provided');
        return;
    }
    
    // Remove any leading slash to prevent double slashes
    const cleanPath = pdfPath.replace(/^\//, '');
    
    // Create or get the modal
    let modal = document.getElementById('pdfModal');
    
    // If modal doesn't exist, create it
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'pdfModal';
        modal.className = 'modal';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        const closeBtn = document.createElement('span');
        closeBtn.className = 'close close-pdf';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = closePdfModal;
        
        const titleElement = document.createElement('h2');
        titleElement.textContent = title;
        titleElement.style.marginBottom = '10px';
        
        const iframe = document.createElement('iframe');
        iframe.id = 'pdfViewer';
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('title', 'PDF Viewer');
        iframe.style.width = '100%';
        iframe.style.height = '80vh';
        
        // Build the modal structure first
        modalContent.appendChild(closeBtn);
        modalContent.appendChild(titleElement);
        modalContent.appendChild(iframe);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Add click outside to close
        modal.addEventListener('click', function modalClickHandler(event) {
            if (event.target === modal) {
                closePdfModal();
            }
        });
        
        // Set the iframe source after the modal is in the DOM
        const googleDocsViewerUrl = `https://docs.google.com/viewer?url=${window.location.origin}/${encodeURIComponent(cleanPath)}&embedded=true`;
        console.log('Google Docs URL:', googleDocsViewerUrl); // Debug log
        iframe.src = googleDocsViewerUrl;
    } else {
        // Update existing modal
        const iframe = document.getElementById('pdfViewer');
        const titleElement = modal.querySelector('h2');
        
        if (iframe) {
            const googleDocsViewerUrl = `https://docs.google.com/viewer?url=${window.location.origin}/${encodeURIComponent(cleanPath)}&embedded=true`;
            console.log('Updating PDF URL:', googleDocsViewerUrl); // Debug log
            iframe.src = googleDocsViewerUrl;
        }
        
        if (titleElement) {
            titleElement.textContent = title;
        }
    }
    
    // Show the modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Add escape key to close
    const handleKeyDown = function(e) {
        if (e.key === 'Escape') {
            closePdfModal();
        }
    };
    
    // Remove any existing keydown listeners to prevent duplicates
    modal._keyDownHandler = handleKeyDown;
    document.addEventListener('keydown', handleKeyDown);
}

// Close PDF modal
function closePdfModal() {
    const modal = document.getElementById('pdfModal');
    if (modal) {
        // Remove the keydown event listener
        if (modal._keyDownHandler) {
            document.removeEventListener('keydown', modal._keyDownHandler);
            delete modal._keyDownHandler;
        }
        
        // Hide the modal with animation
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
        
        // Restore body scrolling
        document.body.style.overflow = 'auto';
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

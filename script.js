document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                const nav = document.querySelector('nav');
                nav.classList.remove('active');
            }
        });
    });

    // Navbar scroll effect
    const nav = document.querySelector('nav');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll <= 0) {
            nav.style.background = 'rgba(0, 0, 0, 0.8)';
            nav.style.padding = '20px 5%';
            return;
        }
        
        if (currentScroll > lastScroll && currentScroll > 100) {
            // Scrolling down
            nav.style.transform = 'translateY(-100%)';
        } else {
            // Scrolling up
            nav.style.transform = 'translateY(0)';
            nav.style.background = 'rgba(0, 0, 0, 0.95)';
            nav.style.padding = '15px 5%';
            nav.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        }
        
        lastScroll = currentScroll;
    });

    // Mobile menu toggle
    const menuToggle = document.createElement('div');
    menuToggle.className = 'menu-toggle';
    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    document.querySelector('nav').appendChild(menuToggle);
    
    menuToggle.addEventListener('click', () => {
        nav.classList.toggle('active');
    });

    // Image gallery functionality
    const mainImage = document.getElementById('main-image');
    const mainCaption = document.querySelector('.image-caption');
    const thumbnails = document.querySelectorAll('.thumbnail');
    const pdfModal = document.getElementById('pdfModal');
    const pdfViewer = document.getElementById('pdfViewer');
    const closePdfBtn = document.querySelector('.close-pdf');
    
    // Initialize PDF viewer iframe with title for accessibility
    if (pdfViewer) {
        pdfViewer.setAttribute('title', 'PDF Document Viewer');
    }

    // Function to update main image with smooth transition
    function updateMainImage(thumbnail) {
        const newSrc = thumbnail.getAttribute('data-full');
        const newCaption = thumbnail.getAttribute('data-caption');
        
        // Check if this is a PDF
        if (newSrc.toLowerCase().endsWith('.pdf')) {
            openPdfViewer(newSrc, newCaption.split(' - ')[0]);
            return; // Don't proceed with image update
        }
        
        // For regular images
        // Fade out current image
        mainImage.style.opacity = '0';
        
        // After fade out, update image and caption, then fade in
        setTimeout(() => {
            mainImage.src = newSrc;
            mainCaption.textContent = newCaption;
            mainImage.style.opacity = '1';
        }, 200);
        
        // Update active thumbnail
        thumbnails.forEach(t => t.classList.remove('active'));
        thumbnail.classList.add('active');
    }

    // Handle PDF view
    function openPdfViewer(pdfPath, title = 'Window Sticker') {
        if (!pdfPath || !pdfModal) return;
        
        // Ensure the modal is visible
        pdfModal.style.display = 'flex';
        
        // Force reflow to enable the transition
        void pdfModal.offsetWidth;
        
        // Set the title
        const pdfTitle = pdfModal.querySelector('h3');
        if (pdfTitle) pdfTitle.textContent = title;
        
        // Set the PDF source
        if (pdfViewer) {
            // First clear any existing content
            const iframe = pdfViewer;
            iframe.src = '';
            
            // Add a small delay to ensure the modal is visible before loading the PDF
            setTimeout(() => {
                // Create a new iframe to ensure clean state
                const newIframe = document.createElement('iframe');
                newIframe.id = 'pdfViewer';
                newIframe.title = 'PDF Document Viewer';
                newIframe.className = iframe.className;
                newIframe.style.cssText = iframe.style.cssText;
                
                // Set the source with viewer parameters
                newIframe.src = pdfPath + '#toolbar=1&navpanes=1';
                
                // Replace the old iframe with the new one
                iframe.parentNode.replaceChild(newIframe, iframe);
                
                // Update the reference
                window.pdfViewer = newIframe;
                
                // Show the modal
                pdfModal.classList.add('active');
            }, 50);
        }
        
        // Pause the slideshow if it's playing
        if (isPlaying) {
            stopSlideshow();
        }
    }
    
    // Close PDF modal
    function closePdfModal() {
        if (!pdfModal || !pdfViewer) return;
        
        // Remove active class to trigger the fade out
        pdfModal.classList.remove('active');
        
        // After the transition completes, hide the modal and clear the PDF
        setTimeout(() => {
            pdfModal.style.display = 'none';
            
            // Clear the iframe by replacing it with a new one
            const iframe = pdfViewer;
            if (iframe) {
                // Stop any ongoing loading
                iframe.src = 'about:blank';
                
                // Remove all event listeners by cloning and replacing
                const newIframe = iframe.cloneNode(false);
                newIframe.src = '';
                iframe.parentNode.replaceChild(newIframe, iframe);
                
                // Update the reference
                window.pdfViewer = newIframe;
            }
        }, 300); // Match this with the CSS transition time
    }

    // Event listener for closing PDF modal
    closePdfBtn.addEventListener('click', closePdfModal);
    
    // Event listener for window sticker link in footer
    const windowStickerLink = document.getElementById('window-sticker-link');
    if (windowStickerLink) {
        windowStickerLink.addEventListener('click', function(e) {
            e.preventDefault();
            openPdfViewer('images/inside/window.pdf', 'Window Sticker');
        });
    }

    // Close modal when clicking outside the content
    pdfModal.addEventListener('click', (e) => {
        if (e.target === pdfModal) {
            closePdfModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && pdfModal.classList.contains('active')) {
            closePdfModal();
        }
    });

    // Add click event to thumbnails
    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', function() {
            updateMainImage(this);
        });
    });

    // Modal functionality
    const modal = document.getElementById('modal');
    const modalImg = document.getElementById('modal-image');
    
    // Click on main image to open modal
    document.querySelector('.gallery-main').addEventListener('click', function(e) {
        // Don't trigger modal if clicking on the zoom button
        if (e.target.closest('.image-zoom')) return;
        
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);
        modalImg.src = mainImage.src;
        document.body.style.overflow = 'hidden';
    });
    
    // Close modal
    document.querySelector('.close').addEventListener('click', function() {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
        document.body.style.overflow = 'auto';
    });
    
    // Close modal when clicking outside the image
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
            document.body.style.overflow = 'auto';
        }
    });
    
    // Form submission
    const form = document.getElementById('inquiry-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(form);
            const formObject = {};
            formData.forEach((value, key) => {
                formObject[key] = value;
            });
            
            // Here you would typically send the form data to a server
            console.log('Form submitted:', formObject);
            
            // Show success message
            alert('Thank you for your inquiry! We will contact you shortly.');
            form.reset();
        });
    }
    
    // Animate elements on scroll
    const animateOnScroll = () => {
        const elements = document.querySelectorAll('.spec-item, .feature, .gallery-container, .contact-container > div');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.2;
            
            if (elementPosition < screenPosition) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    };
    
    // Set initial state for animation
    document.querySelectorAll('.spec-item, .feature, .gallery-container, .contact-container > div').forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'all 0.6s ease-out';
    });
    
    // Run animation on load and scroll
    window.addEventListener('load', animateOnScroll);
    window.addEventListener('scroll', animateOnScroll);
    
    // Add parallax effect to hero section
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero');
        if (hero) {
            hero.style.backgroundPositionY = -(scrolled * 0.5) + 'px';
        }
    });
    
    // Slideshow functionality
    const slideshowBtn = document.getElementById('slideshow-btn');
    let slideshowInterval = null;
    let isPlaying = false;
    
    // Get all thumbnail containers (parent elements of thumbnail images)
    const allThumbnails = Array.from(document.querySelectorAll('.thumbnail'));
    
    // Initialize slideshow button if it exists
    if (slideshowBtn) {
        // Add event listener to the button
        slideshowBtn.addEventListener('click', function(e) {
            e.preventDefault();
            toggleSlideshow();
        });
        
        // Make sure the button is in the correct initial state
        slideshowBtn.innerHTML = '<i class="fas fa-play"></i> Start Slideshow';
        slideshowBtn.classList.remove('playing');
    }
    
    function toggleSlideshow() {
        if (isPlaying) {
            // Stop the slideshow
            stopSlideshow();
        } else {
            // Start the slideshow
            startSlideshow();
        }
    }
    
    function startSlideshow() {
        if (!slideshowBtn) return;
        
        // Update button state
        slideshowBtn.innerHTML = '<i class="fas fa-pause"></i> Pause Slideshow';
        slideshowBtn.classList.add('playing');
        
        // Show first image immediately if none is active
        if (!document.querySelector('.thumbnail.active')) {
            nextSlide();
        }
        
        // Clear any existing interval
        if (slideshowInterval) {
            clearInterval(slideshowInterval);
        }
        
        // Set interval for slideshow
        slideshowInterval = setInterval(nextSlide, 3000);
        isPlaying = true;
    }
    
    function stopSlideshow() {
        if (!slideshowBtn) return;
        
        // Clear the interval
        clearInterval(slideshowInterval);
        slideshowInterval = null;
        
        // Update button state
        slideshowBtn.innerHTML = '<i class="fas fa-play"></i> Start Slideshow';
        slideshowBtn.classList.remove('playing');
        
        isPlaying = false;
    }
    
    function nextSlide() {
        try {
            // Get all non-PDF thumbnails
            const imageThumbnails = Array.from(thumbnails).filter(thumb => {
                if (!thumb || !thumb.getAttribute) return false;
                const src = (thumb.getAttribute('data-full') || '').toLowerCase();
                return src && !src.endsWith('.pdf');
            });
            
            // Get the PDF thumbnail (if it exists)
            const pdfThumbnail = Array.from(thumbnails).find(thumb => {
                const src = (thumb.getAttribute('data-full') || '').toLowerCase();
                return src.endsWith('.pdf');
            });
            
            // Combine images first, then PDF if it exists
            const allSlides = [...imageThumbnails];
            if (pdfThumbnail) {
                allSlides.push(pdfThumbnail);
            }
            
            if (allSlides.length === 0) {
                console.warn('No valid thumbnails found for slideshow');
                return;
            }
            
            // Get current active thumbnail
            const currentActive = document.querySelector('.thumbnail.active');
            let currentIndex = 0;
            
            if (currentActive && allSlides.includes(currentActive)) {
                currentIndex = allSlides.indexOf(currentActive);
            }
            
            // Calculate next index (loop back to start if at end)
            const nextIndex = (currentIndex + 1) % allSlides.length;
            const nextThumbnail = allSlides[nextIndex];
            
            // Update the main image
            if (nextThumbnail) {
                updateMainImage(nextThumbnail);
            } else {
                console.warn('Failed to find next thumbnail');
            }
        } catch (error) {
            console.error('Error in nextSlide:', error);
            // Try to recover by stopping the slideshow
            if (slideshowInterval) {
                clearInterval(slideshowInterval);
                slideshowInterval = null;
            }
            isPlaying = false;
            if (slideshowBtn) {
                slideshowBtn.innerHTML = '<i class="fas fa-play"></i> Start Slideshow';
                slideshowBtn.classList.remove('playing');
            }
        }
    }
    
    // Add click event to slideshow button
    if (slideshowBtn) {
        slideshowBtn.addEventListener('click', startSlideshow);
    }

    // Contact Form Handling
    const contactForm = document.getElementById('inquiry-form');
    const emailPreviewModal = document.getElementById('email-preview-modal');
    const emailPreview = document.getElementById('email-preview');
    const closeModalBtn = document.querySelector('.close-modal');
    const sendEmailBtn = document.getElementById('send-email');
    const editEmailBtn = document.getElementById('edit-email');
    const emailSender = document.getElementById('email-sender');

    if (contactForm) {
        // Form submission
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(contactForm);
            const formProps = Object.fromEntries(formData);
            
            // Ensure subject has a valid value
            const inquiryType = formProps.subject || 'General Inquiry';
            const subject = `Inquiry about 1997 Porsche 911 Carrera 4S - ${inquiryType}`;
            const body = `Name: ${formProps.name}\n` +
                        `Email: ${formProps.email}\n` +
                        `Phone: ${formProps.phone || 'Not provided'}\n\n` +
                        `Message:\n${formProps.message}`;
            
            // Store email data for sending
            emailSender.dataset.subject = subject;
            emailSender.dataset.body = body;
            
            // Show preview
            showEmailPreview(formProps, subject, body);
        });
    }

    // Show email preview modal
    function showEmailPreview(formData, subject, body) {
        // Format the body with proper line breaks and styling
        const formattedBody = body.split('\n').map(line => {
            if (line.startsWith('Name:') || line.startsWith('Email:') || line.startsWith('Phone:')) {
                const [label, value] = line.split(':');
                return `<p class="email-field"><strong>${label}:</strong> ${value || 'Not provided'}</p>`;
            } else if (line === 'Message:') {
                return `<div class="message-section"><strong>Message:</strong>`;
            } else if (line.trim() === '') {
                return '</div>';
            } else {
                return `<p class="message-text">${line}</p>`;
            }
        }).join('');

        // Ensure all message sections are properly closed
        const closedFormattedBody = formattedBody.endsWith('</div>') ? formattedBody : formattedBody + '</div>';

        emailPreview.innerHTML = `
            <div class="email-preview-container">
                <div class="email-header">
                    <p class="email-to"><strong>To:</strong> phdproton@pm.me</p>
                    <p class="email-subject"><strong>Subject:</strong> ${subject}</p>
                </div>
                <div class="email-body">
                    ${closedFormattedBody}
                </div>
            </div>
        `;
        
        // Show modal with animation
        emailPreviewModal.style.display = 'flex';
        setTimeout(() => {
            emailPreviewModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }, 10);
    }

    // Close modal
    function closeModal() {
        emailPreviewModal.classList.remove('active');
        setTimeout(() => {
            emailPreviewModal.style.display = 'none';
            document.body.style.overflow = '';
        }, 300); // Match this with your CSS transition time
    }

    // Event listeners for modal
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    // Close modal when clicking the overlay (outside content)
    window.addEventListener('click', (e) => {
        if (e.target === emailPreviewModal) {
            closeModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && emailPreviewModal.classList.contains('active')) {
            closeModal();
        }
    });

    // Close modal when clicking outside content
    window.addEventListener('click', (e) => {
        if (e.target === emailPreviewModal) {
            closeModal();
        }
    });

    // Send email
    if (sendEmailBtn) {
        sendEmailBtn.addEventListener('click', function() {
            const subject = emailSender.dataset.subject || '';
            const body = emailSender.dataset.body || '';
            const mailtoLink = `mailto:phdproton@pm.me?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            
            // Update button state
            const buttonText = sendEmailBtn.querySelector('.button-text');
            const originalText = buttonText.textContent;
            buttonText.textContent = 'Sending...';
            sendEmailBtn.disabled = true;
            
            // Open email client
            window.location.href = mailtoLink;
            
            // Reset button after a short delay
            setTimeout(() => {
                buttonText.textContent = 'Email Sent!';
                // Show success message
                emailPreview.innerHTML = `
                    <div class="success-message">
                        <i class="fas fa-check-circle"></i>
                        <h4>Thank you for your inquiry!</h4>
                        <p>We will contact you shortly.</p>
                    </div>
                `;
                
                setTimeout(() => {
                    closeModal();
                    contactForm.reset();
                    buttonText.textContent = originalText;
                    sendEmailBtn.disabled = false;
                }, 3000);
            }, 500);
        });
    }
    
    // Edit email
    if (editEmailBtn) {
        editEmailBtn.addEventListener('click', function() {
            closeModal();
            // Scroll to form
            document.querySelector('#inquiry-form').scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && emailPreviewModal.classList.contains('active')) {
            closeModal();
        }
    });
    
    // Update current slide index when clicking on thumbnails
    thumbnails.forEach((thumb, index) => {
        thumb.addEventListener('click', () => {
            currentSlideIndex = index;
            // If slideshow is playing, restart the interval
            if (isPlaying) {
                clearInterval(slideshowInterval);
                slideshowInterval = setInterval(nextSlide, 3000);
            }
        });
    });
    
    // Pause slideshow when modal is open
    modal.addEventListener('show', () => {
        if (isPlaying) {
            clearInterval(slideshowInterval);
            isPlaying = false;
            slideshowBtn.innerHTML = '<i class="fas fa-play"></i> Start Slideshow';
            slideshowBtn.classList.remove('playing');
        }
    });
    
    // Initialize first image caption
    if (thumbnails.length > 0) {
        const initialCaption = thumbnails[0].getAttribute('data-caption');
        if (mainCaption && initialCaption) {
            mainCaption.textContent = initialCaption;
        }
    }
    
    // Add loading animation for images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.style.transition = 'opacity 0.3s ease';
        if (img.complete) {
            img.style.opacity = '1';
        } else {
            img.style.opacity = '0';
            img.addEventListener('load', function() {
                this.style.opacity = '1';
            });
        }
    });
});

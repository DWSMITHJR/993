// dealers.js - Handles dealer contact information and display

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the dealer contacts section
    initDealerContacts();
    
    // Add event listener for suggest dealer link
    document.getElementById('suggest-dealer')?.addEventListener('click', function(e) {
        e.preventDefault();
        alert('Thank you for your interest! Please contact us directly to suggest a new dealer.');
    });
});

// Store the original dealers list for filtering
let originalDealers = [];

async function initDealerContacts() {
    const container = document.getElementById('dealer-contacts-container');
    if (!container) return;
    
    try {
        // Show loading state
        container.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner"></i>
                <p>Loading dealer contacts...</p>
            </div>
        `;
        
        // Simulate loading for better UX
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Load dealer data
        const response = await fetch('/data/dealers.json');
        if (!response.ok) {
            throw new Error('Failed to load dealer data');
        }
        const data = await response.json();
        
        // Sort dealers by most recent contact
        originalDealers = [...data.dealers].sort((a, b) => 
            new Date(b.lastContact) - new Date(a.lastContact)
        );
        
        // Render the dealer contacts
        renderDealerContacts(originalDealers);
        
        // Add search functionality
        setupSearch(originalDealers);
        
    } catch (error) {
        console.error('Error loading dealer data:', error);
        showError('Unable to load dealer contacts at this time. Please try again later.');
    }
}

function showError(message) {
    const container = document.getElementById('dealer-contacts-container');
    if (container) {
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Something went wrong</h3>
                <p>${message}</p>
                <button class="btn btn-secondary" onclick="window.location.reload()">
                    <i class="fas fa-sync-alt"></i> Try Again
                </button>
            </div>
        `;
    }
}

function renderDealerContacts(dealers) {
    const container = document.getElementById('dealer-contacts-container');
    if (!container) return;
    
    // Clear existing content
    container.innerHTML = '';
    
    // Add search bar
    container.innerHTML = `
        <div class="search-container">
            <input type="text" 
                   id="dealer-search" 
                   placeholder="Search by dealer name, location, or specialty..."
                   aria-label="Search dealers">
            <button id="clear-search" class="btn-clear" title="Clear search" aria-label="Clear search">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div id="dealer-list" class="dealer-list"></div>
    `;
    
    const dealerList = document.getElementById('dealer-list');
    
    if (!dealers || dealers.length === 0) {
        dealerList.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No matching dealers found</h3>
                <p>Try adjusting your search or filter criteria</p>
            </div>
        `;
        return;
    }
    
    // Render each dealer
    dealers.forEach(dealer => {
        const dealerElement = createDealerElement(dealer);
        dealerList.appendChild(dealerElement);
    });
    
    // Add clear search functionality
    const clearBtn = document.getElementById('clear-search');
    const searchInput = document.getElementById('dealer-search');
    
    // Focus the search input for better UX
    searchInput.focus();
    
    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchInput.focus();
        renderDealerContacts(originalDealers);
    });
}

function createDealerElement(dealer) {
    const daysAgo = getDaysAgo(dealer.lastContact);
    const lastContactClass = daysAgo <= 7 ? 'recent' : daysAgo <= 30 ? 'somewhat-recent' : 'not-recent';
    
    // Format phone number for display and tel: link
    const formatPhoneNumber = (phone) => {
        if (!phone) return '';
        const cleaned = ('' + phone).replace(/\D/g, '');
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        return match ? `(${match[1]}) ${match[2]}-${match[3]}` : phone;
    };
    
    const dealerElement = document.createElement('div');
    dealerElement.className = 'dealer-card';
    dealerElement.setAttribute('data-dealer-id', dealer.id || dealer.name.toLowerCase().replace(/\s+/g, '-'));
    
    dealerElement.innerHTML = `
        <div class="dealer-header">
            <h3>${dealer.name}</h3>
            <span class="last-contact ${lastContactClass}" 
                  title="Last contact: ${formatDate(dealer.lastContact)}"
                  aria-label="Last contacted ${formatRelativeDate(dealer.lastContact).toLowerCase()}">
                <i class="fas fa-clock"></i> ${formatRelativeDate(dealer.lastContact)}
            </span>
        </div>
        
        <div class="dealer-specialty">
            <i class="fas fa-star"></i> ${dealer.specialty || 'Porsche Specialist'}
        </div>
        
        <div class="dealer-address">
            <i class="fas fa-map-marker-alt"></i>
            <div>
                <div>${dealer.address}</div>
                ${dealer.city ? `<div>${dealer.city}, ${dealer.state} ${dealer.zip}</div>` : ''}
            </div>
        </div>
        
        ${dealer.hours ? `
        <div class="dealer-hours">
            <i class="far fa-clock"></i>
            <div>
                <strong>Hours:</strong> ${dealer.hours}
            </div>
        </div>` : ''}
        
        ${dealer.notes ? `
        <div class="dealer-notes">
            <i class="fas fa-info-circle"></i>
            <div>${dealer.notes}</div>
        </div>` : ''}
        
        <div class="dealer-contact">
            ${dealer.phone ? `
            <a href="tel:${dealer.phone.replace(/\D/g, '')}" 
               class="btn-contact" 
               aria-label="Call ${dealer.name} at ${formatPhoneNumber(dealer.phone)}">
                <i class="fas fa-phone"></i> Call
            </a>` : ''}
            
            ${dealer.email ? `
            <a href="mailto:${dealer.email}" 
               class="btn-contact" 
               aria-label="Email ${dealer.name}">
                <i class="fas fa-envelope"></i> Email
            </a>` : ''}
            
            ${dealer.website ? `
            <a href="${dealer.website.startsWith('http') ? dealer.website : 'https://' + dealer.website}" 
               target="_blank" 
               rel="noopener noreferrer"
               class="btn-contact"
               aria-label="Visit ${dealer.name} website">
                <i class="fas fa-globe"></i> Website
            </a>` : ''}
            
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${dealer.address} ${dealer.city} ${dealer.state} ${dealer.zip}`)}" 
               target="_blank" 
               rel="noopener noreferrer"
               class="btn-contact"
               aria-label="Get directions to ${dealer.name}">
                <i class="fas fa-directions"></i> Directions
            </a>
        </div>
    `;
    
    return dealerElement;
}

function setupSearch(dealers) {
    const searchInput = document.getElementById('dealer-search');
    if (!searchInput) return;
    
    // Add debounce to improve performance
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        
        searchTimeout = setTimeout(() => {
            const searchTerm = e.target.value.trim().toLowerCase();
            
            if (!searchTerm) {
                renderDealerContacts(originalDealers);
                return;
            }
            
            const searchTerms = searchTerm.split(' ').filter(term => term.length > 0);
            
            const filteredDealers = originalDealers.filter(dealer => {
                // Create a searchable string with all dealer data
                const searchableText = [
                    dealer.name,
                    dealer.specialty,
                    dealer.address,
                    dealer.city,
                    dealer.state,
                    dealer.notes || '',
                    dealer.hours || ''
                ].join(' ').toLowerCase();
                
                // Check if all search terms are found in the searchable text
                return searchTerms.every(term => 
                    searchableText.includes(term)
                );
            });
            
            // If no results, show a message with the search term
            if (filteredDealers.length === 0) {
                const dealerList = document.getElementById('dealer-list');
                if (dealerList) {
                    dealerList.innerHTML = `
                        <div class="no-results">
                            <i class="fas fa-search"></i>
                            <h3>No results for "${searchTerm}"</h3>
                            <p>Try a different search term or check back later</p>
                        </div>
                    `;
                }
            } else {
                renderDealerContacts(filteredDealers);
            }
        }, 300); // 300ms debounce
    });
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Focus search on Ctrl/Cmd + K
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
        }
        
        // Clear search on Escape
        if (e.key === 'Escape' && searchInput.value) {
            searchInput.value = '';
            renderDealerContacts(originalDealers);
        }
    });
}

// Helper functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };
        return date.toLocaleDateString(undefined, options);
    } catch (e) {
        console.error('Error formatting date:', e);
        return 'N/A';
    }
}

function formatRelativeDate(dateString) {
    if (!dateString) return 'No contact date';
    
    try {
        const days = getDaysAgo(dateString);
        
        if (isNaN(days)) return 'N/A';
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
        if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`;
        return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? 's' : ''} ago`;
    } catch (e) {
        console.error('Error formatting relative date:', e);
        return 'N/A';
    }
}

function getDaysAgo(dateString) {
    if (!dateString) return Infinity;
    
    try {
        const now = new Date();
        const past = new Date(dateString);
        
        if (isNaN(past.getTime())) return Infinity;
        
        // Set both dates to midnight for accurate day difference
        const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const pastDate = new Date(past.getFullYear(), past.getMonth(), past.getDate());
        
        const diffTime = nowDate - pastDate;
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    } catch (e) {
        console.error('Error calculating days ago:', e);
        return Infinity;
    }
}

// Make functions available globally for debugging
window.dealerUtils = {
    formatDate,
    formatRelativeDate,
    getDaysAgo
};

document.addEventListener('DOMContentLoaded', function() {
    let dealers = [];

    // DOM Elements
    const dealersList = document.getElementById('dealersList');
    const dealerSearch = document.getElementById('dealerSearch');

    // Parse CSV string to array of objects
    function parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) return [];
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"/g, '').replace(/"$/g, ''));
        const result = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = [];
            let inQuotes = false;
            let currentValue = '';
            
            for (let j = 0; j < lines[i].length; j++) {
                const char = lines[i][j];
                const nextChar = lines[i][j + 1] || '';
                
                if (char === '"') {
                    if (nextChar === '"') {
                        currentValue += '"';
                        j++; // Skip next quote
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (char === ',' && !inQuotes) {
                    values.push(currentValue);
                    currentValue = '';
                } else {
                    currentValue += char;
                }
            }
            
            values.push(currentValue);
            
            if (values.length === headers.length) {
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = values[index].replace(/^"/g, '').replace(/"$/g, '');
                });
                result.push(obj);
            }
        }
        
        return result;
    }

    // Load data from CSV file
    async function loadData() {
        try {
            const response = await fetch('data/dealers.dat');
            const csvText = await response.text();
            dealers = parseCSV(csvText);
            renderDealers();
        } catch (error) {
            console.error('Error loading dealer data:', error);
            showToast('Error loading dealer data.', 'error');
        }
    }

    // Render dealers
    function renderDealers(filteredDealers = null) {
        if (!dealersList) return;
        
        const dealersToRender = filteredDealers || dealers;
        
        // Clear existing content
        dealersList.innerHTML = `
            <div class="dealers-grid" id="dealersGrid">
                <!-- Dealer cards will be inserted here -->
            </div>
        `;
        
        const dealersGrid = document.getElementById('dealersGrid');
        if (!dealersGrid) return;
        
        if (dealersToRender.length === 0) {
            dealersList.innerHTML = '<p class="no-results">No dealers found matching your criteria.</p>';
            return;
        }
        
        dealersToRender.forEach(dealer => {
            const dealerCard = document.createElement('div');
            dealerCard.className = 'dealer-card';
            
            // Status info for styling
            const status = (dealer.status || '').toLowerCase().replace(/\s+/g, '-');
            const statusInfo = {
                'active': { label: 'Active', bgColor: '#4caf50', icon: 'fa-check-circle' },
                'inactive': { label: 'Inactive', bgColor: '#9e9e9e', icon: 'fa-pause-circle' },
                'no-response': { label: 'No Response', bgColor: '#f44336', icon: 'fa-times-circle' },
                'follow-up': { label: 'Follow Up', bgColor: '#ff9800', icon: 'fa-exclamation-circle' },
                'pending': { label: 'Pending', bgColor: '#2196f3', icon: 'fa-clock' }
            }[status] || { label: status || 'Inactive', bgColor: '#9e9e9e', icon: 'fa-circle' };
            
            // Format last contact date if it exists
            const lastContact = dealer.lastContact 
                ? new Date(dealer.lastContact).toLocaleDateString() 
                : 'Never';
            
            dealerCard.innerHTML = `
                <div class="dealer-card-inner">
                    <div class="dealer-header" style="--status-color: ${statusInfo.bgColor};">
                        <div class="dealer-name">
                            <i class="fas ${statusInfo.icon}"></i>
                            <div class="dealer-title">
                                <h3>${dealer.name || 'Unnamed Dealer'}</h3>
                                ${dealer.phone ? `<div class="dealer-phone"><i class="fas fa-phone"></i> ${dealer.phone}</div>` : ''}
                            </div>
                            <span class="status-badge" style="background: ${statusInfo.bgColor}">${statusInfo.label}</span>
                        </div>
                        <div class="dealer-actions">
                            <span class="last-contact" title="Last contact: ${lastContact}">
                                <i class="far fa-calendar"></i> ${lastContact}
                            </span>
                        </div>
                    </div>
                    <div class="dealer-details">
                        <div class="dealer-attributes">
                            ${dealer.contactPerson ? `
                                <div class="attribute-line">
                                    <span class="attribute-label">Contact:</span>
                                    <span class="attribute-value">${dealer.contactPerson}</span>
                                </div>
                            ` : ''}
                            ${dealer.email ? `
                                <div class="attribute-line">
                                    <span class="attribute-label">Email:</span>
                                    <a href="mailto:${dealer.email}" class="attribute-value">${dealer.email}</a>
                                </div>
                            ` : ''}
                            ${dealer.website ? `
                                <div class="attribute-line">
                                    <span class="attribute-label">Website:</span>
                                    <a href="${dealer.website.startsWith('http') ? '' : '//'}${dealer.website}" 
                                       target="_blank" rel="noopener noreferrer" class="attribute-value">
                                        ${dealer.website.replace(/^https?:\/\//, '')}
                                    </a>
                                </div>
                            ` : ''}
                            ${dealer.specialty ? `
                                <div class="attribute-line">
                                    <span class="attribute-label">Specialty:</span>
                                    <span class="attribute-value">${dealer.specialty}</span>
                                </div>
                            ` : ''}
                            ${dealer.address ? `
                                <div class="attribute-line">
                                    <span class="attribute-label">Address:</span>
                                    <span class="attribute-value">${dealer.address}</span>
                                </div>
                            ` : ''}
                            ${dealer.notes ? `
                                <div class="attribute-line notes">
                                    <span class="attribute-label">Notes:</span>
                                    <span class="attribute-value">${dealer.notes}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
            
            dealersGrid.appendChild(dealerCard);
        });
    }

    // Show toast notification
    function showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Hide and remove toast after duration
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, duration);
    }

    // Search functionality
    if (dealerSearch) {
        dealerSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filtered = dealers.filter(dealer => 
                (dealer.name && dealer.name.toLowerCase().includes(searchTerm)) ||
                (dealer.contactPerson && dealer.contactPerson.toLowerCase().includes(searchTerm)) ||
                (dealer.email && dealer.email.toLowerCase().includes(searchTerm)) ||
                (dealer.phone && dealer.phone.toLowerCase().includes(searchTerm)) ||
                (dealer.address && dealer.address.toLowerCase().includes(searchTerm)) ||
                (dealer.specialty && dealer.specialty.toLowerCase().includes(searchTerm)) ||
                (dealer.notes && dealer.notes.toLowerCase().includes(searchTerm))
            );
            renderDealers(filtered);
        });
    }

    // Initialize the application
    loadData();
});

// Tab Management
class TabManager {
    constructor() {
        this.tabButtons = document.querySelectorAll('.nav-tab');
        this.tabContents = document.querySelectorAll('.tab-content');
        this.init();
    }

    init() {
        // Add click handlers to all tab buttons
        this.tabButtons.forEach(button => {
            button.addEventListener('click', () => this.showTab(button.dataset.tab));
        });

        // Show the last active tab or default to the first tab
        const lastActiveTab = localStorage.getItem('lastActiveTab') || 'details';
        this.showTab(lastActiveTab);
    }

    showTab(tabId) {
        // Hide all tab contents and remove active class from all buttons
        this.tabContents.forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show the selected tab and mark its button as active
        const activeTab = document.getElementById(tabId);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        // Update button states
        this.tabButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.tab === tabId);
        });
        
        // Save the active tab
        localStorage.setItem('lastActiveTab', tabId);
    }
}

// Dealers Admin Management
class DealersAdmin {
    constructor() {
        this.dealers = [];
        this.dealersFile = '/data/dealers.json';
        this.activities = [];
        this.activitiesEndpoint = '/api/activities';
        this.tabManager = new TabManager();
        this.initialize();
    }
    
    // Helper method to escape HTML to prevent XSS
    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    async initialize() {
        await this.loadDealers();
        this.setupEventListeners();
        this.renderDealers();
        this.updateDealerSelect();
        await this.loadActivities();
        this.renderActivities();
        
        // Listen for dealer updates to refresh the select
        document.addEventListener('dealerUpdated', () => this.updateDealerSelect());
    }

    async loadDealers() {
        try {
            const response = await fetch(this.dealersFile, {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            if (!response.ok) throw new Error(`Failed to load dealers: ${response.status} ${response.statusText}`);
            
            const data = await response.json();
            this.dealers = Array.isArray(data) ? data : (data.dealers || []);
            
            if (!this.dealers || !Array.isArray(this.dealers)) {
                throw new Error('Invalid dealers data format');
            }
            
            console.log(`Loaded ${this.dealers.length} dealers`);
            
            // Ensure all dealers have required fields with proper defaults
            this.dealers = this.dealers.map((dealer, index) => ({
                id: dealer.id || Date.now() + Math.floor(Math.random() * 1000),
                name: dealer.name || 'Unnamed Dealer',
                address: dealer.address || '',
                phone: dealer.phone || '',
                email: dealer.email || '',
                website: dealer.website || '',
                contactPerson: dealer.contactPerson || '',
                lastContact: dealer.lastContact || null,
                status: dealer.status || 'Not Contacted',
                notes: dealer.notes || '',
                createdAt: dealer.createdAt || new Date().toISOString(),
                updatedAt: dealer.updatedAt || new Date().toISOString()
            }));
            
            return true;
        } catch (error) {
            console.error('Error loading dealers:', error);
            this.showToast('Failed to load dealers. Using local data.', 'error');
            return false;
        }
    }

    async saveDealers() {
        try {
            const response = await fetch(this.dealersFile, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                body: JSON.stringify({ dealers: this.dealers })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to save dealers: ${response.status} ${response.statusText}`);
            }
            
            return true;
        } catch (error) {
            console.error('Error saving dealers:', error);
            return false;
        }
    }

    async saveToServer(data) {
        try {
            const response = await fetch(this.dealersFile, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`Failed to save to server: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error saving to server:', error);
            throw error;
        }
    }

    async addDealer(dealerData) {
        try {
            const newDealer = {
                id: Date.now(),
                name: dealerData.name || 'New Dealer',
                address: dealerData.address || '',
                phone: dealerData.phone || '',
                email: dealerData.email || '',
                website: dealerData.website || '',
                contactPerson: dealerData.contactPerson || '',
                lastContact: dealerData.lastContact || null,
                status: dealerData.status || 'Not Contacted',
                notes: dealerData.notes || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            this.dealers.push(newDealer);
            const saved = await this.saveDealers();
            
            if (saved) {
                this.renderDealers();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error adding dealer:', error);
            return false;
        }
    }

    async updateDealer(id, updates) {
        try {
            const index = this.dealers.findIndex(d => d.id === id);
            if (index === -1) return false;
            
            this.dealers[index] = {
                ...this.dealers[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            
            const saved = await this.saveDealers();
            if (saved) {
                this.renderDealers();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating dealer:', error);
            return false;
        }
    }

    // Update the dealer select dropdown in the activity form
    updateDealerSelect() {
        const dealerSelect = document.getElementById('dealerSelect');
        if (!dealerSelect) return;
        
        // Store the current selection
        const currentValue = dealerSelect.value;
        
        // Clear existing options except the first one
        while (dealerSelect.options.length > 1) {
            dealerSelect.remove(1);
        }
        
        // Add dealer options
        this.dealers.forEach(dealer => {
            const option = document.createElement('option');
            option.value = dealer.id;
            option.textContent = dealer.name;
            dealerSelect.appendChild(option);
        });
        
        // Restore the selection if it still exists
        if (currentValue && this.dealers.some(d => d.id.toString() === currentValue)) {
            dealerSelect.value = currentValue;
        }
    }

    setupEventListeners() {
        // Add new dealer button
        const addDealerBtn = document.getElementById('addDealerBtn');
        if (addDealerBtn) {
            addDealerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showAddDealerForm();
            });
        }
        
        // Delegate all button clicks in the dealers container
        const dealersContainer = document.getElementById('dealersContainer');
        if (dealersContainer) {
            dealersContainer.addEventListener('click', (e) => {
                // Handle edit button clicks
                const editBtn = e.target.closest('.btn-edit, .edit-dealer');
                if (editBtn) {
                    e.preventDefault();
                    e.stopPropagation();
                    const card = editBtn.closest('.dealer-card, .dealer-item');
                    if (card) {
                        const dealerId = parseInt(card.dataset.id || editBtn.dataset.dealerId);
                        if (dealerId) {
                            this.editDealerForm(dealerId, e);
                        }
                    }
                }
                
                // Handle delete button clicks
                const deleteBtn = e.target.closest('.btn-delete, .delete-dealer');
                if (deleteBtn) {
                    e.preventDefault();
                    e.stopPropagation();
                    const card = deleteBtn.closest('.dealer-card, .dealer-item');
                    if (card) {
                        const dealerId = parseInt(card.dataset.id || deleteBtn.dataset.dealerId);
                        if (dealerId && confirm('Are you sure you want to delete this dealer?')) {
                            this.deleteDealer(dealerId);
                        }
                    }
                }
            });
        }

        // Search functionality
        const searchInput = document.getElementById('dealerSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                this.filterDealers(searchTerm);
            });
        }
    }

    showAddDealerForm() {
        // Close any existing modals
        document.querySelectorAll('.modal').forEach(modal => modal.remove());
        
        // Create modal container
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 1000;';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.cssText = 'background: #222; padding: 25px; border-radius: 8px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative;';
        
        // Add form content
        modalContent.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2 style="margin: 0; color: #ffcc00;">Add New Dealer</h2>
                <span class="close-btn" style="cursor: pointer; font-size: 1.8rem; color: #aaa;" 
                      onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <form id="addDealerForm" style="display: grid; gap: 15px;">
                <div style="display: grid; gap: 5px;">
                    <label style="font-weight: 500;">Dealer Name:</label>
                    <input type="text" name="name" required 
                           style="padding: 8px; border: 1px solid #444; border-radius: 4px; background: #333; color: #fff;">
                </div>
                
                <div style="display: grid; gap: 5px;">
                    <label style="font-weight: 500;">Address:</label>
                    <textarea name="address" rows="2" 
                              style="padding: 8px; border: 1px solid #444; border-radius: 4px; background: #333; color: #fff; resize: vertical;"></textarea>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div style="display: grid; gap: 5px;">
                        <label style="font-weight: 500;">Phone:</label>
                        <input type="tel" name="phone" 
                               style="padding: 8px; border: 1px solid #444; border-radius: 4px; background: #333; color: #fff;">
                    </div>
                    
                    <div style="display: grid; gap: 5px;">
                        <label style="font-weight: 500;">Email:</label>
                        <input type="email" name="email" 
                               style="padding: 8px; border: 1px solid #444; border-radius: 4px; background: #333; color: #fff;">
                    </div>
                </div>
                
                <div style="display: grid; gap: 5px;">
                    <label style="font-weight: 500;">Website:</label>
                    <input type="url" name="website" 
                           style="padding: 8px; border: 1px solid #444; border-radius: 4px; background: #333; color: #fff;">
                </div>
                
                <div style="display: grid; gap: 5px;">
                    <label style="font-weight: 500;">Contact Person:</label>
                    <input type="text" name="contactPerson" 
                           style="padding: 8px; border: 1px solid #444; border-radius: 4px; background: #333; color: #fff;">
                </div>
                
                <div style="display: grid; gap: 5px;">
                    <label style="font-weight: 500;">Last Contact Date:</label>
                    <input type="date" name="lastContact" 
                           style="padding: 8px; border: 1px solid #444; border-radius: 4px; background: #333; color: #fff;">
                </div>
                
                <div style="display: grid; gap: 5px;">
                    <label style="font-weight: 500;">Status:</label>
                    <select name="status" style="padding: 8px; border: 1px solid #444; border-radius: 4px; background: #333; color: #fff;">
                        <option value="Not Contacted">Not Contacted</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Follow Up">Follow Up</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="Declined">Declined</option>
                        <option value="Sold">Sold</option>
                    </select>
                </div>
                
                <div style="display: grid; gap: 5px;">
                    <label style="font-weight: 500;">Notes:</label>
                    <textarea name="notes" rows="3" 
                              style="padding: 8px; border: 1px solid #444; border-radius: 4px; background: #333; color: #fff; resize: vertical;"></textarea>
                </div>
                
                <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 1rem;">
                    <button type="button" class="btn btn-secondary" 
                            onclick="this.closest('.modal').remove()"
                            style="padding: 8px 16px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Cancel
                    </button>
                    <button type="submit" class="btn btn-primary" 
                            style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                        Save Dealer
                    </button>
                </div>
            </form>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Handle form submission
        const form = modal.querySelector('#addDealerForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(form);
                const dealerData = Object.fromEntries(formData.entries());
                
                // Convert empty strings to null for optional fields
                Object.keys(dealerData).forEach(key => {
                    if (dealerData[key] === '') dealerData[key] = null;
                });
                
                // Add the new dealer
                const success = await this.addDealer(dealerData);
                if (success) {
                    this.showToast('Dealer added successfully', 'success');
                    modal.remove();
                    
                    // Update the dealer select dropdown if it exists
                    this.updateDealerSelect();
                } else {
                    this.showToast('Failed to add dealer', 'error');
                }
            });
        }
    }

    filterDealers(searchTerm) {
        if (!searchTerm) {
            this.renderDealers();
            return;
        }
        
        const filtered = this.dealers.filter(dealer => {
            const searchStr = `${dealer.name} ${dealer.address} ${dealer.contactPerson} ${dealer.phone} ${dealer.email} ${dealer.status} ${dealer.notes}`.toLowerCase();
            return searchStr.includes(searchTerm.toLowerCase());
        });
        
        this.renderDealers(filtered);
    }

    renderDealers(dealersToRender = null) {
        const dealers = dealersToRender || this.dealers;
        const container = document.getElementById('dealersContainer');
        if (!container) return;
        
        if (!dealers || dealers.length === 0) {
            container.innerHTML = '<div class="no-dealers">No dealers found. Click "Add Dealer" to get started.</div>';
            return;
        }
        
        container.innerHTML = dealers.map(dealer => `
            <div class="dealer-card" data-id="${dealer.id}">
                <div class="dealer-header">
                    <h3>${this.escapeHtml(dealer.name)}</h3>
                    <div class="dealer-actions">
                        <button class="btn-edit" data-dealer-id="${dealer.id}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" data-dealer-id="${dealer.id}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="dealer-details">
                    ${dealer.contactPerson ? `<div><i class="fas fa-user"></i> ${this.escapeHtml(dealer.contactPerson)}</div>` : ''}
                    ${dealer.phone ? `<div><i class="fas fa-phone"></i> ${this.escapeHtml(dealer.phone)}</div>` : ''}
                    ${dealer.email ? `<div><i class="fas fa-envelope"></i> ${this.escapeHtml(dealer.email)}</div>` : ''}
                    ${dealer.website ? `<div><i class="fas fa-globe"></i> <a href="${this.escapeHtml(dealer.website.startsWith('http') ? dealer.website : 'https://' + dealer.website)}" target="_blank" rel="noopener noreferrer">${this.escapeHtml(dealer.website)}</a></div>` : ''}
                    ${dealer.address ? `<div><i class="fas fa-map-marker-alt"></i> ${this.escapeHtml(dealer.address).replace(/\n/g, '<br>')}</div>` : ''}
                    <div class="dealer-status status-${(dealer.status || 'not-contacted').toLowerCase().replace(/\s+/g, '-')}">
                        <i class="fas fa-circle"></i> ${dealer.status || 'Not Contacted'}
                    </div>
                    ${dealer.lastContact ? `<div class="last-contact">
                        <i class="far fa-calendar"></i> Last contact: ${this.formatDate(dealer.lastContact)}
                    </div>` : ''}
                </div>
                ${dealer.notes ? `<div class="dealer-notes">
                    <h4>Notes:</h4>
                    <p>${this.escapeHtml(dealer.notes).replace(/\n/g, '<br>')}</p>
                </div>` : ''}
            </div>
        `).join('');
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getStatusClass(status) {
        if (!status) return '';
        return `status-${status.toLowerCase().replace(/\s+/g, '-')}`;
    }

    // Activity Logging
    async loadActivities() {
        try {
            const response = await fetch(this.activitiesEndpoint);
            if (response.ok) {
                const data = await response.json();
                this.activities = Array.isArray(data) ? data : [];
            } else {
                throw new Error(`Failed to load activities: ${response.status}`);
            }
        } catch (error) {
            console.error('Error loading activities:', error);
            // Fallback to localStorage if available
            const savedActivities = localStorage.getItem('dealerActivities');
            if (savedActivities) {
                try {
                    this.activities = JSON.parse(savedActivities);
                } catch (e) {
                    console.error('Error parsing saved activities:', e);
                    this.activities = [];
                }
            }
        }
    }

    saveActivitiesLocal() {
        localStorage.setItem('dealerActivities', JSON.stringify(this.activities));
    }

    renderActivities() {
        const container = document.getElementById('activityLog');
        if (!container) return;
        
        if (!this.activities || this.activities.length === 0) {
            container.innerHTML = '<div class="empty-state">No activities yet. Add one using the form below.</div>';
            return;
        }
        
        const typeLabel = (type) => {
            const types = {
                'call': 'Phone Call',
                'email': 'Email',
                'meeting': 'Meeting',
                'test_drive': 'Test Drive',
                'follow_up': 'Follow Up',
                'other': 'Other'
            };
            return types[type] || type;
        };
        
        container.innerHTML = this.activities.slice(0, 50).map(a => `
            <div class="activity-item" data-id="${a.id}">
                <div class="activity-header">
                    <div class="activity-dealer">${this.escapeHtml(a.dealerName || 'Unknown Dealer')}</div>
                    <div class="activity-date">${this.formatDate(a.date || a.createdAt)}</div>
                </div>
                <div>
                    <span class="activity-type">${typeLabel(a.type)}</span>
                    ${a.statusUpdate ? `<span class="activity-status status-${(a.statusUpdate || '').toString().toLowerCase().replace(/\s+/g,'-')}"><i class="fas fa-info-circle"></i> ${a.statusUpdate}</span>` : ''}
                </div>
                <div class="activity-notes">${this.escapeHtml(a.notes)}</div>
                ${a.followUpDate ? `<div class="activity-followup"><i class="far fa-calendar-check"></i> Follow up on ${this.formatDate(a.followUpDate)}</div>` : ''}
            </div>
        `).join('');
    }

    async handleAddActivity(event) {
        event.preventDefault();
        
        const form = event.target.closest('form');
        if (!form) return;
        
        const formData = new FormData(form);
        const dealerId = formData.get('dealerId');
        const date = formData.get('date');
        const type = formData.get('type');
        const notes = formData.get('notes');
        const followUpDate = formData.get('followUpDate');
        
        // Validation
        const errors = [];
        if (!dealerId) errors.push('Please select a dealer.');
        if (!date) errors.push('Please select a date.');
        if (!type) errors.push('Please select an activity type.');
        if (!notes) errors.push('Please enter notes.');
        
        if (errors.length) {
            this.showToast(errors[0], 'error');
            return;
        }
        
        const payload = {
            dealerId,
            date,
            type,
            notes,
            followUpDate: followUpDate || null,
            statusUpdate: null
        };
        
        try {
            const res = await fetch(this.activitiesEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Failed to save activity');
            const { activity } = await res.json();
            this.activities.unshift(activity || payload);
            this.saveActivitiesLocal();
            this.renderActivities();
            this.showToast('Activity saved', 'success');
            
            // Reset form
            form.reset();
        } catch (e) {
            console.error(e);
            // Fallback to local save
            this.activities.unshift({ ...payload, id: Date.now(), createdAt: new Date().toISOString() });
            this.saveActivitiesLocal();
            this.renderActivities();
            this.showToast('Saved locally (server offline).', 'warning');
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        const container = document.getElementById('toast-container') || document.body;
        container.appendChild(toast);
        
        // Show toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Auto-remove after delay
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 5000);
    }
}

// Initialize the dealers admin when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dealersAdmin = new DealersAdmin();
    
    // Wire global handler for inline onsubmit="addActivity(event)"
    window.addActivity = (e) => {
        e.preventDefault();
        if (window.dealersAdmin) {
            window.dealersAdmin.handleAddActivity(e);
        }
    };
    
    // Set default date to today if field exists
    const dateInput = document.getElementById('activityDate');
    if (dateInput && !dateInput.value) {
        const today = new Date();
        dateInput.value = today.toISOString().split('T')[0];
    }
});

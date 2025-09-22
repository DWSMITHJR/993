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
        this.dealersFile = '/data/dealers.json'; // Changed to absolute path for server
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
        this.updateDealerSelect(); // Initialize the dealer select dropdown
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
                    'Pragma': 'no-cache',
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                throw new Error(`Failed to load dealers: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Handle both direct array and {dealers: [...]} formats
            const dealersData = Array.isArray(data) ? data : (data.dealers || []);
            
            if (!dealersData || !Array.isArray(dealersData)) {
                throw new Error('Invalid dealers data format: expected an array or object with dealers array');
            }
            
            console.log(`Loaded ${dealersData.length} dealers from JSON`);
            
            // Process and validate dealers
            this.dealers = dealersData.map((dealer, index) => ({
                id: dealer.id || `dealer-${Date.now()}-${index}`,
                name: dealer.name || 'Unnamed Dealer',
                address: dealer.address || '',
                phone: dealer.phone || '',
                email: dealer.email || '',
                website: dealer.website || '',
                contactPerson: dealer.contactPerson || '',
                lastContact: dealer.lastContact || '',
                status: dealer.status || 'Not Contacted',
                notes: dealer.notes || '',
                specialty: dealer.specialty || 'Luxury & Exotic Vehicles',
                ...dealer // Preserve any additional fields
            }));
            
            console.log('Loaded dealers:', this.dealers.length);
            
            // Save back to ensure consistent structure
            await this.saveDealers();
            
            return this.dealers;
        } catch (error) {
            console.error('Error loading dealers:', error);
            // Fallback to localStorage if available
            try {
                const localDealers = localStorage.getItem('dealerData');
                if (localDealers) {
                    this.dealers = JSON.parse(localDealers);
                    console.log('Loaded dealers from localStorage:', this.dealers.length);
                    return this.dealers;
                }
            } catch (e) {
                console.error('Error loading from localStorage:', e);
            }
            
            // Initialize with empty array if all else fails
            this.dealers = [];
            return [];
        }
    }

    async saveDealers() {
        if (!Array.isArray(this.dealers)) {
            console.error('Invalid dealers data:', this.dealers);
            return false;
        }

        const data = {
            lastUpdated: new Date().toISOString().split('T')[0],
            dealers: this.dealers
        };

        try {
            // Save to localStorage as fallback
            localStorage.setItem('dealerData', JSON.stringify(this.dealers));
            
            // Save to file via server endpoint if available
            try {
                await this.saveToServer(data);
                console.log('Dealers saved to server successfully');
            } catch (serverError) {
                console.warn('Could not save to server, using localStorage only:', serverError);
                // Continue with local storage as fallback
            }
            
            console.log('Dealers saved successfully');
            showToast('Dealers saved successfully', 'success');
            return true;
        } catch (error) {
            console.error('Error saving dealers:', error);
            showToast('Error saving dealers', 'error');
            return false;
        }
    }

    async saveToServer(data) {
        const response = await fetch('/api/save-dealers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            throw new Error('Failed to save to server');
        }
    }

    addDealer(dealerData) {
        const newDealer = {
            id: Date.now(), // Simple ID generation
            ...dealerData,
            lastContact: dealerData.lastContact || null,
            status: dealerData.status || 'Not Contacted',
            notes: dealerData.notes || '',
            contactPerson: dealerData.contactPerson || ''
        };

        this.dealers.push(newDealer);
        this.saveDealers();
        this.renderDealers();
        return newDealer;
    }

    async updateDealer(id, updates) {
        try {
            const index = this.dealers.findIndex(d => d.id === id);
            if (index === -1) return false;

            // Preserve any existing data not being updated
            this.dealers[index] = { 
                ...this.dealers[index], 
                ...updates,
                // Ensure we don't override these with null if they exist
                id: this.dealers[index].id,
                name: updates.name || this.dealers[index].name,
                // Add any other critical fields that should never be null
            };

            await this.saveDealers();
            this.renderDealers();
            
            // Dispatch event that dealer was updated
            const event = new CustomEvent('dealerUpdated', { detail: { id } });
            document.dispatchEvent(event);
            
            return true;
        } catch (error) {
            console.error('Error updating dealer:', error);
            return false;
        }
    }

    editDealerForm(dealerId, event = null) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        const dealer = this.dealers.find(d => d.id === dealerId);
        if (!dealer) return;

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 1000;';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.cssText = 'background: #222; padding: 25px; border-radius: 8px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative;';

        // Close button
        const closeBtn = document.createElement('span');
        closeBtn.className = 'close-btn';
        closeBtn.textContent = '×';
        closeBtn.style.cssText = 'position: absolute; top: 10px; right: 15px; font-size: 24px; cursor: pointer;';
        closeBtn.onclick = () => modal.remove();
        
        // Form
        const form = document.createElement('form');
        form.id = 'editDealerForm';
        form.style.cssText = 'display: grid; gap: 15px;';
        
        // Hidden ID field
        const idInput = document.createElement('input');
        idInput.type = 'hidden';
        idInput.name = 'id';
        idInput.value = dealer.id;
        
        // Name field
        const nameGroup = document.createElement('div');
        nameGroup.className = 'form-group';
        nameGroup.style.cssText = 'display: grid; gap: 5px;';
        
        const nameLabel = document.createElement('label');
        nameLabel.style.fontWeight = '500';
        nameLabel.textContent = 'Name:';
        
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.name = 'name';
        nameInput.value = dealer.name || '';
        nameInput.required = true;
        nameInput.style.cssText = 'padding: 8px; border: 1px solid #444; border-radius: 4px; background: #333; color: #fff;';
        
        nameGroup.appendChild(nameLabel);
        nameGroup.appendChild(nameInput);
        
        // Address field
        const addressGroup = document.createElement('div');
        addressGroup.className = 'form-group';
        addressGroup.style.cssText = 'display: grid; gap: 5px;';
        
        const addressLabel = document.createElement('label');
        addressLabel.style.fontWeight = '500';
        addressLabel.textContent = 'Address:';
        
        const addressInput = document.createElement('textarea');
        addressInput.name = 'address';
        addressInput.value = dealer.address || '';
        addressInput.rows = 2;
        addressInput.style.cssText = 'padding: 8px; border: 1px solid #444; border-radius: 4px; background: #333; color: #fff; resize: vertical;';
        
        addressGroup.appendChild(addressLabel);
        addressGroup.appendChild(addressInput);
        
        // Phone field
        const phoneGroup = document.createElement('div');
        phoneGroup.className = 'form-group';
        phoneGroup.style.cssText = 'display: grid; gap: 5px;';
        
        const phoneLabel = document.createElement('label');
        phoneLabel.style.fontWeight = '500';
        phoneLabel.textContent = 'Phone:';
        
        const phoneInput = document.createElement('input');
        phoneInput.type = 'tel';
        phoneInput.name = 'phone';
        phoneInput.value = dealer.phone || '';
        phoneInput.style.cssText = 'padding: 8px; border: 1px solid #444; border-radius: 4px; background: #333; color: #fff;';
        
        phoneGroup.appendChild(phoneLabel);
        phoneGroup.appendChild(phoneInput);
        
        // Email field
        const emailGroup = document.createElement('div');
        emailGroup.className = 'form-group';
        emailGroup.style.cssText = 'display: grid; gap: 5px;';
        
        const emailLabel = document.createElement('label');
        emailLabel.style.fontWeight = '500';
        emailLabel.textContent = 'Email:';
        
        const emailInput = document.createElement('input');
        emailInput.type = 'email';
        emailInput.name = 'email';
        emailInput.value = dealer.email || '';
        emailInput.style.cssText = 'padding: 8px; border: 1px solid #444; border-radius: 4px; background: #333; color: #fff;';
        
        emailGroup.appendChild(emailLabel);
        emailGroup.appendChild(emailInput);
        
        // Website field
        const websiteGroup = document.createElement('div');
        websiteGroup.className = 'form-group';
        websiteGroup.style.cssText = 'display: grid; gap: 5px;';
        
        const websiteLabel = document.createElement('label');
        websiteLabel.style.fontWeight = '500';
        websiteLabel.textContent = 'Website:';
        
        const websiteInput = document.createElement('input');
        websiteInput.type = 'url';
        websiteInput.name = 'website';
        websiteInput.value = dealer.website || '';
        websiteInput.style.cssText = 'padding: 8px; border: 1px solid #444; border-radius: 4px; background: #333; color: #fff;';
        
        websiteGroup.appendChild(websiteLabel);
        websiteGroup.appendChild(websiteInput);
        
        // Status field
        const statusGroup = document.createElement('div');
        statusGroup.className = 'form-group';
        statusGroup.style.cssText = 'display: grid; gap: 5px;';
        
        const statusLabel = document.createElement('label');
        statusLabel.style.fontWeight = '500';
        statusLabel.textContent = 'Status:';
        
        const statusSelect = document.createElement('select');
        statusSelect.name = 'status';
        statusSelect.style.cssText = 'padding: 8px; border: 1px solid #444; border-radius: 4px; background: #333; color: #fff;';
        
        const statusOptions = [
            { value: 'Not Contacted', label: 'Not Contacted' },
            { value: 'Contacted', label: 'Contacted' },
            { value: 'Follow Up', label: 'Follow Up' },
            { value: 'Scheduled', label: 'Scheduled' },
            { value: 'Declined', label: 'Declined' },
            { value: 'Sold', label: 'Sold' }
        ];
        
        statusOptions.forEach(option => {
            const optionEl = document.createElement('option');
            optionEl.value = option.value;
            optionEl.textContent = option.label;
            if (dealer.status === option.value) {
                optionEl.selected = true;
            }
            statusSelect.appendChild(optionEl);
        });
        
        statusGroup.appendChild(statusLabel);
        statusGroup.appendChild(statusSelect);
        
        // Last Contact field
        const lastContactGroup = document.createElement('div');
        lastContactGroup.className = 'form-group';
        lastContactGroup.style.cssText = 'display: grid; gap: 5px;';
        
        const lastContactLabel = document.createElement('label');
        lastContactLabel.style.fontWeight = '500';
        lastContactLabel.textContent = 'Last Contact:';
        
        const lastContactInput = document.createElement('input');
        lastContactInput.type = 'date';
        lastContactInput.name = 'lastContact';
        lastContactInput.value = dealer.lastContact || '';
        lastContactInput.style.cssText = 'padding: 8px; border: 1px solid #444; border-radius: 4px; background: #333; color: #fff;';
        
        lastContactGroup.appendChild(lastContactLabel);
        lastContactGroup.appendChild(lastContactInput);
        
        // Notes field
        const notesGroup = document.createElement('div');
        notesGroup.className = 'form-group';
        notesGroup.style.cssText = 'display: grid; gap: 5px;';
        
        const notesLabel = document.createElement('label');
        notesLabel.style.fontWeight = '500';
        notesLabel.textContent = 'Notes:';
        
        const notesInput = document.createElement('textarea');
        notesInput.name = 'notes';
        notesInput.rows = 4;
        notesInput.value = dealer.notes || '';
        notesInput.style.cssText = 'padding: 8px; border: 1px solid #444; border-radius: 4px; background: #333; color: #fff; resize: vertical;';
        
        notesGroup.appendChild(notesLabel);
        notesGroup.appendChild(notesInput);
        
        // Submit button
        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.textContent = 'Save Changes';
        submitBtn.style.cssText = 'padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;';
        
        // Assemble the form
        form.appendChild(idInput);
        form.appendChild(nameGroup);
        form.appendChild(addressGroup);
        form.appendChild(phoneGroup);
        form.appendChild(emailGroup);
        form.appendChild(websiteGroup);
        form.appendChild(statusGroup);
        form.appendChild(lastContactGroup);
        form.appendChild(notesGroup);
        form.appendChild(submitBtn);
        
        // Handle form submission
        const handleFormSubmit = async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const updates = Object.fromEntries(formData.entries());
            
            // Convert empty strings to null for optional fields
            Object.keys(updates).forEach(key => {
                if (updates[key] === '') updates[key] = null;
            });
            
            // If lastContact is updated, update the status to 'Contacted' if not already set
            if (updates.lastContact && (!updates.status || updates.status === 'Not Contacted')) {
                updates.status = 'Contacted';
            }
            
            const success = await this.updateDealer(parseInt(updates.id), updates);
            if (success) {
                this.showToast('Dealer updated successfully', 'success');
                modal.remove();
                
                // Update the dealer select dropdown if it exists
                this.updateDealerSelect();
            } else {
                this.showToast('Failed to update dealer', 'error');
            }
        };
        
        form.addEventListener('submit', handleFormSubmit);
        
        // Add close on escape key
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleKeyDown);
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        
        // Add to DOM
        modalContent.appendChild(closeBtn);
        const h2 = document.createElement('h2');
        h2.textContent = `Edit Dealer: ${dealer.name}`;
        modalContent.appendChild(h2);
        modalContent.appendChild(form);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Focus the first input field
        const firstInput = modal.querySelector('input, select, textarea');
        if (firstInput) firstInput.focus();
        
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

        // Handle edit button clicks using event delegation
        document.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.btn-edit');
            if (editBtn) {
                e.preventDefault();
                e.stopPropagation();
                const card = editBtn.closest('.dealer-card');
                if (card) {
                    const dealerId = parseInt(card.dataset?.id);
                    if (dealerId) {
                        this.editDealerForm(dealerId, e);
                    }
                }
            }
        });

        // Handle card clicks for editing (except when clicking on buttons or links)
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.dealer-card');
            const clickedElement = e.target;
            
            if (card && 
                !clickedElement.closest('.btn-edit') && 
                !clickedElement.closest('a') &&
                !clickedElement.closest('button')) {
                e.preventDefault();
                e.stopPropagation();
                const dealerId = parseInt(card.dataset.id);
                if (dealerId) {
                    this.editDealerForm(dealerId, e);
                }
            }
        });
    }

    showAddDealerForm() {
        // Close any existing modals
        document.querySelectorAll('.modal').forEach(modal => modal.remove());
        
        // Create modal container
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.7);
            z-index: 1000;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            box-sizing: border-box;
        `;
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: #2a2a2a;
            padding: 2rem;
            border-radius: 8px;
            max-width: 600px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            color: #fff;
        `;
        
        // Set the modal content HTML
        modalContent.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2 style="margin: 0; color: #ffcc00;">Add New Dealer</h2>
                <span class="close-btn" style="cursor: pointer; font-size: 1.8rem; color: #aaa;" 
                      onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <form id="addDealerForm" style="display: grid; gap: 1.2rem;">
                <div class="form-group" style="display: grid; gap: 0.5rem;">
                    <label style="font-weight: 500; color: #ddd;">Name:</label>
                    <input type="text" name="name" required 
                           style="padding: 0.7rem; border: 1px solid #444; border-radius: 4px; 
                                  background: #333; color: #fff; width: 100%;">
                </div>
                
                <div class="form-group" style="display: grid; gap: 0.5rem;">
                    <label style="font-weight: 500; color: #ddd;">Address:</label>
                    <input type="text" name="address"
                           style="padding: 0.7rem; border: 1px solid #444; border-radius: 4px; 
                                  background: #333; color: #fff; width: 100%;">
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="form-group" style="display: grid; gap: 0.5rem;">
                        <label style="font-weight: 500; color: #ddd;">Phone:</label>
                        <input type="tel" name="phone"
                               style="padding: 0.7rem; border: 1px solid #444; border-radius: 4px; 
                                      background: #333; color: #fff; width: 100%;">
                    </div>
                    
                    <div class="form-group" style="display: grid; gap: 0.5rem;">
                        <label style="font-weight: 500; color: #ddd;">Email:</label>
                        <input type="email" name="email"
                               style="padding: 0.7rem; border: 1px solid #444; border-radius: 4px; 
                                      background: #333; color: #fff; width: 100%;">
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="form-group" style="display: grid; gap: 0.5rem;">
                        <label style="font-weight: 500; color: #ddd;">Website:</label>
                        <input type="url" name="website"
                               style="padding: 0.7rem; border: 1px solid #444; border-radius: 4px; 
                                      background: #333; color: #fff; width: 100%;">
                    </div>
                    
                    <div class="form-group" style="display: grid; gap: 0.5rem;">
                        <label style="font-weight: 500; color: #ddd;">Contact Person:</label>
                        <input type="text" name="contactPerson"
                               style="padding: 0.7rem; border: 1px solid #444; border-radius: 4px; 
                                      background: #333; color: #fff; width: 100%;">
                    </div>
                </div>
                
                <div class="form-group" style="display: grid; gap: 0.5rem;">
                    <label style="font-weight: 500; color: #ddd;">Notes:</label>
                    <textarea name="notes" rows="3" 
                             style="padding: 0.7rem; border: 1px solid #444; border-radius: 4px; 
                                    background: #333; color: #fff; width: 100%; resize: vertical;"></textarea>
                </div>
                
                <div class="form-actions" style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem;">
                    <button type="button" class="btn btn-secondary" 
                            onclick="this.closest('.modal').remove()"
                            style="padding: 0.7rem 1.5rem; border: none; border-radius: 4px; 
                                   background: #555; color: #fff; cursor: pointer;">
                        Cancel
                    </button>
                    <button type="submit" class="btn btn-primary"
                            style="padding: 0.7rem 1.5rem; border: none; border-radius: 4px; 
                                   background: #4a90e2; color: #fff; cursor: pointer; font-weight: 500;">
                        <i class="fas fa-plus"></i> Add Dealer
                    </button>
                </div>
            </form>
        `;
        
        // Append modal content to modal
        modal.appendChild(modalContent);
        
        // Add modal to the body
        document.body.appendChild(modal);
        
        // Handle form submission
        const form = modal.querySelector('#addDealerForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const dealerData = Object.fromEntries(formData.entries());
                
                // Convert empty strings to null for optional fields
                Object.keys(dealerData).forEach(key => {
                    if (dealerData[key] === '') dealerData[key] = null;
                });
                
                // Add default status and timestamps
                dealerData.status = 'Not Contacted';
                dealerData.createdAt = new Date().toISOString();
                dealerData.lastUpdated = new Date().toISOString();
                
                // Add the new dealer
                this.addDealer(dealerData);
                
                // Close the modal
                modal.remove();
                
                // Show success message
                if (typeof showToast === 'function') {
                    showToast('Dealer added successfully!', 'success');
                }
            });
        }
    }

    filterDealers(searchTerm) {
        if (!searchTerm) {
            this.renderDealers();
            return;
        }
        
        const filtered = this.dealers.filter(dealer => 
            (dealer.name && dealer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (dealer.contactPerson && dealer.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (dealer.phone && dealer.phone.includes(searchTerm)) ||
            (dealer.email && dealer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (dealer.address && dealer.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (dealer.notes && dealer.notes.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        
        this.renderDealers(filtered);
    }
    
    getStatusClass(status) {
        const statusMap = {
            'Not Contacted': 'status-pending',
            'Contacted': 'status-info',
            'Follow Up': 'status-warning',
            'Interested': 'status-success',
            'Not Interested': 'status-error'
        };
        return statusMap[status] || 'status-pending';
    }

    // --- Activity Logging ---
    async loadActivities() {
        try {
            const res = await fetch(this.activitiesEndpoint, { headers: { 'Accept': 'application/json' } });
            if (!res.ok) throw new Error('Failed to load activities');
            const data = await res.json();
            this.activities = Array.isArray(data.activities) ? data.activities : [];
        } catch (e) {
            console.warn('Activities load failed, using localStorage as fallback', e);
            const fallback = localStorage.getItem('activities');
            this.activities = fallback ? JSON.parse(fallback) : [];
        }
    }

    saveActivitiesLocal() {
        try { localStorage.setItem('activities', JSON.stringify(this.activities)); } catch (_) {}
    }

    renderActivities() {
        const container = document.getElementById('activityLog');
        if (!container) return;

        if (!this.activities.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <h3>No Activities Yet</h3>
                    <p>Log your first activity to see it here.</p>
                </div>
            `;
            return;
        }

        const dealerNameById = id => {
            const d = this.dealers.find(x => String(x.id) === String(id));
            return d ? d.name : `Dealer #${id}`;
        };

        const typeLabel = t => ({
            'email': 'Email',
            'call': 'Phone Call',
            'meeting': 'In-Person Meeting',
            'test-drive': 'Test Drive',
            'offer': 'Made Offer',
            'follow-up': 'Follow Up'
        }[t] || t);

        container.innerHTML = this.activities.map(a => `
            <div class="activity-item">
                <div class="activity-header">
                    <div class="activity-dealer"><i class="fas fa-building"></i> ${dealerNameById(a.dealerId)}</div>
                    <div class="activity-date">${this.formatDate(a.date)}</div>
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

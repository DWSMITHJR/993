// Simple authentication for admin panel
(function() {
    // List of allowed IPs (add your public IP here when on the internet)
    const ALLOWED_IPS = ['127.0.0.1', '::1', 'localhost'];
    const PASSWORD = 'Porsche993!';
    const STORAGE_KEY = 'admin_auth';
    const AUTH_TIMEOUT = 12 * 60 * 60 * 1000; // 12 hours

    // Check if we're in a local environment
    function isLocal() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.hostname === '';
    }

    // Check if user is authenticated
    function isAuthenticated() {
        const authData = localStorage.getItem(STORAGE_KEY);
        if (!authData) return false;
        
        try {
            const { timestamp } = JSON.parse(authData);
            return (Date.now() - timestamp) < AUTH_TIMEOUT;
        } catch (e) {
            return false;
        }
    }

    // Set authentication
    function setAuthenticated() {
        const authData = {
            timestamp: Date.now()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
    }

    // Show password prompt
    function showAuthPrompt() {
        const password = prompt('Please enter the admin password:');
        if (password === PASSWORD) {
            setAuthenticated();
            window.location.reload();
        } else {
            document.body.innerHTML = `
                <div style="
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    background: #1a1a1a;
                    color: #fff;
                    font-family: Arial, sans-serif;
                    text-align: center;
                    padding: 20px;
                ">
                    <div>
                        <h1>Access Denied</h1>
                        <p>Invalid password or unauthorized access.</p>
                        <p><a href="/" style="color: #fff;">Return to Home</a></p>
                    </div>
                </div>
            `;
        }
    }

    // Check if the current IP is allowed
    async function checkIP() {
        if (isLocal()) return true;

        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return ALLOWED_IPS.includes(data.ip);
        } catch (e) {
            console.error('Error checking IP:', e);
            return false;
        }
    }

    // Initialize auth check
    async function initAuth() {
        if (isAuthenticated()) return true;
        
        const ipAllowed = await checkIP();
        
        if (ipAllowed) {
            setAuthenticated();
            return true;
        }
        
        showAuthPrompt();
        return false;
    }

    // Make initAuth available globally
    window.initAuth = initAuth;
})();

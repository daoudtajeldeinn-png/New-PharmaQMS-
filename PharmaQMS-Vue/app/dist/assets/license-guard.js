(function() {
    const STORAGE_KEY = 'sessionExpiry';
    const LICENSE_KEY = 'app_license_key';
    const SALT = 'PHARMA_SECURE_2024';

    function checkLicense() {
        const expiryStr = localStorage.getItem(STORAGE_KEY);
        if (!expiryStr) return; // Allow initial setup or login to handle this

        const expiryDate = new Date(expiryStr);
        const now = new Date();

        if (now > expiryDate) {
            showLockScreen();
        }
    }

    function showLockScreen() {
        // Check if lock screen already exists
        if (document.getElementById('license-lock-screen')) return;

        const overlay = document.createElement('div');
        overlay.id = 'license-lock-screen';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(255, 255, 255, 0.98); z-index: 99999;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            font-family: system-ui, -apple-system, sans-serif; text-align: center;
        `;

        overlay.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 10px 25px rgba(0,0,0,0.1); max-width: 400px; border: 1px solid #e5e7eb;">
                <h1 style="color: #ef4444; margin-bottom: 1rem;">⛔ Application Expired</h1>
                <p style="color: #374151; margin-bottom: 1.5rem;">Your license has expired. Please contact the administrator to renew your access.</p>
                <input type="text" id="license-input" placeholder="Enter License Key" style="width: 100%; padding: 0.75rem; margin-bottom: 1rem; border: 1px solid #d1d5db; border-radius: 0.5rem; box-sizing: border-box;">
                <button id="unlock-btn" style="width: 100%; padding: 0.75rem; background: #3b82f6; color: white; border: none; border-radius: 0.5rem; font-weight: bold; cursor: pointer;">Activate License</button>
                <p id="error-msg" style="color: #ef4444; margin-top: 1rem; font-size: 0.875rem; display: none;"></p>
            </div>
        `;

        document.body.appendChild(overlay);

        document.getElementById('unlock-btn').onclick = function() {
            validateKey(document.getElementById('license-input').value);
        };
    }

    function validateKey(inputKey) {
        try {
            // Simple validation: Base64(DateString_SALT)
            // Decode input
            const raw = atob(inputKey);
            const [dateStr, salt] = raw.split('_');

            if (salt !== SALT) throw new Error("Invalid Key");

            const newExpiry = new Date(dateStr);
            if (isNaN(newExpiry.getTime())) throw new Error("Invalid Date");

            // Update localStorage
            localStorage.setItem(STORAGE_KEY, newExpiry.toISOString());
            
            // Also update current user payload if it exists to keep them in sync
            const userStr = localStorage.getItem('currentUser');
            if (userStr) {
                const user = JSON.parse(userStr);
                user.sessionExpiry = newExpiry;
                localStorage.setItem('currentUser', JSON.stringify(user));
            }

            alert("License Activated Successfully!");
            window.location.reload();

        } catch (e) {
            const err = document.getElementById('error-msg');
            err.textContent = "Invalid License Key";
            err.style.display = 'block';
        }
    }

    // Run on load and periodically
    window.addEventListener('load', checkLicense);
    setInterval(checkLicense, 60000); // Check every minute
})();

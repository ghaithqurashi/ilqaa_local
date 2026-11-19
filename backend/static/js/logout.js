// Logout function
function logout() {
    // Clear local storage
    localStorage.removeItem('ilqaa_token');
    localStorage.removeItem('ilqaa_user');
    
    // Try to sign out from Firebase if available
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().signOut().catch(() => {
            // Ignore errors if Firebase isn't initialized
        });
    }
    
    // Redirect to login page
    window.location.href = '/login';
}

// Auto-logout on token expiration (optional)
function checkTokenExpiration() {
    const token = localStorage.getItem('ilqaa_token');
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const exp = payload.exp * 1000; // Convert to milliseconds
            const now = Date.now();
            
            // If token expires in less than 5 minutes, show warning
            if (exp - now < 5 * 60 * 1000) {
                console.warn('Token will expire soon');
            }
            
            // If token is expired, logout
            if (now > exp) {
                logout();
            }
        } catch (e) {
            console.error('Error checking token:', e);
        }
    }
}

// Check token every minute
setInterval(checkTokenExpiration, 60000);

// Export logout function
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { logout };
}
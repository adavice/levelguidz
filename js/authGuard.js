import { authService } from './authService.js';
import { API_BASE_URL } from './config.js';

const PROTECTED_ROUTES = ['chat.html'];
const ADMIN_ROUTES = ['admin_panel.html'];

/**
 * Checks if the server recognizes the user's session as valid
 * @returns {Promise<boolean>} - True if server authentication is valid
 */
async function verifyServerAuthentication() {
    try {
        // Get current auth state
        const state = authService.getAuthState();
        if (!state || !state.token) return false;
        
        // Make a verification request to the server
        const response = await fetch(`${API_BASE_URL}?action=verify_session`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${state.token}`,
                'Accept': 'application/json'
            }
        });
        
        const data = await response.json();
        
        // Check if authentication failed on the server
        if (data.error === "Authentication required" || 
            data.error === "Authentication failed" ||
            data.error === "Invalid token" ||
            data.error === "Session expired") {
            console.log('Server session invalid. Logging out...');
            authService.logout();
            return false;
        }
        
        return data.status === 'ok';
    } catch (error) {
        console.error('Error verifying server authentication:', error);
        return false;
    }
}

export async function initAuthGuard() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Check if the current page requires login or admin access
    if (PROTECTED_ROUTES.includes(currentPage) || ADMIN_ROUTES.includes(currentPage)) {
        // Check if user is logged in locally
        if (!authService.isLoggedIn()) {
            window.location.href = '/index.html#login';
            return;
        }
        
        // Verify server session for protected pages
        const serverAuthValid = await verifyServerAuthentication();
        if (!serverAuthValid) {
            // Show notification if possible
            if (window.showToast) {
                window.showToast('Your session has expired. Please log in again.');
            }
            window.location.href = '/index.html#login';
            return;
        }

        // Additional admin check for admin routes
        if (ADMIN_ROUTES.includes(currentPage) && !authService.isAdmin()) {
            window.location.href = '/index.html#login';
            return;
        }
    }
}

import { authService } from './authService.js';
import { API_BASE_URL } from './config.js';

const PROTECTED_ROUTES = ['chat.html'];
const ADMIN_ROUTES = ['admin_panel.html'];

/**
 * Checks if the server recognizes the user's session as valid
 * If valid, syncs user data to localStorage
 * If invalid, clears localStorage
 * @returns {Promise<boolean>} - True if server authentication is valid
 */
export async function verifyServerAuthentication() {
    try {
        // Ask server: is my cookie valid?
        const response = await fetch(`${API_BASE_URL}?action=verify_session`, {
            method: 'GET',
            credentials: 'include', // Send the levelguidz_session cookie
            headers: {
                'Accept': 'application/json'
            }
        });
        
        const data = await response.json();
        
        // Server says session is valid
        if (data.status === 'ok' && data.user) {
            // Sync user data to localStorage for UI
            authService.saveAuthState({
                isLoggedIn: true,
                isAdmin: !!data.user.isAdmin,
                user: data.user
            });
            return true;
        }
        
        // Server says session is invalid/expired
        console.log('Server session invalid or expired');
        authService.logout(); // Clear localStorage
        return false;
        
    } catch (error) {
        console.error('Error verifying server authentication:', error);
        authService.logout(); // Clear localStorage on error
        return false;
    }
}

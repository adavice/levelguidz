import { authService } from './authService.js';
import { API_BASE_URL } from './config.js';

function getAuthHeaders() {
    const state = authService.getAuthState();
    return {
        'Authorization': state?.token ? `Bearer ${state.token}` : '',
        'Content-Type': 'application/json'
    };
}

/**
 * Checks if response indicates an authentication error and handles logout if needed
 * @param {Object} data - The API response data
 * @returns {boolean} - True if auth error was handled
 */
function handleAuthError(data) {
    // Check for authentication error messages
    const authErrors = [
        "Authentication required",
        "Authentication failed",
        "Invalid token",
        "Session expired"
    ];
    
    if (data && data.error && authErrors.includes(data.error)) {
        // If we're logged in locally but the server reports auth error, logout
        if (authService.isLoggedIn()) {
            console.log('Session expired or invalid. Logging out...');
            authService.logout();
            
            // Notify user if possible
            if (window.showToast) {
                window.showToast('Your session has expired. Please log in again.');
            }
            
            // Redirect if we're on a protected page
            const protectedPaths = ['/admin_panel.html', '/chat.html'];
            const currentPath = window.location.pathname;
            if (protectedPaths.some(path => currentPath.endsWith(path))) {
                window.location.href = '/index.html';
            }
            
            // Update UI if possible
            if (window.updateAuthUI) {
                window.updateAuthUI();
            }
        }
        return true;
    }
    return false;
}

export async function loadCoaches() {
    try {
        const response = await fetch(`${API_BASE_URL}?action=list_coaches`, {
            method: 'GET',
            headers: { 
                ...getAuthHeaders(),
                'Accept': 'application/json' 
            }
        });
        
        const data = await response.json();
        
        // Check if we got an authentication error
        if (handleAuthError(data)) {
            return { status: 'error', error: data.error || 'Authentication failed', coaches: [] };
        }
        
        return data;
    } catch (error) {
        console.error('Error loading coaches:', error);
        return { status: 'error', error: error.message, coaches: [] };
    }
}

export async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                action: 'login',
                email,
                password
            })
        });
        const data = await response.json();
        
        if (data.status === 'ok') {
            authService.login(data.user);
        }
        
        return data;
    } catch (error) {
        console.error('Login error:', error);
        return { status: 'error', error: error.message };
    }
}

export function logout() {
    authService.logout();
}

export async function sendContactForm(formData) {
    try {
        const response = await fetch(`${API_BASE_URL}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                action: 'contactus',
                data: formData
            })
        });
        
        const data = await response.json();
        
        // Check for authentication errors
        handleAuthError(data);
        
        return data;
    } catch (error) {
        console.error('Error sending contact form:', error);
        return { status: 'error', error: error.message };
    }
}

export function getCurrentUser() {
    return authService.getAuthState()?.user || null;
}
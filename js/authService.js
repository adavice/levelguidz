class AuthService {
    constructor() {
        this.authState = this.loadAuthState();
    }

    loadAuthState() {
        const stored = localStorage.getItem('authState');
        return stored ? JSON.parse(stored) : null;
    }

    saveAuthState(state) {
        localStorage.setItem('authState', JSON.stringify(state));
        this.authState = state;
    }

    login(userData) {
        this.saveAuthState({
            isLoggedIn: true,
            isAdmin: !!userData.isAdmin,
            token: userData.token,
            user: userData
        });
        // No longer set 'user' key; use only 'authState' for all logic
    }

    /**
     * Auto-login with URL token
     * Server will set the session cookie and return user data
     * @param {string} urlToken - The token from the URL parameter
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async loginWithToken(urlToken) {
        try {
            // Import API_BASE_URL dynamically if needed
            const { API_BASE_URL } = await import('./config.js');
            
            const response = await fetch(`${API_BASE_URL}?action=login_with_token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Server will set the cookie
                body: JSON.stringify({ token: urlToken })
            });
            
            const data = await response.json();
            
            if (data.status === 'ok' && data.user) {
                // Cookie is set by server, save user info locally
                this.saveAuthState({
                    isLoggedIn: true,
                    isAdmin: !!data.user.isAdmin,
                    user: data.user
                });
                return { success: true };
            }
            
            return { success: false, error: data.error || 'Invalid token' };
        } catch (error) {
            console.error('Token login error:', error);
            return { success: false, error: error.message };
        }
    }

    logout() {
        localStorage.removeItem('authState');
        this.authState = null;
        // Do not redirect here; let the caller handle navigation after storage is cleared
    }

    getAuthState() {
        return this.authState;
    }

    isLoggedIn() {
        return !!(this.authState && this.authState.user && this.authState.user.username);
    }

    isAdmin() {
        return !!(this.authState && this.authState.user && this.authState.user.isAdmin);
    }
}

export const authService = new AuthService();

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

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
        // userData is the user object from backend (no token, no isAdmin)
        this.saveAuthState({
            isLoggedIn: true,
            isAdmin: !!userData.isAdmin,
            token: null,    // no token from backend
            user: userData
        });
        // Also save to 'user' for UI logic
        localStorage.setItem('user', JSON.stringify(userData));
    }

    logout() {
        localStorage.removeItem('authState');
        localStorage.removeItem('user');
        this.authState = null;
        window.location.href = '/index.html';
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

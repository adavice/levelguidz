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
            isAdmin: false, // default to false, since backend does not provide
            token: null,    // no token from backend
            user: userData
        });
    }

    logout() {
        localStorage.removeItem('authState');
        this.authState = null;
        window.location.href = '/index.html';
    }

    getAuthState() {
        return this.authState;
    }

    isLoggedIn() {
        return this.authState?.isLoggedIn || false;
    }

    isAdmin() {
        return this.authState?.isAdmin || false;
    }
}

export const authService = new AuthService();

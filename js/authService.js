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
            isAdmin: userData.isAdmin || false,
            token: userData.token,
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

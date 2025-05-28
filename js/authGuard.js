import { authService } from './authService.js';

const PUBLIC_ROUTES = ['index.html', 'contact.html', 'news.html'];
const ADMIN_ROUTES = ['admin_panel.html'];

export function initAuthGuard() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Allow public routes
    if (PUBLIC_ROUTES.includes(currentPage)) {
        return;
    }

    // Check admin routes
    if (ADMIN_ROUTES.includes(currentPage)) {
        if (!authService.isAdmin()) {
            window.location.href = '/index.html';
            return;
        }
    }

    // Check protected routes
    if (!authService.isLoggedIn()) {
        window.location.href = '/index.html#login';
        return;
    }
}

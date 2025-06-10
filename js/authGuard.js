import { authService } from './authService.js';

const PROTECTED_ROUTES = ['chat.html'];
const ADMIN_ROUTES = ['admin_panel.html'];

export function initAuthGuard() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Check if the current page requires login or admin access
    if (PROTECTED_ROUTES.includes(currentPage) || ADMIN_ROUTES.includes(currentPage)) {
        // Check if user is logged in for protected pages
        if (!authService.isLoggedIn()) {
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

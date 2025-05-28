import { getCurrentUser } from './clientApi.js';

document.addEventListener('DOMContentLoaded', function() {
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Handle admin section
    const user = getCurrentUser();
    if (user?.isAdmin) {
        const navbarNav = document.querySelector('.navbar-nav');
        const adminLink = document.createElement('li');
        adminLink.className = 'nav-item nav-admin';
        adminLink.innerHTML = `
            <a class="nav-link" href="./admin_panel.html" style="color: var(--primary-color); font-weight: 500;">
                <i class="bi bi-shield-lock"></i> Admin
            </a>
        `;
        navbarNav.appendChild(adminLink);
    }
});

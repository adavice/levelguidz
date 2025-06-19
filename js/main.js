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

    // Update login button based on auth state
    const user = getCurrentUser();
    if (user) {
        // Show username dropdown, hide login button
        document.getElementById('loginButton')?.classList.add('d-none');
        const userDropdown = document.getElementById('userDropdown');
        const usernamePlaceholder = document.getElementById('usernamePlaceholder');
        
        if (userDropdown && usernamePlaceholder) {
            userDropdown.classList.remove('d-none');
            usernamePlaceholder.textContent = user.username;
        }
    }

    // Handle admin section
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


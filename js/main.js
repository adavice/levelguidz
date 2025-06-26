import { getCurrentUser } from './clientApi.js';
import { authService } from './authService.js';

export function updateAuthUI() {
  const user = getCurrentUser();
  const loginBtn = document.getElementById('loginButton');
  const userDropdown = document.getElementById('userDropdown');
  const usernamePlaceholder = document.getElementById('usernamePlaceholder');
  let adminLink = document.getElementById('adminNavLink');
  if (authService.isLoggedIn()) {
    if (loginBtn) loginBtn.classList.add('d-none');
    if (userDropdown && usernamePlaceholder) {
      userDropdown.classList.remove('d-none');
      usernamePlaceholder.textContent = user.username;
    }
    if (authService.isAdmin()) {
      if (!adminLink) {
        const nav = document.querySelector('.navbar-nav');
        if (nav) {
          adminLink = document.createElement('li');
          adminLink.className = 'nav-item';
          adminLink.id = 'adminNavLink';
          adminLink.innerHTML = `<a class="nav-link" href="./admin_panel.html"><i class="bi bi-shield-lock"></i> Admin</a>`;
          nav.appendChild(adminLink);
        }
      }
    } else if (adminLink) {
      adminLink.remove();
    }
  } else {
    if (loginBtn) loginBtn.classList.remove('d-none');
    if (userDropdown) userDropdown.classList.add('d-none');
    if (usernamePlaceholder) usernamePlaceholder.textContent = '';
    if (adminLink) adminLink.remove();
  }
}

export function setupAuthUIEvents() {
  // Listen for logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      localStorage.removeItem('user');
      updateAuthUI();
      window.location.href = './index.html';
    });
  }
  // Listen for login/signup success (optional: use a custom event or poll localStorage)
  window.addEventListener('storage', function(e) {
    if (e.key === 'user') updateAuthUI();
  });
  // Optionally, expose updateAuthUI globally for other scripts
  window.updateAuthUI = updateAuthUI;
}

export function saveUserToLocalStorage(user) {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
  }
}

document.addEventListener('DOMContentLoaded', function() {
  updateAuthUI();
  setupAuthUIEvents();
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
});


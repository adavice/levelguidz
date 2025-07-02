import { initCoachSelectorModal, showCoachSelectorModal } from './coachSelector.js';

export function updateAuthUI() {
  // Use getCurrentUser from clientApi.js for consistency
  // Import dynamically to avoid circular dependencies if needed
  let user;
  try {
    // Try to import getCurrentUser if available
    // This works if clientApi.js exports getCurrentUser
    user = require('./clientApi.js').getCurrentUser();
  } catch (e) {
    // Fallback: try localStorage directly
    try {
      user = JSON.parse(localStorage.getItem('user')) || null;
    } catch (e2) {
      user = null;
    }
  }
  const loginBtn = document.getElementById('loginButton');
  const userDropdown = document.getElementById('userDropdown');
  const usernamePlaceholder = document.getElementById('usernamePlaceholder');
  let adminLink = document.getElementById('adminNavLink');
  if (user && user.username) {
    if (loginBtn) loginBtn.classList.add('d-none');
    if (userDropdown && usernamePlaceholder) {
      userDropdown.classList.remove('d-none');
      usernamePlaceholder.textContent = user.username;
    }
    if (user.isAdmin) {
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

document.addEventListener('DOMContentLoaded', function() {
  // Coach selector modal setup
  initCoachSelectorModal();
  const coachingLink = document.getElementById('coachingNavLink');
  if (coachingLink) {
    coachingLink.addEventListener('click', e => {
      e.preventDefault();
      showCoachSelectorModal();
    });
  }
  const chooseCoachBtn = document.getElementById('chooseCoachBtn');
  if (chooseCoachBtn) {
    chooseCoachBtn.addEventListener('click', e => {
      e.preventDefault();
      showCoachSelectorModal();
    });
  }

  // Auth UI state (safe for all pages)
  updateAuthUI();

  // Listen for logout (safe for all pages)
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      localStorage.removeItem('user');
      localStorage.removeItem('authState');
      window.location.replace('./index.html'); // Use replace to force reload and prevent back navigation
    });
  }

  // Listen for login/signup success (optional: use a custom event or poll localStorage)
  window.addEventListener('storage', function(e) {
    if (e.key === 'user') updateAuthUI();
  });

  // Expose updateAuthUI globally for use on all pages
  window.updateAuthUI = updateAuthUI;
});


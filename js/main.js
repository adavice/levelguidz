// Listen for logout button click (for pages that have it)
document.addEventListener('DOMContentLoaded', function() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      localStorage.removeItem('authState');
      updateAuthUI();
      window.location.href = './index.html';
    });
  }
});
// Listen for login/signup success (optional: use a custom event or poll localStorage)
window.addEventListener('storage', function(e) {
  if (e.key === 'authState') updateAuthUI();
});
// Optionally, expose updateAuthUI globally for other scripts
window.updateAuthUI = updateAuthUI;
import { getCurrentUser, loadCoaches } from './clientApi.js';
import { authService } from './authService.js';
import { setupCoachSelectorTriggers } from './coachSelector.js';
import { initAuthGuard } from './authGuard.js';

export function updateAuthUI() {
  const loginBtn = document.getElementById('loginButton');
  const userDropdown = document.getElementById('userDropdown');
  const usernamePlaceholder = document.getElementById('usernamePlaceholder');
  let adminLink = document.getElementById('adminNavLink');
  const authState = JSON.parse(localStorage.getItem('authState'));
  if (authState && authState.isLoggedIn && authState.user && authState.user.username) {
    if (loginBtn) loginBtn.classList.add('d-none');
    if (userDropdown && usernamePlaceholder) {
      userDropdown.classList.remove('d-none');
      usernamePlaceholder.textContent = authState.user.username;
    }
    if (authState.isAdmin) {
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
      localStorage.removeItem('authState');
      updateAuthUI();
      window.location.href = './index.html';
    });
  }
  // Listen for login/signup success (optional: use a custom event or poll localStorage)
  window.addEventListener('storage', function(e) {
    if (e.key === 'authState') updateAuthUI();
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

export function showToast(message, success = false) {
  // Create toast container if it doesn't exist
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(toastContainer);
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-bg-${success ? 'success' : 'danger'} border-0 show`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');
  toast.style.minWidth = '250px';
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <i class="bi ${success ? 'bi-check-circle-fill text-success' : 'bi-exclamation-circle-fill text-danger'} me-2"></i>
        <span>${message}</span>
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;
  toastContainer.appendChild(toast);

  // Show toast using Bootstrap's Toast API if available
  if (window.bootstrap && window.bootstrap.Toast) {
    const bsToast = window.bootstrap.Toast.getOrCreateInstance(toast, { delay: 3000 });
    bsToast.show();
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
  } else {
    // Fallback: auto-remove after 3s
    setTimeout(() => toast.remove(), 3000);
  }
}

/**
 * Verify server session if user is logged in locally
 */
async function verifyAuthentication() {
  if (authService.isLoggedIn()) {
    try {
      // Use loadCoaches as a way to verify the auth status with the server
      const result = await loadCoaches();
      
      // If the response contains an authentication error, the loadCoaches function 
      // will have already handled the logout process
    } catch (error) {
      console.error('Error verifying authentication:', error);
    }
  }
}

document.addEventListener('DOMContentLoaded', async function() {
  // Make showToast available globally
  window.showToast = showToast;
  
  // Verify authentication with the server if logged in
  await verifyAuthentication();
  
  // Initialize the auth guard
  await initAuthGuard();
  
  // Update UI and setup other components
  updateAuthUI();
  setupAuthUIEvents();
  setupCoachSelectorTriggers();
  
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', function() {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
});


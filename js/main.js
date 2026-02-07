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
import { verifyServerAuthentication } from './authGuard.js';
import { translations as toastTranslations } from './translations/i18n-toasts.js';
import { registerTranslations, t } from './translate.js';

/**
 * Renders featured coaches in the locomotive carousel if available
 * Only replaces coach names and profile pictures, keeps the rest of the HTML structure
 */
async function renderFeaturedCoaches() {
  // Check if we're on a page that has the locomotive track
  const locomotiveTrack = document.querySelector('.locomotive-track');
  if (!locomotiveTrack) {
    return; // No carousel on this page, exit silently
  }

  try {
    // Load coaches from API
    const coaches = await loadCoaches();
    
    // If loading failed or user is not authenticated, keep static coaches
    if (!coaches || !Array.isArray(coaches)) {
      console.log('Could not load coaches, keeping static content');
      return;
    }

    // Filter for featured coaches
    const featuredCoaches = coaches.filter(coach => coach.featured === true);
    
    if (featuredCoaches.length === 0) {
      console.log('No featured coaches found, keeping static content');
      return;
    }

    // Get existing coach cards
    const existingCards = locomotiveTrack.querySelectorAll('.coach-card');
    
    // Replace each existing card with featured coach data (up to the number of existing cards)
    existingCards.forEach((card, index) => {
      if (index < featuredCoaches.length) {
        const coach = featuredCoaches[index];
        
        // Update profile image
        const coachImage = card.querySelector('.coach-image');
        if (coachImage && coach.avatar) {
          coachImage.src = coach.avatar;
          coachImage.alt = coach.name || 'Coach Name';
        }
        
        // Update coach name
        const coachNameElement = card.querySelector('.coach-info .coach-name');
        if (coachNameElement && coach.name) {
          coachNameElement.textContent = coach.name;
        }
        
        // Optionally update role/badge if available
        // const badgeElement = card.querySelector('.badge');
        // if (badgeElement && coach.role) {
        //   badgeElement.textContent = coach.role;
        // }
      }
    });

    console.log(`Successfully updated ${Math.min(existingCards.length, featuredCoaches.length)} featured coaches`);
    
  } catch (error) {
    console.error('Error rendering featured coaches:', error);
    // Keep static coaches if there's any error
  }
}

// Register toast translations so the central translator can be used elsewhere
registerTranslations('toasts', toastTranslations);

// Map common server error messages (or fragments) to translation keys.
// This helps when server returns raw English error messages (e.g. "Invalid credentials").
const serverErrorMappings = [
  { pattern: /invalid credentials/i, key: 'invalid.credentials' },
  { pattern: /invalid email/i, key: 'invalid.credentials' },
  { pattern: /invalid password/i, key: 'invalid.credentials' },
  { pattern: /authentication failed/i, key: 'invalid.credentials' },
  { pattern: /invalid token/i, key: 'session.expired' }
];

export function updateAuthUI() {
  const loginBtn = document.getElementById('loginButton');
  const userDropdown = document.getElementById('userDropdown');
  const usernamePlaceholder = document.getElementById('usernamePlaceholder');
  let adminLink = document.getElementById('adminNavLink');
  const authState = JSON.parse(localStorage.getItem('authState'));
  
  // Check if user is logged in (either has username or id)
  if (authState && authState.isLoggedIn && authState.user && (authState.user.username || authState.user.id)) {
    if (loginBtn) loginBtn.classList.add('d-none');
    if (userDropdown && usernamePlaceholder) {
      userDropdown.classList.remove('d-none');
      // Display username if available, otherwise show 'User'
      usernamePlaceholder.textContent = authState.user.username || 'User';
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

function renderToast(message, success = false) {
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
 * Wrapper that accepts either a translation key or raw message text.
 * If the provided message matches a key in the toasts translations for the
 * current language, the translated text will be used.
 */
export function showToast(messageOrKey, success = false) {
  try {
  // If server returned a raw error string, map common patterns to translation keys
  if (typeof messageOrKey === 'string') {
    for (const m of serverErrorMappings) {
      try {
        if (m.pattern.test(messageOrKey)) {
          messageOrKey = m.key;
          break;
        }
      } catch (e) { /* ignore malformed patterns */ }
    }
  }

  // Try to resolve via central translator (registered namespace 'toasts')
  const translated = t(messageOrKey, 'toasts');
  const message = translated || messageOrKey;
  renderToast(message, success);
  } catch (e) {
    renderToast(messageOrKey, success);
  }
}

/**
 * Initialize authentication on page load
 * Handles auto-login via URL token (backend auto-processes it) and session verification
 * @returns {Promise<boolean>} - True if user is authenticated
 */
async function initAuth() {
  const urlParams = new URLSearchParams(window.location.search);
  const autoLoginToken = urlParams.get('t');
  
  // If there's an auto-login token, backend has already processed it and set the cookie
  // We just need to verify the session and clean up the URL
  if (autoLoginToken) {
    // Remove token from URL to prevent reuse/sharing
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  
  // Verify session cookie with server (works for both auto-login and regular login)
  const isValid = await verifyServerAuthentication();
  
  if (!isValid) {
    // Cookie expired or invalid → clear localStorage
    authService.logout();
    
    // Show error only if we just tried auto-login
    if (autoLoginToken) {
      showToast('login.failed', false);
    }
    return false;
  }
  
  // Show success message for auto-login
  if (autoLoginToken) {
    showToast('login.success.redirect', true);
  }
  
  return true; // Session is valid
}

document.addEventListener('DOMContentLoaded', async function() {
  // Make showToast available globally
  window.showToast = showToast;
  
  // Initialize authentication (handles auto-login and session verification)
  await initAuth();
  
  // auth guard removed: server-side cookie-based protection handled on backend
  
  // Update UI and setup other components
  updateAuthUI();
  setupAuthUIEvents();
  setupCoachSelectorTriggers();
  
  // Render featured coaches if available (only on pages with locomotive carousel)
  await renderFeaturedCoaches();
  
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', function() {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
});


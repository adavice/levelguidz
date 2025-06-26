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

  // Login form handler with console log for localStorage
  const loginForm = document.querySelector('.auth-form.front form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const phone = form.querySelector('input[type="phone"]').value;
      const password = form.querySelector('input[type="password"]').value;
      try {
        // Use login from clientApi.js
        const { login } = await import('./clientApi.js');
        const response = await login(phone, password);
        if (response.status === 'ok') {
          form.reset();
          updateAuthUI();
          // Log localStorage user after login
          console.log('User in localStorage after login:', localStorage.getItem('user'));
        } else if (response.error) {
          alert(response.error);
        } else {
          alert('Login failed');
        }
      } catch (error) {
        alert(error.message);
      }
    });
  }

  // Login form handler for both index.html and signin.html
  function setupLoginFormHandler() {
    // Try to find a login form on the page (works for both index and signin)
    const loginForm = document.querySelector('.auth-form.front form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        // Try both selectors for phone/email (signin.html may use email, index.html uses phone)
        const phoneInput = form.querySelector('input[type="phone"], input[type="tel"]');
        const emailInput = form.querySelector('input[type="email"]');
        const passwordInput = form.querySelector('input[type="password"]');
        const phone = phoneInput ? phoneInput.value : '';
        const email = emailInput ? emailInput.value : '';
        const password = passwordInput ? passwordInput.value : '';
        // Prefer phone, fallback to email
        const identifier = phone || email;
        try {
          // Use login from clientApi.js
          const { login } = await import('./clientApi.js');
          // Pass identifier (phone or email) and password
          const response = await login(identifier, password);
          if (response.status === 'ok') {
            form.reset();
            updateAuthUI();
            // Log localStorage user after login
            console.log('User in localStorage after login:', localStorage.getItem('user'));
            // If on signin.html, redirect to chat.html after login
            if (window.location.pathname.endsWith('signin.html')) {
              setTimeout(() => window.location.href = './chat.html', 500);
            }
          } else if (response.error) {
            alert(response.error);
          } else {
            alert('Login failed');
          }
        } catch (error) {
          alert(error.message);
        }
      });
    }
  }

  setupLoginFormHandler();
});


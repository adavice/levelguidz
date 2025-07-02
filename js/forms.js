import { login, signup, forgotPassword } from './authApi.js';
import { getCurrentUser } from './clientApi.js';

export function updateAuthUI() {
  const user = getCurrentUser();
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
  updateAuthUI();
  const authToast = new bootstrap.Toast(document.getElementById('authToast'));
  const showToast = (message, success = false) => {
    const toastMessage = document.getElementById('toastMessage');
    toastMessage.innerHTML = `
      <div class="d-flex align-items-center gap-2">
        <i class="bi ${success ? 'bi-check-circle-fill text-success' : 'bi-exclamation-circle-fill text-danger'}"></i>
        <span>${message}</span>
      </div>`;
    authToast.show();
  };

  // Login form handler
  document.querySelector('.auth-form.front form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const phone = form.querySelector('input[type="phone"]').value;
    const password = form.querySelector('input.password').value;
    try {
      const response = await login(phone, password);
      if (response.status === 'ok') {
        form.reset();
        showToast('Login successful!', true);
        updateAuthUI();
      } else if (response.error) {
        showToast(response.error);
      } else {
        showToast('Login failed');
      }
    } catch (error) {
      showToast(error.message);
    }
  });

  // Signup form handler
  document.querySelector('.auth-form.back form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const username = form.querySelector('input[type="text"]').value;
    const phone = form.querySelector('input[type="phone"]').value;
    const password = form.querySelectorAll('.signup-password.password')[0].value;
    const confirmPassword = form.querySelectorAll('.signup-password.password')[1].value;
    if (password !== confirmPassword) {
      showToast('Passwords do not match');
      return;
    }
    try {
      const response = await signup(username, phone, password);
      if (response.status === 'ok') {
        form.reset();
        showToast('Account created successfully! Please login.', true);
        document.querySelector('.auth-flipper').classList.remove('flipped');
        setTimeout(updateAuthUI, 500);
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error) {
      showToast(error.message);
    }
  });

  // Logout handler
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      localStorage.removeItem('user');
      updateAuthUI();
      window.location.href = './index.html';
    });
  }

  // Forgot password form handler
  document.querySelectorAll('.auth-form.forgot form').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const phone = form.querySelector('input[type="phone"]').value;
      try {
        const response = await forgotPassword(phone);
        if (response.status === 'ok') {
          form.reset();
          showToast('Password reset link has been sent to your phone.', true);
          document.querySelector('.auth-flipper').classList.remove('flipped');
        } else {
          throw new Error(response.error || 'Failed to send reset link');
        }
      } catch (error) {
        showToast(error.message);
      }
    });
  });

  // Password visibility toggle (hover)
  document.querySelectorAll('.password-toggle').forEach(toggle => {
    const input = toggle.parentElement.querySelector('input.password');
    const icon = toggle.querySelector('i');
    if (!input || !icon) return;
    toggle.addEventListener('mouseenter', function () {
      input.type = 'text';
      icon.classList.remove('bi-eye');
      icon.classList.add('bi-eye-slash');
    });
    toggle.addEventListener('mouseleave', function () {
      input.type = 'password';
      icon.classList.remove('bi-eye-slash');
      icon.classList.add('bi-eye');
    });
  });

  // Flip triggers (login/signup)
  document.querySelectorAll('.flip-trigger').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelector('.auth-flipper').classList.toggle('flipped');
      document.querySelector('.auth-form.forgot').style.display = 'none';
      document.querySelector('.auth-form.back').style.display = '';
    });
  });

  // Forgot password trigger
  document.querySelectorAll('.forgot-trigger').forEach(trigger => {
    trigger.addEventListener('click', function(e) {
      e.preventDefault();
      const flipper = document.querySelector('.auth-flipper');
      flipper.classList.add('flipped');
      document.querySelector('.auth-form.back').style.display = 'none';
      document.querySelector('.auth-form.forgot').style.display = 'block';
    });
  });

  // Back to login from forgot password
  document.querySelectorAll('.back-to-login').forEach(trigger => {
    trigger.addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelector('.auth-flipper').classList.remove('flipped');
      document.querySelector('.auth-form.forgot').style.display = 'none';
      document.querySelector('.auth-form.back').style.display = '';
    });
  });
});

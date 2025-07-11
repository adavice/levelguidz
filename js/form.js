// form.js - Handles form flipping, form submission, and password visibility for auth forms
import { login, signup, forgotPassword } from './authApi.js';
import { authService } from './authService.js';

/**
 * Normalizes contact information (phone or email) based on format
 * @param {string} input - Phone number or email address
 * @return {string} - Normalized contact info
 */
function normalizeContactInput(input) {
  if (!input) return input;
  
  const trimmed = input.trim();
  
  // Check if it's likely an email (contains @ symbol)
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase(); // Normalize email to lowercase
  }
  
  // Otherwise treat as phone number
  // Currently, we're passing the phone number as-is without any formatting
  // This allows both formats (with or without +) to work with the backend
  return trimmed;
}

function showToast(message, success = false) {
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

function updateAuthUI() {
  // Optionally, update UI after login/signup/logout
  // This should be replaced by your actual UI update logic
  if (window.updateAuthUI) window.updateAuthUI();
}

document.addEventListener('DOMContentLoaded', function () {
  // --- Form Flip Logic ---
  document.querySelectorAll('.flip-trigger').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelector('.auth-flipper').classList.toggle('flipped');
      document.querySelector('.auth-form.forgot').style.display = 'none';
      document.querySelector('.auth-form.back').style.display = '';
    });
  });

  document.querySelectorAll('.forgot-trigger').forEach(trigger => {
    trigger.addEventListener('click', function(e) {
      e.preventDefault();
      const flipper = document.querySelector('.auth-flipper');
      flipper.classList.add('flipped');
      document.querySelector('.auth-form.back').style.display = 'none';
      document.querySelector('.auth-form.forgot').style.display = 'block';
    });
  });

  document.querySelectorAll('.back-to-login').forEach(trigger => {
    trigger.addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelector('.auth-flipper').classList.remove('flipped');
      document.querySelector('.auth-form.forgot').style.display = 'none';
      document.querySelector('.auth-form.back').style.display = '';
    });
  });

  // --- Password Visibility Toggle ---
  document.querySelectorAll('.password-toggle').forEach(toggle => {
    toggle.addEventListener('click', function() {
      const input = this.parentElement.querySelector('input.password');
      const icon = this.querySelector('i');
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
      icon.classList.toggle('bi-eye');
      icon.classList.toggle('bi-eye-slash');
    });
  });

  // --- Login Form Handler ---
  const loginForm = document.querySelector('.auth-form.front form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      // Get and normalize the contact input (works for both phone or email)
      const contactInput = form.querySelector('input[type="phone"]').value;
      const normalizedContact = normalizeContactInput(contactInput);
      const password = form.querySelector('input.password').value;
      try {
        const response = await login(normalizedContact, password);
        if (response.status === 'ok') {
          form.reset();
          showToast('Login successful!', true);
          authService.login(response.user);
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
  }

  // --- Signup Form Handler ---
  const signupForm = document.querySelector('.auth-form.back form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const username = form.querySelector('input[type="text"]').value;
      // Get and normalize the contact input (works for both phone or email)
      const contactInput = form.querySelector('input[type="phone"]').value;
      const normalizedContact = normalizeContactInput(contactInput);
      const password = form.querySelectorAll('.signup-password.password')[0].value;
      const confirmPassword = form.querySelectorAll('.signup-password.password')[1].value;
      if (password !== confirmPassword) {
        showToast('Passwords do not match');
        return;
      }
      try {
        const response = await signup(username, normalizedContact, password);
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
  }

  // --- Forgot Password Form Handler ---
  document.querySelectorAll('.auth-form.forgot form').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      // Get and normalize the contact input (works for both phone or email)
      const contactInput = form.querySelector('input[type="phone"]').value;
      const normalizedContact = normalizeContactInput(contactInput);
      try {
        const response = await forgotPassword(normalizedContact);
        if (response.status === 'ok') {
          form.reset();
          showToast('Password reset link has been sent.', true);
          document.querySelector('.auth-flipper').classList.remove('flipped');
        } else {
          throw new Error(response.error || 'Failed to send reset link');
        }
      } catch (error) {
        showToast(error.message);
      }
    });
  });
});

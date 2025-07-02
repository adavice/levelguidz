// form.js - Handles form flipping, form submission, and password visibility for auth forms
import { login, signup, forgotPassword } from './authApi.js';
import { authService } from './authService.js';

function showToast(message, success = false) {
  // Use Bootstrap Toast if available, fallback to alert
  const toastEl = document.getElementById('authToast');
  const toastMsg = document.getElementById('toastMessage');
  if (toastEl && toastMsg) {
    toastMsg.textContent = message;
    if (success) {
      toastEl.classList.remove('bg-danger');
      toastEl.classList.add('bg-success');
    } else {
      toastEl.classList.remove('bg-success');
      toastEl.classList.add('bg-danger');
    }
    const toast = bootstrap.Toast.getOrCreateInstance(toastEl);
    toast.show();
  } else {
    alert(message);
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
      const phone = form.querySelector('input[type="phone"]').value;
      const password = form.querySelector('input.password').value;
      try {
        const response = await login(phone, password);
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
  }

  // --- Forgot Password Form Handler ---
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
});

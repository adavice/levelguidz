import { authService } from './authService.js';
import { API_BASE_URL } from './config.js';

function getAuthHeaders() {
    const state = authService.getAuthState();
    return {
        'Authorization': state?.token ? `Bearer ${state.token}` : '',
        'Content-Type': 'application/json'
    };
}

export async function loadCoaches() {
    const response = await fetch(`${API_BASE_URL}?action=list_coaches`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    });
    return response.json();
}

export async function login(email, password) {
    const response = await fetch(`${API_BASE_URL}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
            action: 'login',
            email,
            password
        })
    });
    const data = await response.json();
    
    if (data.status === 'ok') {
        authService.login(data.user);
    }
    
    return data;
}

export async function logout() {
    authService.logout();
}

export async function sendContactForm(formData) {
    const response = await fetch(`${API_BASE_URL}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
            action: 'contactus',
            data: formData
        })
    });
    return response.json();
}

export function getCurrentUser() {
    return authService.getAuthState()?.user || null;
}
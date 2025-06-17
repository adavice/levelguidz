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

export async function loadChatHistory() {
    const response = await fetch(`${API_BASE_URL}?action=load_chat_history`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    });
    return response.json();
}

export async function logout() {
    authService.logout();
}

export function getCurrentUser() {
    return authService.getAuthState()?.user || null;
}


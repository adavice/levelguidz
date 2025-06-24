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

export async function saveCoaches(coachesArray) {
    const response = await fetch(`${API_BASE_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_coaches', coaches: coachesArray })
    });
    return response.json();
}

export async function saveCoach(coach) {
    if (!coach.id) throw new Error('Coach id is required for saveCoach');
    const response = await fetch(`${API_BASE_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_coach', coach: { ...coach, id: coach.id } })
    });
    return response.json();
}

export async function deleteCoach(id) {
    const response = await fetch(`${API_BASE_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_coach', id })
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

export async function saveChatHistory(historyArray) {
    const user = getCurrentUser();
    if (!user?.id) throw new Error('No user logged in');
    const response = await fetch(`${API_BASE_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'save_chat_history',
            user_id: user.id,
            history: historyArray
        })
    });
    return response.json();
}

export async function loadChatHistory() {
    const user = getCurrentUser();
    if (!user?.id) throw new Error('No user logged in');
    const response = await fetch(`${API_BASE_URL}?action=load_chat_history&user_id=${encodeURIComponent(user.id)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    });
    return response.json();
}
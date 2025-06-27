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


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
    const response = await fetch(`${API_BASE_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_coach', coach })
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


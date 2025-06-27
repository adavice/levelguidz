import { authService } from './authService.js';
import { API_BASE_URL } from './config.js';

export async function loadCoaches() {
    const response = await fetch(`${API_BASE_URL}?action=list_coaches`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    });
    return response.json();
}

export async function saveChatHistory(historyArray) {
    const user = getCurrentUser();
    if (!user?.id) throw new Error('No user logged in');
    // Ensure each message has user_id and coachId
    const normalizedHistory = historyArray.map(msg => ({
        ...msg,
        user_id: user.id,
        coachId: msg.coachId || msg.coach_id // fallback if needed
    }));
    const response = await fetch(`${API_BASE_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'save_chat_history',
            user_id: user.id,
            history: normalizedHistory
        })
    });
    const data = await response.json();
    console.log('saveChatHistory response:', data);
    return data;
}

export async function logout() {
    authService.logout();
}

export function getCurrentUser() {
    return authService.getAuthState()?.user || null;
}

export async function loadChatHistory(coachId = null) {
    const user = getCurrentUser();
    if (!user?.id) throw new Error('No user logged in');
    let url = `${API_BASE_URL}?action=chat_history&user_id=${encodeURIComponent(user.id)}`;
    if (coachId) {
        url += `&coach_id=${encodeURIComponent(coachId)}`;
    }
    const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    });
    const data = await response.json();
    console.log('loadChatHistory response:', data);
    return data;
}


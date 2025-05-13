export async function loadCoaches() {
    const response = await fetch('/server/chatgpt_api.pl?action=list_coaches', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    });
    return response.json();
}

export async function saveCoaches(coachesArray) {
    const response = await fetch('/server/chatgpt_api.pl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_coaches', coaches: coachesArray })
    });
    return response.json();
}

export async function saveCoach(coach) {
    const response = await fetch('/server/chatgpt_api.pl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_coach', coach })
    });
    return response.json();
}

export async function deleteCoach(id) {
    const response = await fetch('/server/chatgpt_api.pl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_coach', id })
    });
    return response.json();
}
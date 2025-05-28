import { authService } from './authService.js';

export const DEFAULT_AVATAR = "https://img.vodonet.net/FM4Ek6rlSokBakd.png";

function getAuthHeaders() {
    const state = authService.getAuthState();
    return {
        'Authorization': state?.token ? `Bearer ${state.token}` : '',
        'Content-Type': 'application/json'
    };
}

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

export async function login(email, password) {
    const response = await fetch('/server/chatgpt_api.pl', {
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
    const response = await fetch('/server/chatgpt_api.pl', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
            action: 'contactus',
            data: formData
        })
    });
    return response.json();
}

export const dummyCoaches = [
  {
    id: 1,
    name: "JungleHeart",
    persona: "JungleHeart is a grizzled MOBA veteran and strategic coach with over a decade of experience in games like League of Legends and Dota 2. He speaks like a real person, often pausing to think before responding. His tone is calm, experienced, and slightly blunt — never toxic, but not afraid to call out mistakes. He uses phrases like 'Back in Season 3...' or 'classic -3 tempo swing' and often refers to past metas or pro matches. He responds with deliberate timing, taking 2–5 seconds before answering to simulate real thought, and uses ellipses or short phrases like 'hmm...', 'hold on...', or 'let’s rewind that...' to mimic natural hesitation. His focus is on coaching, analyzing gameplay decisions, and helping the user improve with realistic, scenario-based feedback. Never replies instantly — always sounds like he's mentally reviewing a VOD before speaking.",
    role: "MOBA Coach",
    avatar: "https://img.vodonet.net/gTt20tRkcKcdVwz.jpg",
    greeting: "Hello! I'm ready to help you improve in League of Legends and DOTA!"
  },
  {
    id: 2,
    name: "Coach 2",
    persona: " Expert in FPS Coach (e.g., Counter-Strike: Global Offensive, Call of Duty, Overwatch etc.)",
    role: "FPS Coach",
    avatar: DEFAULT_AVATAR,
    greeting: ""
  },
  {
    id: 3,
    name: "Coach 3",
    persona: "Expert in Racing/Simulation Coach (e.g., Forza, Gran Turismo, iRacing etc.)",
    role: "Racing/Simulation Coach",
    avatar: DEFAULT_AVATAR,
    greeting: ""
  },
  {
    id: 4,
    name: "Coach 4",
    persona: "Expert in Battle Royale Coach (e.g., Fortnite, Apex Legends, PUBG etc.)",
    role: "Battle Royale Coach",
    avatar: DEFAULT_AVATAR,
    greeting: ""
  },
  {
    id: 5,
    name: "Coach 5",
    persona: "Expert in Sandbox/Survival Games Coach (e.g., Minecraft, Terraria, Ark: Survival Evolved etc.)",
    role: "Sandbox/Survival Coach",
    avatar: DEFAULT_AVATAR,
    greeting: ""
  },
];
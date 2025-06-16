export async function login(email, password) {
    const response = await fetch('/server/chat_api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'login',
            email,
            password
        })
    });
    return response.json();
}

export async function signup(username, email, password) {
    const response = await fetch('/server/chat_api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'signup',
            username,
            email,
            password
        })
    });
    return response.json();
}

export async function forgotPassword(email) {
    const response = await fetch('/server/chat_api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'forgot_password',
            email
        })
    });
    return response.json();
}

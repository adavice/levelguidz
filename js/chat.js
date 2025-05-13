import { loadCoaches } from './clientApi.js';

document.addEventListener('DOMContentLoaded', () => {
    const coachList = document.querySelector('.chatbot-list');
    const chatMessages = document.querySelector('.chat-messages');
    const messageInput = document.querySelector('textarea');
    const sendButton = document.querySelector('.chat-input button');

    async function loadCoachesList() {
        try {
            const coaches = await loadCoaches();
            if (!Array.isArray(coaches)) {
                throw new Error('Invalid coaches data');
            }
            coachList.innerHTML = coaches.map(coach => `
                <div class="coach-item d-flex align-items-center gap-3" data-id="${coach.id}">
                    <div class="coach-item-avatar" style="background-image: url('${coach.avatar}')"></div>
                    <div>
                        <h6 class="mb-0">${coach.name}</h6>
                        <small class="text-muted">${coach.role}</small>
                    </div>
                </div>
            `).join('');

            document.querySelectorAll('.coach-item').forEach(item => {
                item.addEventListener('click', () => selectCoach(item));
            });
        } catch (error) {
            console.error('Error loading coaches:', error);
            coachList.innerHTML = `<div class="text-danger">Failed to load coaches. Please try again later.</div>`;
        }
    }

    function selectCoach(coachItem) {
        document.querySelectorAll('.coach-item').forEach(item => item.classList.remove('active'));
        coachItem.classList.add('active');
        // Clear chat messages when switching coaches
        chatMessages.innerHTML = '';
    }

    function addMessage(content, isUser = false) {
        const message = document.createElement('div');
        message.className = `message ${isUser ? 'user' : ''}`;
        const now = new Date();
        const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        message.innerHTML = `
            <div class="message-content">
                ${content}
                <div class="text-end text-muted" style="font-size: 0.8em; opacity: 0.7; margin-top: 0.25rem;">
                    ${timestamp}
                </div>
            </div>
        `;
        chatMessages.appendChild(message);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Handle sending messages
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    function sendMessage() {
        const message = messageInput.value.trim();
        if (!message) return;

        addMessage(message, true);
        messageInput.value = '';

        // TODO: Send message to backend and handle response
        // For now, just simulate a response
        setTimeout(() => {
            addMessage("This is a simulated response from the bot.");
        }, 1000);
    }

    // Handle screenshot paste (Ctrl+V) for vision analysis
    messageInput.addEventListener('paste', async (event) => {
        const items = (event.clipboardData || event.originalEvent.clipboardData).items;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.indexOf('image') !== -1) {
                const file = item.getAsFile();
                if (file) {
                    addMessage('<i class="bi bi-image"></i> <span class="text-muted">Analyzing screenshot...</span>', true);

                    // Prepare form data for backend
                    const formData = new FormData();
                    formData.append('action', 'vision');
                    formData.append('image', file);

                    // Send to backend for vision analysis
                    try {
                        const res = await fetch('/server/chatgpt_api.pl', {
                            method: 'POST',
                            body: formData
                        });
                        const data = await res.json();
                        if (data && data.reply) {
                            addMessage(data.reply, false);
                        } else {
                            addMessage('<span class="text-danger">Failed to analyze image.</span>', false);
                        }
                    } catch (err) {
                        addMessage('<span class="text-danger">Error analyzing image.</span>', false);
                    }
                }
                event.preventDefault();
                break;
            }
        }
    });

    const voiceBtn = document.getElementById('voiceBtn');
    const textarea = document.querySelector('.chat-input textarea');

    if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = false;

        voiceBtn.addEventListener('click', () => {
            recognition.start();
            voiceBtn.classList.add('text-danger'); // red mic while recording
        });

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            textarea.value += transcript;
            voiceBtn.classList.remove('text-danger');
        };

        recognition.onerror = () => {
            voiceBtn.classList.remove('text-danger');
        };

        recognition.onend = () => {
            voiceBtn.classList.remove('text-danger');
        };
    } else {
        voiceBtn.disabled = true;
        voiceBtn.title = "Voice recognition not supported";
    }

    // Initial load
    loadCoachesList();
});

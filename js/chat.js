import { loadCoaches, dummyCoaches } from './clientApi.js';

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
            renderCoaches(coaches);
        } catch (error) {
            console.error('Error loading coaches, using dummy data:', error);
            renderCoaches(dummyCoaches);
        }
    }

    function getRandomStatus() {
        const statuses = ['online', 'away', 'offline'];
        return statuses[Math.floor(Math.random() * statuses.length)];
    }

    function renderCoaches(coaches) {
        coachList.innerHTML = coaches.map(coach => {
            const status = coach.status || getRandomStatus();
            return `
                <div class="coach-item d-flex align-items-center gap-3" data-id="${coach.id}" data-status="${status}">
                    <div class="coach-item-avatar" style="background-image: url('${coach.avatar}')">
                    </div>
                    <div>
                        <h6 class="mb-0">${coach.name} <div class="coach-status status-${status}"></div></h6>
                        <small class="text-muted">${coach.role}</small>
                    </div>
                </div>
            `;
        }).join('');

        document.querySelectorAll('.coach-item').forEach(item => {
            item.addEventListener('click', () => selectCoach(item));
        });
    }

    function setCoachStatus(coachId, status, force = false) {
        const coachItem = document.querySelector(`.coach-item[data-id="${coachId}"]`);
        if (coachItem) {
            const statusDot = coachItem.querySelector('.coach-status');
            const currentStatus = coachItem.dataset.status;

            if (status === 'responding') {
                // Keep original status color but add pulse animation
                statusDot.className = `coach-status status-${currentStatus} status-responding`;
            } else {
                // Remove responding animation and update status if needed
                statusDot.classList.remove('status-responding');
                if (status !== currentStatus || force) {
                    coachItem.dataset.status = status;
                    statusDot.className = `coach-status status-${status}`;
                }
            }

            // Update header status to match
            if (coachItem.classList.contains('active')) {
                const headerName = document.getElementById('chatCoachName');
                const headerStatus = headerName.querySelector('.coach-status'); // Select status inside h6
                if (status === 'responding') {
                    headerStatus.className = `coach-status status-${currentStatus} status-responding`;
                } else {
                    headerStatus.className = `coach-status status-${status}`;
                }
            }
        }
    }

    function selectCoach(coachItem) {
        document.querySelectorAll('.coach-item').forEach(item => item.classList.remove('active'));
        coachItem.classList.add('active');

        // Update chat header with selected coach info
        const coachId = coachItem.dataset.id;
        const status = coachItem.dataset.status;
        const avatar = coachItem.querySelector('.coach-item-avatar').style.backgroundImage;
        const name = coachItem.querySelector('h6').textContent;
        const role = coachItem.querySelector('small').textContent;

        document.getElementById('chatCoachAvatar').style.backgroundImage = avatar;
        document.getElementById('chatCoachName').innerHTML = `${name} <div class="coach-status status-${status}"></div>`;
        document.getElementById('chatCoachRole').textContent = role;
        
        // Clear chat messages when switching coaches
        chatMessages.innerHTML = '';
    }

    function addMessage(content, isUser = false, isAudio = false) {
        const message = document.createElement('div');
        message.className = `message ${isUser ? 'user' : ''}`;
        const now = new Date();
        const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Add delete button for user messages
        const deleteButton = isUser ? `
            <button class="btn btn-link btn-sm text-muted delete-message p-0 ms-2" title="Delete message">
                <i class="bi bi-trash"></i>
            </button>
        ` : '';

        message.innerHTML = `
            <div class="message-content">
                <div class="d-flex align-items-center justify-content-between">
                    <div class="flex-grow-1">
                        ${isAudio ? `
                            <div class="d-flex align-items-center gap-2 mb-2">
                                <i class="bi bi-mic-fill text-primary"></i>
                                <audio src="${content}" controls class="audio-message"></audio>
                            </div>
                        ` : content}
                    </div>
                    ${deleteButton}
                </div>
                <div class="text-end text-muted" style="font-size: 0.8em; opacity: 0.7; margin-top: 0.25rem;">
                    ${timestamp}
                </div>
            </div>
        `;

        // Add delete event listener
        if (isUser) {
            const deleteBtn = message.querySelector('.delete-message');
            deleteBtn?.addEventListener('click', () => message.remove());
        }

        chatMessages.appendChild(message);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function getResponseDelay(status) {
        switch (status) {
            case 'online':
                return Math.random() * 1000 + 500; // 0.5-1.5 seconds
            case 'away':
                return Math.random() * 3000 + 2000; // 2-5 seconds
            case 'offline':
                return Math.random() * 5000 + 10000; // 10-15 seconds
            default:
                return 1000;
        }
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
        const audioPreview = document.querySelector('.audio-preview');
        
        if (!message && !audioPreview) return;

        const activeCoach = document.querySelector('.coach-item.active');
        if (!activeCoach) {
            addMessage('<div class="text-danger">Please select a coach first</div>', false);
            return;
        }

        if (message) {
            const originalStatus = activeCoach.dataset.status;
            addMessage(message, true);
            messageInput.value = '';

            // Add responding animation (pulse) but keep the original color
            const statusDot = activeCoach.querySelector('.coach-status');

            // Simulate bot response after delay
            setTimeout(() => {
                addMessage("This is a simulated response from the bot.");

                // Remove responding animation
                statusDot.classList.remove('status-responding');

                // Only now change to online after bot responds, if was away/offline
                if (originalStatus === 'away' || originalStatus === 'offline') {
                    setCoachStatus(activeCoach.dataset.id, 'online');
                }
                // If already online, keep it green
            }, getResponseDelay(originalStatus));
        }
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
                            addMessage('<span class="text-danger">Failed to send image.</span>', false);
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

    // Handle file input change
    document.getElementById('imageUpload').addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Please upload an image file');
                return;
            }
            
            addMessage('<i class="bi bi-image"></i> <span class="text-muted">Analyzing image...</span>', true);

            const formData = new FormData();
            formData.append('action', 'vision');
            formData.append('image', file);

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

            // Clear the input
            event.target.value = '';
        }
    });

    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false;

    // Initialize audio recording
    async function initializeAudioRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            
            mediaRecorder.ondataavailable = e => {
                audioChunks.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                
                // Add preview to textarea area
                const chatInput = document.querySelector('.chat-input');
                const existingPreview = chatInput.querySelector('.audio-preview');
                if (existingPreview) {
                    existingPreview.remove();
                }

                const previewHtml = `
                    <div class="audio-preview d-flex align-items-center gap-2 my-2">
                        <i class="bi bi-mic-fill text-primary"></i>
                        <audio src="${audioUrl}" controls class="audio-message flex-grow-1"></audio>
                        <button class="btn btn-sm btn-outline-danger" onclick="this.closest('.audio-preview').remove()">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                `;
                
                chatInput.insertAdjacentHTML('afterbegin', previewHtml);

                // Reset recording state
                audioChunks = []; 
            };

            const voiceBtn = document.getElementById('voiceBtn');
            voiceBtn.addEventListener('click', () => {
                if (!isRecording) {
                    // Start recording
                    audioChunks = [];
                    mediaRecorder.start();
                    isRecording = true;
                    voiceBtn.classList.add('text-danger');
                    voiceBtn.querySelector('i').classList.replace('bi-mic-fill', 'bi-stop-fill');
                } else {
                    // Stop recording
                    mediaRecorder.stop();
                    isRecording = false;
                    voiceBtn.classList.remove('text-danger');
                    voiceBtn.querySelector('i').classList.replace('bi-stop-fill', 'bi-mic-fill');
                }
            });

        } catch (err) {
            console.error('Error accessing microphone:', err);
            const voiceBtn = document.getElementById('voiceBtn');
            voiceBtn.disabled = true;
            voiceBtn.title = "Microphone access denied";
        }
    }

    // Initial load
    loadCoachesList();
    initializeAudioRecording();
});

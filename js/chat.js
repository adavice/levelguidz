import { loadCoaches, dummyCoaches } from './clientApi.js';
import { convertToBase64, resizeImage } from './mediaUtils.js';

document.addEventListener('DOMContentLoaded', () => {
    const coachList = document.querySelector('.chatbot-list');
    const chatMessages = document.querySelector('.chat-messages');
    const messageInput = document.querySelector('textarea');
    const sendButton = document.querySelector('.chat-input button');
    const chatInput = document.querySelector('.chat-input');
    
    // Add preview container after chat input initialization
    chatInput.insertAdjacentHTML('afterbegin', `
        <div class="media-preview-container d-flex flex-wrap gap-2 my-2"></div>
    `);
    const previewContainer = chatInput.querySelector('.media-preview-container');

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

    function getStoredStatus(coachId) {
        const storedStatuses = JSON.parse(sessionStorage.getItem('coachStatuses') || '{}');
        return storedStatuses[coachId];
    }

    function storeStatus(coachId, status) {
        const storedStatuses = JSON.parse(sessionStorage.getItem('coachStatuses') || '{}');
        storedStatuses[coachId] = status;
        sessionStorage.setItem('coachStatuses', JSON.stringify(storedStatuses));
    }

    function renderCoaches(coaches) {
        coachList.innerHTML = coaches.map(coach => {
            const storedStatus = getStoredStatus(coach.id);
            const status = storedStatus || coach.status || getRandomStatus();
            if (!storedStatus) {
                storeStatus(coach.id, status);
            }
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

            if (status !== 'responding') {
                storeStatus(coachId, status);
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

    function addMessage(content, isUser = false, isAudio = false, isImage = false) {
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

        let messageContent = content;
        if (isImage) {
            messageContent = `
                <div class="d-flex align-items-center gap-2 mb-2">
                    <i class="bi bi-image text-primary"></i>
                    <img src="data:image/jpeg;base64,${content}" class="img-fluid rounded" 
                        style="max-height: 200px; cursor: pointer" 
                        onclick="window.open(this.src, '_blank')"
                        alt="Uploaded image">
                </div>
            `;
        } else if (isAudio) {
            messageContent = `
                <div class="d-flex align-items-center gap-2 mb-2">
                    <i class="bi bi-mic-fill text-primary"></i>
                    <audio src="${content}" controls class="audio-message"></audio>
                </div>
            `;
        }

        message.innerHTML = `
            <div class="message-content">
                <div class="d-flex align-items-center justify-content-between">
                    <div class="flex-grow-1">
                        ${messageContent}
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

    async function sendToGPT(message, coachId) {
        try {
            const response = await fetch('/server/chatgpt_api.pl', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'chat',
                    coach_id: coachId,
                    message: message
                })
            });
            const data = await response.json();
            return data.reply;
        } catch (error) {
            console.error('Error sending message to GPT:', error);
            throw new Error('Failed to get response from coach');
        }
    }

    async function processUserMessage(message) {
        // Simulate user message processing (typing effect)
        await new Promise(resolve => setTimeout(resolve, 500));
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
        const imagePreview = document.querySelector('.media-preview img');
        
        if (!message && !audioPreview && !imagePreview) return;

        const activeCoach = document.querySelector('.coach-item.active');
        if (!activeCoach) {
            addMessage('<div class="text-danger">Please select a coach first</div>', false);
            return;
        }

        const coachId = activeCoach.dataset.id;
        const originalStatus = activeCoach.dataset.status;
        messageInput.value = '';

        // Handle previews in order
        if (imagePreview) {
            const base64Image = imagePreview.src.split(',')[1];
            handleImageMessage(base64Image, coachId, originalStatus);
            imagePreview.closest('.media-preview').remove();
        }

        if (audioPreview) {
            handleAudioMessage(audioPreview, coachId, originalStatus);
        }

        if (message) {
            handleTextMessage(message, coachId, originalStatus);
        }
    }

    async function handleTextMessage(message, coachId, originalStatus) {
        try {
            // Process user message first
            await processUserMessage(message);
            addMessage(message, true);

            // Only show typing indicator if coach is online
            if (originalStatus === 'online') {
                setCoachStatus(coachId, 'responding');
            }

            // Get response after appropriate delay
            const delay = getResponseDelay(originalStatus);
            await new Promise(resolve => setTimeout(resolve, delay));

            const reply = await sendToGPT(message, coachId);
            addMessage(reply, false);

            // Always set status to online after successful response
            setCoachStatus(coachId, 'online');

        } catch (error) {
            addMessage(`<span class="text-danger">${error.message}</span>`, false);
            setCoachStatus(coachId, originalStatus);
        }
    }

    async function handleAudioMessage(audioPreview, coachId, originalStatus) {
        const audio = audioPreview.querySelector('audio');
        const audioBlob = await fetch(audio.src).then(r => r.blob());
        
        try {
            addMessage(audio.src, true, true);
            setCoachStatus(coachId, 'responding');

            const formData = new FormData();
            formData.append('action', 'transcribe_audio');
            formData.append('coach_id', coachId);
            formData.append('audio', audioBlob, 'audio.webm');

            const response = await fetch('/server/chatgpt_api.pl', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            if (!data || !data.text) {
                throw new Error('Invalid response from server');
            }

            // Add small delay before response
            await new Promise(resolve => setTimeout(resolve, 1000));
            const reply = await sendToGPT(data.text, coachId);
            addMessage(reply, false);
            setCoachStatus(coachId, 'online');

        } catch (error) {
            console.error('Audio processing error:', error);
            addMessage(`<span class="text-danger">Failed to process audio message: ${error.message}</span>`, false);
            setCoachStatus(coachId, originalStatus);
        } finally {
            audioPreview.remove();
        }
    }

    // Add new image message handler
    async function handleImageMessage(base64Image, coachId, originalStatus) {
        try {
            addMessage(base64Image, true, false, true);
            setCoachStatus(coachId, 'responding');

            // Convert base64 to blob
            const byteString = atob(base64Image);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: 'image/jpeg' });

            const formData = new FormData();
            formData.append('action', 'vision');
            formData.append('image', blob, 'image.jpg');

            const res = await fetch('/server/chatgpt_api.pl', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                throw new Error(`Server returned ${res.status}: ${res.statusText}`);
            }

            let data;
            try {
                const text = await res.text(); // Get response as text first
                data = JSON.parse(text); // Try to parse as JSON
            } catch (parseError) {
                console.error('Raw response:', text);
                throw new Error('Invalid response format from server');
            }

            if (data && data.reply) {
                addMessage(data.reply, false);
            } else {
                throw new Error('Missing reply in server response');
            }
            
            setCoachStatus(coachId, 'online');
        } catch (err) {
            console.error('Error handling image message:', err);
            addMessage(`<span class="text-danger">Unable to process image right now. Please try again later.</span>`, false);
            setCoachStatus(coachId, originalStatus);
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
                    try {
                        const resizedBlob = await resizeImage(file);
                        const base64Image = await convertToBase64(resizedBlob);
                        addMediaPreview(base64Image, 'image');
                    } catch (err) {
                        console.error('Error processing pasted image:', err);
                    }
                }
                event.preventDefault();
                break;
            }
        }
    });

    // Update file input handler to only show preview
    document.getElementById('imageUpload').addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Please upload an image file');
                return;
            }

            try {
                const resizedBlob = await resizeImage(file);
                const base64Image = await convertToBase64(resizedBlob);
                addMediaPreview(base64Image, 'image');
            } catch (err) {
                console.error('Error processing uploaded image:', err);
            }

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

    // Add preview handling function
    function addMediaPreview(base64Data, type = 'image') {
        const previewId = 'preview_' + Date.now();
        const previewHtml = `
            <div class="media-preview d-flex align-items-center gap-2 p-2 border rounded" id="${previewId}">
                ${type === 'image' ? `
                    <img src="data:image/jpeg;base64,${base64Data}" 
                        class="img-fluid rounded" 
                        style="max-height: 100px; max-width: 150px;"
                        alt="Preview">
                ` : ''}
                <button class="btn btn-sm btn-outline-danger" onclick="this.closest('.media-preview').remove()">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        previewContainer.insertAdjacentHTML('beforeend', previewHtml);
        return previewId;
    }

    // Initial load
    loadCoachesList();
    initializeAudioRecording();
});

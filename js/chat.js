import { loadCoaches } from './clientApi.js';
import { loadChatHistory, saveChatHistory } from './chatApi.js';
import { convertToBase64, resizeImage } from './mediaUtils.js';
import { DEFAULT_AVATAR } from './constants.js';
import { API_BASE_URL } from './config.js';
import '../js/marked.min.js'; // Import the Markdown parser

let chatHistory = new Map(); // Store chat history by coach ID
let activeCoachId = null; // Track current active coach

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
            let coaches, history;
            try {
                [coaches, history] = await Promise.all([
                    loadCoaches(),
                    loadChatHistory()
                ]);
            } catch (historyError) {
                // If error is "No user logged in", show toast and proceed with empty history
                if (historyError && historyError.message && historyError.message.includes('No user logged in')) {
                    showToast('Please log in to load your chat history.', false);
                    coaches = await loadCoaches();
                    history = [];
                } else {
                    throw historyError;
                }
            }

            if (!Array.isArray(coaches)) {
                throw new Error('Invalid coaches data');
            }

            // Initialize chat history
            chatHistory = new Map();
            if (Array.isArray(history)) {
                // Group messages by coachId into arrays
                history.forEach(item => {
                    if (!chatHistory.has(item.coachId)) {
                        chatHistory.set(item.coachId, []);
                    }
                    chatHistory.get(item.coachId).push(item);
                });
            }

            renderCoaches(coaches);

            // Check for coach param in URL
            const urlParams = new URLSearchParams(window.location.search);
            const coachIdParam = urlParams.get('coach');
            if (coachIdParam) {
                // Hide coach list
                const coachListPanel = document.querySelector('.col-lg-3');
                if (coachListPanel) coachListPanel.style.display = 'none';
                // Auto-select the coach
                const coachCard = document.querySelector(`.coach-item[data-id="${coachIdParam}"]`);
                if (coachCard) {
                    coachCard.click();
                } else {
                    // If not found, select first coach
                    const firstCoach = document.querySelector('.coach-item');
                    if (firstCoach) firstCoach.click();
                }
            } else {
                // Optionally, auto-select the first coach and restore its chat
                const firstCoach = document.querySelector('.coach-item');
                if (firstCoach) firstCoach.click();
            }
        } catch (error) {
            console.error('Error loading coaches:', error);
            chatMessages.innerHTML = `
                <div class="alert alert-danger">
                    Failed to load coaches. Please try refreshing the page.
                </div>
            `;
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
                    <div class="coach-item-avatar" style="background-image: url('${coach.avatar || DEFAULT_AVATAR}')">
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
            const typingIndicator = document.querySelector('.typing-indicator');
            const coachName = coachItem.querySelector('h6').textContent.trim();

            if (status === 'responding') {
                // Show typing indicator with coach name
                typingIndicator.querySelector('span').textContent = `${coachName} is typing...`;
                typingIndicator.classList.remove('d-none');
            } else {
                // Hide typing indicator
                typingIndicator.classList.add('d-none');
                
                if (status !== currentStatus || force) {
                    coachItem.dataset.status = status;
                    statusDot.className = `coach-status status-${status}`;
                }
            }

            // Update header status
            if (coachItem.classList.contains('active')) {
                const headerName = document.getElementById('chatCoachName');
                const headerStatus = headerName.querySelector('.coach-status');
                headerStatus.className = `coach-status status-${status === 'responding' ? currentStatus : status}`;
            }

            if (status !== 'responding') {
                storeStatus(coachId, status);
            }
        }
    }

    // Helper: Render messages for a specific coachId into the chatMessages container
function renderMessagesForCoach(coachId) {
    chatMessages.innerHTML = '';
    const coachHistory = chatHistory.get(coachId) || [];
    coachHistory.forEach(msg => {
        addMessage(
            msg.content,
            msg.isUser,
            msg.isAudio,
            msg.isImage,
            msg.timestamp
        );
    });
}

// Modified handleTextMessage to only update DOM if user is still on the same coach
async function handleTextMessage(message, coachId, originalStatus) {
    const targetCoachId = coachId;

    // Save user message to the correct chat history
    if (!chatHistory.has(targetCoachId)) chatHistory.set(targetCoachId, []);
    chatHistory.get(targetCoachId).push({
        content: message,
        isUser: true,
        timestamp: Date.now()
    });
    saveChatHistory(Array.from(chatHistory.entries()).map(([cid, msgs]) =>
        msgs.map(m => ({ ...m, coachId: cid }))
    ).flat());

    // Only render if user is still on this coach
    if (activeCoachId === targetCoachId) {
        addMessage(message, true);
    }

    try {
        if (originalStatus === 'online' && activeCoachId === targetCoachId) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            setCoachStatus(targetCoachId, 'responding');
        }

        const initialDelay = getResponseDelay(originalStatus);
        await new Promise(resolve => setTimeout(resolve, initialDelay));

        const reply = await sendToServer(message, targetCoachId);

        // Save coach reply to the correct chat history
        chatHistory.get(targetCoachId).push({
            content: reply,
            isUser: false,
            timestamp: Date.now()
        });
        saveChatHistory(Array.from(chatHistory.entries()).map(([cid, msgs]) =>
            msgs.map(m => ({ ...m, coachId: cid }))
        ).flat());

        // Only render if user is still on this coach
        if (activeCoachId === targetCoachId) {
            const typingDelay = calculateTypingDelay(reply);
            await new Promise(resolve => setTimeout(resolve, typingDelay));
            addMessage(reply, false);
            setCoachStatus(targetCoachId, 'online');
        }
        // If not, do not update DOM. When user switches back, renderMessagesForCoach will show all messages.
    } catch (error) {
        chatHistory.get(targetCoachId).push({
            content: `
                <div class="alert alert-danger mb-0">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    ${error.message}
                </div>
            `,
            isUser: false,
            timestamp: Date.now()
        });
        saveChatHistory(Array.from(chatHistory.entries()).map(([cid, msgs]) =>
            msgs.map(m => ({ ...m, coachId: cid }))
        ).flat());

        if (activeCoachId === targetCoachId) {
            addMessage(`
                <div class="alert alert-danger mb-0">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    ${error.message}
                </div>
            `, false);
            setCoachStatus(targetCoachId, originalStatus);
        }
    }
}

    function selectCoach(coachItem) {
        const newCoachId = coachItem.dataset.id;
        // Store current messages for previous coach if any
        if (activeCoachId) {
            const messages = Array.from(chatMessages.children).map(msg => ({
                content: msg.querySelector('.message-content').children[0].innerHTML,
                isUser: msg.classList.contains('user'),
                timestamp: parseInt(msg.dataset.timestamp)
            }));
            chatHistory.set(activeCoachId, messages);
            // Save chat history after switching
            saveChatHistory(Array.from(chatHistory.entries()).map(([coachId, msgs]) =>
                msgs.map(m => ({ ...m, coachId }))
            ).flat());
        }
        
        document.querySelectorAll('.coach-item').forEach(item => item.classList.remove('active'));
        coachItem.classList.add('active');

        // Update chat header with selected coach info
        const status = coachItem.dataset.status;
        const avatar = coachItem.querySelector('.coach-item-avatar').style.backgroundImage;
        const name = coachItem.querySelector('h6').textContent;
        const role = coachItem.querySelector('small').textContent;

        document.getElementById('chatCoachAvatar').style.backgroundImage = avatar;
        document.getElementById('chatCoachName').innerHTML = `${name} <div class="coach-status status-${status}"></div>`;
        document.getElementById('chatCoachRole').textContent = role;
        
        // Load chat history for selected coach
        activeCoachId = newCoachId;
        renderMessagesForCoach(newCoachId);
    }

    function addMessage(content, isUser = false, isAudio = false, isImage = false, timestamp = Date.now()) {
        const message = document.createElement('div');
        message.className = `message ${isUser ? 'user' : ''}`;
        message.dataset.timestamp = timestamp; // Store timestamp as data attribute
        
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
        } else if (!isUser && !isImage && !isAudio) {
            // Render AI (non-user) messages as Markdown
            messageContent = `<div class="ai-markdown">${marked.parse(content)}</div>`;
        }

        message.innerHTML = `
            <div class="message-content">
                <div class="d-flex align-items-center justify-content-between">
                    <div class="flex-grow-1">
                        ${messageContent}
                    </div>
                    ${deleteButton}
                </div>
                <div class="message-timestamp text-end text-muted" style="font-size: 0.8em; opacity: 0.7; margin-top: 0.25rem;">
                    ${new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
        // Save chat history after every new message
        if (activeCoachId) {
            const messages = Array.from(chatMessages.children).map(msg => ({
                content: msg.querySelector('.message-content').children[0].innerHTML,
                isUser: msg.classList.contains('user'),
                timestamp: parseInt(msg.dataset.timestamp)
            }));
            chatHistory.set(activeCoachId, messages);
            saveChatHistory(Array.from(chatHistory.entries()).map(([coachId, msgs]) =>
                msgs.map(m => ({ ...m, coachId }))
            ).flat());
        }
    }

    function getResponseDelay(status) {
        switch (status) {
            case 'online':
                return Math.random() * 1000 + 1500; // 1.5-2.5 seconds
            case 'away':
                return Math.random() * 3000 + 4000; // 4-7 seconds
            case 'offline':
                return Math.random() * 5000 + 10000; // 10-15 seconds
            default:
                return 1000;
        }
    }

    function calculateTypingDelay(text) {
        // Average typing speed: ~40 words per minute, or ~300 characters per minute
        const charactersPerSecond = 300 / 60;
        const delay = (text.length / charactersPerSecond) * 1000;
        // Cap the delay between 1 and 10 seconds
        return Math.min(Math.max(delay, 3000), 15000);
    }

    // Rename sendToGPT to sendToServer
    async function sendToServer(message, coachId) {
        try {
            const response = await fetch(`${API_BASE_URL}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'chat',
                    coach_id: coachId,
                    message: message
                })
            });

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            return data.reply;
        } catch (error) {
            console.error('Error sending message to server:', error);
            throw new Error(error.message || 'Failed to get response from coach');
        }
    }

    async function processUserMessage() {
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
        const targetCoachId = coachId;

        // Save user message to the correct chat history
        if (!chatHistory.has(targetCoachId)) chatHistory.set(targetCoachId, []);
        chatHistory.get(targetCoachId).push({
            content: message,
            isUser: true,
            timestamp: Date.now()
        });
        saveChatHistory(Array.from(chatHistory.entries()).map(([cid, msgs]) =>
            msgs.map(m => ({ ...m, coachId: cid }))
        ).flat());

        // Only render if user is still on this coach
        if (activeCoachId === targetCoachId) {
            addMessage(message, true);
        }

        try {
            if (originalStatus === 'online' && activeCoachId === targetCoachId) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                setCoachStatus(targetCoachId, 'responding');
            }

            const initialDelay = getResponseDelay(originalStatus);
            await new Promise(resolve => setTimeout(resolve, initialDelay));

            const reply = await sendToServer(message, targetCoachId);

            // Save coach reply to the correct chat history
            chatHistory.get(targetCoachId).push({
                content: reply,
                isUser: false,
                timestamp: Date.now()
            });
            saveChatHistory(Array.from(chatHistory.entries()).map(([cid, msgs]) =>
                msgs.map(m => ({ ...m, coachId: cid }))
            ).flat());

            // Only render if user is still on this coach
            if (activeCoachId === targetCoachId) {
                const typingDelay = calculateTypingDelay(reply);
                await new Promise(resolve => setTimeout(resolve, typingDelay));
                addMessage(reply, false);
                setCoachStatus(targetCoachId, 'online');
            }
            // If not, do not update DOM. When user switches back, renderMessagesForCoach will show all messages.
        } catch (error) {
            chatHistory.get(targetCoachId).push({
                content: `
                    <div class="alert alert-danger mb-0">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        ${error.message}
                    </div>
                `,
                isUser: false,
                timestamp: Date.now()
            });
            saveChatHistory(Array.from(chatHistory.entries()).map(([cid, msgs]) =>
                msgs.map(m => ({ ...m, coachId: cid }))
            ).flat());

            if (activeCoachId === targetCoachId) {
                addMessage(`
                    <div class="alert alert-danger mb-0">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        ${error.message}
                    </div>
                `, false);
                setCoachStatus(targetCoachId, originalStatus);
            }
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

            const response = await fetch(`${API_BASE_URL}`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            if (!data || !data.text) {
                console.log(data)
                throw new Error('Invalid response from server');
            }

            // Add small delay before response
            await new Promise(resolve => setTimeout(resolve, 1000));
            const reply = await sendToServer(data.text, coachId);
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
        formData.append('coach_id', coachId);  // Add this line to pass the coach ID

        const res = await fetch(`${API_BASE_URL}`, {
            method: 'POST',
            body: formData
        });

        if (!res.ok) {
            throw new Error(`Server returned ${res.status}: ${res.statusText}`);
        }

        let data;
        try {
            const text = await res.text();
            data = JSON.parse(text);
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

    // Toast utility for chat page
    function showToast(message, success = false) {
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(toastContainer);
        }
        let toast = document.createElement('div');
        toast.className = 'toast show';
        toast.setAttribute('role', 'alert');
        toast.setAttribute('data-bs-delay', '3000');
        toast.innerHTML = `
            <div class="toast-body feature-card border-0">
                <span>
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi ${success ? 'bi-check-circle-fill text-success' : 'bi-exclamation-circle-fill text-danger'}"></i>
                        <span>${message}</span>
                    </div>
                </span>
            </div>
        `;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 3500);
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

    // Add media preview function
    function addMediaPreview(src, type) {
        const previewContainer = document.querySelector('.media-preview-container');
        const existingPreview = previewContainer.querySelector('.media-preview');
        
        if (existingPreview) {
            existingPreview.remove();
        }

        const previewHtml = type === 'image' ? `
            <div class="media-preview d-flex align-items-center gap-2 my-2">
                <i class="bi bi-image text-primary"></i>
                <img src="data:image/jpeg;base64,${src}" class="img-fluid rounded" style="max-height: 100px;">
                <button class="btn btn-sm btn-outline-danger" onclick="this.closest('.media-preview').remove()">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        ` : '';

        previewContainer.insertAdjacentHTML('afterbegin', previewHtml);
    }

    let mediaRecorder = null;
    let audioChunks = [];
    let isRecording = false;
    let audioStream = null;

    async function initializeAudioRecording() {
        try {
            audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(audioStream);
            
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

            // Start recording immediately after getting permission
            audioChunks = [];
            mediaRecorder.start();
            isRecording = true;
            const voiceBtn = document.getElementById('voiceBtn');
            voiceBtn.classList.add('text-danger');
            voiceBtn.querySelector('i').classList.replace('bi-mic-fill', 'bi-stop-fill');

        } catch (err) {
            console.error('Error accessing microphone:', err);
            const voiceBtn = document.getElementById('voiceBtn');
            voiceBtn.disabled = true;
            voiceBtn.title = "Microphone access denied";
        }
    }

    // Handle voice button click
    const voiceBtn = document.getElementById('voiceBtn');
    voiceBtn.addEventListener('click', async () => {
        if (!mediaRecorder) {
            // First time clicking - request permissions and initialize
            await initializeAudioRecording();
            return;
        }

        if (isRecording) {
            // Stop recording
            mediaRecorder.stop();
            isRecording = false;
            voiceBtn.classList.remove('text-danger');
            voiceBtn.querySelector('i').classList.replace('bi-stop-fill', 'bi-mic-fill');
        } else {
            // Start another recording
            audioChunks = [];
            mediaRecorder.start();
            isRecording = true;
            voiceBtn.classList.add('text-danger');
            voiceBtn.querySelector('i').classList.replace('bi-mic-fill', 'bi-stop-fill');
        }
    });

    // Hide coach list and center chat window if coach list is hidden
    function hideCoachListAndCenterChat() {
        const coachListPanel = document.querySelector('.coach-list-panel');
        const chatPanel = document.querySelector('.chat-window-panel');
        if (coachListPanel && chatPanel) {
            coachListPanel.style.display = 'none';
            chatPanel.classList.add('justify-content-center');
            chatPanel.classList.add('align-items-center');
            chatPanel.style.margin = '0 auto';
        }
    }

    // In your loadCoachesList or wherever you hide the coach list:
    // hideCoachListAndCenterChat();

    // Just keep the initial coach list load
    loadCoachesList();
});



class MessengerApp {
    constructor() {
        this.socket = null;
        this.currentUser = null;
        this.currentRoom = 'general';
        this.isConnected = false;
        this.typingTimeout = null;
        
        this.initializeApp();
    }

    initializeApp() {
        this.bindEvents();
        this.checkAuthentication();
    }

    bindEvents() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Message input
        document.getElementById('messageInput').addEventListener('input', (e) => {
            this.handleTyping(e.target.value);
        });

        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        document.getElementById('sendMessageBtn').addEventListener('click', () => {
            this.sendMessage();
        });

        // Room creation
        document.getElementById('createRoomBtn').addEventListener('click', () => {
            this.showCreateRoomModal();
        });

        document.getElementById('createRoomForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createRoom();
        });

        document.getElementById('cancelCreateRoom').addEventListener('click', () => {
            this.hideCreateRoomModal();
        });

        // Emoji picker
        document.getElementById('emojiBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleEmojiPicker();
        });

        // Emoji selection
        document.addEventListener('click', (e) => {
            if (e.target.parentElement.id === 'emojiPicker') {
                this.insertEmoji(e.target.textContent);
            }
        });

        // Close modals on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideCreateRoomModal();
                this.hideEmojiPicker();
            } else if (!e.target.closest('#emojiPicker') && e.target.id !== 'emojiBtn') {
                this.hideEmojiPicker();
            }
        });
    }

    checkAuthentication() {
        const savedUser = localStorage.getItem('messenger_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.connectToServer();
        }
    }

    handleLogin() {
        const usernameInput = document.getElementById('usernameInput');
        const username = usernameInput.value.trim();

        if (username) {
            this.currentUser = {
                username: username,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=667eea&color=fff`
            };

            localStorage.setItem('messenger_user', JSON.stringify(this.currentUser));
            this.connectToServer();
        }
    }

    connectToServer() {
        this.socket = io();

        this.socket.on('connect', () => {
            this.isConnected = true;
            this.socket.emit('user_join', this.currentUser);
            this.showMainApp();
            UI.showNotification('اتصال برقرار شد', 'success');
        });

        this.socket.on('disconnect', () => {
            this.isConnected = false;
            UI.showNotification('اتصال قطع شد', 'error');
        });

        this.socket.on('user_joined', (user) => {
            UI.addUser(user);
            if (user.id !== this.socket.id) {
                UI.showNotification(`${user.username} به چت پیوست`, 'info');
            }
        });

        this.socket.on('user_left', (user) => {
            UI.removeUser(user.id);
            UI.showNotification(`${user.username} چت را ترک کرد`, 'info');
        });

        this.socket.on('users_update', (users) => {
            UI.updateUsersList(users);
        });

        this.socket.on('rooms_update', (rooms) => {
            UI.updateRoomsList(rooms, this.currentRoom);
        });

        this.socket.on('new_message', (message) => {
            if (message.roomId === this.currentRoom) {
                UI.addMessage(message);
            }
        });

        this.socket.on('room_messages', (data) => {
            if (data.roomId === this.currentRoom) {
                UI.loadMessages(data.messages);
            }
        });

        this.socket.on('user_typing', (data) => {
            if (data.userId !== this.socket.id && this.currentRoom === 'general') {
                UI.showTypingIndicator(data.username);
            }
        });

        this.socket.on('user_stop_typing', (data) => {
            UI.hideTypingIndicator();
        });

        this.socket.on('room_created', (room) => {
            UI.addRoom(room);
            UI.showNotification(`اتاق "${room.name}" ایجاد شد`, 'success');
        });
    }

    handleTyping(text) {
        const sendBtn = document.getElementById('sendMessageBtn');
        sendBtn.disabled = !text.trim();

        if (text.trim()) {
            this.socket.emit('typing_start', { roomId: this.currentRoom });
            
            // Clear existing timeout
            if (this.typingTimeout) {
                clearTimeout(this.typingTimeout);
            }
            
            // Set new timeout
            this.typingTimeout = setTimeout(() => {
                this.socket.emit('typing_stop', { roomId: this.currentRoom });
            }, 1000);
        } else {
            this.socket.emit('typing_stop', { roomId: this.currentRoom });
            if (this.typingTimeout) {
                clearTimeout(this.typingTimeout);
            }
        }
    }

    sendMessage() {
        const input = document.getElementById('messageInput');
        const content = input.value.trim();

        if (content && this.isConnected) {
            const messageData = {
                content: content,
                roomId: this.currentRoom,
                type: 'text'
            };

            this.socket.emit('send_message', messageData);
            input.value = '';
            document.getElementById('sendMessageBtn').disabled = true;
            
            // Stop typing indicator
            this.socket.emit('typing_stop', { roomId: this.currentRoom });
            if (this.typingTimeout) {
                clearTimeout(this.typingTimeout);
            }
        }
    }

    insertEmoji(emoji) {
        const input = document.getElementById('messageInput');
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const text = input.value;
        
        input.value = text.substring(0, start) + emoji + text.substring(end);
        input.focus();
        input.selectionStart = input.selectionEnd = start + emoji.length;
        
        // Trigger input event for typing detection
        input.dispatchEvent(new Event('input'));
        
        this.hideEmojiPicker();
    }

    showMainApp() {
        document.getElementById('loginModal').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        
        UI.setCurrentUser(this.currentUser);
        UI.setCurrentRoom('عمومی');
    }

    showCreateRoomModal() {
        document.getElementById('createRoomModal').classList.remove('hidden');
        document.getElementById('roomNameInput').focus();
    }

    hideCreateRoomModal() {
        document.getElementById('createRoomModal').classList.add('hidden');
        document.getElementById('createRoomForm').reset();
    }

    createRoom() {
        const roomNameInput = document.getElementById('roomNameInput');
        const roomName = roomNameInput.value.trim();

        if (roomName && this.isConnected) {
            this.socket.emit('create_room', { name: roomName });
            this.hideCreateRoomModal();
        }
    }

    toggleEmojiPicker() {
        const picker = document.getElementById('emojiPicker');
        picker.classList.toggle('hidden');
    }

    hideEmojiPicker() {
        document.getElementById('emojiPicker').classList.add('hidden');
    }

    joinRoom(roomId, roomName) {
        if (roomId === this.currentRoom) return;

        // Leave current room
        if (this.currentRoom !== 'general') {
            this.socket.emit('leave_room', { roomId: this.currentRoom });
        }

        // Join new room
        this.currentRoom = roomId;
        this.socket.emit('join_room', { roomId: roomId });
        
        UI.setCurrentRoom(roomName);
        UI.clearMessages();
        UI.hideTypingIndicator();
        
        // Update active room in UI
        UI.updateRoomsList(Array.from(window.app.rooms || []), roomId);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MessengerApp();
});
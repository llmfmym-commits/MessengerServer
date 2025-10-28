class UI {
    static setCurrentUser(user) {
        document.getElementById('currentUsername').textContent = user.username;
        document.getElementById('currentUserAvatar').src = user.avatar;
    }

    static setCurrentRoom(roomName) {
        document.getElementById('currentRoomName').textContent = roomName;
    }

    static updateUsersList(users) {
        const usersList = document.getElementById('usersList');
        const onlineCount = document.getElementById('onlineCount');
        
        onlineCount.textContent = users.length;
        usersList.innerHTML = '';

        users.forEach(user => {
            const userElement = this.createUserElement(user);
            usersList.appendChild(userElement);
        });
    }

    static createUserElement(user) {
        const div = document.createElement('div');
        div.className = 'user-item';
        div.innerHTML = `
            <div class="user-status"></div>
            <img src="${user.avatar}" alt="${user.username}" class="avatar">
            <div class="user-details">
                <div class="user-name">${user.username}</div>
            </div>
        `;
        return div;
    }

    static addUser(user) {
        const usersList = document.getElementById('usersList');
        const userElement = this.createUserElement(user);
        usersList.appendChild(userElement);
    }

    static removeUser(userId) {
        const users = document.querySelectorAll('.user-item');
        users.forEach(user => {
            const userName = user.querySelector('.user-name').textContent;
            // Simple removal logic - in real app, we'd have better ID matching
            if (userName === userId) {
                user.remove();
            }
        });
    }

    static updateRoomsList(rooms, activeRoomId = 'general') {
        const roomsList = document.getElementById('roomsList');
        roomsList.innerHTML = '';

        rooms.forEach(room => {
            const roomElement = this.createRoomElement(room, activeRoomId);
            roomsList.appendChild(roomElement);
        });
    }

    static createRoomElement(room, activeRoomId) {
        const div = document.createElement('div');
        div.className = `room-item ${room.id === activeRoomId ? 'active' : ''}`;
        div.innerHTML = `
            <i class="fas fa-hashtag"></i>
            <div class="room-details">
                <div class="room-name">${room.name}</div>
                <div class="room-users">${room.userCount} کاربر</div>
            </div>
        `;
        
        div.addEventListener('click', () => {
            window.app.joinRoom(room.id, room.name);
        });
        
        return div;
    }

    static addRoom(room) {
        const roomsList = document.getElementById('roomsList');
        const roomElement = this.createRoomElement(room, window.app.currentRoom);
        roomsList.appendChild(roomElement);
    }

    static loadMessages(messages) {
        const messagesList = document.getElementById('messagesList');
        messagesList.innerHTML = '';

        messages.forEach(message => {
            this.addMessage(message);
        });

        this.scrollToBottom();
    }

    static addMessage(message) {
        const messagesList = document.getElementById('messagesList');
        const messageElement = this.createMessageElement(message);
        messagesList.appendChild(messageElement);
        this.scrollToBottom();
    }

    static createMessageElement(message) {
        const div = document.createElement('div');
        const isOwn = message.userId === (window.app.socket?.id);
        
        div.className = `message ${isOwn ? 'own' : ''}`;
        div.innerHTML = `
            <img src="${message.avatar}" alt="${message.username}" class="message-avatar">
            <div class="message-content">
                <div class="message-header">
                    <span class="message-username">${message.username}</span>
                    <span class="message-time">${this.formatTime(message.timestamp)}</span>
                </div>
                <div class="message-text">${this.escapeHtml(message.content)}</div>
            </div>
        `;
        
        return div;
    }

    static clearMessages() {
        document.getElementById('messagesList').innerHTML = '';
    }

    static showTypingIndicator(username) {
        const indicator = document.getElementById('typingIndicator');
        indicator.textContent = `${username} در حال تایپ است...`;
        indicator.classList.remove('hidden');
        this.scrollToBottom();
    }

    static hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        indicator.classList.add('hidden');
    }

    static scrollToBottom() {
        const container = document.querySelector('.messages-container');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    static formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('fa-IR', { 
            hour: '2-digit', 
            minute: '2-digit'
        });
    }

    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    static showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notif => notif.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}
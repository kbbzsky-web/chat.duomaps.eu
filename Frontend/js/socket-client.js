/* ========================================
   Socket.io Client - Real-time Communication
   ======================================== */

const { getToken, showNotification, playNotificationSound } = window.DuoMapsChat;

class SocketClient {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.listeners = {};
    }

    // Connect to socket server
    connect() {
        const token = getToken();
        
        if (!token) {
            console.error('No token found. Cannot connect to socket.');
            return;
        }

        // Initialize socket connection
        this.socket = io({
            auth: {
                token: token
            },
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: this.maxReconnectAttempts
        });

        // Connection successful
        this.socket.on('connect', () => {
            console.log('✅ Socket connected');
            this.connected = true;
            this.reconnectAttempts = 0;
            this.emit('connection_status', { connected: true });
        });

        // Connection error
        this.socket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error);
            this.connected = false;
            this.reconnectAttempts++;
            
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                this.emit('connection_failed', { error: 'Max reconnection attempts reached' });
            }
        });

        // Disconnected
        this.socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            this.connected = false;
            this.emit('connection_status', { connected: false, reason });
        });

        // Reconnecting
        this.socket.on('reconnect_attempt', () => {
            console.log('Attempting to reconnect...');
        });

        // Reconnected
        this.socket.on('reconnect', (attemptNumber) => {
            console.log(`✅ Reconnected after ${attemptNumber} attempts`);
            this.connected = true;
            this.emit('reconnected', { attemptNumber });
        });

        // User online
        this.socket.on('user_online', (data) => {
            console.log('User online:', data);
            this.emit('user_online', data);
        });

        // User offline
        this.socket.on('user_offline', (data) => {
            console.log('User offline:', data);
            this.emit('user_offline', data);
        });

        // Receive message
        this.socket.on('receive_message', (data) => {
            console.log('Message received:', data);
            this.emit('receive_message', data);
            
            // Show notification if not on active chat
            if (document.hidden || !this.isActiveChatUser(data.sender_id)) {
                showNotification(
                    data.sender_username,
                    data.content,
                    '/assets/logo.png'
                );
                playNotificationSound();
            }
        });

        // Message sent confirmation
        this.socket.on('message_sent', (data) => {
            console.log('Message sent confirmation:', data);
            this.emit('message_sent', data);
        });

        // User typing
        this.socket.on('user_typing', (data) => {
            this.emit('user_typing', data);
        });

        // User stopped typing
        this.socket.on('user_stopped_typing', (data) => {
            this.emit('user_stopped_typing', data);
        });

        // Messages read
        this.socket.on('messages_read', (data) => {
            this.emit('messages_read', data);
        });

        // Message edited
        this.socket.on('message_edited', (data) => {
            this.emit('message_edited', data);
        });

        // Message deleted
        this.socket.on('message_deleted', (data) => {
            this.emit('message_deleted', data);
        });

        // Error handling
        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
            this.emit('socket_error', error);
        });
    }

    // Send message
    sendMessage(receiverId, content) {
        if (!this.connected) {
            console.error('Socket not connected');
            return false;
        }

        this.socket.emit('send_message', {
            receiverId: parseInt(receiverId),
            content: content.trim()
        });

        return true;
    }

    // Start typing indicator
    startTyping(receiverId) {
        if (!this.connected) return;
        
        this.socket.emit('typing_start', {
            receiverId: parseInt(receiverId)
        });
    }

    // Stop typing indicator
    stopTyping(receiverId) {
        if (!this.connected) return;
        
        this.socket.emit('typing_stop', {
            receiverId: parseInt(receiverId)
        });
    }

    // Mark messages as read
    markAsRead(senderId) {
        if (!this.connected) return;
        
        this.socket.emit('mark_as_read', {
            senderId: parseInt(senderId)
        });
    }

    // Edit message
    editMessage(messageId, newContent, receiverId) {
        if (!this.connected) return;
        
        this.socket.emit('edit_message', {
            messageId: parseInt(messageId),
            newContent: newContent.trim(),
            receiverId: parseInt(receiverId)
        });
    }

    // Delete message
    deleteMessage(messageId, receiverId) {
        if (!this.connected) return;
        
        this.socket.emit('delete_message', {
            messageId: parseInt(messageId),
            receiverId: parseInt(receiverId)
        });
    }

    // Disconnect
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.connected = false;
        }
    }

    // Event listener system
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    // Remove event listener
    off(event, callback) {
        if (!this.listeners[event]) return;
        
        this.listeners[event] = this.listeners[event].filter(
            listener => listener !== callback
        );
    }

    // Emit event to listeners
    emit(event, data) {
        if (!this.listeners[event]) return;
        
        this.listeners[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in ${event} listener:`, error);
            }
        });
    }

    // Check if user is in active chat
    isActiveChatUser(userId) {
        const activeChatId = sessionStorage.getItem('activeChatUserId');
        return activeChatId && parseInt(activeChatId) === parseInt(userId);
    }

    // Get connection status
    isConnected() {
        return this.connected;
    }
}

// Create singleton instance
window.socketClient = new SocketClient();

// Export for use in other scripts
window.SocketClient = SocketClient;
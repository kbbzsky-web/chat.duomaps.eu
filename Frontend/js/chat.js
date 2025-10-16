/* ========================================
   Main Chat Functionality
   ======================================== */

const {
    API_URL,
    getToken,
    removeToken,
    getCurrentUser,
    formatDate,
    formatTime,
    getInitials,
    getAvatarColor
} = window.DuoMapsChat;

const socket = window.socketClient;

// State
let currentUser = null;
let activeChat = null;
let chats = [];
let friends = [];
let typingTimeouts = {};

// DOM Elements
const chatSidebar = document.getElementById('chat-sidebar');
const chatList = document.getElementById('chat-list');
const friendsList = document.getElementById('friends-list');
const searchInput = document.getElementById('search-users');
const searchResults = document.getElementById('search-results');
const noChatSelected = document.getElementById('no-chat-selected');
const activeChat = document.getElementById('active-chat');
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const charCount = document.getElementById('char-count');
const currentUsernameEl = document.getElementById('current-username');
const currentUserInitials = document.getElementById('current-user-initials');
const currentUserAvatar = document.getElementById('current-user-avatar');
const unreadBadge = document.getElementById('unread-badge');

// Initialize
async function init() {
    try {
        // Check authentication
        const token = getToken();
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        // Get current user
        currentUser = getCurrentUser();
        
        if (!currentUser) {
            // Fetch user from API
            const response = await fetch(`${API_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                currentUser = data.user;
                window.DuoMapsChat.setCurrentUser(currentUser);
            } else {
                // Invalid token
                removeToken();
                window.location.href = 'login.html';
                return;
            }
        }

        // Update UI with current user
        updateCurrentUserUI();

        // Connect socket
        socket.connect();

        // Setup socket listeners
        setupSocketListeners();

        // Load chats
        await loadChats();

        // Load friends
        await loadFriends();

        // Setup event listeners
        setupEventListeners();

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

    } catch (error) {
        console.error('Initialization error:', error);
        alert('Fehler beim Laden der Chat-Anwendung. Bitte lade die Seite neu.');
    }
}

// Update current user UI
function updateCurrentUserUI() {
    if (currentUsernameEl) {
        currentUsernameEl.textContent = currentUser.username;
    }
    
    if (currentUserInitials) {
        currentUserInitials.textContent = getInitials(currentUser.username);
    }
    
    if (currentUserAvatar) {
        currentUserAvatar.style.background = getAvatarColor(currentUser.username);
    }
}

// Setup socket listeners
function setupSocketListeners() {
    // Connection status
    socket.on('connection_status', (data) => {
        console.log('Connection status:', data);
        // You can show a connection indicator in UI
    });

    // User online
    socket.on('user_online', (data) => {
        updateUserOnlineStatus(data.userId, true);
    });

    // User offline
    socket.on('user_offline', (data) => {
        updateUserOnlineStatus(data.userId, false);
    });

    // Receive message
    socket.on('receive_message', (message) => {
        handleReceiveMessage(message);
    });

    // Message sent confirmation
    socket.on('message_sent', (message) => {
        handleMessageSent(message);
    });

    // User typing
    socket.on('user_typing', (data) => {
        if (activeChat && activeChat.id === data.userId) {
            showTypingIndicator();
        }
    });

    // User stopped typing
    socket.on('user_stopped_typing', (data) => {
        if (activeChat && activeChat.id === data.userId) {
            hideTypingIndicator();
        }
    });

    // Messages read
    socket.on('messages_read', (data) => {
        markMessagesAsRead(data.readBy);
    });

    // Message edited
    socket.on('message_edited', (data) => {
        updateEditedMessage(data);
    });

    // Message deleted
    socket.on('message_deleted', (data) => {
        removeDeletedMessage(data.messageId);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });

    // Search input
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            searchResults.style.display = 'none';
            searchResults.innerHTML = '';
            return;
        }
        
        searchTimeout = setTimeout(() => {
            searchUsers(query);
        }, 300);
    });

    // Message input
    messageInput.addEventListener('input', (e) => {
        const length = e.target.value.length;
        charCount.textContent = `${length}/2000`;
        
        // Enable/disable send button
        sendBtn.disabled = length === 0;
        
        // Auto-resize textarea
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
        
        // Typing indicator
        if (activeChat && length > 0) {
            socket.startTyping(activeChat.id);
            
            // Clear previous timeout
            if (typingTimeouts[activeChat.id]) {
                clearTimeout(typingTimeouts[activeChat.id]);
            }
            
            // Stop typing after 3 seconds of inactivity
            typingTimeouts[activeChat.id] = setTimeout(() => {
                socket.stopTyping(activeChat.id);
            }, 3000);
        }
    });

    // Send message on Enter (without Shift)
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Send button
    sendBtn.addEventListener('click', sendMessage);

    // Settings button
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            openSettings();
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Delete account button
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', () => {
            openModal('delete-confirm-modal');
        });
    }

    // Confirm delete button
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteAccount);
    }

    // Chat options button
    const chatOptionsBtn = document.getElementById('chat-options-btn');
    if (chatOptionsBtn) {
        chatOptionsBtn.addEventListener('click', () => {
            openModal('chat-options-modal');
        });
    }

    // Add friend button
    const addFriendBtn = document.getElementById('add-friend-btn');
    if (addFriendBtn) {
        addFriendBtn.addEventListener('click', addFriend);
    }

    // Mute user button
    const muteUserBtn = document.getElementById('mute-user-btn');
    if (muteUserBtn) {
        muteUserBtn.addEventListener('click', muteUser);
    }

    // Block user button
    const blockUserBtn = document.getElementById('block-user-btn');
    if (blockUserBtn) {
        blockUserBtn.addEventListener('click', blockUser);
    }

    // Mobile back button
    const mobileBack = document.getElementById('mobile-back');
    if (mobileBack) {
        mobileBack.addEventListener('click', () => {
            closeMobileChat();
        });
    }

    // Sound notifications toggle
    const soundNotifications = document.getElementById('sound-notifications');
    if (soundNotifications) {
        soundNotifications.checked = localStorage.getItem('sound-notifications') !== 'false';
        soundNotifications.addEventListener('change', (e) => {
            localStorage.setItem('sound-notifications', e.target.checked);
        });
    }
}

// Load chats
async function loadChats() {
    try {
        const response = await fetch(`${API_URL}/messages/chats`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            chats = data.chats;
            renderChatList();
            updateUnreadBadge();
        }
    } catch (error) {
        console.error('Error loading chats:', error);
    }
}

// Render chat list
function renderChatList() {
    if (chats.length === 0) {
        chatList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comments"></i>
                <p>Noch keine Chats</p>
                <small>Suche nach Benutzern, um zu chatten</small>
            </div>
        `;
        return;
    }

    chatList.innerHTML = chats.map(chat => `
        <div class="chat-item ${chat.unread_count > 0 ? 'unread' : ''} ${activeChat && activeChat.id === chat.other_user_id ? 'active' : ''}" 
             data-user-id="${chat.other_user_id}" 
             onclick="openChat(${chat.other_user_id}, '${chat.other_username}', ${chat.is_online})">
            <div class="chat-item-avatar" style="background: ${getAvatarColor(chat.other_username)}">
                <span>${getInitials(chat.other_username)}</span>
                ${chat.is_online ? '<div class="online-dot"></div>' : ''}
            </div>
            <div class="chat-item-info">
                <div class="chat-item-header">
                    <span class="chat-item-name">${chat.other_username}</span>
                    <span class="chat-item-time">${chat.last_message_time ? formatDate(chat.last_message_time) : ''}</span>
                </div>
                <div class="chat-item-message">
                    ${chat.last_message || 'Keine Nachrichten'}
                </div>
            </div>
            ${chat.unread_count > 0 ? `<span class="chat-item-badge">${chat.unread_count}</span>` : ''}
        </div>
    `).join('');
}

// Load friends
async function loadFriends() {
    try {
        const response = await fetch(`${API_URL}/users/friends/list`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            friends = data.friends;
            renderFriendsList();
        }
    } catch (error) {
        console.error('Error loading friends:', error);
    }
}

// Render friends list
function renderFriendsList() {
    if (friends.length === 0) {
        friendsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <p>Noch keine Freunde</p>
                <small>Füge Benutzer als Freunde hinzu</small>
            </div>
        `;
        return;
    }

    friendsList.innerHTML = friends.map(friend => `
        <div class="chat-item" onclick="openChat(${friend.id}, '${friend.username}', ${friend.is_online})">
            <div class="chat-item-avatar" style="background: ${getAvatarColor(friend.username)}">
                <span>${getInitials(friend.username)}</span>
                ${friend.is_online ? '<div class="online-dot"></div>' : ''}
            </div>
            <div class="chat-item-info">
                <div class="chat-item-header">
                    <span class="chat-item-name">${friend.username}</span>
                </div>
                <div class="chat-item-message">
                    ${friend.is_online ? 'Online' : `Zuletzt online: ${formatDate(friend.last_online)}`}
                </div>
            </div>
        </div>
    `).join('');
}

// Switch tab
function switchTab(tab) {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    if (tab === 'chats') {
        chatList.style.display = 'block';
        friendsList.style.display = 'none';
    } else if (tab === 'friends') {
        chatList.style.display = 'none';
        friendsList.style.display = 'block';
    }
}

// Search users
async function searchUsers(query) {
    try {
        const response = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(query)}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            displaySearchResults(data.users);
        }
    } catch (error) {
        console.error('Error searching users:', error);
    }
}

// Display search results
function displaySearchResults(users) {
    if (users.length === 0) {
        searchResults.innerHTML = '<div class="empty-state"><p>Keine Benutzer gefunden</p></div>';
        searchResults.style.display = 'block';
        return;
    }

    searchResults.innerHTML = users.map(user => `
        <div class="search-result-item" onclick="openChat(${user.id}, '${user.username}', ${user.is_online})">
            <div class="search-result-avatar" style="background: ${getAvatarColor(user.username)}">
                <span>${getInitials(user.username)}</span>
            </div>
            <div class="search-result-info">
                <div class="search-result-name">${user.username}</div>
                <div class="search-result-status">${user.is_online ? 'Online' : 'Offline'}</div>
            </div>
        </div>
    `).join('');
    
    searchResults.style.display = 'block';
}

// Open chat
async function openChat(userId, username, isOnline) {
    // Close search results
    searchResults.style.display = 'none';
    searchInput.value = '';

    // Set active chat
    activeChat = {
        id: userId,
        username: username,
        isOnline: isOnline
    };

    // Store for notification check
    sessionStorage.setItem('activeChatUserId', userId);

    // Update UI
    noChatSelected.style.display = 'none';
    document.getElementById('active-chat').style.display = 'flex';

    // Update chat header
    document.getElementById('chat-username').textContent = username;
    document.getElementById('chat-user-initials').textContent = getInitials(username);
    document.getElementById('chat-user-avatar').style.background = getAvatarColor(username);
    
    const chatUserStatus = document.getElementById('chat-user-status');
    chatUserStatus.textContent = isOnline ? 'Online' : 'Offline';
    chatUserStatus.className = `chat-status ${isOnline ? 'online' : ''}`;

    // Load messages
    await loadMessages(userId);

    // Mark messages as read
    socket.markAsRead(userId);

    // Update chat list
    renderChatList();

    // Mobile: show chat, hide sidebar
    if (window.innerWidth <= 768) {
        document.getElementById('active-chat').style.display = 'flex';
    }

    // Focus message input
    messageInput.focus();
}

// Load messages
async function loadMessages(userId) {
    try {
        chatMessages.innerHTML = '<div class="messages-loader"><div class="spinner"></div></div>';

        const response = await fetch(`${API_URL}/messages/history/${userId}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            renderMessages(data.messages);
        }
    } catch (error) {
        console.error('Error loading messages:', error);
        chatMessages.innerHTML = '<div class="empty-state"><p>Fehler beim Laden der Nachrichten</p></div>';
    }
}

// Render messages
function renderMessages(messages) {
    if (messages.length === 0) {
        chatMessages.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comments"></i>
                <p>Noch keine Nachrichten</p>
                <small>Starte die Konversation!</small>
            </div>
        `;
        return;
    }

    let html = '';
    let lastDate = null;

    messages.forEach(message => {
        const messageDate = new Date(message.created_at).toLocaleDateString('de-DE');
        
        // Add date divider if date changed
        if (messageDate !== lastDate) {
            html += `
                <div class="date-divider">
                    <span>${messageDate}</span>
                </div>
            `;
            lastDate = messageDate;
        }

        const isSent = message.sender_id === currentUser.id;
        const username = isSent ? currentUser.username : activeChat.username;

        html += `
            <div class="message ${isSent ? 'sent' : 'received'}" data-message-id="${message.id}">
                <div class="message-avatar" style="background: ${getAvatarColor(username)}">
                    <span>${getInitials(username)}</span>
                </div>
                <div class="message-content">
                    <div class="message-bubble">
                        <div class="message-text">${escapeHtml(message.content)}</div>
                        ${message.is_edited ? '<div class="message-edited">(bearbeitet)</div>' : ''}
                    </div>
                    <div class="message-footer">
                        <span class="message-time">${formatTime(message.created_at)}</span>
                        ${isSent ? `<span class="message-status"><i class="fas fa-check${message.is_read ? '-double' : ''}" style="color: ${message.is_read ? 'var(--primary-color)' : 'inherit'}"></i></span>` : ''}
                    </div>
                    ${isSent ? `
                        <div class="message-actions">
                            <button onclick="editMessage(${message.id}, '${escapeHtml(message.content)}')">
                                <i class="fas fa-edit"></i> Bearbeiten
                            </button>
                            <button onclick="deleteMessage(${message.id})">
                                <i class="fas fa-trash"></i> Löschen
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });

    chatMessages.innerHTML = html;
    scrollToBottom();
}

// Send message
function sendMessage() {
    const content = messageInput.value.trim();
    
    if (!content || !activeChat) return;
    
    // Send via socket
    socket.sendMessage(activeChat.id, content);
    
    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    charCount.textContent = '0/2000';
    sendBtn.disabled = true;
    
    // Stop typing indicator
    socket.stopTyping(activeChat.id);
}

// Handle receive message
function handleReceiveMessage(message) {
    // If message is from active chat, append to messages
    if (activeChat && message.sender_id === activeChat.id) {
        appendMessage(message, false);
        socket.markAsRead(message.sender_id);
    }
    
    // Reload chat list
    loadChats();
}

// Handle message sent
function handleMessageSent(message) {
    // Append to messages if in active chat
    if (activeChat && message.receiver_id === activeChat.id) {
        appendMessage(message, true);
    }
    
    // Reload chat list
    loadChats();
}

// Append message to chat
function appendMessage(message, isSent) {
    const username = isSent ? currentUser.username : activeChat.username;
    
    const messageHtml = `
        <div class="message ${isSent ? 'sent' : 'received'}" data-message-id="${message.id}">
            <div class="message-avatar" style="background: ${getAvatarColor(username)}">
                <span>${getInitials(username)}</span>
            </div>
            <div class="message-content">
                <div class="message-bubble">
                    <div class="message-text">${escapeHtml(message.content)}</div>
                </div>
                <div class="message-footer">
                    <span class="message-time">${formatTime(message.created_at)}</span>
                    ${isSent ? '<span class="message-status"><i class="fas fa-check"></i></span>' : ''}
                </div>
                ${isSent ? `
                    <div class="message-actions">
                        <button onclick="editMessage(${message.id}, '${escapeHtml(message.content)}')">
                            <i class="fas fa-edit"></i> Bearbeiten
                        </button>
                        <button onclick="deleteMessage(${message.id})">
                            <i class="fas fa-trash"></i> Löschen
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    // Remove empty state if exists
    const emptyState = chatMessages.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }
    
    chatMessages.insertAdjacentHTML('beforeend', messageHtml);
    scrollToBottom();
}

// Edit message
function editMessage(messageId, currentContent) {
    const newContent = prompt('Nachricht bearbeiten:', currentContent);
    
    if (newContent && newContent.trim() !== currentContent) {
        socket.editMessage(messageId, newContent.trim(), activeChat.id);
    }
}

// Delete message
function deleteMessage(messageId) {
    if (confirm('Nachricht wirklich löschen?')) {
        socket.deleteMessage(messageId, activeChat.id);
    }
}

// Update edited message
function updateEditedMessage(data) {
    const messageEl = document.querySelector(`[data-message-id="${data.messageId}"]`);
    if (messageEl) {
        const textEl = messageEl.querySelector('.message-text');
        textEl.textContent = data.content;
        
        const bubble = messageEl.querySelector('.message-bubble');
        if (!bubble.querySelector('.message-edited')) {
            bubble.insertAdjacentHTML('beforeend', '<div class="message-edited">(bearbeitet)</div>');
        }
    }
}

// Remove deleted message
function removeDeletedMessage(messageId) {
    const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageEl) {
        messageEl.remove();
    }
}

// Show typing indicator
function showTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.style.display = 'block';
    }
}

// Hide typing indicator
function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
}

// Mark messages as read
function markMessagesAsRead(userId) {
    // Update read status in UI
    const messages = chatMessages.querySelectorAll('.message.sent .message-status i');
    messages.forEach(icon => {
        icon.className = 'fas fa-check-double';
        icon.style.color = 'var(--primary-color)';
    });
}

// Update user online status
function updateUserOnlineStatus(userId, isOnline) {
    // Update in chat list
    const chatItem = document.querySelector(`[data-user-id="${userId}"]`);
    if (chatItem) {
        const onlineDot = chatItem.querySelector('.online-dot');
        if (isOnline && !onlineDot) {
            const avatar = chatItem.querySelector('.chat-item-avatar');
            avatar.insertAdjacentHTML('beforeend', '<div class="online-dot"></div>');
        } else if (!isOnline && onlineDot) {
            onlineDot.remove();
        }
    }
    
    // Update active chat header
    if (activeChat && activeChat.id === userId) {
        const chatUserStatus = document.getElementById('chat-user-status');
        chatUserStatus.textContent = isOnline ? 'Online' : 'Offline';
        chatUserStatus.className = `chat-status ${isOnline ? 'online' : ''}`;
    }
}

// Update unread badge
function updateUnreadBadge() {
    const totalUnread = chats.reduce((sum, chat) => sum + (chat.unread_count || 0), 0);
    
    if (unreadBadge) {
        unreadBadge.textContent = totalUnread;
        unreadBadge.style.display = totalUnread > 0 ? 'inline-block' : 'none';
    }
}

// Scroll to bottom
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Open settings
function openSettings() {
    const modal = document.getElementById('settings-modal');
    document.getElementById('settings-username').textContent = currentUser.username;
    document.getElementById('settings-created').textContent = formatDate(currentUser.created_at);
    openModal('settings-modal');
}

// Add friend
async function addFriend() {
    if (!activeChat) return;
    
    try {
        const response = await fetch(`${API_URL}/users/friends/add`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ friendId: activeChat.id })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            alert('Freund hinzugefügt!');
            loadFriends();
        } else {
            alert(data.message || 'Fehler beim Hinzufügen');
        }
    } catch (error) {
        console.error('Error adding friend:', error);
    }
    
    closeModal('chat-options-modal');
}

// Mute user
async function muteUser() {
    if (!activeChat) return;
    
    try {
        const response = await fetch(`${API_URL}/users/mute`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: activeChat.id })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            alert('Benutzer stummgeschaltet!');
        } else {
            alert(data.message || 'Fehler beim Stummschalten');
        }
    } catch (error) {
        console.error('Error muting user:', error);
    }
    
    closeModal('chat-options-modal');
}

// Block user
async function blockUser() {
    if (!activeChat) return;
    
    if (!confirm(`Möchtest du ${activeChat.username} wirklich blockieren?`)) return;
    
    try {
        const response = await fetch(`${API_URL}/users/block`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: activeChat.id })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            alert('Benutzer blockiert!');
            // Close chat and reload list
            activeChat = null;
            noChatSelected.style.display = 'flex';
            document.getElementById('active-chat').style.display = 'none';
            loadChats();
        } else {
            alert(data.message || 'Fehler beim Blockieren');
        }
    } catch (error) {
        console.error('Error blocking user:', error);
    }
    
    closeModal('chat-options-modal');
}

// Delete account
async function deleteAccount() {
    const password = document.getElementById('delete-password').value;
    
    if (!password) {
        alert('Bitte gib dein Passwort ein');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/delete-account`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            alert('Account erfolgreich gelöscht!');
            logout();
        } else {
            alert(data.message || 'Fehler beim Löschen');
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        alert('Fehler beim Löschen des Accounts');
    }
}

// Logout
function logout() {
    socket.disconnect();
    removeToken();
    window.location.href = 'login.html';
}

// Modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close modal on outside click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// Focus search
function focusSearch() {
    searchInput.focus();
}

// Close mobile chat
function closeMobileChat() {
    if (window.innerWidth <= 768) {
        document.getElementById('active-chat').style.display = 'none';
    }
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    socket.disconnect();
});
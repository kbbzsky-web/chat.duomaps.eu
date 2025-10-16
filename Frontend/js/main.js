/* ========================================
   DuoMaps Team Chat - Main JavaScript
   ======================================== */

// Constants
const API_URL = window.location.origin + '/api';

// Check if user is authenticated
function isAuthenticated() {
    return localStorage.getItem('token') !== null;
}

// Get auth token
function getToken() {
    return localStorage.getItem('token');
}

// Set auth token
function setToken(token) {
    localStorage.setItem('token', token);
}

// Remove auth token
function removeToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

// Get current user
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Set current user
function setCurrentUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

// Redirect based on auth status
function handleAuthRedirect() {
    const currentPath = window.location.pathname;
    const isAuth = isAuthenticated();
    
    // If authenticated and on auth pages, redirect to chat
    if (isAuth && (currentPath.includes('login.html') || currentPath.includes('register.html'))) {
        window.location.href = 'chat.html';
        return;
    }
    
    // If not authenticated and on chat page, redirect to login
    if (!isAuth && currentPath.includes('chat.html')) {
        window.location.href = 'login.html';
        return;
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', () => {
    handleAuthRedirect();
});

// Password toggle function
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentElement.querySelector('.toggle-password');
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return 'Gerade eben';
    if (minutes < 60) return `vor ${minutes} Min.`;
    if (hours < 24) return `vor ${hours} Std.`;
    if (days < 7) return `vor ${days} Tag${days > 1 ? 'en' : ''}`;
    
    return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Format time
function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Get initials from username
function getInitials(username) {
    return username.substring(0, 2).toUpperCase();
}

// Get color for avatar
function getAvatarColor(username) {
    const colors = [
        '#2563eb', '#7c3aed', '#db2777', '#dc2626',
        '#ea580c', '#ca8a04', '#16a34a', '#0891b2'
    ];
    
    const index = username.charCodeAt(0) % colors.length;
    return colors[index];
}

// Show notification
function showNotification(title, body, icon = '/assets/logo.png') {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return;
    }
    
    if (Notification.permission === 'granted') {
        new Notification(title, { body, icon });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification(title, { body, icon });
            }
        });
    }
}

// Play notification sound
function playNotificationSound() {
    const soundEnabled = localStorage.getItem('sound-notifications') !== 'false';
    if (!soundEnabled) return;
    
    // Create audio element
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTgJGGi67OmfSwgMUKjo7rdkHQU7k9jzzHkqBSV4yO/bjkIKFV+06+qnVBILSKDh8sFuIQYqgM7y2Ik4CRhpvOzqn0sJDlGo6e+5ZB0GOpHY8s15KwUkeMjv3I9CAhVfu+vqp1UTCkih4fO/bSEGKn/O8tmJOAoYabzs6Z9LCg5SqOnvuWQeBjqR2PLNeSkFJXjH79uOQgIWX7zp6qdVEgxHn+Hzv2wiBit/zvLZiTgKGGm87OmfTAsOUqjp77pkHgY6kdny'
    );
    audio.volume = 0.5;
    audio.play().catch(err => console.log('Audio play failed:', err));
}

// Export functions for use in other scripts
window.DuoMapsChat = {
    API_URL,
    isAuthenticated,
    getToken,
    setToken,
    removeToken,
    getCurrentUser,
    setCurrentUser,
    formatDate,
    formatTime,
    getInitials,
    getAvatarColor,
    showNotification,
    playNotificationSound
};
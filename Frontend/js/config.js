/* ========================================
   Configuration JavaScript
   ======================================== */

window.DuoMapsChat = {
    // API URL - Passe dies an deine Backend-Adresse an
    API_URL: 'http://localhost:3000/api',  // Für lokale Entwicklung
    // Für Production verwende:
    // API_URL: 'http://82.165.195.195:3000/api',
    
    // Token Management
    setToken: (token) => {
        localStorage.setItem('token', token);
    },
    
    getToken: () => {
        return localStorage.getItem('token');
    },
    
    removeToken: () => {
        localStorage.removeItem('token');
    },
    
    // User Management
    setCurrentUser: (user) => {
        localStorage.setItem('currentUser', JSON.stringify(user));
    },
    
    getCurrentUser: () => {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    },
    
    removeCurrentUser: () => {
        localStorage.removeItem('currentUser');
    }
};
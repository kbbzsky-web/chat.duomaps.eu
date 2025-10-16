// Helper Functions

// Datum formatieren
const formatDate = (date) => {
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(date).toLocaleDateString('de-DE', options);
};

// Relativen Zeitstempel erstellen
const getRelativeTime = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Gerade eben';
  if (minutes < 60) return `vor ${minutes} Minute${minutes > 1 ? 'n' : ''}`;
  if (hours < 24) return `vor ${hours} Stunde${hours > 1 ? 'n' : ''}`;
  if (days < 7) return `vor ${days} Tag${days > 1 ? 'en' : ''}`;
  
  return formatDate(date);
};

// Text kürzen
const truncateText = (text, maxLength = 50) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Validierung: Ist String leer?
const isEmpty = (str) => {
  return !str || str.trim().length === 0;
};

// Initials aus Username erstellen
const getInitials = (username) => {
  return username.substring(0, 2).toUpperCase();
};

// Zufällige Farbe für Avatar generieren
const getRandomColor = (username) => {
  const colors = [
    '#3498db', '#2ecc71', '#e74c3c', '#f39c12', 
    '#9b59b6', '#1abc9c', '#34495e', '#e67e22'
  ];
  
  const index = username.charCodeAt(0) % colors.length;
  return colors[index];
};

// Passwort-Stärke prüfen
const checkPasswordStrength = (password) => {
  let strength = 0;
  
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  
  if (strength <= 2) return 'schwach';
  if (strength <= 4) return 'mittel';
  return 'stark';
};

module.exports = {
  formatDate,
  getRelativeTime,
  truncateText,
  isEmpty,
  getInitials,
  getRandomColor,
  checkPasswordStrength
};
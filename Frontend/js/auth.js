/* ========================================
   Authentication JavaScript
   ======================================== */

// Show alert
function showAlert(message, type = 'error') {
    const container = document.getElementById('alert-container');
    if (!container) return;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Password strength checker
function checkPasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    if (strength <= 2) return { level: 'weak', text: 'Schwach', class: 'weak' };
    if (strength <= 4) return { level: 'medium', text: 'Mittel', class: 'medium' };
    return { level: 'strong', text: 'Stark', class: 'strong' };
}

// Update password strength indicator
function updatePasswordStrength() {
    const passwordInput = document.getElementById('password');
    const strengthFill = document.getElementById('strength-fill');
    const strengthText = document.getElementById('strength-text');
    
    if (!passwordInput || !strengthFill || !strengthText) return;
    
    const password = passwordInput.value;
    
    if (password.length === 0) {
        strengthFill.style.width = '0';
        strengthFill.className = 'strength-fill';
        strengthText.textContent = 'Passwort eingeben';
        return;
    }
    
    const strength = checkPasswordStrength(password);
    strengthFill.className = `strength-fill ${strength.class}`;
    strengthText.textContent = `Passwortstärke: ${strength.text}`;
}

// Login Form
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('login-btn');
        const btnText = loginBtn.querySelector('span');
        const spinner = loginBtn.querySelector('.spinner');
        
        // Validation
        if (!username || !password) {
            showAlert('Bitte fülle alle Felder aus');
            return;
        }
        
        // Loading state
        loginBtn.disabled = true;
        btnText.style.display = 'none';
        spinner.style.display = 'block';
        
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // Save token and user
                setToken(data.token);
                setCurrentUser(data.user);
                
                showAlert('Anmeldung erfolgreich! Weiterleitung...', 'success');
                
                // Redirect to chat
                setTimeout(() => {
                    window.location.href = 'chat.html';
                }, 1000);
            } else {
                showAlert(data.message || 'Anmeldung fehlgeschlagen');
            }
        } catch (error) {
            console.error('Login error:', error);
            showAlert('Verbindungsfehler. Bitte versuche es später erneut.');
        } finally {
            loginBtn.disabled = false;
            btnText.style.display = 'inline';
            spinner.style.display = 'none';
        }
    });
}

// Register Form
const registerForm = document.getElementById('register-form');
if (registerForm) {
    const passwordInput = document.getElementById('password');
    
    // Password strength listener
    if (passwordInput) {
        passwordInput.addEventListener('input', updatePasswordStrength);
    }
    
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('password-confirm').value;
        const terms = document.getElementById('terms').checked;
        const registerBtn = document.getElementById('register-btn');
        const btnText = registerBtn.querySelector('span');
        const spinner = registerBtn.querySelector('.spinner');
        
        // Validation
        if (!username || !password || !passwordConfirm) {
            showAlert('Bitte fülle alle Felder aus');
            return;
        }
        
        if (username.length < 3 || username.length > 20) {
            showAlert('Benutzername muss zwischen 3 und 20 Zeichen lang sein');
            return;
        }
        
        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            showAlert('Benutzername darf nur Buchstaben, Zahlen, _ und - enthalten');
            return;
        }
        
        if (password.length < 6) {
            showAlert('Passwort muss mindestens 6 Zeichen lang sein');
            return;
        }
        
        if (password !== passwordConfirm) {
            showAlert('Passwörter stimmen nicht überein');
            return;
        }
        
        if (!terms) {
            showAlert('Bitte akzeptiere die Nutzungsbedingungen');
            return;
        }
        
        // Loading state
        registerBtn.disabled = true;
        btnText.style.display = 'none';
        spinner.style.display = 'block';
        
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // Save token and user
                setToken(data.token);
                setCurrentUser(data.user);
                
                showAlert('Registrierung erfolgreich! Weiterleitung...', 'success');
                
                // Redirect to chat
                setTimeout(() => {
                    window.location.href = 'chat.html';
                }, 1000);
            } else {
                if (data.errors && data.errors.length > 0) {
                    showAlert(data.errors[0].msg);
                } else {
                    showAlert(data.message || 'Registrierung fehlgeschlagen');
                }
            }
        } catch (error) {
            console.error('Register error:', error);
            showAlert('Verbindungsfehler. Bitte versuche es später erneut.');
        } finally {
            registerBtn.disabled = false;
            btnText.style.display = 'inline';
            spinner.style.display = 'none';
        }
    });
}

// Check if already logged in
if (getToken() && (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html'))) {
    window.location.href = 'chat.html';
}
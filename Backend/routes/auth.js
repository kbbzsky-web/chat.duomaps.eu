const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Rate Limiter für Login/Register
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 10, // Max 10 Anfragen
  message: 'Zu viele Anfragen, bitte später erneut versuchen'
});

// JWT Token erstellen
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// @route   POST /api/auth/register
// @desc    Benutzer registrieren
// @access  Public
router.post('/register', [
  authLimiter,
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Benutzername muss zwischen 3 und 20 Zeichen lang sein')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Benutzername darf nur Buchstaben, Zahlen, _ und - enthalten'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Passwort muss mindestens 6 Zeichen lang sein')
], async (req, res) => {
  try {
    // Validierung prüfen
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { username, password } = req.body;

    // Prüfen ob Benutzername existiert
    const userExists = await User.exists(username);
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Benutzername bereits vergeben'
      });
    }

    // Benutzer erstellen
    const userId = await User.create(username, password);

    // Token generieren
    const token = generateToken(userId);

    res.status(201).json({
      success: true,
      message: 'Registrierung erfolgreich',
      token,
      user: {
        id: userId,
        username
      }
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({
      success: false,
      message: 'Serverfehler bei der Registrierung'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Benutzer anmelden
// @access  Public
router.post('/login', [
  authLimiter,
  body('username').trim().notEmpty().withMessage('Benutzername erforderlich'),
  body('password').notEmpty().withMessage('Passwort erforderlich')
], async (req, res) => {
  try {
    // Validierung prüfen
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { username, password } = req.body;

    // Benutzer finden
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Ungültige Anmeldedaten'
      });
    }

    // Passwort überprüfen
    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Ungültige Anmeldedaten'
      });
    }

    // Online-Status aktualisieren
    await User.updateOnlineStatus(user.id, true);

    // Token generieren
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Anmeldung erfolgreich',
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Serverfehler bei der Anmeldung'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Benutzer abmelden
// @access  Private
router.post('/logout', auth, async (req, res) => {
  try {
    // Online-Status aktualisieren
    await User.updateOnlineStatus(req.user.id, false);

    res.json({
      success: true,
      message: 'Erfolgreich abgemeldet'
    });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({
      success: false,
      message: 'Serverfehler beim Abmelden'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Aktuellen Benutzer abrufen
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Benutzer nicht gefunden'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        created_at: user.created_at,
        is_online: user.is_online,
        last_online: user.last_online
      }
    });
  } catch (error) {
    console.error('Get Me Error:', error);
    res.status(500).json({
      success: false,
      message: 'Serverfehler'
    });
  }
});

// @route   DELETE /api/auth/delete-account
// @desc    Account löschen
// @access  Private
router.delete('/delete-account', [
  auth,
  body('password').notEmpty().withMessage('Passwort erforderlich')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { password } = req.body;

    // Benutzer finden
    const user = await User.findById(req.user.id);

    // Passwort überprüfen
    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Falsches Passwort'
      });
    }

    // Account löschen
    await User.delete(req.user.id);

    res.json({
      success: true,
      message: 'Account erfolgreich gelöscht'
    });
  } catch (error) {
    console.error('Delete Account Error:', error);
    res.status(500).json({
      success: false,
      message: 'Serverfehler beim Löschen des Accounts'
    });
  }
});

module.exports = router;
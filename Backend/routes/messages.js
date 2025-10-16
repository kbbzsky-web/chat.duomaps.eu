const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const Friendship = require('../models/Friendship');

// @route   GET /api/messages/chats
// @desc    Alle Chats abrufen
// @access  Private
router.get('/chats', auth, async (req, res) => {
  try {
    const chats = await Message.getUserChats(req.user.id);

    res.json({
      success: true,
      chats
    });
  } catch (error) {
    console.error('Get Chats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Serverfehler beim Abrufen der Chats'
    });
  }
});

// @route   GET /api/messages/history/:userId
// @desc    Chat-Verlauf mit einem Benutzer abrufen
// @access  Private
router.get('/history/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    // Prüfen ob blockiert
    const isBlocked = await Friendship.isBlocked(req.user.id, userId);
    const isBlockedBy = await Friendship.isBlocked(userId, req.user.id);

    if (isBlocked || isBlockedBy) {
      return res.status(403).json({
        success: false,
        message: 'Chat nicht verfügbar'
      });
    }

    const messages = await Message.getChatHistory(req.user.id, userId, limit);

    // Nachrichten als gelesen markieren
    await Message.markAsRead(userId, req.user.id);

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Get Chat History Error:', error);
    res.status(500).json({
      success: false,
      message: 'Serverfehler beim Abrufen des Chat-Verlaufs'
    });
  }
});

// @route   POST /api/messages/send
// @desc    Nachricht senden
// @access  Private
router.post('/send', [
  auth,
  body('receiverId').notEmpty().withMessage('Empfänger-ID erforderlich'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Nachricht darf nicht leer sein')
    .isLength({ max: 2000 })
    .withMessage('Nachricht zu lang (max. 2000 Zeichen)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { receiverId, content } = req.body;

    // Prüfen ob blockiert
    const isBlocked = await Friendship.isBlocked(req.user.id, receiverId);
    const isBlockedBy = await Friendship.isBlocked(receiverId, req.user.id);

    if (isBlocked || isBlockedBy) {
      return res.status(403).json({
        success: false,
        message: 'Nachricht kann nicht gesendet werden'
      });
    }

    const messageId = await Message.create(req.user.id, receiverId, content);

    res.json({
      success: true,
      message: 'Nachricht gesendet',
      messageId
    });
  } catch (error) {
    console.error('Send Message Error:', error);
    res.status(500).json({
      success: false,
      message: 'Serverfehler beim Senden der Nachricht'
    });
  }
});

// @route   PUT /api/messages/:messageId
// @desc    Nachricht bearbeiten
// @access  Private
router.put('/:messageId', [
  auth,
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Nachricht darf nicht leer sein')
    .isLength({ max: 2000 })
    .withMessage('Nachricht zu lang')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { messageId } = req.params;
    const { content } = req.body;

    await Message.update(messageId, req.user.id, content);

    res.json({
      success: true,
      message: 'Nachricht erfolgreich bearbeitet'
    });
  } catch (error) {
    console.error('Update Message Error:', error);
    res.status(500).json({
      success: false,
      message: 'Serverfehler beim Bearbeiten der Nachricht'
    });
  }
});

// @route   DELETE /api/messages/:messageId
// @desc    Nachricht löschen
// @access  Private
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;

    await Message.delete(messageId, req.user.id);

    res.json({
      success: true,
      message: 'Nachricht erfolgreich gelöscht'
    });
  } catch (error) {
    console.error('Delete Message Error:', error);
    res.status(500).json({
      success: false,
      message: 'Serverfehler beim Löschen der Nachricht'
    });
  }
});

// @route   POST /api/messages/mark-read/:senderId
// @desc    Nachrichten als gelesen markieren
// @access  Private
router.post('/mark-read/:senderId', auth, async (req, res) => {
  try {
    const { senderId } = req.params;

    await Message.markAsRead(senderId, req.user.id);

    res.json({
      success: true,
      message: 'Nachrichten als gelesen markiert'
    });
  } catch (error) {
    console.error('Mark Read Error:', error);
    res.status(500).json({
      success: false,
      message: 'Serverfehler'
    });
  }
});

// @route   GET /api/messages/unread-count
// @desc    Anzahl ungelesener Nachrichten
// @access  Private
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Message.getUnreadCount(req.user.id);

    res.json({
      success: true,
      unreadCount: count
    });
  } catch (error) {
    console.error('Get Unread Count Error:', error);
    res.status(500).json({
      success: false,
      message: 'Serverfehler'
    });
  }
});

module.exports = router;
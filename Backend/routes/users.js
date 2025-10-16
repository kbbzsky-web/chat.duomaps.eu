const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Friendship = require('../models/Friendship');

// @route   GET /api/users/search
// @desc    Benutzer suchen
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Suchbegriff muss mindestens 2 Zeichen lang sein'
      });
    }

    const users = await User.searchUsers(q, req.user.id);

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Search Users Error:', error);
    res.status(500).json({
      success: false,
      message: 'Serverfehler bei der Benutzersuche'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Benutzer per ID abrufen
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Benutzer nicht gefunden'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get User Error:', error);
    res.status(500).json({
      success: false,
      message: 'Serverfehler'
    });
  }
});

// @route   POST /api/users/friends/add
// @desc    Freund hinzufügen
// @access  Private
router.post('/friends/add', auth, async (req, res) => {
  try {
    const { friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({
        success: false,
        message: 'Freund-ID erforderlich'
      });
    }

    if (friendId == req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Du kannst dich nicht selbst als Freund hinzufügen'
      });
    }

    // Prüfen ob blockiert
    const isBlocked = await Friendship.isBlocked(req.user.id, friendId);
    if (isBlocked) {
      return res.status(400).json({
        success: false,
        message: 'Du hast diesen Benutzer blockiert'
      });
    }

    await Friendship.addFriend(req.user.id, friendId);

    res.json({
      success: true,
      message: 'Freund erfolgreich hinzugefügt'
    });
  } catch (error) {
    console.error('Add Friend Error:', error);
    res.status(500).json({
      success: false,
      message: 'Serverfehler beim Hinzufügen des Freundes'
    });
  }
});

// @route   DELETE /api/users/friends/:friendId
// @desc    Freund entfernen
// @access  Private
router.delete('/friends/:friendId', auth, async (req, res) => {
  try {
    await Friendship.removeFriend(req.user.id, req.params.friendId);

    res.json({
      success: true,
      message: 'Freund erfolgreich entfernt'
    });
  } catch (error) {
    console.error('Remove Friend Error:', error);
    res.status(500).json({
      success: false,
      message: 'Serverfehler beim Entfernen des Freundes'
    });
  }
});

// @route   GET /api/users/friends
// @desc    Freunde abrufen
// @access  Private
router.get('/friends/list', auth, async (req, res) => {
  try {
    const friends = await Friendship.getFriends(req.user.id);

    res.json({
      success: true,
      friends
    });
  } catch (error) {
    console.error('Get Friends Error:', error);
    res.status(500).json({
      success: false,
      message: 'Serverfehler beim Abrufen der Freunde'
    });
  }
});

// @route   POST /api/users/block
// @desc    Benutzer blockieren
// @access  Private
router.post('/block', auth, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Benutzer-ID erforderlich'
      });
    }

    await Friendship.blockUser(req.user.id, userId);

    res.json({
      success: true,
      message: 'Benutzer erfolgreich blockiert'
    });
  } catch (error) {
    console.error('Block User Error:', error);
    res.status(500).json({
      success: false,
      message: 'Serverfehler beim Blockieren'
    });
  }
});

// @route   DELETE /api/users/block/:userId
// @desc    Benutzer entblocken
// @access  Private
router.delete('/block/:userId', auth, async (req, res) => {
  try {
    await Friendship.unblockUser(req.user.id, req.params.userId);

    res.json({
      success: true,
      message: 'Blockierung erfolgreich aufgehoben'
    });
  } catch (error) {
    console.error('Unblock User Error:', error);
    res.status(500).json({
      success: false,
      message: 'Serverfehler beim Entblocken'
    });
  }
});

// @route   GET /api/users/blocked
// @desc    Blockierte Benutzer abrufen
// @access  Private
router.get('/blocked/list', auth, async (req, res) => {
  try {
    const blockedUsers = await Friendship.getBlockedUsers(req.user.id);

    res.json({
      success: true,
      blockedUsers
    });
  } catch (error) {
    console.error('Get Blocked Users Error:', error);
    res.status(500).json({
      success: false,
      message: 'Serverfehler'
    });
  }
});

// @route   POST /api/users/mute
// @desc    Benutzer stummschalten
// @access  Private
router.post('/mute', auth, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Benutzer-ID erforderlich'
      });
    }

    await Friendship.muteUser(req.user.id, userId);

    res.json({
      success: true,
      message: 'Benutzer erfolgreich stummgeschaltet'
    });
  } catch (error) {
    console.error('Mute User Error:', error);
    res.status(500).json({
      success: false,
      message: 'Serverfehler beim Stummschalten'
    });
  }
});

// @route   DELETE /api/users/mute/:userId
// @desc    Stummschaltung aufheben
// @access  Private
router.delete('/mute/:userId', auth, async (req, res) => {
  try {
    await Friendship.unmuteUser(req.user.id, req.params.userId);

    res.json({
      success: true,
      message: 'Stummschaltung erfolgreich aufgehoben'
    });
  } catch (error) {
    console.error('Unmute User Error:', error);
    res.status(500).json({
      success: false,
      message: 'Serverfehler'
    });
  }
});

// @route   GET /api/users/muted
// @desc    Stummgeschaltete Benutzer abrufen
// @access  Private
router.get('/muted/list', auth, async (req, res) => {
  try {
    const mutedUsers = await Friendship.getMutedUsers(req.user.id);

    res.json({
      success: true,
      mutedUsers
    });
  } catch (error) {
    console.error('Get Muted Users Error:', error);
    res.status(500).json({
      success: false,
      message: 'Serverfehler'
    });
  }
});

module.exports = router;
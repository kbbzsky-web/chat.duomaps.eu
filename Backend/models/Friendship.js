const db = require('../config/db');

class Friendship {
  // Freund hinzufügen
  static async addFriend(userId, friendId) {
    try {
      await db.execute(
        'INSERT INTO friendships (user_id, friend_id, status, created_at) VALUES (?, ?, "accepted", NOW())',
        [userId, friendId]
      );
    } catch (error) {
      throw error;
    }
  }

  // Freunde abrufen
  static async getFriends(userId) {
    try {
      const [rows] = await db.execute(
        `SELECT u.id, u.username, u.is_online, u.last_online
         FROM friendships f
         JOIN users u ON f.friend_id = u.id
         WHERE f.user_id = ? AND f.status = 'accepted'`,
        [userId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Freundschaft entfernen
  static async removeFriend(userId, friendId) {
    try {
      await db.execute(
        'DELETE FROM friendships WHERE user_id = ? AND friend_id = ?',
        [userId, friendId]
      );
    } catch (error) {
      throw error;
    }
  }

  // Benutzer blockieren
  static async blockUser(userId, blockedId) {
    try {
      await db.execute(
        'INSERT INTO blocks (user_id, blocked_user_id, created_at) VALUES (?, ?, NOW())',
        [userId, blockedId]
      );
    } catch (error) {
      throw error;
    }
  }

  // Benutzer entblocken
  static async unblockUser(userId, blockedId) {
    try {
      await db.execute(
        'DELETE FROM blocks WHERE user_id = ? AND blocked_user_id = ?',
        [userId, blockedId]
      );
    } catch (error) {
      throw error;
    }
  }

  // Blockierte Benutzer abrufen
  static async getBlockedUsers(userId) {
    try {
      const [rows] = await db.execute(
        `SELECT u.id, u.username
         FROM blocks b
         JOIN users u ON b.blocked_user_id = u.id
         WHERE b.user_id = ?`,
        [userId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Prüfen ob blockiert
  static async isBlocked(userId, otherUserId) {
    try {
      const [rows] = await db.execute(
        'SELECT COUNT(*) as count FROM blocks WHERE user_id = ? AND blocked_user_id = ?',
        [userId, otherUserId]
      );
      return rows[0].count > 0;
    } catch (error) {
      throw error;
    }
  }

  // Benutzer stummschalten
  static async muteUser(userId, mutedId) {
    try {
      await db.execute(
        'INSERT INTO mutes (user_id, muted_user_id, created_at) VALUES (?, ?, NOW())',
        [userId, mutedId]
      );
    } catch (error) {
      throw error;
    }
  }

  // Stummschaltung aufheben
  static async unmuteUser(userId, mutedId) {
    try {
      await db.execute(
        'DELETE FROM mutes WHERE user_id = ? AND muted_user_id = ?',
        [userId, mutedId]
      );
    } catch (error) {
      throw error;
    }
  }

  // Stummgeschaltete Benutzer abrufen
  static async getMutedUsers(userId) {
    try {
      const [rows] = await db.execute(
        `SELECT u.id, u.username
         FROM mutes m
         JOIN users u ON m.muted_user_id = u.id
         WHERE m.user_id = ?`,
        [userId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Prüfen ob stummgeschaltet
  static async isMuted(userId, otherUserId) {
    try {
      const [rows] = await db.execute(
        'SELECT COUNT(*) as count FROM mutes WHERE user_id = ? AND muted_user_id = ?',
        [userId, otherUserId]
      );
      return rows[0].count > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Friendship;
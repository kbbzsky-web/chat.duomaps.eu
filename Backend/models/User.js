const db = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
  // Benutzer erstellen
  static async create(username, password) {
    try {
      // Passwort hashen
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const [result] = await db.execute(
        'INSERT INTO users (username, password, created_at) VALUES (?, ?, NOW())',
        [username, hashedPassword]
      );

      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // Benutzer per Username finden
  static async findByUsername(username) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Benutzer per ID finden
  static async findById(id) {
    try {
      const [rows] = await db.execute(
        'SELECT id, username, created_at, last_online, is_online FROM users WHERE id = ?',
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Passwort überprüfen
  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Online-Status aktualisieren
  static async updateOnlineStatus(userId, isOnline) {
    try {
      await db.execute(
        'UPDATE users SET is_online = ?, last_online = NOW() WHERE id = ?',
        [isOnline ? 1 : 0, userId]
      );
    } catch (error) {
      throw error;
    }
  }

  // Benutzer löschen
  static async delete(userId) {
    try {
      await db.execute('DELETE FROM users WHERE id = ?', [userId]);
    } catch (error) {
      throw error;
    }
  }

  // Alle Benutzer suchen (außer aktueller Benutzer)
  static async searchUsers(searchTerm, currentUserId) {
    try {
      const [rows] = await db.execute(
        `SELECT id, username, is_online, last_online 
         FROM users 
         WHERE username LIKE ? AND id != ? 
         LIMIT 50`,
        [`%${searchTerm}%`, currentUserId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Benutzer existiert
  static async exists(username) {
    try {
      const [rows] = await db.execute(
        'SELECT COUNT(*) as count FROM users WHERE username = ?',
        [username]
      );
      return rows[0].count > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;
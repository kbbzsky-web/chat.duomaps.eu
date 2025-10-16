const db = require('../config/db');

class Message {
  // Nachricht senden
  static async create(senderId, receiverId, content) {
    try {
      const [result] = await db.execute(
        `INSERT INTO messages (sender_id, receiver_id, content, created_at, is_read) 
         VALUES (?, ?, ?, NOW(), 0)`,
        [senderId, receiverId, content]
      );
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // Chat-Verlauf abrufen
  static async getChatHistory(user1Id, user2Id, limit = 50) {
    try {
      const [rows] = await db.execute(
        `SELECT m.*, 
                u1.username as sender_username,
                u2.username as receiver_username
         FROM messages m
         JOIN users u1 ON m.sender_id = u1.id
         JOIN users u2 ON m.receiver_id = u2.id
         WHERE (m.sender_id = ? AND m.receiver_id = ?) 
            OR (m.sender_id = ? AND m.receiver_id = ?)
         ORDER BY m.created_at DESC
         LIMIT ?`,
        [user1Id, user2Id, user2Id, user1Id, limit]
      );
      return rows.reverse();
    } catch (error) {
      throw error;
    }
  }

  // Alle Chats eines Benutzers abrufen
  static async getUserChats(userId) {
    try {
      const [rows] = await db.execute(
        `SELECT DISTINCT 
                CASE 
                  WHEN m.sender_id = ? THEN m.receiver_id 
                  ELSE m.sender_id 
                END as other_user_id,
                u.username as other_username,
                u.is_online,
                u.last_online,
                (SELECT content FROM messages m2 
                 WHERE (m2.sender_id = ? AND m2.receiver_id = other_user_id) 
                    OR (m2.sender_id = other_user_id AND m2.receiver_id = ?)
                 ORDER BY created_at DESC LIMIT 1) as last_message,
                (SELECT created_at FROM messages m2 
                 WHERE (m2.sender_id = ? AND m2.receiver_id = other_user_id) 
                    OR (m2.sender_id = other_user_id AND m2.receiver_id = ?)
                 ORDER BY created_at DESC LIMIT 1) as last_message_time,
                (SELECT COUNT(*) FROM messages m3 
                 WHERE m3.receiver_id = ? AND m3.sender_id = other_user_id 
                 AND m3.is_read = 0) as unread_count
         FROM messages m
         JOIN users u ON (CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END = u.id)
         WHERE m.sender_id = ? OR m.receiver_id = ?
         ORDER BY last_message_time DESC`,
        [userId, userId, userId, userId, userId, userId, userId, userId, userId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Nachrichten als gelesen markieren
  static async markAsRead(senderId, receiverId) {
    try {
      await db.execute(
        'UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0',
        [senderId, receiverId]
      );
    } catch (error) {
      throw error;
    }
  }

  // Ungelesene Nachrichten zählen
  static async getUnreadCount(userId) {
    try {
      const [rows] = await db.execute(
        'SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = 0',
        [userId]
      );
      return rows[0].count;
    } catch (error) {
      throw error;
    }
  }

  // Nachricht löschen
  static async delete(messageId, userId) {
    try {
      await db.execute(
        'DELETE FROM messages WHERE id = ? AND sender_id = ?',
        [messageId, userId]
      );
    } catch (error) {
      throw error;
    }
  }

  // Nachricht bearbeiten
  static async update(messageId, userId, newContent) {
    try {
      await db.execute(
        'UPDATE messages SET content = ?, is_edited = 1 WHERE id = ? AND sender_id = ?',
        [newContent, messageId, userId]
      );
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Message;
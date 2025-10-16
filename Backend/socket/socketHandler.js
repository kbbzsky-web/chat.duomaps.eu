const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Friendship = require('../models/Friendship');

const socketHandler = (io) => {
  // Online Benutzer speichern
  const onlineUsers = new Map(); // userId -> socketId

  // Socket.io Middleware für Authentifizierung
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.username = user.username;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`✅ User connected: ${socket.username} (${socket.userId})`);

    // Benutzer zur Online-Liste hinzufügen
    onlineUsers.set(socket.userId, socket.id);

    // Online-Status in DB aktualisieren
    await User.updateOnlineStatus(socket.userId, true);

    // Allen anderen Benutzern mitteilen, dass User online ist
    socket.broadcast.emit('user_online', {
      userId: socket.userId,
      username: socket.username
    });

    // Nachricht senden
    socket.on('send_message', async (data) => {
      try {
        const { receiverId, content } = data;

        // Prüfen ob blockiert
        const isBlocked = await Friendship.isBlocked(socket.userId, receiverId);
        const isBlockedBy = await Friendship.isBlocked(receiverId, socket.userId);

        if (isBlocked || isBlockedBy) {
          socket.emit('error', { message: 'Nachricht kann nicht gesendet werden' });
          return;
        }

        // Nachricht in DB speichern
        const messageId = await Message.create(socket.userId, receiverId, content);

        const messageData = {
          id: messageId,
          sender_id: socket.userId,
          sender_username: socket.username,
          receiver_id: receiverId,
          content,
          created_at: new Date(),
          is_read: false,
          is_edited: false
        };

        // Nachricht an Empfänger senden (wenn online)
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive_message', messageData);
        }

        // Bestätigung an Sender
        socket.emit('message_sent', messageData);

      } catch (error) {
        console.error('Send Message Error:', error);
        socket.emit('error', { message: 'Fehler beim Senden der Nachricht' });
      }
    });

    // Tippen-Indikator
    socket.on('typing_start', (data) => {
      const { receiverId } = data;
      const receiverSocketId = onlineUsers.get(receiverId);
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user_typing', {
          userId: socket.userId,
          username: socket.username
        });
      }
    });

    socket.on('typing_stop', (data) => {
      const { receiverId } = data;
      const receiverSocketId = onlineUsers.get(receiverId);
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user_stopped_typing', {
          userId: socket.userId
        });
      }
    });

    // Nachricht als gelesen markieren
    socket.on('mark_as_read', async (data) => {
      try {
        const { senderId } = data;
        await Message.markAsRead(senderId, socket.userId);

        // Sender benachrichtigen
        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit('messages_read', {
            readBy: socket.userId
          });
        }
      } catch (error) {
        console.error('Mark Read Error:', error);
      }
    });

    // Nachricht bearbeiten
    socket.on('edit_message', async (data) => {
      try {
        const { messageId, newContent, receiverId } = data;
        
        await Message.update(messageId, socket.userId, newContent);

        const editData = {
          messageId,
          content: newContent,
          is_edited: true
        };

        // Empfänger benachrichtigen
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('message_edited', editData);
        }

        // Bestätigung an Sender
        socket.emit('message_edited', editData);

      } catch (error) {
        console.error('Edit Message Error:', error);
        socket.emit('error', { message: 'Fehler beim Bearbeiten der Nachricht' });
      }
    });

    // Nachricht löschen
    socket.on('delete_message', async (data) => {
      try {
        const { messageId, receiverId } = data;
        
        await Message.delete(messageId, socket.userId);

        // Empfänger benachrichtigen
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('message_deleted', { messageId });
        }

        // Bestätigung an Sender
        socket.emit('message_deleted', { messageId });

      } catch (error) {
        console.error('Delete Message Error:', error);
        socket.emit('error', { message: 'Fehler beim Löschen der Nachricht' });
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${socket.username} (${socket.userId})`);

      // Benutzer aus Online-Liste entfernen
      onlineUsers.delete(socket.userId);

      // Online-Status in DB aktualisieren
      await User.updateOnlineStatus(socket.userId, false);

      // Allen anderen mitteilen, dass User offline ist
      socket.broadcast.emit('user_offline', {
        userId: socket.userId,
        username: socket.username
      });
    });
  });

  // Online Benutzer abrufen
  io.on('get_online_users', (socket) => {
    socket.emit('online_users', Array.from(onlineUsers.keys()));
  });
};

module.exports = socketHandler;
const Message = require('../models/Message');
const Errand = require('../models/Errand');

module.exports = (io, socket) => {
  // Join specific errand chat room
  socket.on('join_errand_room', async (data) => {
    try {
      const { errandId, userId } = data || {};
      if (!errandId) return;

      const roomName = `errand_${errandId}`;
      socket.join(roomName);
      console.log(`[Socket] Socket ${socket.id} (User: ${userId || 'unknown'}) joined ${roomName}`);

      socket.emit('joined_room', { room: roomName, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('[Socket join_errand_room Error]', error);
    }
  });

  // Leave errand chat room
  socket.on('leave_errand_room', (data) => {
    try {
      const { errandId } = data || {};
      if (!errandId) return;

      const roomName = `errand_${errandId}`;
      socket.leave(roomName);
      console.log(`[Socket] Socket ${socket.id} left ${roomName}`);
    } catch (error) {
      console.error('[Socket leave_errand_room Error]', error);
    }
  });

  // Send real-time chat message
  socket.on('send_message', async (data) => {
    try {
      const { errandId, senderId, text } = data || {};

      if (!errandId || !senderId || !text || !text.trim()) {
        socket.emit('error_message', { message: 'Invalid message payload' });
        return;
      }

      // Verify errand exists
      const errand = await Errand.findById(errandId);
      if (!errand) {
        socket.emit('error_message', { message: 'Errand not found' });
        return;
      }

      // Save message to MongoDB
      const newMessage = new Message({
        errandId,
        senderId,
        text: text.trim(),
        read: false,
      });

      await newMessage.save();
      await newMessage.populate('senderId', 'name avatarUrl karmaScore');

      const roomName = `errand_${errandId}`;
      const payload = {
        _id: newMessage._id,
        errandId,
        senderId: newMessage.senderId,
        text: newMessage.text,
        createdAt: newMessage.createdAt,
      };

      // Broadcast to everyone in the room (including sender or requester/runner)
      io.to(roomName).emit('receive_message', payload);
    } catch (error) {
      console.error('[Socket send_message Error]', error);
      socket.emit('error_message', { message: 'Failed to deliver message' });
    }
  });

  // Typing indicator
  socket.on('typing_start', (data) => {
    const { errandId, userName } = data || {};
    if (errandId) {
      socket.to(`errand_${errandId}`).emit('user_typing', { userName, isTyping: true });
    }
  });

  socket.on('typing_stop', (data) => {
    const { errandId } = data || {};
    if (errandId) {
      socket.to(`errand_${errandId}`).emit('user_typing', { isTyping: false });
    }
  });
};

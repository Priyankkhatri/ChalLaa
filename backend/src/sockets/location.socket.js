module.exports = (io, socket) => {
  // Runner streams live location while errand is "in_progress"
  socket.on('location_update', (data) => {
    try {
      const { errandId, runnerId, lat, lng, speed, heading } = data || {};

      if (!errandId || lat === undefined || lng === undefined) {
        return;
      }

      const roomName = `errand_${errandId}`;
      const payload = {
        errandId,
        runnerId,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        speed: speed || 0,
        heading: heading || 0,
        timestamp: new Date().toISOString(),
      };

      // Broadcast location to all room listeners (the requester)
      socket.to(roomName).emit('location_broadcast', payload);
    } catch (error) {
      console.error('[Socket location_update Error]', error);
    }
  });

  // Client requests immediate status sync
  socket.on('request_status_sync', (data) => {
    try {
      const { errandId } = data || {};
      if (errandId) {
        socket.to(`errand_${errandId}`).emit('sync_status_requested', { errandId });
      }
    } catch (error) {
      console.error('[Socket request_status_sync Error]', error);
    }
  });
};

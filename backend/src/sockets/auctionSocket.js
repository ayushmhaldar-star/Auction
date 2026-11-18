const { sanitizeForPublic } = require('../utils/sanitize');

let ioInstance = null;

const initAuctionSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    // Client can join as public viewer or admin
    socket.on('join_auction', ({ role } = {}) => {
      if (role === 'admin') {
        socket.join('admin_room');
      } else {
        socket.join('public_room');
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });
};

const broadcastAuctionState = (fullState) => {
  if (!ioInstance) return;

  // Send full state to admin
  ioInstance.to('admin_room').emit('auction_state_update', {
    state: fullState
  });

  // Send sanitized state to public viewers
  const publicState = sanitizeForPublic(fullState);
  ioInstance.to('public_room').emit('auction_state_update', {
    state: publicState
  });

  // Also broadcast general event for easy consumer integration
  ioInstance.emit('public_state_update', publicState);
};

const emitSoldEvent = (data) => {
  if (!ioInstance) return;
  const teamData = {
    _id: data.team._id,
    name: data.team.name,
    logo: data.team.logo
  };

  const publicData = {
    player: {
      _id: data.player._id,
      name: data.player.name,
      photo: data.player.photo,
      serialNumber: data.player.serialNumber,
      category: data.player.category?.name || data.player.category
    },
    winningTeam: teamData,
    team: teamData,
    soldPrice: data.soldPrice
  };

  ioInstance.emit('player_sold_event', publicData);
};

const emitUnsoldEvent = (data) => {
  if (!ioInstance) return;
  const publicData = {
    player: {
      _id: data.player._id,
      name: data.player.name,
      photo: data.player.photo,
      serialNumber: data.player.serialNumber,
      category: data.player.category?.name || data.player.category
    }
  };

  ioInstance.emit('player_unsold_event', publicData);
};

module.exports = {
  initAuctionSocket,
  broadcastAuctionState,
  emitSoldEvent,
  emitUnsoldEvent
};

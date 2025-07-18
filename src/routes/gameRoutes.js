// Game routes (socket.io event handler)
const gameController = require('../controllers/gameController');
const timerController = require('../controllers/timerController');

function registerGameSocket(io) {
  io.on('connection', (socket) => {
    // Create or join room
    socket.on('joinRoom', (data, callback) => {
      const { roomId, name } = data;
      if (!gameController.rooms[roomId]) {
        gameController.createRoom(roomId);
      }
      const room = gameController.rooms[roomId];
      let role = 'spectator';
      let playerNum = null;
      if (room.players.length < 2) {
        room.players.push(socket.id);
        room.playerNames[room.players.length - 1] = name;
        playerNum = room.players.length;
        role = 'player';
      } else {
        room.spectators.push(socket.id);
      }
      socket.join(roomId);
      callback({ success: true, playerNum, roomId, role });
      io.to(roomId).emit('update', gameController.getPublicState(roomId));
    });

    // Player ready (start)
    socket.on('playerReady', ({ roomId, playerNum }) => {
      const room = gameController.rooms[roomId];
      if (!room || !playerNum) return;
      room.ready[playerNum - 1] = true;
      io.to(roomId).emit('update', gameController.getPublicState(roomId));
      if (room.ready[0] && room.ready[1] && !room.started) {
        room.started = true;
        io.to(roomId).emit('update', gameController.getPublicState(roomId));
        timerController.startTurnTimer(roomId, io, gameController);
      }
    });

    // Handle cell click
    socket.on('pickCell', ({ roomId, index, playerNum }) => {
      const room = gameController.rooms[roomId];
      if (!room || !room.started || room.lockBoard || room.players[playerNum - 1] !== socket.id) return;
      if (room.revealed[index] || room.matched[index]) return;
      if (room.currentPlayer !== playerNum) return;
      if (room.firstPick === null) {
        room.revealed[index] = true;
        room.firstPick = index;
        io.to(roomId).emit('update', gameController.getPublicState(roomId));
      } else if (room.secondPick === null && index !== room.firstPick) {
        room.revealed[index] = true;
        room.secondPick = index;
        room.lockBoard = true;
        timerController.clearTurnTimer(roomId, gameController);
        io.to(roomId).emit('update', gameController.getPublicState(roomId));
        setTimeout(() => {
          if (room.numbers[room.firstPick] === room.numbers[room.secondPick]) {
            room.matched[room.firstPick] = true;
            room.matched[room.secondPick] = true;
            room.scores[room.currentPlayer - 1]++;
          } else {
            room.revealed[room.firstPick] = false;
            room.revealed[room.secondPick] = false;
            room.currentPlayer = room.currentPlayer === 1 ? 2 : 1;
          }
          room.firstPick = null;
          room.secondPick = null;
          room.lockBoard = false;
          io.to(roomId).emit('update', gameController.getPublicState(roomId));
          if (room.matched.filter(Boolean).length === gameController.totalCells) {
            io.to(roomId).emit('gameOver', gameController.getWinnerMessage(room));
            timerController.clearTurnTimer(roomId, gameController);
          } else {
            timerController.startTurnTimer(roomId, io, gameController);
          }
        }, 800);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      for (const roomId in gameController.rooms) {
        const room = gameController.rooms[roomId];
        let idx = room.players.indexOf(socket.id);
        if (idx !== -1) {
          room.players.splice(idx, 1);
          room.playerNames[idx] = null;
          room.ready[idx] = false;
          room.started = false;
          timerController.clearTurnTimer(roomId, gameController);
          io.to(roomId).emit('update', gameController.getPublicState(roomId));
          io.to(roomId).emit('playerLeft');
          if (room.players.length === 0 && room.spectators.length === 0) {
            delete gameController.rooms[roomId];
          }
          break;
        }
        idx = room.spectators.indexOf(socket.id);
        if (idx !== -1) {
          room.spectators.splice(idx, 1);
          if (room.players.length === 0 && room.spectators.length === 0) {
            delete gameController.rooms[roomId];
          }
          break;
        }
      }
    });
  });
}

module.exports = registerGameSocket;
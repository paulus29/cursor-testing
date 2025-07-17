const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname)));

// Game state per room
const rooms = {};
const boardSize = 10;
const totalCells = boardSize * boardSize;
const totalPairs = totalCells / 2;

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function createRoom(roomId) {
  // Generate pairs
  let numbers = [];
  for (let i = 1; i <= totalPairs; i++) {
    numbers.push(i);
    numbers.push(i);
  }
  shuffle(numbers);
  rooms[roomId] = {
    numbers,
    revealed: Array(totalCells).fill(false),
    matched: Array(totalCells).fill(false),
    scores: [0, 0],
    currentPlayer: 1,
    players: [], // socket.id
    firstPick: null,
    secondPick: null,
    lockBoard: false,
  };
}

io.on('connection', (socket) => {
  // Create or join room
  socket.on('joinRoom', (roomId, callback) => {
    if (!rooms[roomId]) {
      createRoom(roomId);
    }
    const room = rooms[roomId];
    if (room.players.length >= 2) {
      callback({ success: false, message: 'Room full' });
      return;
    }
    room.players.push(socket.id);
    socket.join(roomId);
    const playerNum = room.players.length;
    callback({ success: true, playerNum, roomId });
    // Send initial state
    io.to(roomId).emit('update', getPublicState(roomId));
  });

  // Handle cell click
  socket.on('pickCell', ({ roomId, index, playerNum }) => {
    const room = rooms[roomId];
    if (!room || room.lockBoard || room.players[playerNum - 1] !== socket.id) return;
    if (room.revealed[index] || room.matched[index]) return;
    if (room.currentPlayer !== playerNum) return;
    if (room.firstPick === null) {
      room.revealed[index] = true;
      room.firstPick = index;
    } else if (room.secondPick === null && index !== room.firstPick) {
      room.revealed[index] = true;
      room.secondPick = index;
      room.lockBoard = true;
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
        io.to(roomId).emit('update', getPublicState(roomId));
        // Check for game end
        if (room.matched.filter(Boolean).length === totalCells) {
          io.to(roomId).emit('gameOver', getWinnerMessage(room));
        }
      }, 800);
    }
    io.to(roomId).emit('update', getPublicState(roomId));
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const idx = room.players.indexOf(socket.id);
      if (idx !== -1) {
        room.players.splice(idx, 1);
        io.to(roomId).emit('playerLeft');
        // Optionally, delete room if empty
        if (room.players.length === 0) {
          delete rooms[roomId];
        }
        break;
      }
    }
  });
});

function getPublicState(roomId) {
  const room = rooms[roomId];
  return {
    numbers: room.numbers.map((n, i) => (room.revealed[i] || room.matched[i] ? n : null)),
    matched: room.matched,
    scores: room.scores,
    currentPlayer: room.currentPlayer,
    lockBoard: room.lockBoard,
  };
}

function getWinnerMessage(room) {
  if (room.scores[0] > room.scores[1]) return 'Player 1 wins!';
  if (room.scores[1] > room.scores[0]) return 'Player 2 wins!';
  return "It's a draw!";
}

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
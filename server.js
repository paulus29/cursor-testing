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
const boardSize = 4;
const totalCells = boardSize * boardSize;
const totalPairs = totalCells / 2;
const TURN_TIME = 10; // seconds

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
    playerNames: [null, null],
    firstPick: null,
    secondPick: null,
    lockBoard: false,
    timer: TURN_TIME,
    timerObj: null,
    started: false,
    ready: [false, false], // player 1 & 2 ready
    spectators: [], // socket.id
  };
}

function startTurnTimer(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  clearTurnTimer(roomId);
  room.timer = TURN_TIME;
  room.timerObj = setInterval(() => {
    room.timer--;
    io.to(roomId).emit('update', getPublicState(roomId));
    if (room.timer <= 0) {
      clearTurnTimer(roomId);
      // Lempar giliran
      if (!room.lockBoard && room.firstPick === null && room.secondPick === null) {
        room.currentPlayer = room.currentPlayer === 1 ? 2 : 1;
        io.to(roomId).emit('update', getPublicState(roomId));
        startTurnTimer(roomId);
      } else if (!room.lockBoard && room.firstPick !== null && room.secondPick === null) {
        // Jika sudah pick 1, reset pick dan lempar giliran
        room.revealed[room.firstPick] = false;
        room.firstPick = null;
        room.currentPlayer = room.currentPlayer === 1 ? 2 : 1;
        io.to(roomId).emit('update', getPublicState(roomId));
        startTurnTimer(roomId);
      }
    }
  }, 1000);
}

function clearTurnTimer(roomId) {
  const room = rooms[roomId];
  if (room && room.timerObj) {
    clearInterval(room.timerObj);
    room.timerObj = null;
  }
}

io.on('connection', (socket) => {
  // Create or join room
  socket.on('joinRoom', (data, callback) => {
    const { roomId, name } = data;
    if (!rooms[roomId]) {
      createRoom(roomId);
    }
    const room = rooms[roomId];
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
    io.to(roomId).emit('update', getPublicState(roomId));
  });

  // Player ready (start)
  socket.on('playerReady', ({ roomId, playerNum }) => {
    const room = rooms[roomId];
    if (!room || !playerNum) return;
    room.ready[playerNum - 1] = true;
    io.to(roomId).emit('update', getPublicState(roomId));
    // Start game only if both ready and not started
    if (room.ready[0] && room.ready[1] && !room.started) {
      room.started = true;
      io.to(roomId).emit('update', getPublicState(roomId));
      startTurnTimer(roomId);
    }
  });

  // Handle cell click
  socket.on('pickCell', ({ roomId, index, playerNum }) => {
    const room = rooms[roomId];
    if (!room || !room.started || room.lockBoard || room.players[playerNum - 1] !== socket.id) return;
    if (room.revealed[index] || room.matched[index]) return;
    if (room.currentPlayer !== playerNum) return;
    if (room.firstPick === null) {
      room.revealed[index] = true;
      room.firstPick = index;
      // timer TIDAK di-reset di sini
      io.to(roomId).emit('update', getPublicState(roomId));
    } else if (room.secondPick === null && index !== room.firstPick) {
      room.revealed[index] = true;
      room.secondPick = index;
      room.lockBoard = true;
      clearTurnTimer(roomId);
      io.to(roomId).emit('update', getPublicState(roomId));
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
          clearTurnTimer(roomId);
        } else {
          startTurnTimer(roomId); // timer baru setelah 2 kotak dipilih
        }
      }, 800);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    for (const roomId in rooms) {
      const room = rooms[roomId];
      let idx = room.players.indexOf(socket.id);
      if (idx !== -1) {
        room.players.splice(idx, 1);
        room.playerNames[idx] = null;
        room.ready[idx] = false;
        room.started = false;
        clearTurnTimer(roomId);
        io.to(roomId).emit('update', getPublicState(roomId));
        io.to(roomId).emit('playerLeft');
        if (room.players.length === 0 && room.spectators.length === 0) {
          delete rooms[roomId];
        }
        break;
      }
      idx = room.spectators.indexOf(socket.id);
      if (idx !== -1) {
        room.spectators.splice(idx, 1);
        if (room.players.length === 0 && room.spectators.length === 0) {
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
    playerNames: room.playerNames,
    timer: room.timer,
    started: room.started,
    ready: room.ready,
    playerCount: room.players.length,
    spectatorCount: room.spectators.length,
  };
}

function getWinnerMessage(room) {
  if (room.scores[0] > room.scores[1]) return `${room.playerNames[0] || 'Player 1'} wins!`;
  if (room.scores[1] > room.scores[0]) return `${room.playerNames[1] || 'Player 2'} wins!`;
  return "It's a draw!";
}

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
// Game logic controller
const boardSize = 10;
const totalCells = boardSize * boardSize;
const totalPairs = totalCells / 2;
const TURN_TIME = 10; // seconds

const rooms = {};

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function createRoom(roomId) {
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
    players: [],
    playerNames: [null, null],
    firstPick: null,
    secondPick: null,
    lockBoard: false,
    timer: TURN_TIME,
    timerObj: null,
    started: false,
    ready: [false, false],
    spectators: [],
  };
}

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

module.exports = {
  rooms,
  boardSize,
  totalCells,
  totalPairs,
  TURN_TIME,
  shuffle,
  createRoom,
  getPublicState,
  getWinnerMessage,
};
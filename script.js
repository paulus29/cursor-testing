const boardSize = 10;
const totalCells = boardSize * boardSize;

const board = document.getElementById('game-board');
const player1Score = document.getElementById('player1-score');
const player2Score = document.getElementById('player2-score');
const turnIndicator = document.getElementById('turn-indicator');
const resetBtn = document.getElementById('reset-btn');
const roomForm = document.getElementById('room-form');
const roomIdInput = document.getElementById('room-id');
const roomStatus = document.getElementById('room-status');
const roomSection = document.getElementById('room-section');
const gameSection = document.getElementById('game-section');
const gameMessage = document.getElementById('game-message');

let socket = null;
let playerNum = null;
let roomId = null;
let state = null;
let gameOver = false;

roomForm.onsubmit = (e) => {
  e.preventDefault();
  joinRoom(roomIdInput.value.trim());
};

function joinRoom(room) {
  socket = io();
  socket.emit('joinRoom', room, (res) => {
    if (res.success) {
      playerNum = res.playerNum;
      roomId = res.roomId;
      roomStatus.textContent = `Joined room: ${roomId} as Player ${playerNum}`;
      roomSection.style.display = 'none';
      gameSection.style.display = '';
      setupSocketEvents();
    } else {
      roomStatus.textContent = res.message;
    }
  });
}

function setupSocketEvents() {
  socket.on('update', (newState) => {
    state = newState;
    renderBoard();
    updateScores();
    updateTurn();
    gameMessage.textContent = '';
    gameOver = false;
  });
  socket.on('gameOver', (msg) => {
    gameMessage.textContent = msg;
    gameOver = true;
  });
  socket.on('playerLeft', () => {
    gameMessage.textContent = 'Player lain keluar. Game berakhir.';
    gameOver = true;
  });
}

function renderBoard() {
  board.innerHTML = '';
  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    if (state.matched[i]) {
      cell.classList.add('matched');
      cell.textContent = state.numbers[i];
    } else if (state.numbers[i] !== null) {
      cell.classList.add('revealed');
      cell.textContent = state.numbers[i];
    } else {
      cell.textContent = '';
      if (!gameOver && playerNum === state.currentPlayer && !state.lockBoard) {
        cell.addEventListener('click', () => pickCell(i));
      }
    }
    board.appendChild(cell);
  }
}

function pickCell(index) {
  if (!state || gameOver) return;
  socket.emit('pickCell', { roomId, index, playerNum });
}

function updateScores() {
  player1Score.textContent = `Player 1: ${state.scores[0]}`;
  player2Score.textContent = `Player 2: ${state.scores[1]}`;
}

function updateTurn() {
  if (gameOver) {
    turnIndicator.textContent = 'Game Over';
  } else {
    turnIndicator.textContent = `Turn: Player ${state.currentPlayer}`;
  }
}

// Reset button (optional, hanya reload halaman)
resetBtn.onclick = () => {
  window.location.reload();
};
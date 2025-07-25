const boardSize = 10;
const totalCells = boardSize * boardSize;

const board = document.getElementById('game-board');
const player1Score = document.getElementById('player1-score');
const player2Score = document.getElementById('player2-score');
const turnIndicator = document.getElementById('turn-indicator');
const resetBtn = document.getElementById('reset-btn');
const roomForm = document.getElementById('room-form');
const roomIdInput = document.getElementById('room-id');
const playerNameInput = document.getElementById('player-name');
const roomStatus = document.getElementById('room-status');
const roomSection = document.getElementById('room-section');
const gameSection = document.getElementById('game-section');
const gameMessage = document.getElementById('game-message');
const playersDisplay = document.getElementById('players-display');
const timerDisplay = document.getElementById('timer');
const startBtn = document.getElementById('start-btn');
const spectatorInfo = document.getElementById('spectator-info');
const modalOverlay = document.getElementById('modal-overlay');
const modalJoin = document.getElementById('modal-join');
const modalJoinForm = document.getElementById('modal-join-form');
const modalPlayerName = document.getElementById('modal-player-name');
const modalWin = document.getElementById('modal-win');
const modalWinTitle = document.getElementById('modal-win-title');
const modalWinClose = document.getElementById('modal-win-close');

let socket = null;
let playerNum = null;
let roomId = null;
let state = null;
let gameOver = false;
let playerName = '';
let timerInterval = null;
let lastTimer = 10;
let role = 'spectator';
let selectedIndexes = [];

roomForm.onsubmit = (e) => {
  e.preventDefault();
  joinRoom(roomIdInput.value.trim(), playerNameInput.value.trim());
};

function joinRoom(room, name) {
  socket = io();
  playerName = name;
  socket.emit('joinRoom', { roomId: room, name }, (res) => {
    if (res.success) {
      playerNum = res.playerNum;
      roomId = res.roomId;
      role = res.role;
      roomStatus.textContent = `Joined room: ${roomId} as ${name} (${role === 'player' ? 'Player ' + playerNum : 'Spectator'})`;
      roomSection.style.display = 'none';
      gameSection.style.display = '';
      setupSocketEvents();
    } else {
      roomStatus.textContent = res.message;
    }
  });
}

function showJoinModal() {
  modalOverlay.style.display = '';
  modalJoin.style.display = '';
  modalPlayerName.value = '';
  modalPlayerName.focus();
}
function hideJoinModal() {
  modalOverlay.style.display = 'none';
  modalJoin.style.display = 'none';
}
modalJoinForm.onsubmit = (e) => {
  e.preventDefault();
  const name = modalPlayerName.value.trim();
  if (name) {
    hideJoinModal();
    roomForm.style.display = '';
    playerNameInput.value = name;
    playerNameInput.readOnly = true;
    roomIdInput.focus();
  }
};

function showWinModal(msg) {
  modalOverlay.style.display = '';
  modalWin.style.display = '';
  modalWinTitle.textContent = msg;
}
function hideWinModal() {
  modalOverlay.style.display = 'none';
  modalWin.style.display = 'none';
}
modalWinClose.onclick = hideWinModal;

function setupSocketEvents() {
  socket.on('update', (newState) => {
    state = newState;
    renderPlayers();
    renderBoard();
    updateScores();
    updateTurn();
    updateStartButton();
    updateSpectatorInfo();
    gameMessage.textContent = '';
    gameOver = false;
    startTimer(state.timer);
  });
  socket.on('gameOver', (msg) => {
    gameMessage.textContent = msg;
    gameOver = true;
    stopTimer();
    showWinModal(msg);
  });
  socket.on('playerLeft', () => {
    gameMessage.textContent = 'Player lain keluar. Game berakhir.';
    gameOver = true;
    stopTimer();
  });
}

function renderPlayers() {
  playersDisplay.innerHTML = '';
  if (!state || !state.playerNames) return;
  for (let i = 0; i < 2; i++) {
    const div = document.createElement('div');
    div.className = 'player-name' + (state.currentPlayer === i + 1 && state.started ? ' active' : '');
    div.textContent = state.playerNames[i] || `Player ${i + 1}`;
    // Skor besar di bawah nama
    const scoreDiv = document.createElement('div');
    scoreDiv.className = 'player-score';
    scoreDiv.textContent = state.scores[i] || 0;
    div.appendChild(scoreDiv);
    playersDisplay.appendChild(div);
  }
}

function renderBoard() {
  board.innerHTML = '';
  selectedIndexes = [];
  if (state && state.started && !gameOver) {
    // Highlight kotak yang sedang dipilih
    if (state.firstPick !== undefined && state.firstPick !== null) selectedIndexes.push(state.firstPick);
    if (state.secondPick !== undefined && state.secondPick !== null) selectedIndexes.push(state.secondPick);
  }
  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    // Highlight kotak terpilih
    if (selectedIndexes.includes(i)) {
      if (state.currentPlayer === 1) cell.classList.add('selected-p1');
      else if (state.currentPlayer === 2) cell.classList.add('selected-p2');
    }
    if (state.matched[i]) {
      if (state.matched[i] === 1) {
        cell.classList.add('matched-p1');
      } else if (state.matched[i] === 2) {
        cell.classList.add('matched-p2');
      } else {
        cell.classList.add('matched');
      }
      cell.textContent = state.numbers[i];
    } else if (state.numbers[i] !== null) {
      cell.classList.add('revealed');
      cell.textContent = state.numbers[i];
    } else {
      cell.textContent = '';
      if (!gameOver && role === 'player' && playerNum === state.currentPlayer && !state.lockBoard && state.started) {
        cell.addEventListener('click', () => pickCell(i));
      }
    }
    board.appendChild(cell);
  }
}

function pickCell(index) {
  if (!state || gameOver || !state.started) return;
  socket.emit('pickCell', { roomId, index, playerNum });
}

function updateScores() {
  // Tidak perlu skor kecil di scoreboard, sudah ada di bawah nama
}

function updateTurn() {
  if (gameOver) {
    turnIndicator.textContent = 'Game Over';
  } else if (!state.started) {
    turnIndicator.textContent = 'Menunggu game dimulai...';
  } else {
    const name = state.playerNames?.[state.currentPlayer - 1] || `Player ${state.currentPlayer}`;
    turnIndicator.textContent = `Turn: ${name}`;
  }
}

function updateStartButton() {
  if (role === 'player' && playerNum && state.playerCount === 2 && !state.started) {
    startBtn.style.display = '';
    startBtn.disabled = !!state.ready[playerNum - 1];
    startBtn.textContent = state.ready[playerNum - 1] ? 'Menunggu lawan...' : 'Start';
  } else {
    startBtn.style.display = 'none';
  }
}

startBtn.onclick = () => {
  if (role === 'player' && playerNum && !state.ready[playerNum - 1]) {
    socket.emit('playerReady', { roomId, playerNum });
  }
};

function updateSpectatorInfo() {
  if (role === 'spectator') {
    spectatorInfo.style.display = '';
    spectatorInfo.textContent = `Anda menonton sebagai Spectator. Jumlah penonton: ${state.spectatorCount}`;
  } else {
    spectatorInfo.style.display = 'none';
  }
}

function startTimer(timeLeft) {
  stopTimer();
  if (!state || !state.started) {
    timerDisplay.style.display = 'none';
    return;
  }
  timerDisplay.style.display = '';
  lastTimer = typeof timeLeft === 'number' ? timeLeft : 10;
  timerDisplay.textContent = `⏰ ${lastTimer}s`;
  timerInterval = setInterval(() => {
    lastTimer--;
    timerDisplay.textContent = `⏰ ${lastTimer}s`;
    if (lastTimer <= 0) {
      stopTimer();
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

resetBtn.onclick = () => {
  window.location.reload();
};
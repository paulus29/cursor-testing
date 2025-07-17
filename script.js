const boardSize = 10;
const totalCells = boardSize * boardSize;
const totalPairs = totalCells / 2;
let numbers = [];
let revealed = [];
let matched = [];
let currentPlayer = 1;
let scores = [0, 0];
let firstPick = null;
let secondPick = null;
let lockBoard = false;

const board = document.getElementById('game-board');
const player1Score = document.getElementById('player1-score');
const player2Score = document.getElementById('player2-score');
const turnIndicator = document.getElementById('turn-indicator');
const resetBtn = document.getElementById('reset-btn');

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function initGame() {
  // Generate pairs
  numbers = [];
  for (let i = 1; i <= totalPairs; i++) {
    numbers.push(i);
    numbers.push(i);
  }
  shuffle(numbers);
  revealed = Array(totalCells).fill(false);
  matched = Array(totalCells).fill(false);
  scores = [0, 0];
  currentPlayer = 1;
  firstPick = null;
  secondPick = null;
  lockBoard = false;
  renderBoard();
  updateScores();
  updateTurn();
}

function renderBoard() {
  board.innerHTML = '';
  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    if (matched[i]) {
      cell.classList.add('matched');
      cell.textContent = numbers[i];
    } else if (revealed[i]) {
      cell.classList.add('revealed');
      cell.textContent = numbers[i];
    } else {
      cell.textContent = '';
      cell.addEventListener('click', () => handleCellClick(i));
    }
    board.appendChild(cell);
  }
}

function handleCellClick(index) {
  if (lockBoard || revealed[index] || matched[index]) return;
  if (firstPick === null) {
    revealed[index] = true;
    firstPick = index;
    renderBoard();
  } else if (secondPick === null && index !== firstPick) {
    revealed[index] = true;
    secondPick = index;
    renderBoard();
    checkMatch();
  }
}

function checkMatch() {
  lockBoard = true;
  setTimeout(() => {
    if (numbers[firstPick] === numbers[secondPick]) {
      matched[firstPick] = true;
      matched[secondPick] = true;
      scores[currentPlayer - 1]++;
      if (matched.filter(Boolean).length === totalCells) {
        setTimeout(() => {
          alert(getWinnerMessage());
        }, 100);
      }
    } else {
      revealed[firstPick] = false;
      revealed[secondPick] = false;
      currentPlayer = currentPlayer === 1 ? 2 : 1;
      updateTurn();
    }
    firstPick = null;
    secondPick = null;
    updateScores();
    renderBoard();
    lockBoard = false;
  }, 800);
}

function updateScores() {
  player1Score.textContent = `Player 1: ${scores[0]}`;
  player2Score.textContent = `Player 2: ${scores[1]}`;
}

function updateTurn() {
  turnIndicator.textContent = `Turn: Player ${currentPlayer}`;
}

function getWinnerMessage() {
  if (scores[0] > scores[1]) return 'Player 1 wins!';
  if (scores[1] > scores[0]) return 'Player 2 wins!';
  return 'It\'s a draw!';
}

resetBtn.addEventListener('click', initGame);

window.onload = initGame;
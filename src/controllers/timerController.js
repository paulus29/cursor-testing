// Timer logic controller
function startTurnTimer(roomId, io, gameController) {
  const { rooms, TURN_TIME, getPublicState } = gameController;
  const room = rooms[roomId];
  if (!room) return;
  clearTurnTimer(roomId, gameController);
  room.timer = TURN_TIME;
  room.timerObj = setInterval(() => {
    room.timer--;
    io.to(roomId).emit('update', getPublicState(roomId));
    if (room.timer <= 0) {
      clearTurnTimer(roomId, gameController);
      if (!room.lockBoard && room.firstPick === null && room.secondPick === null) {
        room.currentPlayer = room.currentPlayer === 1 ? 2 : 1;
        io.to(roomId).emit('update', getPublicState(roomId));
        startTurnTimer(roomId, io, gameController);
      } else if (!room.lockBoard && room.firstPick !== null && room.secondPick === null) {
        room.revealed[room.firstPick] = false;
        room.firstPick = null;
        room.currentPlayer = room.currentPlayer === 1 ? 2 : 1;
        io.to(roomId).emit('update', getPublicState(roomId));
        startTurnTimer(roomId, io, gameController);
      }
    }
  }, 1000);
}

function clearTurnTimer(roomId, gameController) {
  const { rooms } = gameController;
  const room = rooms[roomId];
  if (room && room.timerObj) {
    clearInterval(room.timerObj);
    room.timerObj = null;
  }
}

module.exports = {
  startTurnTimer,
  clearTurnTimer,
};
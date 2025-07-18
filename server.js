const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static files from public
app.use(express.static(path.join(__dirname, 'public')));

// Register socket.io game routes
const registerGameSocket = require('./src/routes/gameRoutes');
registerGameSocket(io);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
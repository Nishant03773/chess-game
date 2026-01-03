const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Explicitly define the path to the public folder
const publicPath = path.join(__dirname, 'public');

// 1. Serve static files from the public folder
app.use(express.static(publicPath));

// 2. Explicitly serve index.html for the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

const rooms = {};

io.on('connection', (socket) => {
    socket.on('create-room', (name) => {
        const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
        rooms[roomId] = { players: [{ id: socket.id, name, color: 'white' }] };
        socket.join(roomId);
        socket.emit('room-created', roomId);
    });

    socket.on('join-room', ({ roomId, name }) => {
        const id = roomId.toUpperCase();
        if (rooms[id] && rooms[id].players.length === 1) {
            rooms[id].players.push({ id: socket.id, name, color: 'black' });
            socket.join(id);
            io.to(rooms[id].players[0].id).emit('start-game', { opponent: name, color: 'white' });
            io.to(socket.id).emit('start-game', { opponent: rooms[id].players[0].name, color: 'black' });
        } else {
            socket.emit('error-msg', 'Room not found or full');
        }
    });

    socket.on('move', ({ roomId, moveData }) => {
        if(roomId) socket.to(roomId.toUpperCase()).emit('remote-move', moveData);
    });

    socket.on('chat', ({ roomId, msg }) => {
        if(roomId) socket.to(roomId.toUpperCase()).emit('remote-chat', msg);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

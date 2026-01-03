const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Serve files from the root directory instead of /public
app.use(express.static(__dirname));

// Explicitly serve index.html when someone visits the site
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const rooms = {};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('create-room', (name) => {
        const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
        rooms[roomId] = { players: [{ id: socket.id, name, color: 'white' }] };
        socket.join(roomId);
        socket.emit('room-created', roomId);
    });

    socket.on('join-room', ({ roomId, name }) => {
        const room = rooms[roomId];
        if (room && room.players.length === 1) {
            room.players.push({ id: socket.id, name, color: 'black' });
            socket.join(roomId);
            io.to(room.players[0].id).emit('start-game', { opponent: name, color: 'white' });
            io.to(socket.id).emit('start-game', { opponent: room.players[0].name, color: 'black' });
        } else {
            socket.emit('error-msg', 'Room not found or full');
        }
    });

    socket.on('move', ({ roomId, moveData }) => {
        socket.to(roomId).emit('remote-move', moveData);
    });

    socket.on('chat', ({ roomId, msg }) => {
        socket.to(roomId).emit('remote-chat', msg);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

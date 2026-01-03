const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, 'public')));

const rooms = {};

io.on('connection', (socket) => {
    // Host creates a room
    socket.on('create-room', (name) => {
        const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
        rooms[roomId] = { host: socket.id, hostName: name, guest: null };
        socket.join(roomId);
        socket.emit('room-created', roomId);
    });

    // Guest joins a room
    socket.on('join-room', ({ roomId, name }) => {
        const room = rooms[roomId];
        if (room && !room.guest) {
            room.guest = socket.id;
            socket.join(roomId);
            // Notify Host
            io.to(room.host).emit('player-joined', { opponent: name, color: 'white' });
            // Notify Guest
            socket.emit('player-joined', { opponent: room.hostName, color: 'black' });
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
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

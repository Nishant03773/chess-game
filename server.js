const io = require("socket.io")(process.env.PORT || 3000, {
  cors: { origin: "*" }
});

const rooms = {};

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  socket.on("create-room", (name) => {
    const roomId = Math.random().toString(36).substring(2, 7);
    rooms[roomId] = { players: [{ id: socket.id, name, color: 'white' }] };
    socket.join(roomId);
    socket.emit("room-created", roomId);
    console.log(`Room ${roomId} created by ${name}`);
  });

  socket.on("join-room", ({ roomId, name }) => {
    const room = rooms[roomId];
    if (room && room.players.length === 1) {
      room.players.push({ id: socket.id, name, color: 'black' });
      socket.join(roomId);
      
      const p1 = room.players[0];
      const p2 = room.players[1];

      // Tell both players the game is starting
      io.to(p1.id).emit("start-game", { opponent: p2.name, color: 'white' });
      io.to(p2.id).emit("start-game", { opponent: p1.name, color: 'black' });
      console.log(`${name} joined room ${roomId}`);
    } else {
      socket.emit("error-msg", "Room full or not found");
    }
  });

  socket.on("move", ({ roomId, moveData }) => {
    socket.to(roomId).emit("remote-move", moveData);
  });

  socket.on("chat", ({ roomId, msg }) => {
    socket.to(roomId).emit("remote-chat", msg);
  });

  socket.on("disconnect", () => {
    console.log("Player disconnected");
  });
});
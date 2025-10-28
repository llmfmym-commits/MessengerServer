const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.static(path.join(__dirname)));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Store active users and messages
const users = new Map();
const rooms = new Map();
const messages = new Map();

// Default room
rooms.set('general', {
  id: 'general',
  name: 'General',
  users: new Set(),
  messages: []
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/users', (req, res) => {
  res.json(Array.from(users.values()));
});

app.get('/api/rooms', (req, res) => {
  res.json(Array.from(rooms.values()).map(room => ({
    id: room.id,
    name: room.name,
    userCount: room.users.size
  })));
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins the chat
  socket.on('user_join', (userData) => {
    const user = {
      id: socket.id,
      username: userData.username,
      avatar: userData.avatar || `https://ui-avatars.com/api/?name=${userData.username}`,
      status: 'online',
      joinedAt: new Date()
    };

    users.set(socket.id, user);
    socket.join('general');
    rooms.get('general').users.add(socket.id);

    // Notify all users
    io.emit('user_joined', user);
    io.emit('users_update', Array.from(users.values()));
    io.emit('rooms_update', Array.from(rooms.values()).map(room => ({
      id: room.id,
      name: room.name,
      userCount: room.users.size
    })));

    // Send room messages to the new user
    socket.emit('room_messages', {
      roomId: 'general',
      messages: rooms.get('general').messages.slice(-100)
    });
  });

  // Handle new message
  socket.on('send_message', (messageData) => {
    const user = users.get(socket.id);
    if (!user) return;

    const message = {
      id: uuidv4(),
      userId: socket.id,
      username: user.username,
      avatar: user.avatar,
      content: messageData.content,
      timestamp: new Date(),
      roomId: messageData.roomId || 'general',
      type: messageData.type || 'text',
      replyTo: messageData.replyTo
    };

    // Store message
    const room = rooms.get(message.roomId);
    if (room) {
      room.messages.push(message);
      if (room.messages.length > 1000) {
        room.messages = room.messages.slice(-1000);
      }
    }

    // Broadcast to room
    io.to(message.roomId).emit('new_message', message);
  });

  // Handle typing indicator
  socket.on('typing_start', (data) => {
    const user = users.get(socket.id);
    if (user) {
      socket.to(data.roomId || 'general').emit('user_typing', {
        userId: socket.id,
        username: user.username
      });
    }
  });

  socket.on('typing_stop', (data) => {
    socket.to(data.roomId || 'general').emit('user_stop_typing', {
      userId: socket.id
    });
  });

  // Handle room creation
  socket.on('create_room', (roomData) => {
    const roomId = uuidv4();
    const room = {
      id: roomId,
      name: roomData.name,
      createdBy: socket.id,
      users: new Set([socket.id]),
      messages: []
    };

    rooms.set(roomId, room);
    socket.join(roomId);
    socket.leave('general');
    rooms.get('general').users.delete(socket.id);

    io.emit('room_created', room);
    io.emit('rooms_update', Array.from(rooms.values()).map(room => ({
      id: room.id,
      name: room.name,
      userCount: room.users.size
    })));
  });

  // Join room
  socket.on('join_room', (roomData) => {
    const room = rooms.get(roomData.roomId);
    if (room) {
      socket.join(roomData.roomId);
      room.users.add(socket.id);
      
      // Send room messages to user
      socket.emit('room_messages', {
        roomId: roomData.roomId,
        messages: room.messages.slice(-100)
      });

      io.emit('rooms_update', Array.from(rooms.values()).map(room => ({
        id: room.id,
        name: room.name,
        userCount: room.users.size
      })));
    }
  });

  // Leave room
  socket.on('leave_room', (roomData) => {
    const room = rooms.get(roomData.roomId);
    if (room) {
      socket.leave(roomData.roomId);
      room.users.delete(socket.id);
      
      io.emit('rooms_update', Array.from(rooms.values()).map(room => ({
        id: room.id,
        name: room.name,
        userCount: room.users.size
      })));
    }
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      users.delete(socket.id);
      
      // Remove user from all rooms
      rooms.forEach(room => {
        room.users.delete(socket.id);
      });

      io.emit('user_left', user);
      io.emit('users_update', Array.from(users.values()));
      io.emit('rooms_update', Array.from(rooms.values()).map(room => ({
        id: room.id,
        name: room.name,
        userCount: room.users.size
      })));
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
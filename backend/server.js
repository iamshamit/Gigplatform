const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// ... existing middleware setup ...

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('New client connected');

  // Join a chat room for a specific job
  socket.on('join-chat', (jobId) => {
    socket.join(jobId);
  });

  // Handle new messages
  socket.on('send-message', async (data) => {
    try {
      const { jobId, message, senderId } = data;
      
      // Broadcast the message to all clients in the job's chat room
      io.to(jobId).emit('new-message', {
        jobId,
        message,
        senderId
      });
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// ... existing routes setup ...

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 
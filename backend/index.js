require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "https://gigplatform.onrender.com",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import and use routes
const jobRoutes = require('./routes/jobs');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const uploadRoutes = require('./routes/upload');
app.use('/jobs', jobRoutes);
app.use('/auth', authRoutes);
app.use('/chat', chatRoutes);
app.use('/upload', uploadRoutes);


// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('New client connected');

  // Join a chat room for a specific job
  socket.on('join-chat', (jobId) => {
    socket.join(jobId);
    console.log(`Client joined chat room: ${jobId}`);
  });

  // Handle new messages
  socket.on('send-message', async (data) => {
    try {
      const { jobId, message, senderId } = data;
      console.log('Received message:', { jobId, message, senderId });
      
      // Broadcast the message to all clients in the job's chat room
      io.to(jobId).emit('new-message', {
        jobId,
        message,
        senderId
      });
      console.log('Message broadcasted to room:', jobId);
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

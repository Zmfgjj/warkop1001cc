const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const db = require('./config/database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const pesananRoutes = require('./routes/pesanan');
app.use('/api/pesanan', pesananRoutes);
const laporanRoutes = require('./routes/laporan');
app.use('/api/laporan', laporanRoutes);
const mejaRoutes = require('./routes/meja');
app.use('/api/meja', mejaRoutes);
const userRoutes = require('./routes/user');
app.use('/api/user', userRoutes);
const pembayaranRoutes = require('./routes/pembayaran');
app.use('/api/pembayaran', pembayaranRoutes);
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
const menuRoutes = require('./routes/menu');
app.use('/api/menu', menuRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 Warkop 1001 CC API is running!',
    version: '1.0.0'
  });
});

// Socket.IO
app.set('io', io);
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
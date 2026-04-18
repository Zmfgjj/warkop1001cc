const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
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

// Setup folder uploads
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for uploads
app.use('/uploads', express.static(uploadsDir));

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
const settingsRoutes = require('./routes/settings');
app.use('/api/settings', settingsRoutes);
const publikRoutes = require('./routes/publik');
app.use('/api/publik', publikRoutes);

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

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
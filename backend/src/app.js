const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const db = require('./config/database');

const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);

// CORS Config
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173', 'capacitor://localhost', 'http://localhost'];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};

const io = new Server(server, {
  cors: corsOptions
});

// Setup folder uploads
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Terlalu banyak request, silakan coba lagi nanti.' }
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs for auth/publik
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Terlalu banyak percobaan, silakan coba lagi nanti.' }
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false })); // Security headers
app.use(compression()); // Gzip compression
app.use(cors(corsOptions));
app.use(limiter);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Serve static files for uploads
app.use('/uploads', express.static(uploadsDir, { maxAge: '1d' }));

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
app.use('/api/auth', strictLimiter, authRoutes);
const menuRoutes = require('./routes/menu');
app.use('/api/menu', menuRoutes);
const settingsRoutes = require('./routes/settings');
app.use('/api/settings', settingsRoutes);
const roleRoutes = require('./routes/role');
app.use('/api/roles', roleRoutes);
const publikRoutes = require('./routes/publik');
app.use('/api/publik', strictLimiter, publikRoutes);

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
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
const waGateway = require('./services/waGateway');

const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);

// CORS Config
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173', 'capacitor://localhost', 'http://localhost'];

const corsOptions = {
  origin: function (origin, callback) {
    callback(null, true);
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
app.use('/api/uploads', express.static(uploadsDir, { maxAge: '1d' }));

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
const bonusRoutes = require('./routes/bonus');
app.use('/api/bonus', bonusRoutes);
const publikRoutes = require('./routes/publik');
app.use('/api/publik', strictLimiter, publikRoutes);
const crmRoutes = require('./routes/crm');
app.use('/api/crm', crmRoutes);
const logRoutes = require('./routes/logs');
app.use('/api/logs', logRoutes);

// Diagnostic route for uploads
app.get('/api/diagnose-uploads', (req, res) => {
  const uploadsDir = path.join(__dirname, '../public/uploads');
  try {
    const files = fs.readdirSync(uploadsDir);
    const stats = fs.statSync(uploadsDir);
    res.json({
      success: true,
      path: uploadsDir,
      mode: stats.mode,
      filesCount: files.length,
      files: files.slice(0, 50),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      path: uploadsDir
    });
  }
});

// Diagnostic route for DB menus
app.get('/api/diagnose-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, nama, gambar, tersedia FROM menu ORDER BY id DESC LIMIT 10');
    res.json({
      success: true,
      menus: rows
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Test route
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Warkop 1001 CC API is running!',
    version: '1.0.0'
  });
});

// Update Checker API
app.get('/api/version', (req, res) => {
  res.json({
    latest_version: '1.0.0', // Ganti ini di server kalau mau minta user update
    download_url: 'https://link-google-drive-atau-sejenisnya.com/warkop.apk', // Link download APK baru
    force_update: false, // Jika true, user tidak bisa masuk sebelum update
    message: 'Ada update fitur baru! Silakan download versi terbaru.'
  });
});

// Socket.IO
app.set('io', io);
waGateway.setSocketIo(io);
waGateway.initializeGateway();

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // Send current WA status to new connected client
  socket.emit('wa_status', waGateway.getStatus());

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Global error handler
app.use((err, req, res, next) => {
  // Log error aslinya ke console server
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);
  
  // Jika production, sembunyikan detail error dari client
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.status(err.status || 500).json({ 
    message: isProduction ? 'Terjadi kesalahan internal server' : err.message,
    // Jangan pernah kirim stack trace ke production!
    stack: isProduction ? undefined : err.stack 
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
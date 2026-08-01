const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for audio uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../../public/uploads/audio');
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const type = req.body.type || 'notif';
    cb(null, `kds_${req.body.mode || 'dapur'}_${type}_${Date.now()}${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedExts = /\.(mp3|wav|m4a|aac|ogg|flac|webm|3gp|opus)$/i;
    const isAllowedExt = allowedExts.test(path.extname(file.originalname || ''));
    const isAllowedMime = file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/') || file.mimetype === 'application/octet-stream' || !file.mimetype;
    if (isAllowedExt || isAllowedMime) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file audio yang diizinkan! (MP3/WAV/M4A/OPUS)'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.get('/ppn', auth(), settingsController.getPPN);
router.put('/ppn', auth({ module: 'user_manage', action: 'edit' }), settingsController.setPPN);

router.get('/kds-audio', auth(), settingsController.getKdsAudio);
router.post('/kds-audio', auth(), upload.single('audio'), settingsController.uploadKdsAudio);

module.exports = router;

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const uploadsDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    let ext = path.extname(file.originalname).toLowerCase();
    // If no extension, try to derive from mimetype (very common on mobile WebViews/APKs)
    if (!ext && file.mimetype) {
      const mimeToExt = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp'
      };
      ext = mimeToExt[file.mimetype] || '';
    }
    cb(null, `${crypto.randomUUID()}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedExts = /jpeg|jpg|png|gif|webp/;
    const allowedMime = /image\/(jpeg|jpg|png|gif|webp)/;
    
    const ext = path.extname(file.originalname).toLowerCase();
    const mimetype = allowedMime.test(file.mimetype);
    
    // If the file has an extension, validate it. If not (like 'blob'), rely on mimetype validation.
    const extname = ext ? allowedExts.test(ext) : true;
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diizinkan (JPEG, PNG, GIF, WEBP)'));
    }
  }
});

module.exports = upload;

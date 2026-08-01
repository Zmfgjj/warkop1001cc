const db = require('../config/database');

// Get PPN setting
exports.getPPN = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT nilai FROM settings WHERE `key` = 'ppn' LIMIT 1");
    
    if (rows.length === 0) {
      // Return default 2% if not set
      return res.json({ ppn: 2 });
    }
    
    res.json({ ppn: parseFloat(rows[0].nilai) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Set PPN setting
exports.setPPN = async (req, res) => {
  try {
    const { ppn } = req.body;
    
    if (ppn === undefined || ppn === null || isNaN(ppn)) {
      return res.status(400).json({ message: 'PPN harus berupa angka' });
    }
    
    // Validasi PPN antara 0-100%
    const ppnValue = parseFloat(ppn);
    if (ppnValue < 0 || ppnValue > 100) {
      return res.status(400).json({ message: 'PPN harus antara 0-100' });
    }
    
    // Check if setting exists
    const [existing] = await db.query("SELECT id FROM settings WHERE `key` = 'ppn'");
    
    if (existing.length > 0) {
      // Update existing
      await db.query("UPDATE settings SET nilai = ? WHERE `key` = 'ppn'", [ppnValue]);
    } else {
      // Insert new
      await db.query("INSERT INTO settings (`key`, nilai) VALUES ('ppn', ?)", [ppnValue]);
    }
    
    res.json({ message: 'PPN berhasil diubah', ppn: ppnValue });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper for generating full URL
const getFullAudioUrl = (req, relativePath) => {
  if (!relativePath || !relativePath.startsWith('/uploads/')) return relativePath;
  const host = req.get('host') || 'apps.warkop1001cc.cloud';
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const finalProto = host.includes('warkop1001cc.cloud') ? 'https' : proto;
  return `${finalProto}://${host}${relativePath}`;
};

// Get KDS Audio
exports.getKdsAudio = async (req, res) => {
  try {
    const { mode, type = 'notif' } = req.query; // 'dapur' or 'bar'
    if (!mode || (mode !== 'dapur' && mode !== 'bar')) {
      return res.status(400).json({ message: 'Mode harus dapur atau bar' });
    }
    
    const key = `kds_audio_${mode}${type === 'reminder' ? '_reminder' : ''}`;
    const [rows] = await db.query("SELECT nilai FROM settings WHERE `key` = ? LIMIT 1", [key]);
    
    if (rows.length === 0 || !rows[0].nilai) {
      // Return default client-side audio path if not set
      return res.json({ url: type === 'reminder' ? '/sounds/order-alert.mp3' : '/sounds/order-alert.mp3' });
    }
    
    res.json({ url: getFullAudioUrl(req, rows[0].nilai) });
  } catch (err) {
    console.error('Error getKdsAudio:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Upload KDS Audio
exports.uploadKdsAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Pilih file audio terlebih dahulu' });
    }
    
    const { mode, type = 'notif' } = req.body;
    if (!mode || (mode !== 'dapur' && mode !== 'bar')) {
      return res.status(400).json({ message: 'Mode harus dapur atau bar' });
    }
    
    const audioUrl = `/uploads/audio/${req.file.filename}`;
    const key = `kds_audio_${mode}${type === 'reminder' ? '_reminder' : ''}`;
    
    // Check if setting exists
    const [existing] = await db.query("SELECT id FROM settings WHERE `key` = ?", [key]);
    
    if (existing.length > 0) {
      await db.query("UPDATE settings SET nilai = ? WHERE `key` = ?", [audioUrl, key]);
    } else {
      await db.query("INSERT INTO settings (`key`, nilai) VALUES (?, ?)", [key, audioUrl]);
    }
    
    res.json({ 
      message: 'Audio KDS berhasil diperbarui', 
      url: getFullAudioUrl(req, audioUrl)
    });
  } catch (err) {
    console.error('Error uploadKdsAudio:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

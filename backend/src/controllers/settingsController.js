const db = require('../config/database');

// Removed PPN since it's included in price

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

// Get KPI Target
exports.getKpiTarget = async (req, res) => {
  try {
    const key = 'laporan_kpi_target';
    const [rows] = await db.query("SELECT nilai FROM settings WHERE `key` = ? LIMIT 1", [key]);
    
    if (rows.length === 0 || !rows[0].nilai) {
      return res.json({ target: 50000000 }); // Default 50 juta
    }
    
    res.json({ target: Number(rows[0].nilai) });
  } catch (err) {
    console.error('Error getKpiTarget:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update KPI Target
exports.updateKpiTarget = async (req, res) => {
  try {
    const { target } = req.body;
    if (target === undefined || isNaN(Number(target))) {
      return res.status(400).json({ message: 'Target tidak valid' });
    }
    
    const key = 'laporan_kpi_target';
    const stringValue = String(target);
    
    const [existing] = await db.query("SELECT id FROM settings WHERE `key` = ?", [key]);
    
    if (existing.length > 0) {
      await db.query("UPDATE settings SET nilai = ? WHERE `key` = ?", [stringValue, key]);
    } else {
      await db.query("INSERT INTO settings (`key`, nilai) VALUES (?, ?)", [key, stringValue]);
    }
    
    res.json({ message: 'Target KPI berhasil diperbarui', target: Number(target) });
  } catch (err) {
    console.error('Error updateKpiTarget:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

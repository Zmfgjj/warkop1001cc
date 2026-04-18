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

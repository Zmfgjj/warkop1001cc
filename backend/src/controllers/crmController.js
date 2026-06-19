const db = require('../config/database');
const waGateway = require('../services/waGateway');

exports.getPelanggan = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        nama_pelanggan, 
        no_telepon, 
        email, 
        COUNT(id) as total_kunjungan, 
        SUM(total) as total_belanja,
        MAX(created_at) as kunjungan_terakhir
      FROM pesanan 
      WHERE 
        status = 'selesai' 
        AND no_telepon IS NOT NULL 
        AND no_telepon != ''
      GROUP BY 
        no_telepon, nama_pelanggan, email
      ORDER BY 
        total_belanja DESC
    `);
    
    // Format the phone numbers (ensure starting with 62)
    const formattedRows = rows.map(r => {
      let phone = r.no_telepon.replace(/\D/g, ''); // remove non-digits
      if (phone.startsWith('0')) {
        phone = '62' + phone.substring(1);
      } else if (!phone.startsWith('62')) {
        phone = '62' + phone; // assuming it's a local number without 0 or 62
      }
      return {
        ...r,
        no_telepon_wa: phone
      };
    });

    res.json(formattedRows);
  } catch (err) {
    console.error('CRM Controller Error:', err);
    res.status(500).json({ message: 'Server error saat mengambil data CRM' });
  }
};



exports.getWaStatus = (req, res) => {
  try {
    const status = waGateway.getStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ message: 'Error checking WA status' });
  }
};

exports.logoutWa = async (req, res) => {
  try {
    await waGateway.logout();
    res.json({ message: 'Berhasil logout dari WhatsApp' });
  } catch (err) {
    res.status(500).json({ message: 'Error logout WA' });
  }
};

exports.broadcastLocal = async (req, res) => {
  try {
    const { targets, message } = req.body;
    
    if (!targets || targets.length === 0 || !message) {
      return res.status(400).json({ message: 'Data tidak lengkap. Pastikan ada target dan pesan.' });
    }

    const successCount = await waGateway.sendBroadcastMessage(targets, message);
    
    res.json({ message: `Broadcast berhasil dikirim ke ${successCount} nomor menggunakan Gateway Lokal!` });
  } catch (err) {
    console.error('CRM Broadcast Local Error:', err);
    res.status(500).json({ message: err.message || 'Server error saat mengirim broadcast lokal' });
  }
};


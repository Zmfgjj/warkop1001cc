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
        MAX(created_at) as kunjungan_terakhir,
        SUM(CASE WHEN MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE()) THEN 1 ELSE 0 END) as kunjungan_bulan_ini,
        SUM(CASE WHEN MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE()) THEN total ELSE 0 END) as belanja_bulan_ini
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

exports.toggleWa = async (req, res) => {
  try {
    const { action } = req.body;
    if (action === 'start') {
      waGateway.startService();
      res.json({ message: 'Memulai WhatsApp Gateway...' });
    } else if (action === 'stop') {
      waGateway.stopService().catch(e => console.error(e));
      res.json({ message: 'WhatsApp Gateway sedang dimatikan...' });
    } else {
      res.status(400).json({ message: 'Action tidak valid' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengubah status WA' });
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


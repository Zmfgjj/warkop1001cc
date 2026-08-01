const db = require('../config/database');
const os = require('os');
const { logAction } = require('../services/logger');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

// Fetch activity logs
exports.getActivityLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const [rows] = await db.query(
      'SELECT id, user_id, username, action_type, table_name, description, (backup_data IS NOT NULL) AS has_backup, created_at FROM activity_logs ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Restore a deleted transaction (Rollback/Recovery)
exports.restoreLog = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;
    
    // Find the log
    const [logs] = await conn.query('SELECT * FROM activity_logs WHERE id = ?', [id]);
    if (logs.length === 0) {
      return res.status(404).json({ message: 'Log tidak ditemukan' });
    }

    const logEntry = logs[0];
    if (!logEntry.backup_data) {
      return res.status(400).json({ message: 'Log ini tidak memiliki data backup untuk dipulihkan' });
    }

    const backup = JSON.parse(logEntry.backup_data);
    const { pesanan, detail_pesanan, pembayaran } = backup;

    if (!pesanan || !pesanan.id) {
      return res.status(400).json({ message: 'Data backup transaksi tidak lengkap/valid' });
    }

    await conn.beginTransaction();

    // Check if pesanan already exists
    const [existing] = await conn.query('SELECT id FROM pesanan WHERE id = ?', [pesanan.id]);
    if (existing.length > 0) {
      await conn.rollback();
      return res.status(400).json({ message: `Transaksi #${pesanan.id} sudah ada di database (tidak perlu dipulihkan)` });
    }

    // Restore pesanan row (maintaining original id and created_at if possible)
    const pesananFields = Object.keys(pesanan);
    const pesananValues = Object.values(pesanan);
    const pesananPlaceholders = pesananFields.map(() => '?').join(', ');
    
    await conn.query(
      `INSERT INTO pesanan (${pesananFields.join(', ')}) VALUES (${pesananPlaceholders})`,
      pesananValues
    );

    // Restore detail_pesanan items
    if (Array.isArray(detail_pesanan) && detail_pesanan.length > 0) {
      for (const item of detail_pesanan) {
        // Exclude AUTO_INCREMENT primary key to prevent duplication errors, or preserve it if needed
        const itemFields = Object.keys(item);
        const itemValues = Object.values(item);
        const itemPlaceholders = itemFields.map(() => '?').join(', ');
        await conn.query(
          `INSERT INTO detail_pesanan (${itemFields.join(', ')}) VALUES (${itemPlaceholders})`,
          itemValues
        );
      }
    }

    // Restore pembayaran records
    if (Array.isArray(pembayaran) && pembayaran.length > 0) {
      for (const pay of pembayaran) {
        const payFields = Object.keys(pay);
        const payValues = Object.values(pay);
        const payPlaceholders = payFields.map(() => '?').join(', ');
        await conn.query(
          `INSERT INTO pembayaran (${payFields.join(', ')}) VALUES (${payPlaceholders})`,
          payValues
        );
      }
    }

    // Log the restore event
    const userId = req.user ? req.user.id : null;
    const username = req.user ? (req.user.username || req.user.nama || 'USER') : 'SYSTEM';
    const description = `Memulihkan Transaksi #${pesanan.id} (${pesanan.nama_pelanggan || 'Pelanggan Umum'}) - Total Rp ${Number(pesanan.total).toLocaleString('id-ID')}`;
    
    await conn.query(
      `INSERT INTO activity_logs (user_id, username, action_type, table_name, description, backup_data) 
       VALUES (?, ?, 'RESTORE', 'pesanan', ?, NULL)`,
      [userId, username, description]
    );

    // Mark the source log to prevent multiple restores (or clear its backup data)
    await conn.query('UPDATE activity_logs SET backup_data = NULL WHERE id = ?', [id]);

    await conn.commit();

    // Emit Socket event so POS/history panels reload
    const io = req.app.get('io');
    if (io) {
      io.emit('mejaUpdated');
      io.emit('pesanan_baru', { pesanan_id: pesanan.id });
    }

    res.json({ message: 'Transaksi berhasil dipulihkan', pesanan_id: pesanan.id });
  } catch (err) {
    await conn.rollback();
    console.error('❌ Gagal memulihkan transaksi:', err);
    res.status(500).json({ message: 'Gagal memulihkan transaksi: ' + err.message });
  } finally {
    conn.release();
  }
};

// System Resource Monitoring status
exports.getSystemStatus = async (req, res) => {
  try {
    // 1. Memory Info
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramUsagePercent = Math.round((usedMem / totalMem) * 100);

    // 2. CPU info
    const cpus = os.cpus();
    const cpuModel = cpus.length > 0 ? cpus[0].model : 'Unknown';
    const cpuCores = cpus.length;

    // 3. Database status test
    const startTime = Date.now();
    await db.query('SELECT 1');
    const dbLatencyMs = Date.now() - startTime;

    // 4. Counts of orders, menus, users
    const [[{ orderCount }]] = await db.query('SELECT COUNT(*) as orderCount FROM pesanan');
    const [[{ menuCount }]] = await db.query('SELECT COUNT(*) as menuCount FROM menu');
    const [[{ userCount }]] = await db.query('SELECT COUNT(*) as userCount FROM users');

    // Helper function to get folder size
    const getFolderSize = async (path) => {
      try {
        const { stdout } = await exec(`du -sh ${path} 2>/dev/null | cut -f1`);
        return stdout.trim() || '0B';
      } catch (e) {
        return '0B';
      }
    };

    // 5. Disk Usage
    let diskUsage = { size: '0G', used: '0G', avail: '0G', pcent: '0%' };
    try {
      const { stdout } = await exec('df -h / | awk \'NR==2 {print $2, $3, $4, $5}\'');
      const parts = stdout.trim().split(/\s+/);
      if (parts.length >= 4) {
        diskUsage = { size: parts[0], used: parts[1], avail: parts[2], pcent: parts[3] };
      }
    } catch (e) {
      console.warn('Failed to get disk usage:', e.message);
    }

    // 6. Top Processes (Top 5 by memory)
    let processes = [];
    try {
      // Get top 5 processes. PID, %CPU, %MEM, COMMAND
      const { stdout } = await exec('ps aux --sort=-%mem | awk \'NR>1 && NR<=6 {print $2, $3, $4, $11}\'');
      const lines = stdout.trim().split('\n');
      processes = lines.map(line => {
        const parts = line.trim().split(/\s+/);
        // cmd might be a path, extract the basename
        let cmd = parts.slice(3).join(' ');
        cmd = cmd.split('/').pop();
        return { pid: parts[0], cpu: parts[1], mem: parts[2], cmd: cmd };
      }).filter(p => p.pid);
    } catch (e) {
      console.warn('Failed to get processes:', e.message);
    }

    res.json({
      platform: os.platform(),
      arch: os.arch(),
      uptime: os.uptime(),
      cpu: {
        model: cpuModel,
        cores: cpuCores,
        loadAvg: os.loadavg()
      },
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        percentage: ramUsagePercent
      },
      database: {
        status: 'ONLINE',
        latencyMs: dbLatencyMs,
        stats: {
          orders: orderCount,
          menus: menuCount,
          users: userCount
        }
      },
      processes: processes,
      folders: [
        { name: 'PM2 Logs', path: '~/.pm2/logs', size: await getFolderSize('~/.pm2/logs') },
        { name: 'Puppeteer Cache', path: '/root/.cache/puppeteer', size: await getFolderSize('/root/.cache/puppeteer') },
        { name: 'Temp Uploads', path: '../temp_uploads', size: await getFolderSize('../temp_uploads') }
      ]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Clear server cache (PM2 logs, old puppeteer data, temporary files)
exports.clearServerCache = async (req, res) => {
  try {
    const { target } = req.body; // e.g. 'pm2', 'puppeteer', 'temp_uploads', or 'all'
    let commands = [];
    let desc = '';

    if (target === 'pm2') {
      commands.push('pm2 flush');
      desc = 'Membersihkan log PM2';
    } else if (target === 'puppeteer') {
      commands.push('rm -rf /root/.cache/puppeteer/*');
      desc = 'Membersihkan cache Chrome/Puppeteer';
    } else if (target === 'temp_uploads') {
      commands.push('rm -rf ../temp_uploads/*');
      desc = 'Membersihkan file temporary uploads';
    } else {
      commands = [
        'pm2 flush',
        'rm -rf /root/.cache/puppeteer/*',
        'rm -rf ../temp_uploads/*'
      ];
      desc = 'Membersihkan semua sampah server';
    }

    let results = [];
    for (const cmd of commands) {
      try {
        await exec(cmd);
        results.push({ cmd, status: 'success' });
      } catch (err) {
        results.push({ cmd, status: 'error', error: err.message });
      }
    }

    // Log this action
    const userId = req.user ? req.user.id : null;
    const username = req.user ? (req.user.username || req.user.nama || 'USER') : 'SYSTEM';
    
    await db.query(
      `INSERT INTO activity_logs (user_id, username, action_type, table_name, description) 
       VALUES (?, ?, 'CLEAR_CACHE', 'system', ?)`,
      [userId, username, desc]
    );

    res.json({ message: 'Pembersihan selesai', results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal membersihkan cache server' });
  }
};

// Restart server (PM2 or VPS Reboot)
exports.restartServer = async (req, res) => {
  try {
    const { type } = req.body || {}; // 'pm2' or 'vps'
    const isVps = type === 'vps';
    
    const userId = req.user ? req.user.id : null;
    const username = req.user ? (req.user.username || req.user.nama || 'USER') : 'SYSTEM';
    
    const actionDesc = isVps 
      ? 'Melakukan REBOOT sistem VPS Server (Reset Uptime)' 
      : 'Melakukan restart layanan aplikasi (PM2)';
      
    await db.query(
      `INSERT INTO activity_logs (user_id, username, action_type, table_name, description) 
       VALUES (?, ?, 'RESTART_SERVER', 'system', ?)`,
      [userId, username, actionDesc]
    );

    const resMessage = isVps
      ? 'Perintah REBOOT VPS dikirim. Mesin server sedang dimuat ulang (memakan waktu 30-60 detik)...'
      : 'Perintah restart PM2 dikirim. Layanan sedang dimuat ulang dalam 2-5 detik...';

    res.json({ message: resMessage });

    // Delay command slightly so the HTTP response reaches the client safely
    setTimeout(() => {
      const cmd = isVps ? 'reboot' : 'pm2 restart all';
      exec(cmd).catch(err => console.error('Restart error:', err));
    }, 1000);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal merestart server' });
  }
};

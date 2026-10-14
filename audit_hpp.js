const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const scriptVPS = `
const db = require('./src/config/database');
async function run() {
  const conn = await db.getConnection();
  try {
    // Cek semua variasi persentase HPP yang ada di transaksi (per bulan)
    console.log("\\n=== SEMUA VARIASI HPP PER BULAN (TRANSAKSI) ===");
    const [byMonth] = await conn.query(\`
      SELECT 
        DATE_FORMAT(p.created_at, '%Y-%m') as bulan,
        ROUND((dp.hpp / dp.harga) * 100, 1) as hpp_persen,
        COUNT(DISTINCT dp.menu_id) as jumlah_menu,
        COUNT(*) as jumlah_item
      FROM detail_pesanan dp
      JOIN pesanan p ON dp.pesanan_id = p.id
      WHERE dp.harga > 0
      GROUP BY bulan, hpp_persen
      ORDER BY bulan ASC, hpp_persen ASC
    \`);
    byMonth.forEach(r => {
      const flag = r.hpp_persen != 35.0 && r.hpp_persen != 45.0 ? ' ⚠️ BEDA' : '';
      console.log("Bulan: " + r.bulan + " | HPP: " + r.hpp_persen + "% | Uniq Menu: " + r.jumlah_menu + " | Items: " + r.jumlah_item + flag);
    });

    // Cek master menu - apakah ada menu dengan HPP bukan 45%
    console.log("\\n=== MASTER MENU DENGAN HPP BUKAN 45% ===");
    const [menuAneh] = await conn.query(\`
      SELECT nama, harga, hpp, ROUND((hpp/harga)*100,1) as hpp_persen
      FROM menu 
      WHERE harga > 0 AND is_deleted = FALSE 
        AND ABS((hpp/harga) - 0.45) > 0.01
      ORDER BY hpp_persen ASC
    \`);
    if (menuAneh.length === 0) {
      console.log("Semua menu sudah HPP 45%.");
    } else {
      menuAneh.forEach(r => {
        console.log("- " + r.nama + " | Harga: " + r.harga + " | HPP: " + r.hpp + " (" + r.hpp_persen + "%)");
      });
    }

    // Cek transaksi September 2026 - lihat detail per menu mana saja yang 24%
    console.log("\\n=== DETAIL TRANSAKSI SEPT 2026 DENGAN HPP BUKAN 35% ===");
    const [septAneh] = await conn.query(\`
      SELECT 
        m.nama as menu_nama,
        dp.harga,
        dp.hpp,
        ROUND((dp.hpp/dp.harga)*100,1) as hpp_persen,
        COUNT(*) as jumlah
      FROM detail_pesanan dp
      JOIN pesanan p ON dp.pesanan_id = p.id
      LEFT JOIN menu m ON dp.menu_id = m.id
      WHERE dp.harga > 0 
        AND p.created_at >= '2026-09-01' AND p.created_at < '2026-10-01'
        AND ABS((dp.hpp/dp.harga) - 0.35) > 0.01
      GROUP BY m.nama, dp.harga, dp.hpp, hpp_persen
      ORDER BY hpp_persen ASC
      LIMIT 30
    \`);
    if (septAneh.length === 0) {
      console.log("Semua transaksi September HPP 35%.");
    } else {
      septAneh.forEach(r => {
        console.log("- " + r.menu_nama + " | Harga: " + r.harga + " | HPP: " + r.hpp + " (" + r.hpp_persen + "%) | Jumlah: " + r.jumlah);
      });
    }

  } catch(e) {
    console.error(e);
  } finally {
    conn.release();
    process.exit(0);
  }
}
run();
`;

const localFile = path.join(__dirname, 'tmp_audit_hpp.js');
fs.writeFileSync(localFile, scriptVPS);

const VPS = 'root@202.155.157.13';
const remoteFile = '/var/www/backend/tmp_audit_hpp.js';

console.log("⏳ Mengaudit data HPP di VPS...");
try {
  execSync(`scp -o StrictHostKeyChecking=no "${localFile}" ${VPS}:${remoteFile}`, { stdio: 'inherit' });
  execSync(`ssh -o StrictHostKeyChecking=no ${VPS} "cd /var/www/backend && node tmp_audit_hpp.js"`, { stdio: 'inherit' });
} catch(e) {
  console.error("Gagal:", e.message);
} finally {
  fs.unlinkSync(localFile);
}

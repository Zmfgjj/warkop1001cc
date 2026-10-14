const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Script yang akan dijalankan di VPS
const scriptVPS = `
const db = require('./src/config/database');
async function run() {
  const conn = await db.getConnection();
  try {
    const query = \`
      SELECT 
        DATE_FORMAT(p.created_at, '%Y-%m') as bulan,
        ROUND((dp.hpp / dp.harga) * 100, 1) as hpp_persen,
        ROUND(100 - ((dp.hpp / dp.harga) * 100), 1) as gp_persen,
        COUNT(*) as jumlah_item
      FROM detail_pesanan dp
      JOIN pesanan p ON dp.pesanan_id = p.id
      WHERE dp.harga > 0
      GROUP BY bulan, hpp_persen
      ORDER BY bulan ASC, hpp_persen ASC
    \`;
    const [rows] = await conn.query(query);
    console.log("=========================================================");
    console.log("HISTORI HPP & GROSS PROFIT PER BULAN (dari transaksi):");
    console.log("=========================================================");
    if (rows.length === 0) {
      console.log("Belum ada data transaksi.");
    } else {
      rows.forEach(r => {
        console.log("Bulan: " + r.bulan + " | HPP: " + r.hpp_persen + "% | GP: " + r.gp_persen + "% | Items: " + r.jumlah_item);
      });
    }
    console.log("=========================================================");

    const queryHarian = \`
      SELECT 
        DATE(p.created_at) as tanggal,
        ROUND((dp.hpp / dp.harga) * 100, 1) as hpp_persen,
        ROUND(100 - ((dp.hpp / dp.harga) * 100), 1) as gp_persen,
        COUNT(*) as jumlah_item
      FROM detail_pesanan dp
      JOIN pesanan p ON dp.pesanan_id = p.id
      WHERE dp.harga > 0 AND p.created_at >= '2026-10-01'
      GROUP BY tanggal, hpp_persen
      ORDER BY tanggal ASC
    \`;
    const [rowsH] = await conn.query(queryHarian);
    console.log("\\nDETAIL HARIAN SEJAK 1 OKTOBER 2026:");
    console.log("=========================================================");
    if (rowsH.length === 0) {
      console.log("Belum ada data di Oktober 2026.");
    } else {
      rowsH.forEach(r => {
        console.log("Tgl: " + r.tanggal + " | HPP: " + r.hpp_persen + "% | GP: " + r.gp_persen + "% | Items: " + r.jumlah_item);
      });
    }
    console.log("=========================================================");
  } catch(e) {
    console.error(e);
  } finally {
    conn.release();
    process.exit(0);
  }
}
run();
`;

// Simpan script ke file lokal sementara
const localFile = path.join(__dirname, 'tmp_cek_hpp.js');
fs.writeFileSync(localFile, scriptVPS);

const VPS = 'root@202.155.157.13';
const remoteFile = '/var/www/backend/tmp_cek_hpp.js';

console.log("⏳ Menyalin script ke VPS via SCP...");
try {
  execSync(`scp -o StrictHostKeyChecking=no "${localFile}" ${VPS}:${remoteFile}`, { stdio: 'inherit' });
  console.log("✅ File berhasil disalin. Menjalankan script di VPS...");
  execSync(`ssh -o StrictHostKeyChecking=no ${VPS} "cd /var/www/backend && node tmp_cek_hpp.js"`, { stdio: 'inherit' });
} catch(e) {
  console.error("Gagal:", e.message);
} finally {
  fs.unlinkSync(localFile);
}

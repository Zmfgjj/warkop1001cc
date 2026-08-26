const db = require('./src/config/database');

async function fixMemberPoints() {
  const conn = await db.getConnection();
  try {
    const pointsData = [
      { name: 'tamba', points: 1430 },
      { name: 'uci', points: 500 },
      { name: 'lili', points: 1110 },
      { name: 'arina', points: 1090 },
      { name: 'dinda', points: 880 }
    ];

    for (const item of pointsData) {
      // Kita pakai LIKE agar cocok dengan nama atau nama panggilan
      const searchTerm = `%${item.name}%`;
      const [result] = await conn.query(
        `UPDATE members SET point = ? WHERE nama_panggilan LIKE ? OR nama LIKE ?`,
        [item.points, searchTerm, searchTerm]
      );
      
      if (result.affectedRows > 0) {
        console.log(`✅ Point member '${item.name}' berhasil diupdate menjadi ${item.points}`);
      } else {
        console.log(`❌ Member '${item.name}' tidak ditemukan!`);
      }
    }

    console.log("Proses perbaikan poin selesai!");
  } catch (err) {
    console.error("Terjadi kesalahan:", err);
  } finally {
    conn.release();
    process.exit();
  }
}

fixMemberPoints();

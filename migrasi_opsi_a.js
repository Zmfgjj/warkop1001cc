const db = require('./src/config/database');

async function run() {
  const conn = await db.getConnection();
  try {
    const targets = [
      { searchName: '%Milky love%', newPrice: 15000 },
      { searchName: '%Creamy tea%', newPrice: 15000 },
      { searchName: '%Sweet honey tea%', newPrice: 15000 },
      { searchName: '%Lemon tea%', newPrice: 15000 },
      { searchName: '%Peach tea%', newPrice: 15000 }
    ];

    console.log("=========================================");
    console.log("=== MEMULAI PROSES MIGRASI (OPSI A) ===");
    console.log("=========================================\n");

    let totalMigrasi = 0;

    for (const t of targets) {
      console.log(`Mencari menu untuk: ${t.searchName.replace(/%/g, '')} ...`);
      
      // Ambil semua menu yang namanya mirip
      const [menus] = await conn.query('SELECT id, nama, harga, is_deleted FROM menu WHERE nama LIKE ?', [t.searchName]);
      
      console.log(`📋 Ditemukan ${menus.length} menu dengan nama mirip:`);
      menus.forEach(m => console.log(`   - ID: ${m.id} | Nama: "${m.nama}" | Harga: ${m.harga} | is_deleted: ${m.is_deleted}`));

      // Cari menu baru (yang harganya 15000 dan tidak dihapus)
      const newMenu = menus.find(m => Number(m.harga) === t.newPrice && m.is_deleted === 0);
      
      // Cari menu lama (selain menu baru, yang harganya di bawah 15000)
      const oldMenus = menus.filter(m => (!newMenu || m.id !== newMenu.id) && Number(m.harga) < t.newPrice);

      if (!newMenu) {
        console.log(` ❌ [SKIPPED] Tidak menemukan menu BARU (harga 15000, belum dihapus) untuk ${t.searchName}`);
        console.log("-----------------------------------------\n");
        continue;
      }

      if (oldMenus.length === 0) {
        console.log(` ⚠️ [SKIPPED] Tidak ada menu LAMA yang perlu dimigrasi untuk ${newMenu.nama}`);
        console.log("-----------------------------------------\n");
        continue;
      }

      console.log(` ✅ Ditemukan Menu BARU: ID ${newMenu.id} (${newMenu.nama}) - Rp ${newMenu.harga}`);
      const oldIds = oldMenus.map(m => m.id);
      console.log(` ✅ Ditemukan Menu LAMA: IDs [${oldIds.join(', ')}]`);

      // Cek jumlah transaksi lama yang menempel di ID Lama
      const [oldTrx] = await conn.query('SELECT COUNT(id) as cnt FROM detail_pesanan WHERE menu_id IN (?)', [oldIds]);
      console.log(` 🔄 Ada ${oldTrx[0].cnt} riwayat pesanan (gelas) dari masa lalu...`);

      if (oldTrx[0].cnt > 0) {
        // Pindahkan menu_id ke ID Baru (Harga TIDAK diubah, murni cuma pindah ID sesuai Opsi A)
        const [updateResult] = await conn.query('UPDATE detail_pesanan SET menu_id = ? WHERE menu_id IN (?)', [newMenu.id, oldIds]);
        console.log(` 🎉 BERHASIL! ${updateResult.affectedRows} baris pesanan telah dipindah/digabung ke ID ${newMenu.id}`);
        totalMigrasi += updateResult.affectedRows;
      }
      
      // Pastikan menu lama disembunyikan agar kasir tidak bingung (is_deleted = 1)
      await conn.query('UPDATE menu SET is_deleted = 1 WHERE id IN (?)', [oldIds]);
      console.log(` 🔒 Menu LAMA [${oldIds.join(', ')}] telah dinonaktifkan (disembunyikan dari layar kasir)`);
      
      console.log("-----------------------------------------\n");
    }

    console.log("=========================================");
    console.log(`=== SELESAI! Total ${totalMigrasi} histori pesanan berhasil digabung. ===`);
    console.log("=========================================");

  } catch(e) {
    console.error("Terjadi Kesalahan:", e);
  } finally {
    conn.release();
    process.exit(0);
  }
}

run();

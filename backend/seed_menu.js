const db = require('./src/config/database');

const kategoriData = [
  { nama: 'MAIN COURSE', urutan: 1 },
  { nama: 'INDOMIE SERIES', urutan: 2 },
  { nama: 'SNACK', urutan: 3 },
  { nama: 'SIGNATURE', urutan: 4 },
  { nama: 'SIGNATURE COFFEE BAR', urutan: 5 },
  { nama: 'SIGNATURE MOCKTAIL', urutan: 6 },
  { nama: 'MANUAL BREW', urutan: 7 },
  { nama: 'PAKET', urutan: 8 },
  { nama: 'LAIN-LAIN', urutan: 9 } // Kategori tambahan untuk item paket yg tidak ada di A La Carte
];

const menuData = [
  { kat: 'MAIN COURSE', nama: 'Rice Bowl Nugget', harga: 15000 },
  { kat: 'MAIN COURSE', nama: 'Rice Bowl Chicken Bbq', harga: 19000 },
  { kat: 'MAIN COURSE', nama: 'Rice Bowl Chicken Teriyaki', harga: 19000 },
  { kat: 'MAIN COURSE', nama: 'Rice Bowl Chicken Blackpapper', harga: 19000 },
  { kat: 'MAIN COURSE', nama: 'Rice Bowl Chicken Sambal Matah', harga: 22000 },
  { kat: 'MAIN COURSE', nama: 'Nasi Ayam Suwir Daun Kemangi', harga: 20000 },
  { kat: 'MAIN COURSE', nama: 'Rice Bowl Chiken Sambal Bledeg', harga: 22000 },
  { kat: 'MAIN COURSE', nama: 'Nasi Daun Jeruk Ayam Sambal Bawang', harga: 23000 },
  { kat: 'MAIN COURSE', nama: 'Mie Tek-tek', harga: 20000 },
  { kat: 'MAIN COURSE', nama: 'Steak Ayam', harga: 35000 },
  { kat: 'MAIN COURSE', nama: 'Steak Daging', harga: 45000 },
  
  { kat: 'INDOMIE SERIES', nama: 'Indomie Goreng Original', harga: 10000 },
  { kat: 'INDOMIE SERIES', nama: 'Indomie Rendang', harga: 10000 },
  { kat: 'INDOMIE SERIES', nama: 'Indomie Ayam Bawang', harga: 10000 },
  { kat: 'INDOMIE SERIES', nama: 'Indomie Soto', harga: 10000 },
  
  { kat: 'SNACK', nama: 'Cireng Rujak', harga: 15000 },
  { kat: 'SNACK', nama: 'Kentang Goreng', harga: 15000 },
  { kat: 'SNACK', nama: 'Singkong Goreng', harga: 15000 },
  { kat: 'SNACK', nama: 'Loeyam (Lumpia Ayam)', harga: 20000 },
  { kat: 'SNACK', nama: 'Dimsum', harga: 18000 },
  { kat: 'SNACK', nama: 'Macaroni Schotel', harga: 18000 },
  { kat: 'SNACK', nama: 'Spaghetti Panggang', harga: 18000 },
  { kat: 'SNACK', nama: 'Snack Ice Cream', harga: 18000 },
  { kat: 'SNACK', nama: 'Cilok 1001cc', harga: 18000 },
  
  { kat: 'SIGNATURE', nama: 'Kopi Cakra', harga: 25000 },
  { kat: 'SIGNATURE', nama: 'Cakra Matcha Latte', harga: 25000 },
  { kat: 'SIGNATURE', nama: 'Affogato', harga: 22000 },
  { kat: 'SIGNATURE', nama: 'Kopi Susu Gula Aren', harga: 22000 },
  
  { kat: 'SIGNATURE COFFEE BAR', nama: 'Iced Baileys Coffee', harga: 23000 },
  { kat: 'SIGNATURE COFFEE BAR', nama: 'Iced Black Mango', harga: 20000 },
  { kat: 'SIGNATURE COFFEE BAR', nama: 'Iced Black Lychee', harga: 20000 },
  { kat: 'SIGNATURE COFFEE BAR', nama: 'Iced Black Peach', harga: 20000 },
  { kat: 'SIGNATURE COFFEE BAR', nama: 'Iced Butterscotch', harga: 23000 },
  { kat: 'SIGNATURE COFFEE BAR', nama: 'Iced Machiato', harga: 22000 },
  { kat: 'SIGNATURE COFFEE BAR', nama: 'Avocado Coffee', harga: 23000 },
  { kat: 'SIGNATURE COFFEE BAR', nama: 'Cappucino (hot/ice)', harga: 22000 },
  { kat: 'SIGNATURE COFFEE BAR', nama: 'Coffe Lattee (hot/ice)', harga: 21000 },
  { kat: 'SIGNATURE COFFEE BAR', nama: 'Iced Americano', harga: 18000 },
  { kat: 'SIGNATURE COFFEE BAR', nama: 'Espresso 1 shot', harga: 17000 },
  
  { kat: 'SIGNATURE MOCKTAIL', nama: 'Perfreshlite Mocktail', harga: 21000 },
  { kat: 'SIGNATURE MOCKTAIL', nama: 'Pertamix Mocktail', harga: 21000 },
  { kat: 'SIGNATURE MOCKTAIL', nama: 'Pertamix Turbo Mocktail', harga: 21000 },
  { kat: 'SIGNATURE MOCKTAIL', nama: 'SolarGO Mocktail', harga: 21000 },
  
  { kat: 'MANUAL BREW', nama: 'V60', harga: 25000 },
  { kat: 'MANUAL BREW', nama: 'Japanese', harga: 25000 }
];

const paketData = [
  { nama: 'Paket Susu Santai 1', harga: 15000, items: ['Susu Hangat', 'Pisang Goreng'] },
  { nama: 'Paket Susu Santai 2', harga: 15000, items: ['Susu Hangat', 'Roti Bakar'] },
  { nama: 'Paket Susu Santai 3', harga: 15000, items: ['Susu Hangat', 'Pisang Kukus'] },
  { nama: 'Paket Kopi Santai 1', harga: 20000, items: ['Kopi Tubruk', 'Pisang Goreng'] },
  { nama: 'Paket Kopi Santai 2', harga: 20000, items: ['Kopi Tubruk', 'Roti Bakar'] },
  { nama: 'Paket Kopi Santai 3', harga: 20000, items: ['Kopi Tubruk', 'Pisang Kukus'] },
  { nama: 'Paket Santuy A', harga: 22000, items: ['Kentang Goreng', 'Es Teh Manis'] },
  { nama: 'Paket Santuy B', harga: 22000, items: ['Cireng Rujak', 'Es Teh Manis'] },
  { nama: 'Ramean 1', harga: 23000, items: ['Rice Bowl Chicken Teriyaki', 'Es Teh Manis'] }, // Mapping Teriyaki
  { nama: 'Ramean 2', harga: 23000, items: ['Rice Bowl Chicken Bbq', 'Es Teh Manis'] },       // Mapping Barbeque
  { nama: 'Ramean 3', harga: 23000, items: ['Rice Bowl Chicken Blackpapper', 'Es Teh Manis'] } // Mapping Blackpepper
];

async function seed() {
  try {
    console.log('⏳ Mulai proses seeder...');

    // 1. Buat tabel paket_item jika belum ada
    await db.query(`
      CREATE TABLE IF NOT EXISTS \`paket_item\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`paket_id\` int(11) NOT NULL,
        \`menu_id\` int(11) NOT NULL,
        PRIMARY KEY (\`id\`),
        FOREIGN KEY (\`paket_id\`) REFERENCES \`menu\` (\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`menu_id\`) REFERENCES \`menu\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ Tabel paket_item dipastikan ada');

    // Helper: Cari atau insert kategori
    async function getKategoriId(nama, urutan = 99) {
      const [rows] = await db.query('SELECT id FROM kategori WHERE nama = ?', [nama]);
      if (rows.length > 0) return rows[0].id;
      const [res] = await db.query('INSERT INTO kategori (nama, urutan) VALUES (?, ?)', [nama, urutan]);
      return res.insertId;
    }

    // Helper: Cari atau insert menu
    async function getMenuId(nama, harga = 0, kategoriId = null) {
      const [rows] = await db.query('SELECT id FROM menu WHERE nama = ?', [nama]);
      if (rows.length > 0) return rows[0].id;
      
      // Jika kategori tidak diberikan, gunakan 'LAIN-LAIN'
      let katId = kategoriId;
      if (!katId) {
        katId = await getKategoriId('LAIN-LAIN');
      }
      const [res] = await db.query('INSERT INTO menu (kategori_id, nama, harga) VALUES (?, ?, ?)', [katId, nama, harga]);
      return res.insertId;
    }

    // 2. Insert Kategori
    for (const k of kategoriData) {
      await getKategoriId(k.nama, k.urutan);
    }
    console.log('✅ Kategori berhasil dimasukkan');

    // 3. Insert Menu A La Carte
    for (const m of menuData) {
      const katId = await getKategoriId(m.kat);
      await getMenuId(m.nama, m.harga, katId);
    }
    console.log('✅ Menu A La Carte berhasil dimasukkan');

    // 4. Insert Paket dan Relasinya
    const paketKatId = await getKategoriId('PAKET');
    
    for (const p of paketData) {
      const paketDeskripsi = p.items.join(' + ');
      
      // Insert Paket sebagai Menu
      let paketId;
      const [existing] = await db.query('SELECT id FROM menu WHERE nama = ? AND kategori_id = ?', [p.nama, paketKatId]);
      if (existing.length > 0) {
        paketId = existing[0].id;
        // Update deskripsi & harga
        await db.query('UPDATE menu SET harga = ?, deskripsi = ? WHERE id = ?', [p.harga, paketDeskripsi, paketId]);
      } else {
        const [res] = await db.query('INSERT INTO menu (kategori_id, nama, harga, deskripsi) VALUES (?, ?, ?, ?)', 
          [paketKatId, p.nama, p.harga, paketDeskripsi]);
        paketId = res.insertId;
      }

      // Bersihkan relasi lama untuk paket ini (jika ada)
      await db.query('DELETE FROM paket_item WHERE paket_id = ?', [paketId]);

      // Buat Relasi paket_item
      for (const itemNama of p.items) {
        // Cari menu item, jika tidak ada (seperti Susu Hangat), maka otomatis dibuat ke kategori LAIN-LAIN
        const itemId = await getMenuId(itemNama);
        await db.query('INSERT INTO paket_item (paket_id, menu_id) VALUES (?, ?)', [paketId, itemId]);
      }
    }
    console.log('✅ Data Paket beserta relasinya berhasil dimasukkan');
    console.log('🎉 Seeder selesai!');

  } catch (err) {
    console.error('❌ Terjadi kesalahan:', err);
  } finally {
    process.exit();
  }
}

seed();

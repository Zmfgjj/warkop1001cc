const db = require('./src/config/database');

async function migrate() {
  try {
    console.log('Menambahkan kolom pilihan_rasa ke tabel menu...');
    await db.query("ALTER TABLE menu ADD COLUMN pilihan_rasa VARCHAR(255) DEFAULT NULL");
    console.log('✅ Kolom pilihan_rasa berhasil ditambahkan!');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('✅ Kolom pilihan_rasa sudah ada.');
    } else {
      console.error('❌ Gagal menambahkan kolom:', err.message);
    }
  } finally {
    process.exit();
  }
}

migrate();

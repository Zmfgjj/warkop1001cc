const db = require('./src/config/database');

async function seedMeja() {
  try {
    // Kosongkan tabel meja
    await db.query('DELETE FROM meja');
    
    // Siapkan data 42 meja dengan format 001, 002, ...
    let values = [];
    for(let i=1; i<=42; i++) {
      values.push(`('${String(i).padStart(3, '0')}')`);
    }
    
    // Insert sekaligus
    await db.query('INSERT INTO meja (nomor) VALUES ' + values.join(','));
    console.log('✅ 42 tables created successfully');
  } catch(e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

seedMeja();

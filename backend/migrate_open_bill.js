const db = require('./src/config/database');

async function migrate() {
  try {
    console.log('Migrating pesanan table...');
    await db.query(`ALTER TABLE pesanan ADD COLUMN is_open_bill BOOLEAN DEFAULT FALSE`);
    console.log('is_open_bill added.');
    
    await db.query(`ALTER TABLE pesanan ADD COLUMN dp_amount DECIMAL(10,2) DEFAULT 0`);
    console.log('dp_amount added.');
    
    await db.query(`ALTER TABLE pesanan ADD COLUMN nama_pelanggan VARCHAR(255) DEFAULT NULL`);
    console.log('nama_pelanggan added.');
    
    // Status meja in existing schema: We don't need to alter ENUM if it's just VARCHAR. 
    // Let's assume we can just use "reservasi" as string. If it fails due to ENUM, we will catch it.
    console.log('Migration completed successfully.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Fields already exist, ignoring.');
    } else {
      console.error('Migration error:', err);
    }
  } finally {
    process.exit();
  }
}

migrate();

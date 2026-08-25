const db = require('./src/config/database');

async function run() {
  try {
    const [rows] = await db.query('SELECT count(*) as count FROM menu');
    const [sample] = await db.query('SELECT id, nama, harga, hpp FROM menu LIMIT 5');
    console.log(`Total menu to update: ${rows[0].count}`);
    console.log('Sample data before update:');
    console.table(sample);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();

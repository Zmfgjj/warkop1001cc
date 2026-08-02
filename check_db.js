const db = require('./src/db');
async function run() {
  try {
    const [categories] = await db.query('SELECT * FROM kategori');
    console.log('--- EXISTING CATEGORIES ---');
    console.log(JSON.stringify(categories, null, 2));

    const [menus] = await db.query('SELECT id, nama, kategori_id, harga, hpp FROM menu');
    console.log('--- EXISTING MENUS ---');
    console.log(`Total Menus: ${menus.length}`);
    // console.log(JSON.stringify(menus.slice(0, 5), null, 2)); // show sample

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();

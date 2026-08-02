const mysql = require('mysql2/promise');

const updateMap = [
  // Signature
  { id: 65, cat: 'Signature', nama: 'Kopi Cakra', harga: 25000, deskripsi: 'Perpaduan espresso dengan gula aren dan sentuhan dark coklat.' },
  { id: 28, cat: 'Signature', nama: 'Cakra Matcha Latte', harga: 25000, deskripsi: 'Matcha premium berpadu dengan susu & gula aren.' },
  { id: 30, cat: 'Signature', nama: 'Kopi Susu Gula Aren', harga: 22000, deskripsi: 'Perpaduan antara kopi, susu, dan gula aren yang manis.' },
  { id: 29, cat: 'Signature', nama: 'Afogatto', harga: 22000, deskripsi: 'Espresso yang disajikan dengan es krim vanilla.' },

  // Signature Coffee Bar
  { id: 33, cat: 'Signature Coffee Bar', nama: 'Black Lychee', harga: 22000, deskripsi: 'Americano dengan tambahan sirup buah lychee.' },
  { id: 32, cat: 'Signature Coffee Bar', nama: 'Black Mango', harga: 22000, deskripsi: 'Americano dengan tambahan sirup buah mango.' },
  { id: 40, cat: 'Signature Coffee Bar', nama: 'Americano', harga: 22000, deskripsi: 'Espresso yang disajikan dingin, menghasilkan rasa ringan.' },
  { id: 34, cat: 'Signature Coffee Bar', nama: 'Black Peach', harga: 22000, deskripsi: 'Americano dengan tambahan sirup buah peach.' },
  { id: 39, cat: 'Signature Coffee Bar', nama: 'Iced Coffee Latte', harga: 21000, deskripsi: 'Perpaduan espresso pilihan dengan susu segar dan es batu, menghasilkan rasa kopi yang lembut, creamy, dan tetap bold.' },
  { id: 35, cat: 'Signature Coffee Bar', nama: 'Butterscotch', harga: 23000, deskripsi: 'Espresso dengan campuran susu dan sirup butterscotch manis.' },
  { id: 31, cat: 'Signature Coffee Bar', nama: 'Baileys Coffee', harga: 23000, deskripsi: 'Espresso creamy dengan sirup rasa Baileys (non-alkohol).' },
  { id: 36, cat: 'Signature Coffee Bar', nama: 'Machiato', harga: 22000, deskripsi: 'Espresso pekat dengan sedikit busa susu.' },
  { id: 38, cat: 'Signature Coffee Bar', nama: 'Cappuccino', harga: 22000, deskripsi: 'Espresso dengan susu steamed dan foam tebal di atasnya.' },
  { id: 37, cat: 'Signature Coffee Bar', nama: 'Avocado Coffee', harga: 23000, deskripsi: 'Minuman unik yang memadukan rasa buah alpukat yang creamy dengan kopi.' },
  { id: 41, cat: 'Signature Coffee Bar', nama: 'Espresso', harga: 17000, deskripsi: 'Bubuk kopi hitam tradisional diseduh langsung.' },

  // Manual Brew
  { id: 46, cat: 'Manual Brew', nama: 'V60', harga: 25000, deskripsi: 'Seduhan manual dengan biji kopi Kintamani, menghasilkan rasa clean dan fruity.' },
  { id: 47, cat: 'Manual Brew', nama: 'Japanese', harga: 25000, deskripsi: 'Seduhan manual dengan biji kopi Kintamani, diseduh dingin ala Jepang yang segar.' },

  // Signature Mocktail
  { id: 42, cat: 'Signature Mocktail', nama: 'Perfreshlite', harga: 21000, deskripsi: 'Soda berpadu dengan sirup green apple.' },
  { id: 43, cat: 'Signature Mocktail', nama: 'Pertamix', harga: 21000, deskripsi: 'Soda berpadu dengan sirup blue curacao.' },
  { id: 44, cat: 'Signature Mocktail', nama: 'Pertamix Turbo', harga: 21000, deskripsi: 'Soda berpadu dengan sirup raspberry.' },
  { id: 45, cat: 'Signature Mocktail', nama: 'SolarGO', harga: 21000, deskripsi: 'Soda berpadu dengan sirup mango.' },

  // Tea Series
  { id: 60, cat: 'Tea Series', nama: 'Es Teh Manis', harga: 7000, deskripsi: '-' },

  // Others
  { id: 56, cat: 'Others', nama: 'Kopi Tubruk', harga: 10000, deskripsi: 'Bubuk kopi hitam tradisional diseduh langsung.' },

  // Main Course
  { id: 13, cat: 'Main Course', nama: 'Steak Ayam', harga: 35000, deskripsi: 'Daging ayam panggang dengan saus barbeque/black pepper dan kentang goreng.' },
  { id: 14, cat: 'Main Course', nama: 'Steak Daging', harga: 45000, deskripsi: 'Daging sapi panggang dengan saus barbeque/black pepper dan kentang goreng.' },
  { id: 6, cat: 'Main Course', nama: 'Rice Bowl Chicken Teriyaki', harga: 19000, deskripsi: 'Nasi dengan ayam tumis saus teriyaki khas Jepang, manis dan savory.' },
  { id: 4, cat: 'Main Course', nama: 'Rice Bowl Nugget', harga: 15000, deskripsi: 'Nasi putih hangat dengan nugget, praktis dan mengenyangkan.' },
  { id: 7, cat: 'Main Course', nama: 'Rice Bowl Chicken Blackpapper', harga: 19000, deskripsi: 'Nasi dengan ayam dibalut saus Blackpapper pedas gurih.' },
  { id: 5, cat: 'Main Course', nama: 'Rice Bowl Chicken Barbeque', harga: 19000, deskripsi: 'Nasi dengan ayam dibalut saus barbeque manis gurih.' },
  { id: 10, cat: 'Main Course', nama: 'Rice Bowl Chicken Sambal Bledeg', harga: 22000, deskripsi: 'Nasi dengan ayam yang disiram sambal bledeg super pedas dan gurih.' },
  { id: 8, cat: 'Main Course', nama: 'Rice Bowl Chicken Sambal Matah', harga: 22000, deskripsi: 'Nasi dengan ayam yang dipadukan sambal matah segar, wangi, dan pedas gurih.' },
  { id: 9, cat: 'Main Course', nama: 'Nasi Ayam Suwir Kemangi', harga: 20000, deskripsi: 'Nasi dengan ayam suwir berbumbu gurih pedas yang dipadukan aroma kemangi segar.' },
  { id: 11, cat: 'Main Course', nama: 'Nasi Daun Jeruk Ayam Sambal Bawang', harga: 23000, deskripsi: 'Nasi harum daun jeruk dengan ayam berbumbu gurih yang dipadukan sambal bawang pedas nendang.' },
  { id: 12, cat: 'Main Course', nama: 'Mie Tek-tek', harga: 20000, deskripsi: 'Mie goreng nyemek khas kaki lima dengan bumbu gurih pedas.' },

  // Paket Keluarga
  { id: 62, cat: 'Paket Keluarga', nama: 'Keluarga 1 (Ricebowl Teriyaki + Es Teh Manis)', harga: 23000, deskripsi: '-' },
  { id: 63, cat: 'Paket Keluarga', nama: 'Keluarga 2 (Ricebowl Barbeque + Es Teh Manis)', harga: 23000, deskripsi: '-' },
  { id: 64, cat: 'Paket Keluarga', nama: 'Keluarga 3 (Ricebowl Blackpepper + Es Teh Manis)', harga: 23000, deskripsi: '-' },

  // Snack
  { id: 52, cat: 'Snack', nama: 'Roti Bakar', harga: 18000, deskripsi: 'Roti panggang isi topping Coklat/Keju/Green Tea/Tiramisu.' },
  { id: 50, cat: 'Snack', nama: 'Pisang Cocol', harga: 18000, deskripsi: 'Pisang goreng dengan pilihan saus coklat atau tiramisu.' },
  { id: 21, cat: 'Snack', nama: 'Singkong Goreng', harga: 15000, deskripsi: 'Singkong yang digoreng krispi tapi lembut di dalam.' },
  { id: 20, cat: 'Snack', nama: 'Kentang Goreng', harga: 15000, deskripsi: 'Potongan kentang goreng renyah dengan saus dan mayones.' },
  { id: 19, cat: 'Snack', nama: 'Cireng Rujak', harga: 15000, deskripsi: 'Cireng kenyal disajikan dengan sambal rujak pedas-manis.' },
  { id: 22, cat: 'Snack', nama: 'Loeyam (Lumpia Ayam)', harga: 20000, deskripsi: 'Ayam suwir yang sudah dibumbui lalu dibungkus dengan kulit lumpia.' },
  { id: 27, cat: 'Snack', nama: 'Cilok 1001cc', harga: 18000, deskripsi: 'Cilok kenyal dengan campuran sambal yang pedas.' },
  { id: 26, cat: 'Snack', nama: 'Snack Ice Cream', harga: 18000, deskripsi: 'Ice cream vanila yang dingin dan creamy, varian bubuk yang' }
];

const newItems = [
  { cat: 'Signature Coffee Bar', nama: 'Hot Coffee Latte', harga: 21000, deskripsi: 'Perpaduan espresso hangat dengan susu steamed yang lembut dan creamy, menciptakan rasa kopi yang smooth, balance, dan comforting di setiap tegukan.' },
  { cat: 'Non Coffee', nama: 'Green Tea', harga: 20000, deskripsi: 'Minuman teh hijau lembut dengan susu.' },
  { cat: 'Non Coffee', nama: 'Red Velvet', harga: 20000, deskripsi: 'Susu creamy dengan bubuk red velvet manis.' },
  { cat: 'Non Coffee', nama: 'Dark Chocolate', harga: 20000, deskripsi: 'Cokelat bubuk pekat dengan susu, rasa manis seimbang.' },
  { cat: 'Non Coffee', nama: 'Taro', harga: 20000, deskripsi: 'Susu dengan bubuk taro ungu khas, creamy, dan manis.' },
  { cat: 'Tea Series', nama: 'Teh Susu', harga: 13000, deskripsi: 'Perpaduan teh dan susu yang creamy.' },
  { cat: 'Tea Series', nama: 'Teh Manis Hangat', harga: 5000, deskripsi: '-' },
  { cat: 'Tea Series', nama: 'Lemon Tea', harga: 13000, deskripsi: 'Perpaduan teh dan lemon yang segar.' },
  { cat: 'Tea Series', nama: 'Peach Tea', harga: 15000, deskripsi: 'Perpaduan teh dan sirup peach yang segar.' },
  { cat: 'Tea Series', nama: 'Lychee Tea', harga: 15000, deskripsi: 'Perpaduan teh dan sirup lychee yang segar ditambah dengan potongan buah lychee yang manis.' },
  { cat: 'Yakult Squash', nama: 'Green Apple Squash', harga: 20000, deskripsi: 'Soda berpadu dengan sirup green apple ditambah dengan yakult.' },
  { cat: 'Yakult Squash', nama: 'Mango Squash', harga: 20000, deskripsi: 'Soda berpadu dengan sirup mango ditambah dengan yakult.' },
  { cat: 'Yakult Squash', nama: 'Peach Squash', harga: 20000, deskripsi: 'Soda berpadu dengan sirup raspberry ditambah dengan yakult.' },
  { cat: 'Creamy Mocktail', nama: 'Peach Creamy', harga: 22000, deskripsi: 'Soda berpadu dengan sirup raspberry ditambah dengan ice cream yang creamy.' },
  { cat: 'Creamy Mocktail', nama: 'Green Apple', harga: 22000, deskripsi: 'Soda berpadu dengan sirup green apple ditambah dengan ice cream yang creamy.' },
  { cat: 'Creamy Mocktail', nama: 'Blue Curacao', harga: 22000, deskripsi: 'Soda berpadu dengan sirup blue curacao ditambah dengan ice cream yang creamy.' },
  { cat: 'Creamy Mocktail', nama: 'Mango Creamy', harga: 22000, deskripsi: 'Perpaduan sirup mango dan soda ditambah dengan ice cream yang creamy.' },
  { cat: 'Others', nama: 'Temu Canda', harga: 18000, deskripsi: 'Temulawak berpadu susu segar, disajikan dingin.' },
  { cat: 'Others', nama: 'Coffee Beer', harga: 18000, deskripsi: 'Campuran kopi espresso dan minuman bersoda Beer Banteng.' },
  { cat: 'Others', nama: 'Cleo', harga: 6000, deskripsi: '-' },
  { cat: 'Paket Keluarga', nama: 'Keluarga 4 (Ayam Suwir Kemangi + Es Teh Manis)', harga: 24000, deskripsi: '-' },
  { cat: 'Paket Keluarga', nama: 'Keluarga 5 (Chicken Bledeg + Es Teh Manis)', harga: 25000, deskripsi: '-' },
  { cat: 'Paket Keluarga', nama: 'Keluarga 6 (Mie Tek Tek + Es Teh Manis)', harga: 24000, deskripsi: '-' },
  { cat: 'Snack', nama: 'Mix Platter', harga: 22000, deskripsi: 'Kentang goreng, nugget, & sosis, disajikan dengan saus dan mayones.' }
];

async function run() {
  const conn = await mysql.createConnection({ host: '127.0.0.1', user: 'root', password: '', database: 'warkop1001cc' });

  // 1. Setup categories
  const cats = ['Signature', 'Signature Coffee Bar', 'Manual Brew', 'Signature Mocktail', 'Non Coffee', 'Tea Series', 'Yakult Squash', 'Creamy Mocktail', 'Others', 'Main Course', 'Paket Keluarga', 'Snack', 'Add On', 'Indomie Series', 'Paket Santuy', 'Paket Kopi Santai', 'Paket Susu Santai'];
  
  let catMap = {};
  const [existingCats] = await conn.query('SELECT * FROM kategori');
  for (let cat of existingCats) {
    catMap[cat.nama] = cat.id;
  }

  for (let i = 0; i < cats.length; i++) {
    const cat = cats[i];
    if (!catMap[cat]) {
      const [res] = await conn.query('INSERT INTO kategori (nama, urutan) VALUES (?, ?)', [cat, i]);
      catMap[cat] = res.insertId;
    } else {
      await conn.query('UPDATE kategori SET urutan = ? WHERE id = ?', [i, catMap[cat]]);
    }
  }

  // 2. Update mapped items
  for (let item of updateMap) {
    if (catMap[item.cat]) {
      await conn.query('UPDATE menu SET kategori_id = ?, nama = ?, harga = ?, deskripsi = ? WHERE id = ?', [catMap[item.cat], item.nama, item.harga, item.deskripsi, item.id]);
    }
  }

  // 3. Insert new items
  for (let item of newItems) {
    if (catMap[item.cat]) {
      await conn.query('INSERT INTO menu (kategori_id, nama, deskripsi, harga, tersedia) VALUES (?, ?, ?, ?, 1)', [catMap[item.cat], item.nama, item.deskripsi, item.harga]);
    }
  }

  console.log("Cleanup and mapping done successfully.");
  await conn.end();
}
run().catch(console.error);

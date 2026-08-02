const mysql = require('mysql2/promise');

const data = {
  "Signature": [
    { nama: "Kopi Cakra", harga: 25000, deskripsi: "Perpaduan espresso dengan gula aren dan sentuhan dark coklat." },
    { nama: "Cakra Matcha Latte", harga: 25000, deskripsi: "Matcha premium berpadu dengan susu & gula aren." },
    { nama: "Kopi Susu Gula Aren", harga: 22000, deskripsi: "Perpaduan antara kopi, susu, dan gula aren yang manis." },
    { nama: "Afogatto", harga: 22000, deskripsi: "Espresso yang disajikan dengan es krim vanilla." }
  ],
  "Signature Coffee Bar": [
    { nama: "Black Lychee", harga: 22000, deskripsi: "Americano dengan tambahan sirup buah lychee." },
    { nama: "Black Mango", harga: 22000, deskripsi: "Americano dengan tambahan sirup buah mango." },
    { nama: "Americano", harga: 22000, deskripsi: "Espresso yang disajikan dingin, menghasilkan rasa ringan." },
    { nama: "Black Peach", harga: 22000, deskripsi: "Americano dengan tambahan sirup buah peach." },
    { nama: "Iced Coffee Latte", harga: 21000, deskripsi: "Perpaduan espresso pilihan dengan susu segar dan es batu, menghasilkan rasa kopi yang lembut, creamy, dan tetap bold." },
    { nama: "Hot Coffee Latte", harga: 21000, deskripsi: "Perpaduan espresso hangat dengan susu steamed yang lembut dan creamy, menciptakan rasa kopi yang smooth, balance, dan comforting di setiap tegukan." },
    { nama: "Butterscotch", harga: 23000, deskripsi: "Espresso dengan campuran susu dan sirup butterscotch manis." },
    { nama: "Baileys Coffee", harga: 23000, deskripsi: "Espresso creamy dengan sirup rasa Baileys (non-alkohol)." },
    { nama: "Machiato", harga: 22000, deskripsi: "Espresso pekat dengan sedikit busa susu." },
    { nama: "Cappuccino", harga: 22000, deskripsi: "Espresso dengan susu steamed dan foam tebal di atasnya." },
    { nama: "Avocado Coffee", harga: 23000, deskripsi: "Minuman unik yang memadukan rasa buah alpukat yang creamy dengan kopi." },
    { nama: "Espresso", harga: 17000, deskripsi: "Bubuk kopi hitam tradisional diseduh langsung." }
  ],
  "Manual Brew": [
    { nama: "V60", harga: 25000, deskripsi: "Seduhan manual dengan biji kopi Kintamani, menghasilkan rasa clean dan fruity." },
    { nama: "Japanese", harga: 25000, deskripsi: "Seduhan manual dengan biji kopi Kintamani, diseduh dingin ala Jepang yang segar." }
  ],
  "Signature Mocktail": [
    { nama: "Perfreshlite", harga: 21000, deskripsi: "Soda berpadu dengan sirup green apple." },
    { nama: "Pertamix", harga: 21000, deskripsi: "Soda berpadu dengan sirup blue curacao." },
    { nama: "Pertamix Turbo", harga: 21000, deskripsi: "Soda berpadu dengan sirup raspberry." },
    { nama: "SolarGO", harga: 21000, deskripsi: "Soda berpadu dengan sirup mango." }
  ],
  "Non Coffee": [
    { nama: "Green Tea", harga: 20000, deskripsi: "Minuman teh hijau lembut dengan susu." },
    { nama: "Red Velvet", harga: 20000, deskripsi: "Susu creamy dengan bubuk red velvet manis." },
    { nama: "Dark Chocolate", harga: 20000, deskripsi: "Cokelat bubuk pekat dengan susu, rasa manis seimbang." },
    { nama: "Taro", harga: 20000, deskripsi: "Susu dengan bubuk taro ungu khas, creamy, dan manis." }
  ],
  "Tea Series": [
    { nama: "Teh Susu", harga: 13000, deskripsi: "Perpaduan teh dan susu yang creamy." },
    { nama: "Es Teh Manis", harga: 7000, deskripsi: "-" },
    { nama: "Teh Manis Hangat", harga: 5000, deskripsi: "-" },
    { nama: "Lemon Tea", harga: 13000, deskripsi: "Perpaduan teh dan lemon yang segar." },
    { nama: "Peach Tea", harga: 15000, deskripsi: "Perpaduan teh dan sirup peach yang segar." },
    { nama: "Lychee Tea", harga: 15000, deskripsi: "Perpaduan teh dan sirup lychee yang segar ditambah dengan potongan buah lychee yang manis." }
  ],
  "Yakult Squash": [
    { nama: "Green Apple Squash", harga: 20000, deskripsi: "Soda berpadu dengan sirup green apple ditambah dengan yakult." },
    { nama: "Mango Squash", harga: 20000, deskripsi: "Soda berpadu dengan sirup mango ditambah dengan yakult." },
    { nama: "Peach Squash", harga: 20000, deskripsi: "Soda berpadu dengan sirup raspberry ditambah dengan yakult." }
  ],
  "Creamy Mocktail": [
    { nama: "Peach Creamy", harga: 22000, deskripsi: "Soda berpadu dengan sirup raspberry ditambah dengan ice cream yang creamy." },
    { nama: "Green Apple", harga: 22000, deskripsi: "Soda berpadu dengan sirup green apple ditambah dengan ice cream yang creamy." },
    { nama: "Blue Curacao", harga: 22000, deskripsi: "Soda berpadu dengan sirup blue curacao ditambah dengan ice cream yang creamy." },
    { nama: "Mango Creamy", harga: 22000, deskripsi: "Perpaduan sirup mango dan soda ditambah dengan ice cream yang creamy." }
  ],
  "Others": [
    { nama: "Temu Canda", harga: 18000, deskripsi: "Temulawak berpadu susu segar, disajikan dingin." },
    { nama: "Coffee Beer", harga: 18000, deskripsi: "Campuran kopi espresso dan minuman bersoda Beer Banteng." },
    { nama: "Kopi Tubruk", harga: 10000, deskripsi: "Bubuk kopi hitam tradisional diseduh langsung." },
    { nama: "Cleo", harga: 6000, deskripsi: "-" }
  ],
  "Main Course": [
    { nama: "Steak Ayam", harga: 35000, deskripsi: "Daging ayam panggang dengan saus barbeque/black pepper dan kentang goreng." },
    { nama: "Steak Daging", harga: 45000, deskripsi: "Daging sapi panggang dengan saus barbeque/black pepper dan kentang goreng." },
    { nama: "Rice Bowl Chicken Teriyaki", harga: 19000, deskripsi: "Nasi dengan ayam tumis saus teriyaki khas Jepang, manis dan savory." },
    { nama: "Rice Bowl Nugget", harga: 15000, deskripsi: "Nasi putih hangat dengan nugget, praktis dan mengenyangkan." },
    { nama: "Rice Bowl Chicken Blackpapper", harga: 19000, deskripsi: "Nasi dengan ayam dibalut saus Blackpapper pedas gurih." },
    { nama: "Rice Bowl Chicken Barbeque", harga: 19000, deskripsi: "Nasi dengan ayam dibalut saus barbeque manis gurih." },
    { nama: "Rice Bowl Chicken Sambal Bledeg", harga: 22000, deskripsi: "Nasi dengan ayam yang disiram sambal bledeg super pedas dan gurih." },
    { nama: "Rice Bowl Chicken Sambal Matah", harga: 22000, deskripsi: "Nasi dengan ayam yang dipadukan sambal matah segar, wangi, dan pedas gurih." },
    { nama: "Nasi Ayam Suwir Kemangi", harga: 20000, deskripsi: "Nasi dengan ayam suwir berbumbu gurih pedas yang dipadukan aroma kemangi segar." },
    { nama: "Nasi Daun Jeruk Ayam Sambal Bawang", harga: 23000, deskripsi: "Nasi harum daun jeruk dengan ayam berbumbu gurih yang dipadukan sambal bawang pedas nendang." },
    { nama: "Mie Tek-tek", harga: 20000, deskripsi: "Mie goreng nyemek khas kaki lima dengan bumbu gurih pedas." }
  ],
  "Paket Keluarga": [
    { nama: "Keluarga 1 (Ricebowl Teriyaki + Es Teh Manis)", harga: 23000, deskripsi: "-" },
    { nama: "Keluarga 2 (Ricebowl Barbeque + Es Teh Manis)", harga: 23000, deskripsi: "-" },
    { nama: "Keluarga 3 (Ricebowl Blackpepper + Es Teh Manis)", harga: 23000, deskripsi: "-" },
    { nama: "Keluarga 4 (Ayam Suwir Kemangi + Es Teh Manis)", harga: 24000, deskripsi: "-" },
    { nama: "Keluarga 5 (Chicken Bledeg + Es Teh Manis)", harga: 25000, deskripsi: "-" },
    { nama: "Keluarga 6 (Mie Tek Tek + Es Teh Manis)", harga: 24000, deskripsi: "-" }
  ],
  "Snack": [
    { nama: "Roti Bakar", harga: 18000, deskripsi: "Roti panggang isi topping Coklat/Keju/Green Tea/Tiramisu." },
    { nama: "Mix Platter", harga: 22000, deskripsi: "Kentang goreng, nugget, & sosis, disajikan dengan saus dan mayones." },
    { nama: "Pisang Cocol", harga: 18000, deskripsi: "Pisang goreng dengan pilihan saus coklat atau tiramisu." },
    { nama: "Singkong Goreng", harga: 15000, deskripsi: "Singkong yang digoreng krispi tapi lembut di dalam." },
    { nama: "Kentang Goreng", harga: 15000, deskripsi: "Potongan kentang goreng renyah dengan saus dan mayones." },
    { nama: "Cireng Rujak", harga: 15000, deskripsi: "Cireng kenyal disajikan dengan sambal rujak pedas-manis." },
    { nama: "Loeyam (Lumpia Ayam)", harga: 20000, deskripsi: "Ayam suwir yang sudah dibumbui lalu dibungkus dengan kulit lumpia." },
    { nama: "Cilok 1001cc", harga: 18000, deskripsi: "Cilok kenyal dengan campuran sambal yang pedas." },
    { nama: "Snack Ice Cream", harga: 18000, deskripsi: "Ice cream vanila yang dingin dan creamy, varian bubuk yang" }
  ]
};

function normalizeText(text) {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function run() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'warkop1001cc'
  });

  const [existingCategories] = await conn.query('SELECT * FROM kategori');
  let categoryMap = {};
  for (let cat of existingCategories) {
    categoryMap[normalizeText(cat.nama)] = cat.id;
  }

  const [existingMenus] = await conn.query('SELECT * FROM menu');
  let menuMap = {};
  for (let menu of existingMenus) {
    menuMap[normalizeText(menu.nama)] = menu;
  }

  let stats = {
    updated: 0,
    inserted: 0,
    unmatched: []
  };

  for (let catName of Object.keys(data)) {
    let normalizedCatName = normalizeText(catName);
    let catId = categoryMap[normalizedCatName];
    
    // Insert category if not exists
    if (!catId) {
      const [result] = await conn.query('INSERT INTO kategori (nama) VALUES (?)', [catName]);
      catId = result.insertId;
      categoryMap[normalizedCatName] = catId;
      console.log(`Created new category: ${catName}`);
    }

    const items = data[catName];
    for (let item of items) {
      let normalizedItemName = normalizeText(item.nama);
      let existingMenu = menuMap[normalizedItemName];

      if (existingMenu) {
        // Update existing
        await conn.query('UPDATE menu SET deskripsi = ?, harga = ? WHERE id = ?', [item.deskripsi, item.harga, existingMenu.id]);
        stats.updated++;
      } else {
        // Fuzzy matching to find potential match before insert
        let potentialMatch = existingMenus.find(m => (normalizeText(m.nama).includes(normalizedItemName) || normalizedItemName.includes(normalizeText(m.nama))) && Math.abs(normalizeText(m.nama).length - normalizedItemName.length) < 5);
        if (potentialMatch) {
            console.log(`Fuzzy match found for "${item.nama}": Matched with "${potentialMatch.nama}". Updating it.`);
            await conn.query('UPDATE menu SET deskripsi = ?, harga = ? WHERE id = ?', [item.deskripsi, item.harga, potentialMatch.id]);
            stats.updated++;
        } else {
            // Insert new
            console.log(`No match for: "${item.nama}", inserting new...`);
            await conn.query('INSERT INTO menu (kategori_id, nama, deskripsi, harga, tersedia) VALUES (?, ?, ?, ?, 1)', [catId, item.nama, item.deskripsi, item.harga]);
            stats.inserted++;
            stats.unmatched.push(item.nama);
        }
      }
    }
  }

  console.log('\\n=== SUMMARY ===');
  console.log(`Rows Updated: ${stats.updated}`);
  console.log(`Rows Inserted: ${stats.inserted}`);
  console.log(`Items inserted (no existing match): ${stats.unmatched.join(', ')}`);

  await conn.end();
}

run().catch(console.error);

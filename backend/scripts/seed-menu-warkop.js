require('dotenv').config({ path: '../src/.env' });
require('dotenv').config({ path: '../.env' });
const db = require('../src/config/database');

const menuData = [
  { category: 'SIGNATURE', items: [
    { name: 'Kopi Cakra', desc: 'Perpaduan espresso dengan gula aren dan sentuhan dark coklat', price: 25000 },
    { name: 'Cakra Matcha Latte', desc: 'Matcha premium berpadu dengan susu & gula aren', price: 25000 },
    { name: 'Kopi Susu Gula Aren', desc: 'Perpaduan antara kopi, susu, dan gula aren yang manis', price: 22000 },
    { name: 'Afogatto', desc: 'Espresso yang disajikan dengan es krim vanilla', price: 22000 },
  ]},
  { category: 'SIGNATURE COFFEE BAR', items: [
    { name: 'Black Lychee', desc: 'Americano dengan tambahan sirup buah lychee', price: 22000 },
    { name: 'Black Mango', desc: 'Americano dengan tambahan sirup buah mango', price: 22000 },
    { name: 'Black Peach', desc: 'Americano dengan tambahan sirup buah peach', price: 22000 },
    { name: 'Americano', desc: 'Espresso yang disajikan dingin, menghasilkan rasa ringan', price: 22000 },
    { name: 'Baileys Coffee', desc: 'Espresso creamy dengan sirup rasa Baileys (non-alkohol)', price: 23000 },
    { name: 'Cappuccino', desc: 'Espresso dengan susu steamed dan foam tebal di atasnya', price: 22000 },
    { name: 'Iced Coffee Latte', desc: 'Perpaduan espresso pilihan dengan susu segar dan es batu, rasa lembut, creamy, tetap bold', price: 21000 },
    { name: 'Hot Coffee Latte', desc: 'Espresso hangat + susu steamed lembut & creamy, smooth & comforting', price: 21000 },
    { name: 'Butterscotch', desc: 'Espresso dengan campuran susu dan sirup butterscotch manis', price: 23000 },
    { name: 'Machiato', desc: 'Espresso pekat dengan sedikit busa susu', price: 22000 },
    { name: 'Avocado Coffee', desc: 'Rasa buah alpukat yang creamy dengan kopi', price: 23000 },
    { name: 'Espresso', desc: 'Bubuk kopi hitam tradisional diseduh langsung', price: 17000 },
  ]},
  { category: 'MANUAL BREW', items: [
    { name: 'V60', desc: 'Seduhan manual biji kopi Kintamani, rasa clean & fruity', price: 25000 },
    { name: 'Japanese', desc: 'Seduhan manual biji kopi Kintamani, diseduh dingin ala Jepang', price: 25000 },
  ]},
  { category: 'SIGNATURE MOCKTAIL', items: [
    { name: 'Perfreshlite', desc: 'Soda + sirup green apple', price: 21000 },
    { name: 'Pertamix', desc: 'Soda + sirup blue curacao', price: 21000 },
    { name: 'Pertamix Turbo', desc: 'Soda + sirup raspberry', price: 21000 },
    { name: 'SolarGO', desc: 'Soda + sirup mango', price: 21000 },
  ]},
  { category: 'NON COFFEE', items: [
    { name: 'Green Tea', desc: 'Minuman teh hijau lembut dengan susu', price: 20000 },
    { name: 'Red Velvet', desc: 'Susu creamy dengan bubuk red velvet manis', price: 20000 },
    { name: 'Dark Chocolate', desc: 'Cokelat bubuk pekat dengan susu, manis seimbang', price: 20000 },
    { name: 'Taro', desc: 'Susu dengan bubuk taro ungu, creamy manis', price: 20000 },
  ]},
  { category: 'TEA SERIES', items: [
    { name: 'Teh Susu', desc: 'Perpaduan teh dan susu yang creamy', price: 13000 },
    { name: 'Es Teh Manis', desc: '', price: 7000 },
    { name: 'Teh Manis Hangat', desc: '', price: 5000 },
    { name: 'Lemon Tea', desc: 'Perpaduan teh dan lemon segar', price: 13000 },
    { name: 'Peach Tea', desc: 'Perpaduan teh dan sirup peach segar', price: 15000 },
    { name: 'Lychee Tea', desc: 'Teh + sirup lychee + potongan buah lychee', price: 15000 },
  ]},
  { category: 'YAKULT SQUASH', items: [
    { name: 'Mango Squash', desc: 'Soda + sirup mango + yakult', price: 20000 },
    { name: 'Green Apple Squash', desc: 'Soda + sirup green apple + yakult', price: 20000 },
    { name: 'Peach Squash', desc: 'Soda + sirup raspberry + yakult', price: 20000 },
  ]},
  { category: 'CREAMY MOCKTAIL', items: [
    { name: 'Peach Creamy', desc: 'Soda + sirup raspberry + ice cream creamy', price: 22000 },
    { name: 'Green Apple', desc: 'Soda + sirup green apple + ice cream creamy', price: 22000 },
    { name: 'Blue Curacao', desc: 'Soda + sirup blue curacao + ice cream creamy', price: 22000 },
    { name: 'Mango Creamy', desc: 'Sirup mango + soda + ice cream creamy', price: 22000 },
  ]},
  { category: 'OTHERS', items: [
    { name: 'Temu Canda', desc: 'Temulawak + susu segar, disajikan dingin', price: 18000 },
    { name: 'Coffee Beer', desc: 'Espresso + minuman bersoda Beer Banteng', price: 18000 },
    { name: 'Kopi Tubruk', desc: 'Bubuk kopi hitam tradisional diseduh langsung', price: 10000 },
    { name: 'Cleo', desc: 'Air mineral botol', price: 6000 },
  ]},
  { category: 'MAIN COURSE', items: [
    { name: 'Steak Ayam', desc: 'Daging ayam panggang + saus barbeque/black pepper + kentang goreng', price: 35000 },
    { name: 'Steak Daging', desc: 'Daging sapi panggang + saus barbeque/black pepper + kentang goreng', price: 45000 },
    { name: 'Rice Bowl Chicken Teriyaki', desc: 'Nasi + ayam tumis saus teriyaki khas Jepang, manis savory', price: 19000 },
    { name: 'Rice Bowl Nugget', desc: 'Nasi putih hangat + nugget, praktis mengenyangkan', price: 15000 },
    { name: 'Rice Bowl Chicken Blackpepper', desc: 'Nasi + ayam saus blackpepper pedas gurih', price: 19000 },
    { name: 'Rice Bowl Chicken Barbeque', desc: 'Nasi + ayam saus barbeque manis gurih', price: 19000 },
    { name: 'Rice Bowl Chicken Sambal Bledeg', desc: 'Nasi + ayam sambal bledeg super pedas gurih', price: 22000 },
    { name: 'Rice Bowl Chicken Sambal Matah', desc: 'Nasi + ayam sambal matah segar wangi pedas gurih', price: 22000 },
    { name: 'Nasi Ayam Suwir Kemangi', desc: 'Ayam suwir bumbu gurih pedas + aroma kemangi segar', price: 20000 },
    { name: 'Nasi Daun Jeruk Ayam Sambal Bawang', desc: 'Nasi harum daun jeruk + ayam gurih + sambal bawang pedas nendang', price: 23000 },
    { name: 'Mie Tek-tek', desc: 'Mie goreng nyemek khas kaki lima, bumbu gurih pedas', price: 20000 },
  ]},
  { category: 'SNACK', items: [
    { name: 'Roti Bakar', desc: 'Roti panggang isi topping coklat/keju/green tea/tiramisu', price: 18000 },
    { name: 'Mix Platter', desc: 'Kentang goreng, nugget, sosis + saus & mayones', price: 22000 },
    { name: 'Pisang Cocol', desc: 'Pisang goreng + saus coklat/tiramisu', price: 18000 },
    { name: 'Singkong Goreng', desc: 'Singkong goreng krispi lembut di dalam', price: 15000 },
    { name: 'Kentang Goreng', desc: 'Kentang goreng renyah + saus & mayones', price: 15000 },
    { name: 'Cireng Rujak', desc: 'Cireng kenyal + sambal rujak pedas-manis', price: 15000 },
    { name: 'Loeyam (Lumpia Ayam)', desc: 'Ayam suwir bumbu, dibungkus kulit lumpia', price: 20000 },
    { name: 'Cilok 1001cc', desc: 'Cilok kenyal + campuran sambal pedas', price: 18000 },
    { name: 'Snack Ice Cream', desc: 'Ice cream vanila + varian bubuk coklat/green tea/red velvet/taro', price: 18000 },
    { name: 'Roti Bakar Ice Cream', desc: 'Roti + ice cream vanila + pilihan slai coklat/greentea/tiramisu', price: 22000 },
    { name: 'Spaghetti Panggang', desc: 'Spaghetti + saus bolognese + bechamel + keju', price: 18000 },
    { name: 'Klapertart', desc: 'Kue kelapa muda, susu, telur, tepung, mentega + topping kismis kenari', price: 22000 },
    { name: 'Macaroni Schotel', desc: 'Makaroni + saus susu, keju, telur, mentega, isi daging cincang/kornet', price: 18000 },
    { name: 'Seblak 1001cc', desc: 'Kuliner khas Bandung, gurih-pedas, aroma kencur', price: 22000 },
    { name: 'Baso Aci Tulang Rangu', desc: 'Bakso aci + daging sapi + tulang rangu renyah', price: 22000 },
    { name: 'Baso Aci Tetelan', desc: 'Bakso aci khas Jabar + tetelan sapi gurih', price: 25000 },
    { name: 'Baso Aci Mozarella', desc: 'Bakso aci + isian keju mozarella lumer', price: 25000 },
    { name: 'Baso Aci Ayam Suwir', desc: 'Bakso aci + tumisan ayam suwir pedas', price: 25000 },
    { name: 'Siomay Gumeulis', desc: 'Ikan tenggiri + tepung kenyal + telur, kuah kacang', price: 20000 },
    { name: 'Dimsum', desc: 'Adonan daging ayam gurih, kulit pangsit tipis, dikukus', price: 18000 },
    { name: 'Pempek Neng Madu', desc: 'Daging ikan giling + tapioka + kuah cuko', price: 20000 },
    { name: 'Cireng Gemoy Ayam', desc: 'Cireng tapioka isi suwiran ayam pedas', price: 20000 },
    { name: 'Cireng Gemoy Keju', desc: 'Cireng tapioka isi keju gurih', price: 20000 },
  ]},
  { category: 'INDOMIE SERIES', items: [
    { name: 'Indomie Goreng Original', desc: 'Indomie goreng standar', price: 10000 },
    { name: 'Indomie Rendang', desc: 'Indomie rasa rendang', price: 10000 },
    { name: 'Indomie Soto', desc: 'Indomie kuah rasa soto', price: 10000 },
    { name: 'Indomie Ayam Bawang', desc: 'Indomie kuah rasa ayam bawang', price: 10000 },
  ]},
  { category: 'ADD ON', items: [
    { name: 'Nasi Putih', desc: 'Nasi putih porsi satuan', price: 5000 },
    { name: 'Keju', desc: 'Topping keju tambahan', price: 5000 },
    { name: 'Ice Cube', desc: 'Tambahan es batu', price: 3000 },
    { name: 'Telur', desc: 'Tambahan telur', price: 5000 },
    { name: 'Kerupuk Bangka', desc: 'Kerupuk bangka krispi', price: 12000 },
  ]},
  { category: 'PAKET KELUARGA', items: [
    { name: 'Paket 1: Ricebowl Teriyaki + Es Teh Manis', desc: 'Ricebowl Teriyaki + Es Teh Manis', price: 23000 },
    { name: 'Paket 2: Ricebowl Barbeque + Es Teh Manis', desc: 'Ricebowl Barbeque + Es Teh Manis', price: 23000 },
    { name: 'Paket 3: Ricebowl Blackpepper + Es Teh Manis', desc: 'Ricebowl Blackpepper + Es Teh Manis', price: 23000 },
    { name: 'Paket 4: Ayam Suwir Kemangi + Es Teh Manis', desc: 'Ayam Suwir Kemangi + Es Teh Manis', price: 24000 },
    { name: 'Paket 5: Chicken Bledeg + Es Teh Manis', desc: 'Chicken Bledeg + Es Teh Manis', price: 25000 },
    { name: 'Paket 6: Mie Tek Tek + Es Teh Manis', desc: 'Mie Tek Tek + Es Teh Manis', price: 24000 },
  ]},
  { category: 'PAKET SANTUY', items: [
    { name: 'Paket Santuy A', desc: 'Kentang Goreng + Es Teh Manis', price: 22000 },
    { name: 'Paket Santuy B', desc: 'Cireng Bumbu Rujak + Es Teh Manis', price: 22000 },
  ]},
  { category: 'PAKET KOPI / SUSU SANTAI', items: [
    { name: 'Kopi Tubruk + Pisang Goreng', desc: 'Kopi Tubruk + Pisang Goreng', price: 20000 },
    { name: 'Susu Hangat + Roti Bakar', desc: 'Susu Hangat + Roti Bakar', price: 20000 },
    { name: 'Susu Hangat + Pisang Kukus', desc: 'Susu Hangat + Pisang Kukus', price: 20000 },
  ]},
];

async function seed() {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    let catIndex = 1;
    for (const cat of menuData) {
      // Upsert Category
      console.log(`Memproses kategori: ${cat.category}`);
      const [existingCat] = await conn.query('SELECT id FROM kategori WHERE nama = ?', [cat.category]);
      let catId;
      if (existingCat.length > 0) {
        catId = existingCat[0].id;
      } else {
        const [resCat] = await conn.query('INSERT INTO kategori (nama, urutan) VALUES (?, ?)', [cat.category, catIndex]);
        catId = resCat.insertId;
      }
      catIndex++;

      // Upsert Menus
      for (const item of cat.items) {
        console.log(` -> Memproses menu: ${item.name}`);
        const [existingMenu] = await conn.query('SELECT id FROM menu WHERE nama = ?', [item.name]);
        if (existingMenu.length > 0) {
          // Update
          await conn.query(
            'UPDATE menu SET deskripsi = ?, harga = ?, kategori_id = ? WHERE id = ?',
            [item.desc, item.price, catId, existingMenu[0].id]
          );
        } else {
          // Insert
          await conn.query(
            'INSERT INTO menu (nama, deskripsi, harga, kategori_id, gambar, tersedia) VALUES (?, ?, ?, ?, ?, ?)',
            [item.name, item.desc, item.price, catId, '', 1]
          );
        }
      }
    }

    await conn.commit();
    console.log("✅ Menu berhasil di-import & diupdate dengan deskripsi baru!");
  } catch (err) {
    await conn.rollback();
    console.error("❌ Gagal mengimport menu:", err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seed();

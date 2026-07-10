const mysql = require('mysql2/promise');

const data = {
  // SIGNATURE
  'Kopi Cakra': 'Perpaduan espresso dengan gula aren dan sentuhan dark coklat',
  'Cakra Matcha Latte': 'Matcha premium berpadu dengan susu & gula aren',
  'Kopi Susu Gula Aren': 'Perpaduan antara kopi, susu, dan gula aren yang manis',
  'Afogatto': 'Espresso yang disajikan dengan es krim vanilla',

  // SIGNATURE COFFEE BAR
  'Black Lychee': 'Americano dengan tambahan sirup buah lychee',
  'Black Mango': 'Americano dengan tambahan sirup buah mango',
  'Black Peach': 'Americano dengan tambahan sirup buah peach',
  'Americano': 'Espresso yang disajikan dingin, menghasilkan rasa ringan',
  'Baileys Coffee': 'Espresso creamy dengan sirup rasa Baileys (non-alkohol)',
  'Cappuccino': 'Espresso dengan susu steamed dan foam tebal di atasnya',
  'Iced Coffee Latte': 'Perpaduan espresso pilihan dengan susu segar dan es batu, rasa lembut, creamy, tetap bold',
  'Hot Coffee Latte': 'Espresso hangat + susu steamed lembut & creamy, smooth & comforting',
  'Butterscotch': 'Espresso dengan campuran susu dan sirup butterscotch manis',
  'Machiato': 'Espresso pekat dengan sedikit busa susu',
  'Avocado Coffee': 'Rasa buah alpukat yang creamy dengan kopi',
  'Espresso': 'Bubuk kopi hitam tradisional diseduh langsung',

  // MANUAL BREW
  'V60': 'Seduhan manual biji kopi Kintamani, rasa clean & fruity',
  'Japanese': 'Seduhan manual biji kopi Kintamani, diseduh dingin ala Jepang',

  // SIGNATURE MOCKTAIL
  'Perfreshlite': 'Soda + sirup green apple',
  'Pertamix': 'Soda + sirup blue curacao',
  'Pertamix Turbo': 'Soda + sirup raspberry',
  'SolarGO': 'Soda + sirup mango',

  // NON COFFEE
  'Green Tea': 'Minuman teh hijau lembut dengan susu',
  'Red Velvet': 'Susu creamy dengan bubuk red velvet manis',
  'Dark Chocolate': 'Cokelat bubuk pekat dengan susu, manis seimbang',
  'Taro': 'Susu dengan bubuk taro ungu, creamy manis',

  // TEA SERIES
  'Teh Susu': 'Perpaduan teh dan susu yang creamy',
  'Es Teh Manis': '-',
  'Teh Manis Hangat': '-',
  'Lemon Tea': 'Perpaduan teh dan lemon segar',
  'Peach Tea': 'Perpaduan teh dan sirup peach segar',
  'Lychee Tea': 'Teh + sirup lychee + potongan buah lychee',

  // YAKULT SQUASH
  'Mango Squash': 'Soda + sirup mango + yakult',
  'Green Apple Squash': 'Soda + sirup green apple + yakult',
  'Peach Squash': 'Soda + sirup raspberry + yakult',

  // CREAMY MOCKTAIL
  'Peach Creamy': 'Soda + sirup raspberry + ice cream creamy',
  'Green Apple': 'Soda + sirup green apple + ice cream creamy',
  'Blue Curacao': 'Soda + sirup blue curacao + ice cream creamy',
  'Mango Creamy': 'Sirup mango + soda + ice cream creamy',

  // OTHERS
  'Temu Canda': 'Temulawak + susu segar, disajikan dingin',
  'Coffee Beer': 'Espresso + minuman bersoda Beer Banteng',
  'Kopi Tubruk': 'Bubuk kopi hitam tradisional diseduh langsung',
  'Cleo': 'Air mineral botol',

  // MAIN COURSE
  'Steak Ayam': 'Daging ayam panggang + saus barbeque/black pepper + kentang goreng',
  'Steak Daging': 'Daging sapi panggang + saus barbeque/black pepper + kentang goreng',
  'Rice Bowl Chicken Teriyaki': 'Nasi + ayam tumis saus teriyaki khas Jepang, manis savory',
  'Rice Bowl Nugget': 'Nasi putih hangat + nugget, praktis mengenyangkan',
  'Rice Bowl Chicken Blackpepper': 'Nasi + ayam saus blackpepper pedas gurih',
  'Rice Bowl Chicken Barbeque': 'Nasi + ayam saus barbeque manis gurih',
  'Rice Bowl Chicken Sambal Bledeg': 'Nasi + ayam sambal bledeg super pedas gurih',
  'Rice Bowl Chicken Sambal Matah': 'Nasi + ayam sambal matah segar wangi pedas gurih',
  'Nasi Ayam Suwir Kemangi': 'Ayam suwir bumbu gurih pedas + aroma kemangi segar',
  'Nasi Daun Jeruk Ayam Sambal Bawang': 'Nasi harum daun jeruk + ayam gurih + sambal bawang pedas nendang',
  'Mie Tek-tek': 'Mie goreng nyemek khas kaki lima, bumbu gurih pedas',
  'Mie Tek Tek': 'Mie goreng nyemek khas kaki lima, bumbu gurih pedas', // fallback

  // SNACK
  'Roti Bakar': 'Roti panggang isi topping coklat/keju/green tea/tiramisu',
  'Mix Platter': 'Kentang goreng, nugget, sosis + saus & mayones',
  'Pisang Cocol': 'Pisang goreng + saus coklat/tiramisu',
  'Singkong Goreng': 'Singkong goreng krispi lembut di dalam',
  'Kentang Goreng': 'Kentang goreng renyah + saus & mayones',
  'Cireng Rujak': 'Cireng kenyal + sambal rujak pedas-manis',
  'Loeyam': 'Ayam suwir bumbu, dibungkus kulit lumpia',
  'Lumpia Ayam': 'Ayam suwir bumbu, dibungkus kulit lumpia',
  'Cilok 1001cc': 'Cilok kenyal + campuran sambal pedas',
  'Snack Ice Cream': 'Ice cream vanila + varian bubuk coklat/green tea/red velvet/taro',
  'Roti Bakar Ice Cream': 'Roti + ice cream vanila + pilihan slai coklat/greentea/tiramisu',
  'Spaghetti Panggang': 'Spaghetti + saus bolognese + bechamel + keju',
  'Klapertart': 'Kue kelapa muda, susu, telur, tepung, mentega + topping kismis kenari',
  'Macaroni Schotel': 'Makaroni + saus susu, keju, telur, mentega, isi daging cincang/kornet',
  'Seblak 1001cc': 'Kuliner khas Bandung, gurih-pedas, aroma kencur',
  'Baso Aci Tulang Rangu': 'Bakso aci + daging sapi + tulang rangu renyah',
  'Baso Aci Tetelan': 'Bakso aci khas Jabar + tetelan sapi gurih',
  'Baso Aci Mozarella': 'Bakso aci + isian keju mozarella lumer',
  'Baso Aci Ayam Suwir': 'Bakso aci + tumisan ayam suwir pedas',
  'Siomay Gumeulis': 'Ikan tenggiri + tepung kenyal + telur, kuah kacang',
  'Dimsum': 'Adonan daging ayam gurih, kulit pangsit tipis, dikukus',
  'Pempek Neng Madu': 'Daging ikan giling + tapioka + kuah cuko',
  'Cireng Gemoy Ayam': 'Cireng tapioka isi suwiran ayam pedas',
  'Cireng Gemoy Keju': 'Cireng tapioka isi keju gurih'
};

async function updateDb() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'warkop1001cc'
  });

  for (const [nama, deskripsi] of Object.entries(data)) {
    if (deskripsi === '-') continue;
    const [result] = await conn.query('UPDATE menu SET deskripsi = ? WHERE nama LIKE ?', [deskripsi, `%${nama}%`]);
    console.log(`Updated ${nama}: ${result.affectedRows} rows affected`);
  }
  
  await conn.end();
}

updateDb().catch(console.error);

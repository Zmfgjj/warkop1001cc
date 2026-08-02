const fs = require('fs');
let data = fs.readFileSync('menu_only.sql', 'utf8');
data = data.replace('VALUES', '(id, kategori_id, nama, deskripsi, harga, harga_diskon, hpp, gambar, tersedia, created_at, pilihan_rasa) VALUES');
fs.writeFileSync('menu_only_fixed.sql', 'SET FOREIGN_KEY_CHECKS=0;\nTRUNCATE TABLE menu;\n' + data + '\nSET FOREIGN_KEY_CHECKS=1;\n');

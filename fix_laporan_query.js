const fs = require('fs');

const path = 'backend/src/controllers/laporanController.js';
let content = fs.readFileSync(path, 'utf-8');

// Replace SELECT m.harga as harga_jual with dp.harga as harga_jual
content = content.replace(/m\.harga as harga_jual/g, 'dp.harga as harga_jual');

// Replace GROUP BY dp.menu_id with GROUP BY dp.menu_id, dp.harga
content = content.replace(/GROUP BY dp\.menu_id/g, 'GROUP BY dp.menu_id, dp.harga');

fs.writeFileSync(path, content);
console.log('Fixed laporanController.js');

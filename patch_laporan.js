const fs = require('fs');

let content = fs.readFileSync('backend/src/controllers/laporanController.js', 'utf8');

// Replace m.hpp with dp.hpp
content = content.replace(/m\.hpp/g, 'dp.hpp');
// Replace mn.hpp with dp.hpp
content = content.replace(/mn\.hpp/g, 'dp.hpp');

fs.writeFileSync('backend/src/controllers/laporanController.js', content);
console.log('laporanController.js patched successfully!');

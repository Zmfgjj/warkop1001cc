const fs = require('fs');

let content = fs.readFileSync('frontend/src/pages/KDS.jsx', 'utf-8');

// Replace socket listeners
content = content.replace(
    "socket.on('pesanan_baru', onChange)",
    "socket.on('pesanan_baru', onChange)\n    socket.on('pembayaran', onChange)"
);
content = content.replace(
    "socket.off('pesanan_baru', onChange)",
    "socket.off('pesanan_baru', onChange)\n      socket.off('pembayaran', onChange)"
);

// Replace print destination logic (regex to match different indentations)
const pattern = /( +)if \(i\.kategori_print_destination \|\| i\.kategori2_print_destination\) \{\n\1( +)const isDapur = i\.kategori_print_destination === 'dapur' \|\| i\.kategori_print_destination === 'semua' \|\| i\.kategori2_print_destination === 'dapur' \|\| i\.kategori2_print_destination === 'semua';\n\1\2const isBar = i\.kategori_print_destination === 'bar' \|\| i\.kategori_print_destination === 'semua' \|\| i\.kategori2_print_destination === 'bar' \|\| i\.kategori2_print_destination === 'semua';\n\1\2if \(kdsMode === 'dapur'\) return isDapur;\n\1\2if \(kdsMode === 'bar'\) return isBar;\n\1\2return true;\n\1\}/g;

const replacement = `$1if (i.kategori_print_destination || i.kategori2_print_destination) {
$1$2const dest1 = i.kategori_print_destination === 'kasir' ? null : i.kategori_print_destination;
$1$2const dest2 = i.kategori2_print_destination === 'kasir' ? null : i.kategori2_print_destination;
$1$2if (dest1 || dest2) {
$1$2  const isDapur = dest1 === 'dapur' || dest1 === 'semua' || dest2 === 'dapur' || dest2 === 'semua';
$1$2  const isBar = dest1 === 'bar' || dest1 === 'semua' || dest2 === 'bar' || dest2 === 'semua';
$1$2  if (kdsMode === 'dapur') return isDapur;
$1$2  if (kdsMode === 'bar') return isBar;
$1$2  return true;
$1$2}
$1}`;

const newContent = content.replace(pattern, replacement);

fs.writeFileSync('frontend/src/pages/KDS.jsx', newContent, 'utf-8');
console.log('Updated KDS.jsx');

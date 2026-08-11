const XLSX = require('xlsx-js-style');
const fs = require('fs');
const createCell = (val) => ({ v: val, t: typeof val === 'number' ? 'n' : 's' });
const rows = [
  [createCell('LAPORAN POS HARIAN'), '', '', ''],
  [],
  [createCell('Tanggal'), createCell('2023-10-10')]
];
const ws = XLSX.utils.aoa_to_sheet(rows);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Laporan');
const base64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
fs.writeFileSync('test.xlsx', Buffer.from(base64, 'base64'));
console.log('Done!');

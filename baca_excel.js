const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'Laporan_Keuangan_Menu_Baru3.xlsx');
try {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  console.log("Headers:", data[0]);
  console.log("Row 1:", data[1]);
} catch(e) {
  console.error("Error reading excel:", e.message);
}

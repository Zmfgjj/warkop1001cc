const xlsx = require('xlsx');

try {
  const workbook = xlsx.readFile('Laporan-Harian-2026-08-30.xlsx');
  console.log("=== DAFTAR SHEET DALAM TEMPLATE EXCEL ===");
  console.log(workbook.SheetNames);
  
  for (let i = 0; i < workbook.SheetNames.length; i++) {
    const sheetName = workbook.SheetNames[i];
    const sheet = workbook.Sheets[sheetName];
    console.log(`\n=== STRUKTUR SHEET: ${sheetName} (10 Baris Pertama) ===`);
    console.table(xlsx.utils.sheet_to_json(sheet, {header: 1}).slice(0, 10));
  }
} catch(e) {
  if (e.code === 'MODULE_NOT_FOUND') {
    console.error("❌ Modul 'xlsx' belum terinstall. Tolong jalankan perintah: npm install xlsx");
  } else {
    console.error("❌ Error membaca file Excel:", e.message);
  }
}

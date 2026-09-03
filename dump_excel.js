const xlsx = require('xlsx');
const fs = require('fs');

try {
  const workbook = xlsx.readFile('Laporan-Harian-2026-08-30.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet, {header: 1});
  
  let output = "=== STRUKTUR FULL TEMPLATE EXCEL ===\n";
  for(let i = 0; i < data.length; i++) {
    output += `Baris ${i}: ${JSON.stringify(data[i])}\n`;
  }
  
  fs.writeFileSync('template_dump.txt', output);
  console.log("Berhasil men-dump isi Excel ke template_dump.txt");
} catch(e) {
  console.error("Error:", e.message);
}

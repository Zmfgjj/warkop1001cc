const ExcelJS = require('exceljs');
async function run() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('Laporan_Keuangan_Menu_Baru3.xlsx');
  const sheet = wb.getWorksheet(1);
  for(let i=20; i<=30; i++) {
    console.log(`Row ${i}: A="${sheet.getCell('A'+i).value}" B="${sheet.getCell('B'+i).value}"`);
  }
}
run();

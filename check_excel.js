const ExcelJS = require('exceljs');
async function check() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('Laporan_Keuangan_Menu_Baru.xlsx');
  const sheet = wb.getWorksheet(1);
  for(let i = 147; i <= 156; i++) {
    const row = sheet.getRow(i);
    console.log(`Row ${i}: ${row.getCell(1).value} | ${row.getCell(2).value}`);
  }
}
check();

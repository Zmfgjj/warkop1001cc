const ExcelJS = require('exceljs');
const path = require('path');

async function inspect() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(path.join(__dirname, 'Laporan_Keuangan_Menu_Baru3.xlsx'));
    const ws = workbook.worksheets[0];
    
    console.log("Sheet Name:", ws.name);
    
    for (let i = 1; i <= 25; i++) {
        let rowData = [];
        const row = ws.getRow(i);
        for (let j = 1; j <= 8; j++) {
            rowData.push(row.getCell(j).value);
        }
        console.log(`Row ${i}:`, rowData);
    }
}
inspect();

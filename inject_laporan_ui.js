const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/Laporan.jsx', 'utf8');

// 1. Add state for modal
if (!content.includes('showRangeModal')) {
  content = content.replace(
    'const [dataBulanan, setDataBulanan] = useState(null)',
    'const [dataBulanan, setDataBulanan] = useState(null)\n  const [showRangeModal, setShowRangeModal] = useState(false)\n  const [rangeStartMonth, setRangeStartMonth] = useState(new Date().getMonth() + 1)\n  const [rangeStartYear, setRangeStartYear] = useState(new Date().getFullYear())\n  const [rangeEndMonth, setRangeEndMonth] = useState(new Date().getMonth() + 1)\n  const [rangeEndYear, setRangeEndYear] = useState(new Date().getFullYear())'
  );
}

// 2. Add handleExportBulananRange function
const rangeExportFunc = `
  const handleExportBulananRange = async () => {
    try {
      setLoading(true);
      const res = await api.get('/laporan/bulanan-range', { params: { startMonth: rangeStartMonth, startYear: rangeStartYear, endMonth: rangeEndMonth, endYear: rangeEndYear } });
      const dataArr = res.data;
      if (!dataArr || dataArr.length === 0) {
        showAlert('Tidak ada data dalam rentang tersebut', 'Gagal', 'error');
        setLoading(false);
        return;
      }
      const sheets = [];
      const bulanNama = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

      for (const d of dataArr) {
        const netRevenue = Number(d.net_revenue) || 0;
        const totalDiskon = Number(d.total_diskon) || 0;
        const gross = netRevenue + totalDiskon;

        const rows = [
          [createCell('LAPORAN POS BULANAN', styleTitle), '', '', ''],
          [],
          [createCell('Periode', styleBold), createCell(\`\${bulanNama[d.bulan - 1]} \${d.tahun}\`, styleBold)],
          [],
          [createCell('A. RINGKASAN PENJUALAN', styleSubHeader)],
          [createCell('Keterangan', styleHeader), createCell('Nilai (Rp)', styleHeader)],
          ['Gross Revenue (Total Penjualan Kotor)', createCell(gross, styleCurrency)],
          ['Total Diskon / Promo', createCell(totalDiskon, styleCurrency)],
          ['Service Charge', createCell(0, styleCurrency)],
          [createCell('Net Revenue (Pendapatan Bersih)', styleBold), createCell(netRevenue, styleCurrencyBold)],
          ['Total Transaksi', createCell(d.total_pesanan || 0, styleCenter)],
          ['Average Order Value', createCell(gross > 0 && d.total_pesanan > 0 ? Math.round(gross / d.total_pesanan) : 0, styleCurrency)],
        ];
        
        rows.push([]);
        rows.push([createCell('B. METODE PEMBAYARAN', styleSubHeader)]);
        rows.push([createCell('Metode', styleHeader), createCell('Jumlah Transaksi', styleHeader), createCell('Total (Rp)', styleHeader), createCell('% dari Total', styleHeader)]);
        const metodeRows = buildMetodeRows(d.metode_pembayaran, gross);
        metodeRows.forEach(m => rows.push([m.label, createCell(m.jumlah, styleCenter), createCell(m.total, styleCurrency), createCell(m.pct, styleCenter)]));
        const totalTrx = metodeRows.reduce((s, m) => s + m.jumlah, 0);
        rows.push([createCell('TOTAL', styleBold), createCell(totalTrx, {font: {bold: true}, alignment: {horizontal: "center"}}), createCell(gross, styleCurrencyBold), createCell('100%', {font: {bold: true}, alignment: {horizontal: "center"}})]);

        rows.push([]);
        rows.push([createCell('C. PENJUALAN PER MENU', styleSubHeader)]);
        rows.push([createCell('Menu', styleHeader), createCell('Kategori', styleHeader), createCell('HPP', styleHeader), createCell('Harga Jual', styleHeader), createCell('Terjual', styleHeader), createCell('Omset', styleHeader), createCell('Total HPP', styleHeader), createCell('Gross Profit', styleHeader)]);
        ;(d.menu_detail || []).forEach(m => {
          const omset = Number(m.total_pendapatan);
          const hppTotal = Number(m.total_hpp || 0);
          rows.push([m.nama, m.kategori || '-', createCell(Number(m.hpp), styleCurrency), createCell(Number(m.harga_jual), styleCurrency), createCell(Number(m.total_terjual), styleCenter), createCell(omset, styleCurrency), createCell(hppTotal, styleCurrency), createCell(omset - hppTotal, styleCurrency)]);
        });

        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
        ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];

        sheets.push({ ws, name: \`\${bulanNama[d.bulan - 1]} \${d.tahun}\` });
      }

      exportToExcel(sheets, \`Laporan-Range-\${rangeStartMonth}-\${rangeStartYear}-to-\${rangeEndMonth}-\${rangeEndYear}\`);
      setShowRangeModal(false);
    } catch (err) {
      console.error(err);
      showAlert('Gagal export laporan range', 'Error', 'error');
    } finally {
      setLoading(false);
    }
  }
`;

if (!content.includes('handleExportBulananRange')) {
  content = content.replace(
    'const handleExportBulanan = () => {',
    rangeExportFunc + '\n  const handleExportBulanan = () => {'
  );
}

// 3. Add UI Button
const newButton = `<button onClick={() => setShowRangeModal(true)} className="w-full md:w-auto px-6 py-2.5 rounded-xl font-bold text-amber-700 bg-amber-50 border border-amber-200 transition-all hover:bg-amber-600 hover:text-white shadow-sm flex items-center justify-center gap-2 text-sm h-[42px]"><Download size={18} /> Export Beberapa Bulan</button>`;
if (!content.includes('Export Beberapa Bulan')) {
  content = content.replace(
    '<button onClick={handleExportBulanan} className="w-full md:w-auto px-6 py-2.5 rounded-xl font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 transition-all hover:bg-emerald-600 hover:text-white shadow-sm flex items-center justify-center gap-2 text-sm h-[42px]">\n                      <Download size={18} /> Export Laporan Pro\n                    </button>',
    '<button onClick={handleExportBulanan} className="w-full md:w-auto px-6 py-2.5 rounded-xl font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 transition-all hover:bg-emerald-600 hover:text-white shadow-sm flex items-center justify-center gap-2 text-sm h-[42px]">\n                      <Download size={18} /> Export 1 Bulan\n                    </button>\n                    ' + newButton
  );
}

// 4. Add Modal UI at the bottom
const modalUI = `
      {showRangeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-[#634930] mb-4">Export Beberapa Bulan</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Dari Bulan</label>
                <div className="flex gap-2">
                  <select value={rangeStartMonth} onChange={(e) => setRangeStartMonth(parseInt(e.target.value))} className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#634930]">
                    {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{new Date(2024, i).toLocaleString('id-ID', { month: 'long' })}</option>)}
                  </select>
                  <select value={rangeStartYear} onChange={(e) => setRangeStartYear(parseInt(e.target.value))} className="w-24 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#634930]">
                    {[...Array(5)].map((_, i) => <option key={i} value={new Date().getFullYear() - 2 + i}>{new Date().getFullYear() - 2 + i}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Sampai Bulan</label>
                <div className="flex gap-2">
                  <select value={rangeEndMonth} onChange={(e) => setRangeEndMonth(parseInt(e.target.value))} className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#634930]">
                    {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{new Date(2024, i).toLocaleString('id-ID', { month: 'long' })}</option>)}
                  </select>
                  <select value={rangeEndYear} onChange={(e) => setRangeEndYear(parseInt(e.target.value))} className="w-24 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#634930]">
                    {[...Array(5)].map((_, i) => <option key={i} value={new Date().getFullYear() - 2 + i}>{new Date().getFullYear() - 2 + i}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowRangeModal(false)} className="flex-1 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Batal</button>
              <button onClick={handleExportBulananRange} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-[#634930] to-[#8B6F47] hover:shadow-lg transition-all">Export Excel</button>
            </div>
          </div>
        </div>
      )}
`;

if (!content.includes('showRangeModal && (')) {
  content = content.replace('</MobileLayout>', modalUI + '\n    </MobileLayout>');
}

fs.writeFileSync('frontend/src/pages/Laporan.jsx', content);
console.log('Laporan.jsx updated successfully');

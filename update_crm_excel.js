const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/CRM.jsx', 'utf8');

// Update downloadExcel to support 'total' and 'member' view modes
const oldExcelLogic = `
  const downloadExcel = async () => {
    try {
      const dataToExport = filteredCustomers.map((c, i) => ({
        'No': i + 1,
        'Nama': c.nama_pelanggan || '-',
        'No WA': c.no_telepon_wa || '-',
        'Email': c.email || '-',
        'Total Kunjungan': c.total_kunjungan,
        'Total Belanja': c.total_belanja,
        'Kunjungan Bulan Ini': c.kunjungan_bulan_ini,
        'Belanja Bulan Ini': c.belanja_bulan_ini,
        'Kunjungan Terakhir': c.kunjungan_terakhir ? new Date(c.kunjungan_terakhir).toLocaleDateString('id-ID') : '-'
      }));
`;

const newExcelLogic = `
  const downloadExcel = async () => {
    try {
      let dataToExport = [];
      let filename = 'Data_CRM';
      if (viewMode === 'member') {
        dataToExport = filteredMembers.map((m, i) => ({
          'No': i + 1,
          'Nama': m.nama || '-',
          'Nama Panggilan': m.nama_panggilan || '-',
          'No WA': m.no_hp || '-',
          'Email': m.email || '-',
          'Total Poin': m.point || 0,
          'Tgl Daftar': m.created_at ? new Date(m.created_at).toLocaleDateString('id-ID') : '-'
        }));
        filename = 'Data_Member_Loyalty';
      } else {
        dataToExport = filteredCustomers.map((c, i) => {
          const base = {
            'No': i + 1,
            'Nama': c.nama_pelanggan || '-',
            'No WA': c.no_telepon_wa || '-',
            'Email': c.email || '-'
          };
          if (viewMode === 'bulanan') {
            base['Kunjungan Bulan Ini'] = c.kunjungan_bulan_ini;
            base['Belanja Bulan Ini'] = c.belanja_bulan_ini;
            filename = \`Laporan_CRM_Bulanan_\${selectedMonth}\`;
          } else {
            base['Total Kunjungan'] = c.total_kunjungan;
            base['Total Belanja'] = c.total_belanja;
            filename = 'Laporan_CRM_Total_Akumulasi';
          }
          base['Kunjungan Terakhir'] = c.kunjungan_terakhir ? new Date(c.kunjungan_terakhir).toLocaleDateString('id-ID') : '-';
          return base;
        });
      }
`;

content = content.replace(oldExcelLogic.trim(), newExcelLogic.trim());
content = content.replace(`const filename = \`Laporan_CRM_\${selectedMonth}\`;`, `// filename replaced above`);

// Change UI to render Excel button for all modes
const oldUI = `          {viewMode === 'bulanan' ? (
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <input 
                  type="month" 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)} 
                  className="px-4 py-2 bg-white border border-stone-200 rounded-full text-sm text-[#442D1D] font-bold focus:outline-none focus:border-[#634930] shadow-sm"
                />
                <button
                  onClick={downloadExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-[#107C41] text-white rounded-full text-sm font-bold shadow-sm hover:bg-[#185c37] transition-colors"
                >
                  <Download size={16} /> Excel
                </button>
              </div>
              <div className="flex gap-2 bg-white p-1 rounded-full border border-stone-200 shadow-sm overflow-x-auto scrollbar-hide">
                {[
                  { val: 0, label: 'Semua' },
                  { val: 5, label: '≥ 5 Kali' },
                  { val: 10, label: '≥ 10 Kali' },
                  { val: 15, label: '≥ 15 Kali' }
                ].map(f => (
                  <button
                    key={f.val}
                    onClick={() => setFilterVisit(f.val)}
                    className={\`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap \${
                      filterVisit === f.val 
                        ? 'bg-[#634930] text-white' 
                        : 'text-stone-500 hover:bg-stone-100'
                    }\`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full md:w-auto"></div>
          )}`;

const newUI = `          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto justify-between">
            {viewMode === 'bulanan' && (
              <>
                <div className="flex items-center gap-2">
                  <input 
                    type="month" 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)} 
                    className="px-4 py-2 bg-white border border-stone-200 rounded-full text-sm text-[#442D1D] font-bold focus:outline-none focus:border-[#634930] shadow-sm"
                  />
                </div>
                <div className="flex gap-2 bg-white p-1 rounded-full border border-stone-200 shadow-sm overflow-x-auto scrollbar-hide">
                  {[
                    { val: 0, label: 'Semua' },
                    { val: 5, label: '≥ 5 Kali' },
                    { val: 10, label: '≥ 10 Kali' },
                    { val: 15, label: '≥ 15 Kali' }
                  ].map(f => (
                    <button
                      key={f.val}
                      onClick={() => setFilterVisit(f.val)}
                      className={\`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap \${
                        filterVisit === f.val 
                          ? 'bg-[#634930] text-white' 
                          : 'text-stone-500 hover:bg-stone-100'
                      }\`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </>
            )}
            
            <button
              onClick={downloadExcel}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-[#107C41] text-white rounded-full text-sm font-bold shadow-sm hover:bg-[#185c37] transition-colors"
            >
              <Download size={16} /> Excel {viewMode === 'bulanan' ? 'Bulanan' : viewMode === 'member' ? 'Member' : 'Semua'}
            </button>
          </div>`;

content = content.replace(oldUI, newUI);
fs.writeFileSync('frontend/src/pages/CRM.jsx', content);
console.log('Updated CRM.jsx for excel export');

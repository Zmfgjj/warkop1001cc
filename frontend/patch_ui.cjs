const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/pages/KasirPOS2.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Reservasi Button
content = content.replace(
  />🛍️ Take Away<\/button>\s*<\/div>/,
  `>🛍️ Take Away</button>
                </div>
                
                <button
                  onClick={() => setShowReservasiModal(true)}
                  className="flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium transition-all"
                  style={{ backgroundColor: '#EDE0CC', color: '#634930', border: '1.5px solid #C4A882' }}
                >
                  <CalendarPlus size={16} /> Reservasi / Open Bill
                </button>`
);

// 2. Sisa Pembayaran UI
content = content.replace(
  /<span className="font-bold" style={{ color: '#634930' }}>Rp \{total\.toLocaleString\('id-ID'\)\}<\/span>\s*<\/div>/,
  `<span className="font-bold" style={{ color: '#634930' }}>Rp {total.toLocaleString('id-ID')}</span>
                </div>
                {activeBill && (
                  <div className="flex justify-between text-sm mb-3 pt-2 border-t" style={{ color: '#c0392b', borderColor: '#C4A882' }}>
                    <span className="font-bold">SISA PEMBAYARAN</span>
                    <span className="font-bold">Rp {Math.max(0, activeBill.total - activeBill.dp_amount).toLocaleString('id-ID')}</span>
                  </div>
                )}`
);

// 3. Checkout Buttons
content = content.replace(
  /<button\s+onClick=\{handleProsesBayar\}\s+disabled=\{loadingBayar\}\s+className="flex-1 py-3 rounded-full font-bold text-sm text-white disabled:opacity-60"\s+style=\{\{ backgroundColor: '#27ae60' \}\}\s*>\s*\{loadingBayar \? 'Memproses\.\.\.' : 'Proses Bayar'\}\s*<\/button>/,
  `{activeBill ? (
                    <div className="flex flex-1 gap-2">
                      <button
                        onClick={() => handleProsesBayar(false)}
                        disabled={loadingBayar || order.length === 0}
                        className="flex-1 py-3 rounded-full font-bold text-sm text-white disabled:opacity-60"
                        style={{ backgroundColor: '#27ae60' }}
                      >
                        {loadingBayar ? '...' : 'Simpan ke Bill'}
                      </button>
                      <button
                        onClick={() => handleProsesBayar(true)}
                        disabled={loadingBayar}
                        className="flex-1 py-3 rounded-full font-bold text-sm text-white disabled:opacity-60"
                        style={{ backgroundColor: '#634930' }}
                      >
                        {loadingBayar ? '...' : 'Tutup Bill'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleProsesBayar(false)}
                      disabled={loadingBayar}
                      className="flex-1 py-3 rounded-full font-bold text-sm text-white disabled:opacity-60"
                      style={{ backgroundColor: '#27ae60' }}
                    >
                      {loadingBayar ? 'Memproses...' : 'Proses Bayar'}
                    </button>
                  )}`
);

// 4. Modal
content = content.replace(
  /<\/div>\s*<\/div>\s*\)\s*\}\s*$/,
  `</div>
        )}
      </div>

      {showReservasiModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4" style={{ backgroundColor: '#634930' }}>
              <h3 className="text-lg font-bold text-white">Buat Reservasi / Open Bill</h3>
            </div>
            <form onSubmit={handleBuatReservasi} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1" style={{ color: '#634930' }}>Nama Pelanggan / Rombongan</label>
                <input
                  type="text"
                  required
                  value={resNama}
                  onChange={e => setResNama(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none"
                  style={{ borderColor: '#C4A882' }}
                  placeholder="Misal: Bukber Budi"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1" style={{ color: '#634930' }}>Pilih Meja</label>
                <select
                  required
                  value={resMejaId}
                  onChange={e => setResMejaId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none"
                  style={{ borderColor: '#C4A882' }}
                >
                  <option value="">-- Pilih Meja --</option>
                  {mejaList.filter(m => m.status === 'kosong').map(m => (
                    <option key={m.id} value={m.id}>Meja #{String(m.nomor).padStart(3, '0')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1" style={{ color: '#634930' }}>Nominal DP (Down Payment)</label>
                <input
                  type="text"
                  required
                  value={resDp}
                  onChange={e => {
                    const val = e.target.value.replace(/\\D/g, '')
                    setResDp(val ? 'Rp ' + Number(val).toLocaleString('id-ID') : '')
                  }}
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none text-xl font-bold"
                  style={{ borderColor: '#C4A882', color: '#634930' }}
                  placeholder="Rp 0"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowReservasiModal(false)}
                  className="flex-1 py-2 rounded-xl font-bold"
                  style={{ backgroundColor: '#e0e0e0', color: '#333' }}
                >Batal</button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl font-bold text-white"
                  style={{ backgroundColor: '#634930' }}
                >Simpan Reservasi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}`
);

fs.writeFileSync(file, content);
console.log('UI Patched successfully');

import { useState, useEffect } from 'react';
import MobileLayout from '../components/MobileLayout';
import api from '../api/auth';
import { useAuth } from '../hooks/useAuth';

export default function ImportData() {
  const { canEdit } = useAuth();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    tanggal: '',
    pelanggan: '',
    tipe: 'dine-in',
    catatan: ''
  });
  
  const [items, setItems] = useState([]);
  
  // Form add item
  const [selectedMenu, setSelectedMenu] = useState('');
  const [qty, setQty] = useState(1);

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      const res = await api.get('/menu');
      let dataMenu = res.data;
      
      const spinPrizes = [
        { id: 'spin-lychee', nama: '[PROMO SPIN] Lychee', harga: 10000, kategori: 'minuman' },
        { id: 'spin-tulang-rangu', nama: '[PROMO SPIN] Tulang Rangu / Baso Aci', harga: 13000, kategori: 'makanan' },
        { id: 'spin-siomay', nama: '[PROMO SPIN] Siomay', harga: 10000, kategori: 'makanan' },
        { id: 'spin-mango', nama: '[PROMO SPIN] Mango', harga: 10000, kategori: 'minuman' },
        { id: 'spin-seblak', nama: '[PROMO SPIN] Seblak', harga: 15000, kategori: 'makanan' },
        { id: 'spin-cireng', nama: '[PROMO SPIN] Cireng Isi / Gemoy', harga: 12000, kategori: 'makanan' },
        { id: 'spin-es-teh', nama: '[PROMO SPIN] Es Teh', harga: 5000, kategori: 'minuman' },
        { id: 'spin-singkong', nama: '[PROMO SPIN] Singkong', harga: 10000, kategori: 'makanan' },
        { id: 'spin-kentang', nama: '[PROMO SPIN] Kentang', harga: 10000, kategori: 'makanan' },
        { id: 'spin-peach', nama: '[PROMO SPIN] Peach', harga: 10000, kategori: 'minuman' },
        { id: 'spin-macaroni', nama: '[PROMO SPIN] Macaroni / Schotel', harga: 13000, kategori: 'makanan' },
        { id: 'spin-cireng-rujak', nama: '[PROMO SPIN] Cireng Rujak', harga: 10000, kategori: 'makanan' },
      ];

      dataMenu = [...dataMenu, ...spinPrizes];
      
      setMenus(dataMenu);
      if (dataMenu.length > 0) setSelectedMenu(dataMenu[0].id);
    } catch (err) {
      console.error('Gagal fetch menu:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!selectedMenu || qty < 1) return;
    
    const menuObj = menus.find(m => String(m.id) === String(selectedMenu));
    if (!menuObj) return;
    
    let menuIdToSave = menuObj.id;
    let catatanSpin = '';

    // Jika item promo spin, coba cari ID aslinya
    if (typeof menuObj.id === 'string' && menuObj.id.startsWith('spin-')) {
      catatanSpin = 'Hadiah Spin Wheel (>100k) - Harga Promo';
      const p = menuObj.nama.toLowerCase().replace('[promo spin] ', '');
      const realMenu = menus.find(m => typeof m.id === 'number' && m.nama.toLowerCase().includes(p));
      menuIdToSave = realMenu ? realMenu.id : menus[0]?.id; // Default ke menu pertama jika tidak ketemu
    }
    
    const newItem = {
      menu_id: menuIdToSave,
      nama_menu: menuObj.nama,
      harga: Number(menuObj.harga),
      qty: Number(qty),
      catatan: catatanSpin
    };
    
    setItems([...items, newItem]);
    setQty(1); // Reset qty
  };

  const handleRemoveItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const isCakra = formData.pelanggan.toLowerCase().includes('cakra');
  const subtotalTagihan = items.reduce((sum, item) => sum + (item.harga * item.qty), 0);
  const totalTagihan = isCakra ? 0 : subtotalTagihan;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit('laporan')) {
      alert('Anda tidak memiliki izin untuk melakukan ini');
      return;
    }

    if (!formData.tanggal || items.length === 0) {
      alert('Tanggal dan minimal 1 menu wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        ...formData,
        total: totalTagihan,
        items: items
      };
      
      if (isCakra) {
        orderData.catatan = orderData.catatan ? `${orderData.catatan} (Diskon 100% Tim Cakra)` : 'Diskon 100% Tim Cakra';
      }

      await api.post('/pesanan/import', orderData);
      alert('Pesanan masa lalu berhasil dimasukkan ke riwayat!');
      setFormData({
        tanggal: '',
        pelanggan: '',
        tipe: 'dine-in',
        catatan: ''
      });
      setItems([]);
    } catch (err) {
      console.error(err);
      alert('Gagal memasukkan pesanan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout activeMenu="Import Data">
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        
        <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200">
          <h1 className="text-xl font-bold text-gray-800 mb-1">Input Data Lama (Migrasi)</h1>
          <p className="text-sm text-gray-500">
            Pilih tanggal, masukkan menu yang terjual, lalu simpan. Data akan langsung masuk ke Laporan Histori tanpa masuk ke KDS atau Printer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Kolom Kiri: Form Pesanan */}
          <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200">
            <h2 className="font-bold text-gray-700 mb-4 border-b pb-2">Informasi Transaksi</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Waktu Transaksi *</label>
                <input 
                  type="datetime-local" 
                  name="tanggal"
                  value={formData.tanggal}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded border border-gray-300 focus:border-blue-500 focus:outline-none text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tipe Pesanan</label>
                <select 
                  name="tipe"
                  value={formData.tipe}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded border border-gray-300 focus:border-blue-500 focus:outline-none text-sm"
                >
                  <option value="dine-in">Dine-in</option>
                  <option value="take-away">Take-away</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Pelanggan</label>
                <input 
                  type="text" 
                  name="pelanggan"
                  value={formData.pelanggan}
                  onChange={handleChange}
                  placeholder="Contoh: Budi (Aplikasi Lama)"
                  className="w-full px-3 py-2 rounded border border-gray-300 focus:border-blue-500 focus:outline-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Daftar Menu */}
          <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 flex flex-col">
            <h2 className="font-bold text-gray-700 mb-4 border-b pb-2">Pilih Menu</h2>
            
            <form onSubmit={handleAddItem} className="flex flex-col gap-2 mb-4">
              <input 
                type="text" 
                placeholder="Cari menu..." 
                value={searchTerm}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchTerm(val);
                  const filtered = menus.filter(m => m.nama.toLowerCase().includes(val.toLowerCase()));
                  if (filtered.length > 0) {
                    setSelectedMenu(filtered[0].id);
                  }
                }}
                className="w-full px-3 py-2 rounded border border-gray-300 focus:border-blue-500 focus:outline-none text-sm mb-1"
              />
              <div className="flex gap-2">
                <select 
                  value={selectedMenu}
                  onChange={(e) => setSelectedMenu(e.target.value)}
                  className="flex-1 px-3 py-2 rounded border border-gray-300 focus:border-blue-500 focus:outline-none text-sm"
                >
                  {menus.filter(m => m.nama.toLowerCase().includes(searchTerm.toLowerCase())).map(m => (
                    <option key={m.id} value={m.id}>{m.nama} - Rp {Number(m.harga).toLocaleString('id-ID')}</option>
                  ))}
                </select>
                <input 
                  type="number" 
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  min="1"
                  className="w-20 px-3 py-2 rounded border border-gray-300 focus:border-blue-500 focus:outline-none text-sm"
                />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 text-sm">
                  Tambah
                </button>
              </div>
            </form>

            {/* List Items */}
            <div className="flex-1 overflow-y-auto mb-4 border border-gray-100 rounded bg-gray-50 p-2 min-h-[150px]">
              {items.length === 0 ? (
                <p className="text-sm text-gray-400 text-center mt-10">Belum ada menu yang dipilih</p>
              ) : (
                <ul className="space-y-2">
                  {items.map((it, idx) => (
                    <li key={idx} className="flex justify-between items-center bg-white p-2 rounded shadow-sm text-sm">
                      <div>
                        <span className="font-semibold text-gray-800">{it.nama_menu}</span>
                        <div className="text-xs text-gray-500">
                          {it.qty} x Rp {it.harga.toLocaleString('id-ID')}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-800">Rp {(it.qty * it.harga).toLocaleString('id-ID')}</span>
                        <button onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:bg-red-50 px-2 py-1 rounded">
                          Hapus
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-gray-700">Total Tagihan:</span>
                <div className="text-right">
                  {isCakra && (
                    <div className="text-xs text-red-600 font-bold mb-1">Diskon 100% Tim Cakra</div>
                  )}
                  {isCakra ? (
                    <div className="flex flex-col items-end">
                      <span className="line-through text-gray-400 text-sm">Rp {subtotalTagihan.toLocaleString('id-ID')}</span>
                      <span className="font-black text-xl text-blue-700">Rp 0</span>
                    </div>
                  ) : (
                    <span className="font-black text-xl text-blue-700">Rp {totalTagihan.toLocaleString('id-ID')}</span>
                  )}
                </div>
              </div>
              <button 
                onClick={handleSubmit}
                disabled={loading || items.length === 0 || !formData.tanggal}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded transition-colors disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Simpan Transaksi Final'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </MobileLayout>
  );
}

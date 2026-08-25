// Utility untuk cetak struk thermal printer
// Mendukung: window.print() fallback + ESC/POS via Web Serial API
import { globalAlert } from '../context/AlertContext'
function formatRupiah(n) {
  return 'Rp ' + Number(n).toLocaleString('id-ID')
}

function formatTanggal(date) {
  return new Date(date || Date.now()).toLocaleString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// // Generate HTML struk untuk window.print()
function generateStrukHTML({ pesananId, items, subtotal, total, metodeBayar, jumlahBayar, kembali, meja, tipe, kasir, tanggal, copyLabel, type, nama_pelanggan, no_telepon, discount_name, discount_value, point_used, point_earned }) {
  const isDapurOrBar = type === 'dapur' || type === 'bar';
  const isMeja = type === 'meja';
  
  const t = new Date(tanggal || Date.now());
  const dateStr = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
  const timeStr = `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}:${String(t.getSeconds()).padStart(2,'0')}`;

  const itemRows = items.map((o, idx) => {
    if (isDapurOrBar) {
      return `
        <div style="margin-bottom:4px; font-weight:bold; font-size:13px;">
          ${o.qty}x ${o.nama || o.nama_menu || 'Item'} ${o.catatan ? `<span style="font-weight:normal;font-style:italic;">(${o.catatan})</span>` : ''}
        </div>
      `;
    }
    return `
      <div style="margin-bottom:4px">
        <p style="margin:0">${idx + 1}. ${o.nama || o.nama_menu || 'Item'} ${o.catatan ? `( ${o.catatan} )` : ''}</p>
        <div style="display:flex;justify-content:space-between;padding-left:12px">
          <span>${o.qty} X ${isMeja ? `<del>${formatRupiah(o.harga)}</del>` : formatRupiah(o.harga)}</span>
          <span>${isMeja ? `<del>${formatRupiah(o.harga * o.qty)}</del>` : formatRupiah(o.harga * o.qty)}</span>
        </div>
      </div>
    `;
  }).join('');

  if (isDapurOrBar) {
    return `
      <div style="width:280px;font-family:'Courier New',monospace;padding:4px;margin:0 auto;box-sizing:border-box;line-height:1.2;">
        <div style="text-align:center;margin-bottom:2px">
          <h3 style="margin:0;font-size:16px;font-weight:black;letter-spacing:1px;">${copyLabel}</h3>
        </div>
        <hr style="border:none;border-top:2px dashed #000;margin:4px 0">
        
        <div style="font-size:11px;display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <p style="margin:0 0 2px 0;font-weight:bold;">No.0-${String(pesananId)}</p>
            <p style="margin:0 0 2px 0;">${dateStr} ${timeStr}</p>
            ${nama_pelanggan ? `<p style="margin:0;font-weight:bold;">Pelanggan: ${nama_pelanggan}</p>` : ''}
          </div>
          <div style="text-align:right">
            <p style="margin:0;font-weight:black;font-size:13px;background:#000;color:#fff;padding:2px 6px;border-radius:4px;display:inline-block;">${tipe === 'take-away' ? 'Take Away' : `Meja: ${meja || '?'}`}</p>
          </div>
        </div>
        
        <hr style="border:none;border-top:1px dashed #000;margin:4px 0">
        
        <div style="font-size:12px;margin:4px 0;font-weight:bold;">
          ${itemRows}
        </div>
        
        <div style="text-align:center;margin-top:12px;padding-top:4px;border-top:2px dashed #000;font-size:9px;font-weight:bold;color:#333;">
          ✂️ SOBEK DI SINI ✂️
        </div>
      </div>
    `;
  }

  return `
    <div style="width:280px;font-family:'Courier New',monospace;padding:8px;margin:0 auto">
      <div style="text-align:center;margin-bottom:8px">
        <h3 style="margin:0;font-size:16px;font-weight:normal;">Warkop 1001cc</h3>
        <p style="margin:2px 0;font-size:12px">Jl. Raya Bojonggede - Kemang</p>
        <p style="margin:2px 0;font-size:12px">Warkop1001CC</p>
        <p style="margin:2px 0;font-size:12px">244238220260604152544</p>
      </div>
      <hr style="border:none;border-top:1px dashed #000;margin:8px 0">
      
      <div style="font-size:12px;display:flex;justify-content:space-between;">
        <div>
          <p style="margin:2px 0">No.0-${String(pesananId)}</p>
          <p style="margin:2px 0">${dateStr}</p>
          <p style="margin:2px 0">${timeStr}</p>
          ${nama_pelanggan ? `<p style="margin:2px 0;font-weight:medium;">Pelanggan: ${nama_pelanggan}</p>` : ''}
          ${(no_telepon && type !== 'pelanggan') ? `<p style="margin:2px 0">No HP: ${no_telepon}</p>` : ''}
        </div>
        <div style="text-align:right">
          <p style="margin:2px 0">Tipe: ${tipe === 'take-away' ? 'Take Away' : `Meja: ${meja || '?'}`}</p>
          <p style="margin:2px 0">Kasir : Warkop</p>
          <p style="margin:2px 0">${kasir || 'kasir'}</p>
        </div>
      </div>
      
      <hr style="border:none;border-top:1px dashed #000;margin:8px 0">
      
      <div style="font-size:12px;margin:8px 0">
        ${itemRows}
      </div>
 
      <hr style="border:none;border-top:1px dashed #000;margin:8px 0">
      
      <div style="font-size:12px">
        <div style="display:flex;justify-content:space-between;margin:2px 0"><span>Subtotal</span><span>${isMeja ? `<del>${formatRupiah(subtotal)}</del>` : formatRupiah(subtotal)}</span></div>
        ${(!isMeja && discount_value > 0) ? `<div style="display:flex;justify-content:space-between;margin:2px 0;color:#c0392b;font-weight:bold;"><span>${discount_name || 'Promo'}</span><span>-${formatRupiah(discount_value)}</span></div>` : ''}
        ${(!isMeja && point_used > 0) ? `<div style="display:flex;justify-content:space-between;margin:2px 0;color:#c0392b;font-weight:bold;"><span>Tukar Poin</span><span>-${formatRupiah(point_used)}</span></div>` : ''}
        <div style="display:flex;justify-content:space-between;margin:2px 0"><span>Total Tagihan</span><span style="font-weight:bold;">${isMeja ? `<del>${formatRupiah(total)}</del>` : formatRupiah(total)}</span></div>
        <div style="display:flex;justify-content:space-between;margin:2px 0"><span>Bayar (${metodeBayar === 'Tunai' ? 'Cash' : metodeBayar})</span><span>${isMeja ? `<del>${formatRupiah(metodeBayar === 'Tunai' ? jumlahBayar : total)}</del>` : formatRupiah(metodeBayar === 'Tunai' ? jumlahBayar : total)}</span></div>
        ${metodeBayar === 'Tunai' ? `<div style="display:flex;justify-content:space-between;margin:2px 0"><span>Kembali</span><span>${isMeja ? `<del>${formatRupiah(kembali)}</del>` : formatRupiah(kembali)}</span></div>` : ''}
        ${(point_earned > 0) ? `<div style="display:flex;justify-content:space-between;margin:2px 0;color:#8B6F47;font-weight:bold;margin-top:4px;"><span>Poin Didapat</span><span>+${point_earned} Poin</span></div>` : ''}
      </div>
      <hr style="border:none;border-top:1px dashed #000;margin:8px 0">
      
      <div style="text-align:center;font-size:12px;margin-top:8px">
        <p style="margin:2px 0">Good Vibes In Every Cup</p>
        <p style="margin:2px 0">Password Wifi :</p>
        <div style="display:inline-block; text-align:left;">
          <p style="margin:2px 0">1. User: 1001_CC_5G</p>
          <p style="margin:2px 0">&nbsp;&nbsp;&nbsp;Pass: warkopnaikkelaz</p>
          <p style="margin:2px 0">2. User: warkop1001cc_5G</p>
          <p style="margin:2px 0">&nbsp;&nbsp;&nbsp;Pass: kopicakramantap</p>
        </div>
        <br>
        <p style="margin:2px 0">Bantu kami jadi lebih baik!</p>
        <p style="margin:2px 0">Beri ulasan di Google Maps:</p>
        <p style="margin:2px 0;font-weight:bold;margin-bottom:8px;">s.id/warkop1001cc-maps</p>
        <p style="margin:2px 0">Instagram: @warkop1001cc</p>
        <p style="margin:2px 0">TikTok: @warkop1001cc</p>
        <p style="margin:2px 0">YouTube: @warkop1001cc</p>
      </div>
    </div>
  `
}

function getFilteredItems(items, type) {
  // Kasir, pelanggan, dan meja selalu menampilkan semua item
  if (type === 'kasir' || type === 'pelanggan' || type === 'meja') {
    return items;
  }

  return items.filter(i => {
    const dest1 = i.kategori_print_destination; // null, 'dapur', 'bar', 'semua'
    const dest2 = i.kategori2_print_destination; // null, 'dapur', 'bar', 'semua'

    // 1. Jika ada dest eksplisit yang cocok dengan type → tampilkan
    if (dest1 === type || dest2 === type) return true;

    // 2. Jika ada dest eksplisit 'semua' → tampilkan di semua printer
    if (dest1 === 'semua' || dest2 === 'semua') return true;

    // 3. Jika dest1 ada dan eksplisit (bukan null, bukan 'semua') tapi BUKAN type → jangan tampilkan
    if (dest1 && dest1 !== 'semua' && dest1 !== type) return false;
    if (dest2 && dest2 !== 'semua' && dest2 !== type) return false;

    // 4. Fallback berdasarkan nama kategori jika tidak ada dest eksplisit
    const k1 = (i.kategori_nama || i.kategori || '').toLowerCase();
    const k2 = (i.kategori2_nama || i.kategori2 || '').toLowerCase();

    if (type === 'dapur') {
      const isDapur = k => (k.includes('makanan') || k.includes('snack') || k.includes('food') || k.includes('main course') || k.includes('indomie') || k.includes('dapur') || k.includes('add on') || k.includes('others') || k.includes('roti') || k.includes('cemilan') || k.includes('paket') || k.includes('mie') || k.includes('gorengan') || k.includes('promo') || k.includes('dimsum') || k.includes('toast') || k.includes('pastry')) && !k.includes('ice cream');
      return isDapur(k1) || isDapur(k2);
    }

    if (type === 'bar') {
      const isBar = k => k.includes('ice cream') || k.includes('minuman') || k.includes('kopi') || k.includes('drink') || k.includes('tea') || k.includes('signature') || k.includes('coffee') || k.includes('mocktail') || k.includes('manual brew') || k.includes('non coffee') || k.includes('non-coffee') || k.includes('coklat') || k.includes('chocolate') || k.includes('susu') || k.includes('blend') || k.includes('yakult') || k.includes('squash') || k.includes('bar') || k.includes('coffe') || k.includes('juice') || k.includes('jus') || k.includes('ice') || k.includes('es') || k.includes('frappe') || k.includes('smoothie') || k.includes('spesial') || k.includes('special');
      return isBar(k1) || isBar(k2);
    }

    return false;
  });
}

// Cetak struk via window.print()
export function cetakStruk(data, printTypes = ['kasir', 'pelanggan']) {
  const receiptsHtml = printTypes.map(type => {
    let label = '📋 PELANGGAN';
    if (type === 'kasir') label = '📋 KASIR';
    else if (type === 'dapur') label = '🍳 DAPUR';
    else if (type === 'bar') label = '🍸 BAR';
    else if (type === 'meja') label = '🍽️ MEJA';
    
    const filteredItems = getFilteredItems(data.items || [], type);
    if (filteredItems.length === 0 && (type === 'dapur' || type === 'bar')) return ''; // Skip if empty for kitchen/bar

    return `<div class="page-break">${generateStrukHTML({ ...data, items: filteredItems, copyLabel: label, type })}</div>`;
  }).filter(html => html !== '').join('');

  if (!receiptsHtml) return;

  const printWindow = window.open('', '_blank', 'width=320,height=600')
  if (!printWindow) {
    globalAlert('Popup diblokir! Izinkan popup untuk mencetak struk.', 'Perhatian', 'error')
    return
  }

  printWindow.document.write(`
    <html>
    <head>
      <title>Struk #${String(data.pesananId).padStart(4, '0')}</title>
      <style>
        @media print {
          body { margin: 0; padding: 0; }
          .page-break { page-break-after: always; }
          @page { size: 80mm auto; margin: 0; }
          del { text-decoration: line-through !important; -webkit-text-decoration: line-through !important; }
        }
        body { margin: 0; padding: 0; }
        del { text-decoration: line-through !important; -webkit-text-decoration: line-through !important; }
      </style>
    </head>
    <body>
      ${receiptsHtml}
      <script>
        window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }
      <\/script>
    </body>
    </html>
  `)
  printWindow.document.close()
}

// Cache port reference in memory
let cachedPorts = { kasir: null, dapur: null, bar: null };

// Helper to get or request serial port
async function getSerialPort(role = 'kasir') {
  if (cachedPorts[role]) return cachedPorts[role];
  // Web Serial API doesn't let us easily persist which port is which without re-requesting in some browsers,
  // but we can cache them in memory during the session.
  const port = await navigator.serial.requestPort();
  cachedPorts[role] = port;
  return port;
}

// Dapatkan daftar printer bluetooth
export async function getBluetoothPrinters() {
  return new Promise((resolve) => {
    if (!window.bluetoothSerial) return resolve([]);
    window.bluetoothSerial.list((devices) => {
      const printers = devices.filter(d => (
        d.class === 1664 ||
        d.name.toLowerCase().includes('print') ||
        d.name.toLowerCase().includes('pos') ||
        d.name.toLowerCase().includes('blue') ||
        d.name.toLowerCase().includes('mpt') ||
        d.name.toLowerCase().includes('bt')
      ));
      resolve(printers);
    }, (err) => {
      console.warn('Gagal ambil bluetooth list', err);
      resolve([]);
    });
  });
}

// Backward compatibility (Single Printer) - Jika dipanggil tanpa UI multi-printer
export async function requestPrinterPermission() {
  try {
    if (window.bluetoothSerial) {
      const printers = await getBluetoothPrinters();
      if (printers.length > 0) {
        localStorage.setItem('printer_mac_kasir', printers[0].address);
        globalAlert(`Printer [${printers[0].name}] disimpan sebagai Kasir!`, 'Sukses', 'success');
        return true;
      } else {
        globalAlert('Tidak ada printer Bluetooth paired.', 'Perhatian', 'error');
        return false;
      }
    } else if ('serial' in navigator) {
      await getSerialPort('kasir');
      globalAlert('Printer thermal USB Kasir terhubung!', 'Sukses', 'success');
      return true;
    }
    return false;
  } catch (err) {
    globalAlert('Gagal menghubungkan printer.', 'Error', 'error');
    return false;
  }
}


let printQueue = Promise.resolve();

// Wrapper agar kalau banyak order bersamaan, printer antre 1 per 1 secara otomatis
export function cetakStrukThermal(data, printTypes = ['kasir', 'pelanggan']) {
  return new Promise((resolve) => {
    printQueue = printQueue.then(async () => {
      try {
        await _cetakStrukThermal(data, printTypes);
      } catch (err) {
        console.error('Error in print queue:', err);
      }
      resolve(true);
      // Jeda 3 detik antar antrean struk agar printer ada nafas sedikit
      await new Promise(r => setTimeout(r, 3000));
    });
  });
}

// Cetak struk via Web Serial API (thermal printer ESC/POS)
async function _cetakStrukThermal(data, printTypes = ['kasir', 'pelanggan']) {
  if (!('serial' in navigator) && !window.bluetoothSerial) {
    globalAlert('Browser/APK tidak mendukung API Printer. Gunakan Chrome/Edge atau Build APK.', 'Perhatian', 'error')
    return false
  }

  try {
    // Variabel writer/encoder hanya dipakai untuk Web Serial (bukan Bluetooth APK)
    const encoder = new TextEncoder()

    const ESC = '\x1B'
    const GS = '\x1D'
    const LF = '\n'
    const INIT = ESC + '@'
    const CENTER = ESC + 'a\x01'
    const LEFT = ESC + 'a\x00'
    const BOLD_ON = ESC + 'E\x01'
    const BOLD_OFF = ESC + 'E\x00'
    // CUT: partial cut, kompatibel dengan TM-58V dan printer 58mm lainnya
    const CUT = GS + 'V\x42\x00'
    const DOUBLE = GS + '!\x11'
    const NORMAL = GS + '!\x00'

    const line = '--------------------------------' + LF
    const dashed = '- - - - - - - - - - - - - - - -' + LF

    function padRight(str, len) { return (str + ' '.repeat(len)).slice(0, len) }
    function padLeft(str, len) { return (' '.repeat(len) + str).slice(-len) }

    const receipts = [];
    
    // Print requested copies
    for (const type of printTypes) {
      let receipt = INIT;
      let label = '[ PELANGGAN ]';
      if (type === 'kasir') label = '[ KASIR ]';
      else if (type === 'dapur') label = '[ DAPUR ]';
      else if (type === 'bar') label = '[ BAR ]';
      else if (type === 'meja') label = '[ MEJA ]';

      const filteredItems = getFilteredItems(data.items || [], type);
      if (filteredItems.length === 0 && (type === 'dapur' || type === 'bar')) continue;

      const isDapurOrBar = type === 'dapur' || type === 'bar';
      const isMeja = type === 'meja';

      if (isDapurOrBar) {
        // Kitchen / Bar Copy (Paper-saving, straight forward)
        receipt += CENTER + DOUBLE
        receipt += label + LF
        receipt += NORMAL
        receipt += LEFT + dashed
        
        const noStr = padRight(`No.0-${String(data.pesananId)}`, 16);
        const mejaStr = padLeft(`${data.tipe === 'take-away' ? 'Take Away' : `Meja: ${data.meja || '?'}`}`, 16);
        receipt += noStr + mejaStr + LF;
        
        const t = new Date(data.tanggal || Date.now());
        const timeStr = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')} ${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`;
        receipt += padRight(timeStr, 32) + LF;
        
        if (data.nama_pelanggan) {
          receipt += `Pelanggan: ${data.nama_pelanggan}` + LF;
        }
        
        receipt += dashed

        for (const item of filteredItems) {
          receipt += `${item.qty}x ${item.nama || item.nama_menu || 'Item'}${item.catatan ? ` (${item.catatan})` : ''}` + LF;
        }
        receipt += dashed
        // Add manual tear off spacing/lines for paper roll tearing
        receipt += '--------------------------------' + LF + LF + LF + LF + LF
        receipt += CUT
      } else {
        // Cashier / Customer Copy (Full Detail)
        receipt += CENTER + DOUBLE
        receipt += 'Warkop 1001cc' + LF
        receipt += NORMAL
        receipt += 'Jl. Raya Bojonggede - Kemang' + LF
        receipt += 'Warkop1001CC' + LF
        receipt += '244238220260604152544' + LF
        receipt += LEFT + dashed
        
        const noStr = padRight(`No.0-${String(data.pesananId)}`, 16);
        const mejaStr = padLeft(`${data.tipe === 'take-away' ? 'Take Away' : `Meja: ${data.meja || '?'}`}`, 16);
        receipt += noStr + mejaStr + LF;
        
        const t = new Date(data.tanggal || Date.now());
        const dateStr = padRight(`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`, 16);
        const kasirT1 = padLeft('Kasir : Warkop', 16);
        receipt += dateStr + kasirT1 + LF;

        const timeStr = padRight(`${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}:${String(t.getSeconds()).padStart(2,'0')}`, 16);
        const kasirT2 = padLeft(data.kasir || 'kasir', 16);
        receipt += timeStr + kasirT2 + LF;

        if (data.nama_pelanggan) {
          receipt += `Plg: ${padRight(data.nama_pelanggan, 27)}` + LF;
        }
        if (data.no_telepon && type !== 'pelanggan') {
          receipt += `HP : ${padRight(data.no_telepon, 27)}` + LF;
        }

        receipt += dashed

        let idx = 1;
        for (const item of filteredItems) {
          receipt += `${idx}. ${item.nama || item.nama_menu || 'Item'} ${item.catatan ? `( ${item.catatan} )` : ''}` + LF
          const priceStr = isMeja ? '------' : formatRupiah(item.harga);
          const totalStr = isMeja ? '------' : formatRupiah(item.harga * item.qty);
          const qtyStr = padRight(`  ${item.qty}x`, 6);
          const pricePadded = padRight(priceStr, 12);
          const totalPadded = padLeft(totalStr, 14);
          receipt += qtyStr + pricePadded + totalPadded + LF
          idx++;
        }

        receipt += dashed
        const subtotalStr = isMeja ? '------' : formatRupiah(data.subtotal);
        receipt += padRight('Subtotal', 16) + padLeft(subtotalStr, 16) + LF

        if (!isMeja && data.discount_value > 0) {
          const diskonStr = '-' + formatRupiah(data.discount_value);
          receipt += padRight(data.discount_name || 'Promo', 16) + padLeft(diskonStr, 16) + LF
        }
        
        if (!isMeja && data.point_used > 0) {
          const poinStr = '-' + formatRupiah(data.point_used);
          receipt += padRight('Tukar Poin', 16) + padLeft(poinStr, 16) + LF
        }

        const totalStr = isMeja ? '------' : formatRupiah(data.total);
        receipt += padRight('Total Tagihan', 16) + padLeft(totalStr, 16) + LF
        
        const bayarStr = isMeja ? '------' : formatRupiah(data.metodeBayar === 'Tunai' ? data.jumlahBayar : data.total);
        receipt += padRight(`Bayar (${data.metodeBayar === 'Tunai' ? 'Cash' : data.metodeBayar})`, 16) + padLeft(bayarStr, 16) + LF
        if (data.metodeBayar === 'Tunai') {
          const kembaliStr = isMeja ? '------' : formatRupiah(data.kembali);
          receipt += padRight('Kembali', 16) + padLeft(kembaliStr, 16) + LF
        }
        if (data.point_earned > 0) {
          receipt += padRight('Poin Didapat', 16) + padLeft(`+${data.point_earned} Poin`, 16) + LF
        }
        receipt += dashed

        receipt += CENTER + 'Good Vibes In Every Cup' + LF
        receipt += CENTER + 'Password Wifi :' + LF
        receipt += LEFT + '    1. User: 1001_CC_5G' + LF
        receipt += LEFT + '       Pass: warkopnaikkelaz' + LF
        receipt += LEFT + '    2. User: warkop1001cc_5G' + LF
        receipt += LEFT + '       Pass: kopicakramantap' + LF + LF
        receipt += CENTER + 'Terima kasih telah menjadi' + LF
        receipt += 'bagian dari cerita 1001cc.' + LF + LF
        receipt += 'follow kami @warkop1001cc' + LF
        
        receipt += LF + LF
        receipt += CUT
      }
      receipts.push({ type, data: receipt });
    }

    // --- Eksekusi Cetak via Native Bluetooth Serial (APK) ---
    if (window.bluetoothSerial) {
      return new Promise(async (resolve, reject) => {
        try {
          // ----------------------------------------------------------------
          // STEP 1: Kelompokkan struk berdasarkan MAC address printer
          // Struk kasir + pelanggan → MAC yang sama → 1 koneksi, kirim berurutan
          // Ini mencegah disconnect/reconnect & data interleaving
          // ----------------------------------------------------------------
          const macGroups = {}; // { mac: [{ type, byteArray }, ...] }
          const macOrder  = []; // urutan MAC supaya dapur/bar tetap setelah kasir
          
          for (const { type, data: receiptStr } of receipts) {
            let mac = null;
            const fallbackMac = localStorage.getItem('printer_mac_kasir') || localStorage.getItem('printer_mac');
            if (type === 'dapur') mac = localStorage.getItem('printer_mac_dapur') || fallbackMac;
            else if (type === 'bar') mac = localStorage.getItem('printer_mac_bar') || fallbackMac;
            else mac = fallbackMac;

            if (!mac) {
              console.warn(`Printer untuk '${type}' belum diatur, dilewati.`);
              continue;
            }

            // Konversi string ESC/POS → byte array (supaya \x00 di CUT command tidak terpotong)
            const byteArray = new Uint8Array(Array.from(receiptStr).map(c => c.charCodeAt(0) & 0xFF));

            if (!macGroups[mac]) {
              macGroups[mac] = [];
              macOrder.push(mac);
            }
            macGroups[mac].push({ type, byteArray });
          }

          // ----------------------------------------------------------------
          // STEP 2: Untuk setiap MAC, connect SEKALI lalu kirim semua struk
          // Chunk size 64 byte + delay 50ms: aman untuk buffer printer BT
          // ----------------------------------------------------------------
          const CHUNK_SIZE = 64;   // Kecil supaya buffer printer tidak overflow
          const CHUNK_DELAY = 50;  // ms jeda antar chunk
          const RECEIPT_GAP = 8500; // ms jeda antar struk dalam 1 printer (cukup untuk cut)
          const CONNECT_RETRY = 3;

          const writeBytes = (bytes) => new Promise(async (res, rej) => {
            try {
              for (let j = 0; j < bytes.length; j += CHUNK_SIZE) {
                const chunk = bytes.slice(j, j + CHUNK_SIZE);
                // Convert to ArrayBuffer for cordova-plugin-bluetooth-serial
                await new Promise((ok, fail) => window.bluetoothSerial.write(chunk.buffer, ok, fail));
                await new Promise(r => setTimeout(r, CHUNK_DELAY));
              }
              res();
            } catch (e) { rej(e); }
          });

          const connectAndPrint = (mac, jobs) => new Promise((res) => {
            const tryConnect = (retries) => {
              console.log(`[BT] Menghubungkan ke ${mac}... (sisa retry: ${retries})`);
              window.bluetoothSerial.connect(mac, async () => {
                console.log(`[BT] Terhubung ke ${mac}, mulai cetak ${jobs.length} struk.`);
                try {
                  for (let idx = 0; idx < jobs.length; idx++) {
                    await writeBytes(jobs[idx].byteArray);
                    console.log(`[BT] Struk '${jobs[idx].type}' selesai.`);
                    
                    if (idx < jobs.length - 1) {
                      // Jeda antar struk di printer yang sama — beri waktu printer memotong kertas
                      await new Promise(r => setTimeout(r, RECEIPT_GAP));
                    } else {
                      // TAMBAHAN: Jeda untuk struk TERAKHIR agar printer sempat 
                      // memproses sisa buffer dan memotong kertas sebelum koneksi Bluetooth dimatikan.
                      await new Promise(r => setTimeout(r, 4000));
                    }
                  }
                } catch (e) {
                  console.error('[BT] Error saat menulis ke printer:', e);
                }
                // Perbaikan: Tunggu sampai proses disconnect benar-benar tuntas + beri napas 3 detik
                window.bluetoothSerial.disconnect(
                  () => { setTimeout(res, 3000); }, 
                  () => { setTimeout(res, 3000); }
                );
              }, (err) => {
                console.error(`[BT] Gagal konek ke ${mac}:`, err);
                if (retries > 0) {
                  setTimeout(() => tryConnect(retries - 1), 2000);
                } else {
                  console.warn(`[BT] Menyerah koneksi ke ${mac}.`);
                  res();
                }
              });
            };
            // Pastikan tidak ada koneksi aktif sebelum memulai
            window.bluetoothSerial.disconnect(
              () => setTimeout(() => tryConnect(CONNECT_RETRY), 1500),
              () => tryConnect(CONNECT_RETRY)
            );
          });

          // Eksekusi group per MAC secara berurutan (satu printer selesai dulu baru ke printer berikutnya)
          for (const mac of macOrder) {
            await connectAndPrint(mac, macGroups[mac]);
            // Jeda antar printer (misalnya dari kasir ke dapur) supaya Bluetooth stack tidak crash
            await new Promise(r => setTimeout(r, 500));
          }

          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    } else {
      // 2. Eksekusi via Web Serial (Browser PC / USB)
      // Kelompokkan struk berdasarkan role (port yang sama)
      // agar tidak terjadi lock/unlock berulang yang menyebabkan tumpang tindih
      const roleMap = {};
      for (const receipt of receipts) {
        let role = 'kasir';
        if (receipt.type === 'dapur') role = 'dapur';
        else if (receipt.type === 'bar') role = 'bar';
        // 'kasir' dan 'pelanggan' pakai port yang sama (role='kasir')
        if (!roleMap[role]) roleMap[role] = [];
        roleMap[role].push(receipt.data);
      }

      // Tulis setiap group ke portnya masing-masing dalam 1 sesi writer
      for (const [role, receiptDataList] of Object.entries(roleMap)) {
        const port = await getSerialPort(role);
        if (!port) {
          console.warn(`Serial port untuk ${role} belum di-set.`);
          continue;
        }

        if (!port.readable || port.readable.locked) {
          try {
            await port.open({ baudRate: 115200 });
          } catch {}
        }

        let writer;
        try {
          writer = port.writable.getWriter();
        } catch (err) {
          console.warn(`Gagal mendapatkan writer untuk ${role}:`, err);
          continue;
        }

        try {
          const chunkSize = 64;
          const delayMs = 20;
          // Gabungkan semua struk untuk role ini dalam 1 stream
          for (let rIdx = 0; rIdx < receiptDataList.length; rIdx++) {
            const bytes = encoder.encode(receiptDataList[rIdx]);
            for (let j = 0; j < bytes.length; j += chunkSize) {
              const chunk = bytes.slice(j, j + chunkSize);
              await writer.write(chunk);
              await new Promise(r => setTimeout(r, delayMs));
            }
            // Jika masih ada struk berikutnya untuk port ini, tunggu printer selesai memotong
            if (rIdx < receiptDataList.length - 1) {
              await new Promise(r => setTimeout(r, 4000));
            }
          }
        } finally {
          writer.releaseLock();
        }
      }
      return true
    }
  } catch (err) {
    console.error('Thermal printer error:', err)
    return false
  }
}


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
function generateStrukHTML({ pesananId, items, subtotal, ppn, ppnRate, total, metodeBayar, jumlahBayar, kembali, meja, tipe, kasir, tanggal, copyLabel, type, nama_pelanggan, no_telepon, discount_name, discount_value }) {
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
        ${(!isMeja && !discount_value && (subtotal - total) > 0) ? `<div style="display:flex;justify-content:space-between;margin:2px 0;color:#c0392b;font-weight:bold;"><span>Diskon CAKRA</span><span>-${formatRupiah(subtotal - total)}</span></div>` : ''}
        <div style="display:flex;justify-content:space-between;margin:2px 0"><span>Total Tagihan</span><span style="font-weight:bold;">${isMeja ? `<del>${formatRupiah(total)}</del>` : formatRupiah(total)}</span></div>
        <div style="display:flex;justify-content:space-between;margin:2px 0"><span>Bayar (${metodeBayar === 'Tunai' ? 'Cash' : metodeBayar})</span><span>${isMeja ? `<del>${formatRupiah(metodeBayar === 'Tunai' ? jumlahBayar : total)}</del>` : formatRupiah(metodeBayar === 'Tunai' ? jumlahBayar : total)}</span></div>
        ${metodeBayar === 'Tunai' ? `<div style="display:flex;justify-content:space-between;margin:2px 0"><span>Kembali</span><span>${isMeja ? `<del>${formatRupiah(kembali)}</del>` : formatRupiah(kembali)}</span></div>` : ''}
      </div>
      <hr style="border:none;border-top:1px dashed #000;margin:8px 0">
      
      <div style="text-align:center;font-size:12px;margin-top:8px">
        <p style="margin:2px 0">Good Vibes In Every Cup</p>
        <p style="margin:2px 0">Password Wifi :</p>
        <p style="margin:2px 0">Lt 1: kopicakramantap</p>
        <p style="margin:2px 0">Lt 2: warkopnaikkelaz</p>
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
  if (type === 'dapur') return items.filter(i => { const k = (i.kategori_nama || i.kategori || '').toLowerCase(); return k.includes('makanan') || k.includes('snack') || k.includes('food') || k.includes('main course') || k.includes('indomie'); });
  if (type === 'bar') return items.filter(i => { const k = (i.kategori_nama || i.kategori || '').toLowerCase(); return k.includes('minuman') || k.includes('kopi') || k.includes('drink') || k.includes('tea') || k.includes('signature') || k.includes('coffee') || k.includes('mocktail') || k.includes('manual brew'); });
  return items;
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


// Cetak struk via Web Serial API (thermal printer ESC/POS)
export async function cetakStrukThermal(data, printTypes = ['kasir', 'pelanggan']) {
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
    const CUT = GS + 'V\x00'
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
        receipt += CENTER + NORMAL + '--------------------------------' + LF
        receipt += '     [ SOBEK DI SINI - CUT ]    ' + LF
        receipt += '--------------------------------' + LF + LF + LF
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
          receipt += `   ${item.qty}  X ${padRight(priceStr, 12)} ${padLeft(totalStr, 11)}` + LF
          idx++;
        }

        receipt += dashed
        const subtotalStr = isMeja ? '------' : formatRupiah(data.subtotal);
        receipt += padRight('Subtotal', 16) + padLeft(subtotalStr, 16) + LF

        if (!isMeja && data.discount_value > 0) {
          const diskonStr = '-' + formatRupiah(data.discount_value);
          receipt += padRight(data.discount_name || 'Promo', 16) + padLeft(diskonStr, 16) + LF
        } else if (!isMeja && (data.subtotal - data.total) > 0) {
          const diskonStr = '-' + formatRupiah(data.subtotal - data.total);
          receipt += padRight('Diskon CAKRA', 16) + padLeft(diskonStr, 16) + LF
        }

        const totalStr = isMeja ? '------' : formatRupiah(data.total);
        receipt += padRight('Total Tagihan', 16) + padLeft(totalStr, 16) + LF
        
        const bayarStr = isMeja ? '------' : formatRupiah(data.metodeBayar === 'Tunai' ? data.jumlahBayar : data.total);
        receipt += padRight(`Bayar (${data.metodeBayar === 'Tunai' ? 'Cash' : data.metodeBayar})`, 16) + padLeft(bayarStr, 16) + LF
        if (data.metodeBayar === 'Tunai') {
          const kembaliStr = isMeja ? '------' : formatRupiah(data.kembali);
          receipt += padRight('Kembali', 16) + padLeft(kembaliStr, 16) + LF
        }
        receipt += dashed

        receipt += CENTER + 'Good Vibes In Every Cup' + LF
        receipt += CENTER + 'Password Wifi :' + LF
        receipt += 'Lt 1: kopicakramantap' + LF
        receipt += 'Lt 2: warkopnaikkelaz' + LF + LF
        receipt += CENTER + 'Terima kasih telah menjadi' + LF
        receipt += 'bagian dari cerita 1001cc.' + LF + LF
        receipt += 'follow kami @warkop1001cc' + LF
        
        receipt += LF + LF
        receipt += CUT
      }
      receipts.push({ type, data: receipt });
    }

    // --- Eksekusi Cetak ---
    if (window.bluetoothSerial) {
      // 1. Eksekusi via Native Bluetooth Serial (APK)
      return new Promise(async (resolve, reject) => {
        try {
          for (let i = 0; i < receipts.length; i++) {
            const { type, data: currentReceipt } = receipts[i];
            
            // Tentukan target MAC address berdasarkan tipe struk
            let targetMac = null;
            if (type === 'dapur') targetMac = localStorage.getItem('printer_mac_dapur') || localStorage.getItem('printer_mac_kasir') || localStorage.getItem('printer_mac');
            else if (type === 'bar') targetMac = localStorage.getItem('printer_mac_bar') || localStorage.getItem('printer_mac_kasir') || localStorage.getItem('printer_mac');
            else targetMac = localStorage.getItem('printer_mac_kasir') || localStorage.getItem('printer_mac');

            if (!targetMac) {
              console.warn(`Target printer untuk ${type} tidak diatur, melewati cetak.`);
              continue; // Skip jika printer belum di-set
            }

            // Fungsi untuk print string via koneksi yang ada
            const doPrint = async () => {
              const chunkSize = 128;
              const delayMs = 80;
              for (let j = 0; j < currentReceipt.length; j += chunkSize) {
                const chunk = currentReceipt.substring(j, j + chunkSize);
                await new Promise((res, rej) => window.bluetoothSerial.write(chunk, res, rej));
                await new Promise(res => setTimeout(res, delayMs));
              }
              if (i < receipts.length - 1) {
                await new Promise(res => setTimeout(res, 3000));
              }
            };

            // Diskonek & Konek untuk routing ke printer yang tepat
            await new Promise((res) => {
              const tryConnect = () => {
                window.bluetoothSerial.connect(targetMac, async () => {
                  await doPrint();
                  res();
                }, (err) => {
                  console.error('Gagal koneksi ke MAC', targetMac, err);
                  res(); // Lanjut ke struk berikutnya
                });
              };

              // Disconnect from current before connecting to new one
              window.bluetoothSerial.disconnect(() => {
                setTimeout(tryConnect, 500); // Jeda aman setelah disconnect berhasil
              }, () => {
                // Jika disconnect gagal (biasanya karena belum connect sama sekali), langsung coba connect
                tryConnect(); 
              });
            });
          }
          // Setelah semua selesai, diskonek saja atau biarkan (kita pilih diskonek agar fresh)
          window.bluetoothSerial.disconnect(() => {}, () => {});
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    } else {
      // 2. Eksekusi via Web Serial (Browser PC)
      for (let i = 0; i < receipts.length; i++) {
        const { type, data: currentReceipt } = receipts[i];
        
        let role = 'kasir';
        if (type === 'dapur') role = 'dapur';
        if (type === 'bar') role = 'bar';
        
        const port = await getSerialPort(role);
        if (!port) {
          console.warn(`Serial port untuk ${role} belum di-set.`);
          continue;
        }

        if (!port.writable) {
          await port.open({ baudRate: 9600 })
        }
        const writer = port.writable.getWriter()

        const chunkSize = 64
        const delayMs = 30
        const bytes = encoder.encode(currentReceipt)
        for (let j = 0; j < bytes.length; j += chunkSize) {
          const chunk = bytes.slice(j, j + chunkSize)
          await writer.write(chunk)
          await new Promise(resolve => setTimeout(resolve, delayMs))
        }

        if (i < receipts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        writer.releaseLock()
      }
      return true
    }
  } catch (err) {
    console.error('Thermal printer error:', err)
    return false
  }
}


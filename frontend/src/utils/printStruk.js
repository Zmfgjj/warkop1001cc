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

// Generate HTML struk untuk window.print()
function generateStrukHTML({ pesananId, items, subtotal, ppn, ppnRate, total, metodeBayar, jumlahBayar, kembali, meja, tipe, kasir, tanggal, copyLabel, type }) {
  const isDapurOrBar = type === 'dapur' || type === 'bar';
  const isMeja = type === 'meja';
  
  const t = new Date(tanggal || Date.now());
  const dateStr = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
  const timeStr = `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}:${String(t.getSeconds()).padStart(2,'0')}`;

  const itemRows = items.map((o, idx) => `
    <div style="margin-bottom:4px">
      <p style="margin:0">${idx + 1}. ${o.nama || o.nama_menu || 'Item'} ${o.catatan ? `( ${o.catatan} )` : ''}</p>
      <div style="display:flex;justify-content:space-between;padding-left:12px">
        <span>${o.qty} X ${isDapurOrBar ? '' : (isMeja ? `<del>${formatRupiah(o.harga)}</del>` : formatRupiah(o.harga))}</span>
        <span>${isDapurOrBar ? '' : (isMeja ? `<del>${formatRupiah(o.harga * o.qty)}</del>` : formatRupiah(o.harga * o.qty))}</span>
      </div>
    </div>
  `).join('');

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
        </div>
        <div style="text-align:right">
          <p style="margin:2px 0">Meja ${tipe === 'take-away' ? 'TA' : `(${meja || '?'}/1)`}</p>
          <p style="margin:2px 0">Kasir : Warkop</p>
          <p style="margin:2px 0">${kasir || 'kasir'}</p>
        </div>
      </div>
      
      <hr style="border:none;border-top:1px dashed #000;margin:8px 0">
      
      <div style="font-size:12px;margin:8px 0">
        ${itemRows}
      </div>

      <hr style="border:none;border-top:1px dashed #000;margin:8px 0">
      
      ${!isDapurOrBar ? `
      <div style="font-size:12px">
        <div style="display:flex;justify-content:space-between;margin:2px 0"><span>Total Tagihan</span><span style="font-weight:bold;">${isMeja ? `<del>${formatRupiah(total)}</del>` : formatRupiah(total)}</span></div>
        <div style="display:flex;justify-content:space-between;margin:2px 0"><span>Bayar (${metodeBayar === 'Tunai' ? 'Cash' : metodeBayar})</span><span>${isMeja ? `<del>${formatRupiah(metodeBayar === 'Tunai' ? jumlahBayar : total)}</del>` : formatRupiah(metodeBayar === 'Tunai' ? jumlahBayar : total)}</span></div>
        ${metodeBayar === 'Tunai' ? `<div style="display:flex;justify-content:space-between;margin:2px 0"><span>Kembali</span><span>${isMeja ? `<del>${formatRupiah(kembali)}</del>` : formatRupiah(kembali)}</span></div>` : ''}
      </div>
      <div style="text-align:right;font-size:10px;font-style:italic;margin-top:2px;">Harga total sudah termasuk PPN</div>
      <hr style="border:none;border-top:1px dashed #000;margin:8px 0">
      ` : ''}
      
      <div style="text-align:center;font-size:12px;margin-top:8px">
        <p style="margin:2px 0">Good Vibes In Every Cup</p>
        <p style="margin:2px 0">Password Wifi :</p>
        <p style="margin:2px 0">warkopnaikkelaz</p>
        <br>
        <p style="margin:2px 0">Bantu kami jadi lebih baik!</p>
        <p style="margin:2px 0">Beri ulasan di Google Maps:</p>
        <p style="margin:2px 0;font-weight:bold;">s.id/warkop1001cc-maps</p>
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
        }
        body { margin: 0; padding: 0; }
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

// Cetak struk via Web Serial API (thermal printer ESC/POS)
export async function cetakStrukThermal(data, printTypes = ['kasir', 'pelanggan']) {
  if (!('serial' in navigator)) {
    globalAlert('Browser tidak mendukung Web Serial API. Gunakan Chrome/Edge.', 'Perhatian', 'error')
    return false
  }

  try {
    const port = await navigator.serial.requestPort()
    await port.open({ baudRate: 9600 })

    const writer = port.writable.getWriter()
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

    let receipt = INIT
    
    // Print requested copies
    for (const type of printTypes) {
      let label = '[ PELANGGAN ]';
      if (type === 'kasir') label = '[ KASIR ]';
      else if (type === 'dapur') label = '[ DAPUR ]';
      else if (type === 'bar') label = '[ BAR ]';
      else if (type === 'meja') label = '[ MEJA ]';

      const filteredItems = getFilteredItems(data.items || [], type);
      if (filteredItems.length === 0 && (type === 'dapur' || type === 'bar')) continue;

      const isDapurOrBar = type === 'dapur' || type === 'bar';
      const isMeja = type === 'meja';

      receipt += CENTER + DOUBLE
      receipt += 'Warkop 1001cc' + LF
      receipt += NORMAL
      receipt += 'Jl. Raya Bojonggede - Kemang' + LF
      receipt += 'Warkop1001CC' + LF
      receipt += '244238220260604152544' + LF
      receipt += LEFT + dashed
      
      const noStr = padRight(`No.0-${String(data.pesananId)}`, 16);
      const mejaStr = padLeft(`Meja ${data.tipe === 'take-away' ? 'TA' : `(${data.meja || '?'}/1)`}`, 16);
      receipt += noStr + mejaStr + LF;
      
      const t = new Date(data.tanggal || Date.now());
      const dateStr = padRight(`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`, 16);
      const kasirT1 = padLeft('Kasir : Warkop', 16);
      receipt += dateStr + kasirT1 + LF;

      const timeStr = padRight(`${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}:${String(t.getSeconds()).padStart(2,'0')}`, 16);
      const kasirT2 = padLeft(data.kasir || 'kasir', 16);
      receipt += timeStr + kasirT2 + LF;

      receipt += dashed

      let idx = 1;
      for (const item of filteredItems) {
        receipt += `${idx}. ${item.nama || item.nama_menu || 'Item'} ${item.catatan ? `( ${item.catatan} )` : ''}` + LF
        if (!isDapurOrBar) {
          const priceStr = isMeja ? '------' : formatRupiah(item.harga);
          const totalStr = isMeja ? '------' : formatRupiah(item.harga * item.qty);
          receipt += `   ${item.qty}  X ${padRight(priceStr, 12)} ${padLeft(totalStr, 11)}` + LF
        } else {
          receipt += `   ${item.qty}  X` + LF
        }
        idx++;
      }

      receipt += dashed
      if (!isDapurOrBar) {
        const totalStr = isMeja ? '------' : formatRupiah(data.total);
        
        receipt += padRight('Total Tagihan', 16) + padLeft(totalStr, 16) + LF
        
        const bayarStr = isMeja ? '------' : formatRupiah(data.metodeBayar === 'Tunai' ? data.jumlahBayar : data.total);
        receipt += padRight(`Bayar (${data.metodeBayar === 'Tunai' ? 'Cash' : data.metodeBayar})`, 16) + padLeft(bayarStr, 16) + LF
        if (data.metodeBayar === 'Tunai') {
          const kembaliStr = isMeja ? '------' : formatRupiah(data.kembali);
          receipt += padRight('Kembali', 16) + padLeft(kembaliStr, 16) + LF
        }
        receipt += padLeft('Harga total sudah termasuk PPN', 32) + LF
        receipt += dashed
      }

      receipt += CENTER + 'Good Vibes In Every Cup' + LF
      receipt += 'Password Wifi :' + LF
      receipt += 'warkopnaikkelaz' + LF + LF
      receipt += 'Bantu kami jadi lebih baik!' + LF
      receipt += 'Beri ulasan di Google Maps:' + LF
      receipt += 's.id/warkop1001cc-maps' + LF
      
      receipt += LF + LF
      receipt += CUT
    }

    await writer.write(encoder.encode(receipt))
    writer.releaseLock()
    await port.close()
    return true
  } catch (err) {
    console.error('Thermal printer error:', err)
    return false
  }
}

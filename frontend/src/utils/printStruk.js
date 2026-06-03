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
function generateStrukHTML({ pesananId, items, subtotal, ppn, ppnRate, total, metodeBayar, jumlahBayar, kembali, meja, tipe, kasir, tanggal, copyLabel }) {
  const itemRows = items.map(o => `
    <tr>
      <td style="text-align:left;font-size:11px">${o.nama} ${o.catatan ? `<br><i style="font-size:9px">${o.catatan}</i>` : ''}</td>
      <td style="text-align:center;font-size:11px">${o.qty}</td>
      <td style="text-align:right;font-size:11px">${formatRupiah(o.harga * o.qty)}</td>
    </tr>
  `).join('')

  return `
    <div style="width:280px;font-family:'Courier New',monospace;padding:8px;margin:0 auto">
      <div style="text-align:center;margin-bottom:8px">
        <h3 style="margin:0;font-size:14px">☕ WARKOP 1001 CC</h3>
        <p style="margin:2px 0;font-size:10px">Jl. Contoh No. 123</p>
        <p style="margin:2px 0;font-size:10px">${formatTanggal(tanggal)}</p>
        ${copyLabel ? `<p style="margin:4px 0;font-size:9px;font-weight:bold;border:1px dashed #000;padding:2px">${copyLabel}</p>` : ''}
      </div>
      <hr style="border:none;border-top:1px dashed #000">
      <div style="font-size:11px;margin:4px 0">
        <p style="margin:2px 0">No: #${String(pesananId).padStart(4, '0')}</p>
        <p style="margin:2px 0">${tipe === 'take-away' ? '🛍️ Take Away' : `🍽️ Meja #${String(meja || '?').padStart(3, '0')}`}</p>
        ${kasir ? `<p style="margin:2px 0">Kasir: ${kasir}</p>` : ''}
      </div>
      <hr style="border:none;border-top:1px dashed #000">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr>
            <th style="text-align:left;font-size:10px;padding:2px 0">Item</th>
            <th style="text-align:center;font-size:10px;padding:2px 0">Qty</th>
            <th style="text-align:right;font-size:10px;padding:2px 0">Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      <hr style="border:none;border-top:1px dashed #000">
      <div style="font-size:11px">
        <div style="display:flex;justify-content:space-between"><span>Subtotal</span><span>${formatRupiah(subtotal)}</span></div>
        <div style="display:flex;justify-content:space-between"><span>PPN (${ppnRate}%)</span><span>${formatRupiah(ppn)}</span></div>
        <hr style="border:none;border-top:1px solid #000">
        <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:13px"><span>TOTAL</span><span>${formatRupiah(total)}</span></div>
        <hr style="border:none;border-top:1px solid #000">
        <div style="display:flex;justify-content:space-between"><span>Bayar (${metodeBayar})</span><span>${metodeBayar === 'Tunai' ? formatRupiah(jumlahBayar) : formatRupiah(total)}</span></div>
        ${metodeBayar === 'Tunai' ? `<div style="display:flex;justify-content:space-between"><span>Kembali</span><span>${formatRupiah(kembali)}</span></div>` : ''}
      </div>
      <hr style="border:none;border-top:1px dashed #000">
      <div style="text-align:center;font-size:10px;margin-top:6px">
        <p style="margin:2px 0">Terima kasih!</p>
        <p style="margin:2px 0">Selamat menikmati ☕</p>
      </div>
    </div>
  `
}

// Cetak struk via window.print() - 2 copy (pelanggan + laporan)
export function cetakStruk(data) {
  const strukPelanggan = generateStrukHTML({ ...data, copyLabel: '📋 PELANGGAN' })
  const strukLaporan = generateStrukHTML({ ...data, copyLabel: '📊 LAPORAN' })

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
      <div class="page-break">${strukPelanggan}</div>
      <div>${strukLaporan}</div>
      <script>
        window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }
      <\/script>
    </body>
    </html>
  `)
  printWindow.document.close()
}

// Cetak struk via Web Serial API (thermal printer ESC/POS)
export async function cetakStrukThermal(data) {
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
    
    // Print 2 copies
    for (let copy = 0; copy < 2; copy++) {
      const label = copy === 0 ? '[ PELANGGAN ]' : '[ LAPORAN ]'

      receipt += CENTER + DOUBLE
      receipt += 'WARKOP 1001 CC' + LF
      receipt += NORMAL
      receipt += 'Jl. Contoh No. 123' + LF
      receipt += formatTanggal(data.tanggal) + LF
      receipt += BOLD_ON + label + BOLD_OFF + LF
      receipt += LEFT + line
      receipt += `No: #${String(data.pesananId).padStart(4, '0')}` + LF
      receipt += `${data.tipe === 'take-away' ? 'Take Away' : `Meja #${String(data.meja || '?').padStart(3, '0')}`}` + LF
      if (data.kasir) receipt += `Kasir: ${data.kasir}` + LF
      receipt += line

      for (const item of data.items) {
        receipt += item.nama + LF
        receipt += `  ${item.qty}x ${padLeft(formatRupiah(item.harga), 12)} ${padLeft(formatRupiah(item.harga * item.qty), 12)}` + LF
        if (item.catatan) receipt += `  * ${item.catatan}` + LF
      }

      receipt += line
      receipt += padRight('Subtotal', 20) + padLeft(formatRupiah(data.subtotal), 12) + LF
      receipt += padRight(`PPN (${data.ppnRate}%)`, 20) + padLeft(formatRupiah(data.ppn), 12) + LF
      receipt += dashed
      receipt += BOLD_ON
      receipt += padRight('TOTAL', 20) + padLeft(formatRupiah(data.total), 12) + LF
      receipt += BOLD_OFF + dashed
      receipt += padRight(`Bayar (${data.metodeBayar})`, 20) + padLeft(formatRupiah(data.metodeBayar === 'Tunai' ? data.jumlahBayar : data.total), 12) + LF
      if (data.metodeBayar === 'Tunai') {
        receipt += padRight('Kembali', 20) + padLeft(formatRupiah(data.kembali), 12) + LF
      }
      receipt += line
      receipt += CENTER + 'Terima kasih!' + LF
      receipt += 'Selamat menikmati' + LF + LF + LF
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

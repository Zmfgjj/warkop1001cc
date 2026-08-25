import sys
import re

with open('frontend/src/pages/KDS.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace socket listeners
content = content.replace(
    "socket.on('pesanan_baru', onChange)",
    "socket.on('pesanan_baru', onChange)\n    socket.on('pembayaran', onChange)"
)
content = content.replace(
    "socket.off('pesanan_baru', onChange)",
    "socket.off('pesanan_baru', onChange)\n      socket.off('pembayaran', onChange)"
)

# Replace print destination logic (regex to match different indentations)
pattern = re.compile(
    r'( +)if \(i\.kategori_print_destination \|\| i\.kategori2_print_destination\) \{\n'
    r'\1( +)const isDapur = i\.kategori_print_destination === \'dapur\' \|\| i\.kategori_print_destination === \'semua\' \|\| i\.kategori2_print_destination === \'dapur\' \|\| i\.kategori2_print_destination === \'semua\';\n'
    r'\1\2const isBar = i\.kategori_print_destination === \'bar\' \|\| i\.kategori_print_destination === \'semua\' \|\| i\.kategori2_print_destination === \'bar\' \|\| i\.kategori2_print_destination === \'semua\';\n'
    r'\1\2if \(kdsMode === \'dapur\'\) return isDapur;\n'
    r'\1\2if \(kdsMode === \'bar\'\) return isBar;\n'
    r'\1\2return true;\n'
    r'\1\}'
)

replacement = r'''\1if (i.kategori_print_destination || i.kategori2_print_destination) {
\1\2const dest1 = i.kategori_print_destination === 'kasir' ? null : i.kategori_print_destination;
\1\2const dest2 = i.kategori2_print_destination === 'kasir' ? null : i.kategori2_print_destination;
\1\2if (dest1 || dest2) {
\1\2  const isDapur = dest1 === 'dapur' || dest1 === 'semua' || dest2 === 'dapur' || dest2 === 'semua';
\1\2  const isBar = dest1 === 'bar' || dest1 === 'semua' || dest2 === 'bar' || dest2 === 'semua';
\1\2  if (kdsMode === 'dapur') return isDapur;
\1\2  if (kdsMode === 'bar') return isBar;
\1\2  return true;
\1\2}
\1}'''

new_content = pattern.sub(replacement, content)

with open('frontend/src/pages/KDS.jsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Updated KDS.jsx')

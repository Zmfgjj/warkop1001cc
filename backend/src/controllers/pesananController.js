const db = require('../config/database');
const { logAction } = require('../services/logger');
async function getNomorAntrean(conn, isOffline) {
  // Lock settings
  await conn.query('SELECT id FROM settings FOR UPDATE');

  const [rows] = await conn.query('SELECT `key`, nilai FROM settings WHERE `key` IN ("queue_date", "queue_online", "queue_offline")');
  const settings = {};
  for (const r of rows) settings[r.key] = r.nilai;

  const d = new Date();
  const todayStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

  if (settings.queue_date !== todayStr) {
    settings.queue_date = todayStr;
    settings.queue_online = '0';
    settings.queue_offline = '30';
    await conn.query('UPDATE settings SET nilai = ? WHERE `key` = "queue_date"', [todayStr]);
    await conn.query('UPDATE settings SET nilai = "0" WHERE `key` = "queue_online"');
    await conn.query('UPDATE settings SET nilai = "30" WHERE `key` = "queue_offline"');
  }

  let nextNo = 0;
  if (isOffline) {
    nextNo = parseInt(settings.queue_offline || '30') + 1;
    await conn.query('UPDATE settings SET nilai = ? WHERE `key` = "queue_offline"', [nextNo]);
  } else {
    nextNo = parseInt(settings.queue_online || '0') + 1;
    if (nextNo > 30) nextNo = 1; // loop back to 1 if it exceeds 30
    await conn.query('UPDATE settings SET nilai = ? WHERE `key` = "queue_online"', [nextNo]);
  }
  return nextNo;
}


exports.buatPesanan = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { local_id, created_at, meja_id, tipe, catatan, items, is_offline_sync, pembayaran, nama_pelanggan, no_telepon, discount_name, discount_value, nomor_antrean: antreanClient, member_id: req_member_id, point_used } = req.body;

    let member_id = req_member_id || null;
    if (no_telepon) {
      const [existingMember] = await conn.query('SELECT id FROM members WHERE no_hp = ?', [no_telepon]);
      if (existingMember.length > 0) {
        member_id = existingMember[0].id;
      }
    }

    // Cek idempotency: jika local_id sudah ada, kembalikan sukses (mencegah duplikat saat retry sync)
    if (local_id) {
      const [existing] = await conn.query('SELECT id, total FROM pesanan WHERE local_id = ?', [local_id]);
      if (existing.length > 0) {
        conn.release();
        return res.status(200).json({
          message: 'Pesanan sudah tersinkronisasi sebelumnya',
          pesanan_id: existing[0].id,
          total: existing[0].total
        });
      }
    }

    await conn.beginTransaction();
    const kasir_id = req.user?.id || null;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items pesanan wajib diisi' });
    }

    // Hitung total dari DB dan ambil nama menu + kategori untuk keperluan print struk dapur di KDS
    let totalBaru = 0;
    const validatedItems = [];

    const getActivePrice = (menu) => {
      // Check if menu has any linked promotions
      if (menu.promosi && menu.promosi.length > 0) {
        const now = new Date();
        const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const activePromos = menu.promosi.filter(p => {
          // Day check
          if (p.hari && p.hari !== 'all') {
            const activeDays = p.hari.split(',').map(d => parseInt(d, 10));
            if (!activeDays.includes(currentDay)) return false;
          }

          // Time check
          if (p.mulai_jam && p.selesai_jam) {
            if (p.mulai_jam <= p.selesai_jam) {
              return currentHHMM >= p.mulai_jam && currentHHMM <= p.selesai_jam;
            } else {
              return currentHHMM >= p.mulai_jam || currentHHMM <= p.selesai_jam;
            }
          }
          return true; // No time limit
        });

        if (activePromos.length > 0) {
          let lowestPrice = Number(menu.harga);
          for (const p of activePromos) {
            let promoPrice = Number(menu.harga);
            if (p.tipe_promo === 'fixed') {
              promoPrice = Number(p.nilai_promo);
            } else if (p.tipe_promo === 'nominal') {
              promoPrice = Math.max(0, Number(menu.harga) - Number(p.nilai_promo));
            } else if (p.tipe_promo === 'percent') {
              promoPrice = Math.max(0, Number(menu.harga) - (Number(menu.harga) * (Number(p.nilai_promo) / 100)));
            }
            if (promoPrice < lowestPrice) {
              lowestPrice = promoPrice;
            }
          }
          return lowestPrice;
        }
      }

      if (Number(menu.harga_diskon) > 0) {
        if (menu.promo_mulai_jam && menu.promo_selesai_jam) {
          const now = new Date();
          const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          const { promo_mulai_jam, promo_selesai_jam } = menu;
          if (promo_mulai_jam <= promo_selesai_jam) {
            if (currentHHMM >= promo_mulai_jam && currentHHMM <= promo_selesai_jam) {
              return Number(menu.harga_diskon);
            }
          } else {
            if (currentHHMM >= promo_mulai_jam || currentHHMM <= promo_selesai_jam) {
              return Number(menu.harga_diskon);
            }
          }
        } else {
          return Number(menu.harga_diskon);
        }
      }
      return Number(menu.harga);
    };

    for (const item of items) {
      const [menu] = await conn.query(
        `SELECT m.harga, m.harga_diskon, m.promo_mulai_jam, m.promo_selesai_jam, m.nama, 
         k.nama as kategori_nama, k.print_destination as kategori_print_destination,
         k2.nama as kategori2_nama, k2.print_destination as kategori2_print_destination
         FROM menu m 
         LEFT JOIN kategori k ON m.kategori_id = k.id 
         LEFT JOIN kategori k2 ON m.kategori2_id = k2.id
         WHERE m.id = ? AND m.is_deleted = FALSE`,
        [item.menu_id]
      );
      if (menu.length > 0) {
        const [promos] = await conn.query(
          `SELECT p.id, p.nama, p.tipe_promo, p.nilai_promo, p.mulai_jam, p.selesai_jam, p.hari
           FROM promosi_menu pm
           JOIN promosi p ON pm.promosi_id = p.id
           WHERE pm.menu_id = ?`,
          [item.menu_id]
        );
        menu[0].promosi = promos;
        let itemHarga = getActivePrice(menu[0]);
        // Trust frontend price if it's a Spin Prize
        if (item.catatan && item.catatan.includes('Hadiah Spin Wheel')) {
          itemHarga = Number(item.harga) || itemHarga;
        }
        totalBaru += itemHarga * item.qty;
        let isKdsTarget = false;
        const rawDest1 = menu[0].kategori_print_destination;
        const rawDest2 = menu[0].kategori2_print_destination;
        const dest1 = rawDest1 === 'kasir' ? null : rawDest1;
        const dest2 = rawDest2 === 'kasir' ? null : rawDest2;

        if (dest1 === 'dapur' || dest1 === 'bar' || dest1 === 'semua' || dest2 === 'dapur' || dest2 === 'bar' || dest2 === 'semua') {
          isKdsTarget = true;
        } else if (!dest1 && !dest2) {
          const k1 = (menu[0].kategori_nama || '').toLowerCase();
          const k2 = (menu[0].kategori2_nama || '').toLowerCase();
          const isDapur = k => k.includes('makanan') || k.includes('snack') || k.includes('food') || k.includes('main course') || k.includes('indomie') || k.includes('dapur') || k.includes('add on') || k.includes('others') || k.includes('cemilan') || k.includes('camilan') || k.includes('gorengan') || k.includes('cireng');
          const isBar = k => k.includes('minuman') || k.includes('kopi') || k.includes('drink') || k.includes('tea') || k.includes('signature') || k.includes('coffee') || k.includes('mocktail') || k.includes('manual brew') || k.includes('bar') || k.includes('coffe');
          if (isDapur(k1) || isDapur(k2) || isBar(k1) || isBar(k2)) {
            isKdsTarget = true;
          }
        }

        validatedItems.push({
          ...item,
          harga: itemHarga,
          nama_menu: (item.catatan && item.catatan.includes('Hadiah Spin Wheel') && item.nama) ? item.nama : menu[0].nama,
          kategori_nama: menu[0].kategori_nama,
          is_kds_target: isKdsTarget
        });
      }
    }

    let pesanan_id;
    let total = 0;
    let nomor_antrean = null;

    // Lock meja row to prevent race condition
    if (meja_id) {
      await conn.query('SELECT id FROM meja WHERE id = ? FOR UPDATE', [meja_id]);
    }

    // Cek Open Bill (Bypass jika ini pesanan sinkronisasi offline)
    const [openBill] = is_offline_sync ? [[]] : await conn.query(
      "SELECT id, total FROM pesanan WHERE meja_id = ? AND is_open_bill = 1 AND status != 'selesai' AND status != 'batal' LIMIT 1",
      [meja_id]
    );

    if (openBill.length > 0) {
      pesanan_id = openBill[0].id;
      total = Math.max(0, parseFloat(openBill[0].total) + totalBaru - (Number(discount_value) || 0) - (Number(point_used) || 0));

      await conn.query(
        'UPDATE pesanan SET total = ?, nama_pelanggan = COALESCE(nama_pelanggan, ?), no_telepon = COALESCE(no_telepon, ?), discount_name = COALESCE(discount_name, ?), discount_value = COALESCE(discount_value, ?), member_id = COALESCE(member_id, ?), point_used = COALESCE(point_used, ?) WHERE id = ?',
        [total, nama_pelanggan || null, no_telepon || null, discount_name || null, Number(discount_value) || 0, member_id || null, Number(point_used) || 0, pesanan_id]
      );

      for (const item of validatedItems) {
        await conn.query(
          'INSERT INTO detail_pesanan (pesanan_id, menu_id, qty, harga, catatan) VALUES (?, ?, ?, ?, ?)',
          [pesanan_id, item.menu_id, item.qty, item.harga, item.catatan || null]
        );
      }
    } else {
      total = Math.max(0, totalBaru - (Number(discount_value) || 0) - (Number(point_used) || 0));
      const isOffline = kasir_id !== null;
      if (is_offline_sync && antreanClient) {
        nomor_antrean = antreanClient;
      } else {
        nomor_antrean = await getNomorAntrean(conn, isOffline);
      }

      // Jika sync offline, cek umurnya. Batas waktu pesanan tampil di KDS adalah 30 Menit.
      // Jika lebih dari 30 menit, anggap pesanan basi/sudah dimasak manual, jadi langsung selesai.
      let isOldOffline = false;
      if (is_offline_sync && created_at) {
        const orderTime = new Date(created_at).getTime();
        const now = Date.now();
        if (now - orderTime > 30 * 60 * 1000) {
          isOldOffline = true;
        }
      }

      const allSelesai = validatedItems.every(i => !i.is_kds_target);
      // Jika pesanan basi (offline sync > 30 menit) ATAU semua item bukan target KDS, maka selesai.
      // Jika pesanan masih segar (meskipun offline sync) dan ada item KDS, maka pending (masuk KDS).
      const statusValue = (isOldOffline || allSelesai) ? 'selesai' : 'pending';
      const paymentStatusValue = is_offline_sync ? 'paid' : 'unpaid';

      // Beri tanda khusus [Offline] pada KDS agar koki tahu jika ini pesanan tertunda
      let finalCatatan = catatan || '';
      if (is_offline_sync && !isOldOffline) {
        finalCatatan = `[OFFLINE SYNC] ${finalCatatan}`.trim();
      }

      const [result] = await conn.query(
        'INSERT INTO pesanan (local_id, created_at, meja_id, kasir_id, tipe, catatan, total, nomor_antrean, status, payment_status, nama_pelanggan, no_telepon, discount_name, discount_value, member_id, point_used) VALUES (?, COALESCE(?, CURRENT_TIMESTAMP), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [local_id || null, created_at ? new Date(created_at) : null, meja_id, kasir_id, tipe, finalCatatan, total, nomor_antrean, statusValue, paymentStatusValue, nama_pelanggan || null, no_telepon || null, discount_name || null, Number(discount_value) || 0, member_id || null, Number(point_used) || 0]
      );
      pesanan_id = result.insertId;

      for (const item of validatedItems) {
        const itemStatusValue = (isOldOffline || !item.is_kds_target) ? 'selesai' : 'pending';
        await conn.query(
          'INSERT INTO detail_pesanan (pesanan_id, menu_id, qty, harga, catatan, status) VALUES (?, ?, ?, ?, ?, ?)',
          [pesanan_id, item.menu_id, item.qty, item.harga, item.catatan || null, itemStatusValue]
        );
      }

      // Jika sync offline, simpan pembayaran secara otomatis
      if (is_offline_sync && pembayaran) {
        const metodeSafe = (pembayaran.metode || 'tunai').toString().toLowerCase();
        await conn.query(
          'INSERT INTO pembayaran (pesanan_id, metode, jumlah, status, created_at) VALUES (?, ?, ?, "sukses", COALESCE(?, CURRENT_TIMESTAMP))',
          [pesanan_id, metodeSafe, total, created_at ? new Date(created_at) : null]
        );

        if (member_id) {
          const pointEarned = Math.floor(total / 1000) * 10;
          const pointUsedNum = Number(point_used) || 0;
          await conn.query('UPDATE pesanan SET point_earned = ? WHERE id = ?', [pointEarned, pesanan_id]);
          await conn.query('UPDATE members SET point = point + ? - ? WHERE id = ?', [pointEarned, pointUsedNum, member_id]);

          if (pointEarned > 0) {
            await conn.query('INSERT INTO member_points_history (member_id, pesanan_id, tipe, jumlah_poin, created_at) VALUES (?, ?, "earn", ?, COALESCE(?, CURRENT_TIMESTAMP))', [member_id, pesanan_id, pointEarned, created_at ? new Date(created_at) : null]);
          }
          if (pointUsedNum > 0) {
            await conn.query('INSERT INTO member_points_history (member_id, pesanan_id, tipe, jumlah_poin, created_at) VALUES (?, ?, "redeem", ?, COALESCE(?, CURRENT_TIMESTAMP))', [member_id, pesanan_id, pointUsedNum, created_at ? new Date(created_at) : null]);
          }
        }
      }

      if (meja_id && !is_offline_sync && !allSelesai) {
        await conn.query('UPDATE meja SET status = "terisi" WHERE id = ?', [meja_id]);
      }
    }

    await conn.commit();

    // TRACE LOGGING: Order berhasil masuk DB
    const logDesc = is_offline_sync
      ? `Pesanan Offline #${pesanan_id} berhasil disinkronisasi`
      : `Pesanan Baru #${pesanan_id} berhasil dibuat`;
    await logAction(req, 'INSERT', 'pesanan', logDesc, { pesanan_id, total });

    const io = req.app.get('io');
    if (io) {
      if (is_offline_sync) {
        // Ambil nama kasir untuk data struk
        let namaKasir = 'Kasir';
        if (kasir_id) {
          const [u] = await db.query('SELECT nama FROM users WHERE id = ?', [kasir_id]);
          if (u.length > 0) namaKasir = u[0].nama;
        }

        // Ambil nomor meja jika ada
        let nomorMeja = null;
        if (meja_id) {
          const [m] = await db.query('SELECT nomor FROM meja WHERE id = ?', [meja_id]);
          if (m.length > 0) nomorMeja = m[0].nomor;
        }

        io.emit('pesanan_offline_sync', {
          id: pesanan_id,
          meja_id,
          nomor_meja: nomorMeja,
          tipe,
          catatan,
          total,
          nomor_antrean,
          created_at: new Date(),
          nama_kasir: namaKasir,
          items: validatedItems
        });
      } else {
        io.emit('pesanan_baru', { pesanan_id, meja_id, total });
        if (meja_id && openBill.length === 0) {
          io.emit('status_meja', { meja_id, status: 'terisi' });
        }
      }
    }

    res.status(201).json({ message: 'Pesanan dibuat/diperbarui', pesanan_id, total });
  } catch (err) {
    await conn.rollback();
    console.error('[PesananController] Error buatPesanan:', err.message, err.sqlMessage || '');
    res.status(500).json({ message: 'Server error: ' + (err.sqlMessage || err.message) });
  } finally {
    conn.release();
  }
};

exports.buatReservasi = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { meja_id, nama_pelanggan, dp_amount } = req.body;
    const kasir_id = req.user?.id || null;

    if (!meja_id || !nama_pelanggan) {
      return res.status(400).json({ message: 'Meja dan nama pelanggan wajib diisi' });
    }

    const nomor_antrean = await getNomorAntrean(conn, true); // Reservasi is always offline/kasir

    const [result] = await conn.query(
      'INSERT INTO pesanan (meja_id, kasir_id, tipe, catatan, total, is_open_bill, dp_amount, nama_pelanggan, nomor_antrean) VALUES (?, ?, "dine-in", "", 0, true, ?, ?, ?)',
      [meja_id, kasir_id, dp_amount || 0, nama_pelanggan, nomor_antrean]
    );

    await conn.query('UPDATE meja SET status = "reservasi" WHERE id = ?', [meja_id]);

    await conn.commit();

    const io = req.app.get('io');
    if (io) {
      io.emit('status_meja', { meja_id, status: 'reservasi' });
      io.emit('pesanan_baru', { pesanan_id: result.insertId, meja_id, total: 0 });
    }

    res.status(201).json({ message: 'Reservasi berhasil dibuat', pesanan_id: result.insertId });
  } catch (err) {
    await conn.rollback();
    console.error(err); res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};

exports.getPesanan = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, m.nomor as nomor_meja,
        u.nama as nama_kasir
      FROM pesanan p
      LEFT JOIN meja m ON p.meja_id = m.id
      LEFT JOIN users u ON p.kasir_id = u.id
      WHERE p.status NOT IN ('selesai', 'batal')
      ORDER BY p.created_at DESC
    `);

    if (rows.length > 0) {
      const ids = rows.map(r => r.id);
      const [allDetails] = await db.query(`
        SELECT dp.*, mn.nama as nama_menu, k.nama as kategori_nama, k.print_destination as kategori_print_destination, k2.nama as kategori2_nama, k2.print_destination as kategori2_print_destination
        FROM detail_pesanan dp
        LEFT JOIN menu mn ON dp.menu_id = mn.id
        LEFT JOIN kategori k ON mn.kategori_id = k.id
        LEFT JOIN kategori k2 ON mn.kategori2_id = k2.id
        WHERE dp.pesanan_id IN (?)
      `, [ids]);

      const detailMap = {};
      for (const d of allDetails) {
        if (!detailMap[d.pesanan_id]) detailMap[d.pesanan_id] = [];
        detailMap[d.pesanan_id].push(d);
      }
      for (const pesanan of rows) {
        pesanan.items = detailMap[pesanan.id] || [];
      }
    }

    res.json(rows);
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatus = ['pending', 'diproses', 'selesai', 'batal'];
    if (!status || !allowedStatus.includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid' });
    }

    await db.query('UPDATE pesanan SET status = ? WHERE id = ?', [status, id]);

    if (status === 'batal') {
      const [pesanan] = await db.query('SELECT member_id FROM pesanan WHERE id = ?', [id]);
      if (pesanan.length > 0 && pesanan[0].member_id) {
        const [historyRows] = await db.query('SELECT * FROM member_points_history WHERE pesanan_id = ?', [id]);
        let pointsToDeduct = 0;
        let pointsToRefund = 0;
        for (const row of historyRows) {
          if (row.tipe === 'earn') pointsToDeduct += Number(row.jumlah_poin);
          if (row.tipe === 'redeem') pointsToRefund += Number(row.jumlah_poin);
        }
        if (pointsToDeduct > 0 || pointsToRefund > 0) {
          await db.query('UPDATE members SET point = point - ? + ? WHERE id = ?', [pointsToDeduct, pointsToRefund, pesanan[0].member_id]);
          await db.query('DELETE FROM member_points_history WHERE pesanan_id = ?', [id]);
        }
      }
    }

    if (status === 'selesai' || status === 'diproses') {
      await db.query('UPDATE detail_pesanan SET status = ? WHERE pesanan_id = ? AND status != ?', [status, id, status]);
    }

    const io = req.app.get('io');

    // Jika pesanan selesai atau batal, kosongkan kembali meja yang dipakai
    const [pesananRows] = await db.query('SELECT meja_id FROM pesanan WHERE id = ?', [id]);
    if (pesananRows.length > 0 && pesananRows[0].meja_id) {
      const meja_id = pesananRows[0].meja_id;
      if (status === 'selesai' || status === 'batal') {
        await db.query('UPDATE meja SET status = "kosong" WHERE id = ?', [meja_id]);
        if (io) {
          io.emit('status_meja', { meja_id, status: 'kosong' });
          io.emit('mejaUpdated');
        }
      }
    }

    // Emit socket
    if (io) {
      io.emit('status_pesanan', { pesanan_id: id, status });
    }

    res.json({ message: 'Status diupdate' });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};

exports.updateStatusDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatus = ['pending', 'diproses', 'selesai'];
    if (!status || !allowedStatus.includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid' });
    }

    await db.query('UPDATE detail_pesanan SET status = ? WHERE id = ?', [status, id]);

    const [detail] = await db.query('SELECT pesanan_id FROM detail_pesanan WHERE id = ?', [id]);
    const pesanan_id = detail[0].pesanan_id;

    // Auto-update pesanan status: if any item diproses → pesanan diproses
    if (status === 'diproses') {
      await db.query("UPDATE pesanan SET status = 'diproses' WHERE id = ? AND status = 'pending'", [pesanan_id]);
    }

    // Auto-complete: if ALL items selesai → pesanan selesai
    if (status === 'selesai') {
      const [remaining] = await db.query(
        "SELECT COUNT(*) as cnt FROM detail_pesanan WHERE pesanan_id = ? AND status != 'selesai'",
        [pesanan_id]
      );
      if (remaining[0].cnt === 0) {
        await db.query("UPDATE pesanan SET status = 'selesai' WHERE id = ?", [pesanan_id]);

        // Free table
        const [pes] = await db.query('SELECT meja_id FROM pesanan WHERE id = ?', [pesanan_id]);
        if (pes.length > 0 && pes[0].meja_id) {
          await db.query('UPDATE meja SET status = "kosong" WHERE id = ?', [pes[0].meja_id]);
          const io = req.app.get('io');
          if (io) {
            io.emit('status_meja', { meja_id: pes[0].meja_id, status: 'kosong' });
            io.emit('mejaUpdated');
          }
        }
      }
    }

    // Emit socket ke dapur
    const io = req.app.get('io');
    if (io) {
      io.emit('status_item', { detail_id: id, pesanan_id, status });
      if (status === 'selesai') io.emit('status_pesanan', { pesanan_id, status: 'selesai' });
    }

    res.json({ message: 'Status item diupdate' });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};

exports.updateDetailCatatan = async (req, res) => {
  try {
    const { id } = req.params;
    const { catatan } = req.body;

    if (catatan === undefined || catatan === null) {
      return res.status(400).json({ message: 'Catatan tidak valid' });
    }

    const catatanValue = String(catatan).trim() || null;

    await db.query('UPDATE detail_pesanan SET catatan = ? WHERE id = ?', [catatanValue, id]);

    const [detail] = await db.query('SELECT pesanan_id FROM detail_pesanan WHERE id = ?', [id]);

    // Emit socket
    const io = req.app.get('io');
    if (io) {
      io.emit('catatan_item', { detail_id: id, pesanan_id: detail[0].pesanan_id, catatan: catatanValue });
    }

    res.json({ message: 'Catatan item diupdate' });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};

exports.konfirmasiPembayaran = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;
    const { status } = req.body; // 'paid' or 'unpaid'

    if (status === 'paid') {
      const [p] = await conn.query("SELECT total, member_id, point_used, point_earned FROM pesanan WHERE id = ?", [id]);

      // Check if pembayaran already exists
      const [ex] = await conn.query("SELECT id FROM pembayaran WHERE pesanan_id = ?", [id]);
      if (ex.length === 0 && p.length > 0) {
        const pointEarned = Math.floor(p[0].total / 1000) * 10;
        await conn.query("UPDATE pesanan SET payment_status = 'paid', point_earned = ? WHERE id = ?", [pointEarned, id]);
        await conn.query("INSERT INTO pembayaran (pesanan_id, metode, jumlah, status) VALUES (?, 'qris', ?, 'sukses')", [id, p[0].total]);

        if (p[0].member_id) {
          const pointUsedNum = Number(p[0].point_used) || 0;
          await conn.query('UPDATE members SET point = point + ? - ? WHERE id = ?', [pointEarned, pointUsedNum, p[0].member_id]);
          if (pointEarned > 0) {
            await conn.query('INSERT INTO member_points_history (member_id, pesanan_id, tipe, jumlah_poin) VALUES (?, ?, "earn", ?)', [p[0].member_id, id, pointEarned]);
          }
          if (pointUsedNum > 0) {
            await conn.query('INSERT INTO member_points_history (member_id, pesanan_id, tipe, jumlah_poin) VALUES (?, ?, "redeem", ?)', [p[0].member_id, id, pointUsedNum]);
          }
        }
      } else {
        await conn.query("UPDATE pesanan SET payment_status = 'paid' WHERE id = ?", [id]);
      }
    } else {
      await conn.query("UPDATE pesanan SET payment_status = 'unpaid', bukti_pembayaran = NULL WHERE id = ?", [id]);
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('pembayaran', { pesanan_id: id, status });
    }

    res.json({ message: 'Status pembayaran diupdate' });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};

exports.hapusPesanan = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;
    await conn.beginTransaction();

    const [pesanan] = await conn.query('SELECT * FROM pesanan WHERE id = ?', [id]);
    if (pesanan.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    }

    const pesananData = pesanan[0];
    if (pesananData.meja_id) {
      await conn.query("UPDATE meja SET status = 'kosong' WHERE id = ?", [pesananData.meja_id]);
    }

    // Fetch detail & pembayaran for backup log
    const [detailRows] = await conn.query('SELECT * FROM detail_pesanan WHERE pesanan_id = ?', [id]);
    const [pembayaranRows] = await conn.query('SELECT * FROM pembayaran WHERE pesanan_id = ?', [id]);

    const backupObj = {
      pesanan: pesananData,
      detail_pesanan: detailRows,
      pembayaran: pembayaranRows
    };

    // Save delete log and backup to activity_logs table
    const userId = req.user ? req.user.id : null;
    const username = req.user ? (req.user.username || req.user.nama || 'USER') : 'SYSTEM';
    const description = `Menghapus Transaksi #${id} atas nama ${pesananData.nama_pelanggan || 'Pelanggan Umum'} - Total Rp ${Number(pesananData.total).toLocaleString('id-ID')}`;

    await conn.query(
      `INSERT INTO activity_logs (user_id, username, action_type, table_name, description, backup_data) 
       VALUES (?, ?, 'DELETE', 'pesanan', ?, ?)`,
      [userId, username, description, JSON.stringify(backupObj)]
    );

    // Rollback Member Points if any
    if (pesananData.member_id) {
      const [historyRows] = await conn.query('SELECT * FROM member_points_history WHERE pesanan_id = ?', [id]);
      let pointsToDeduct = 0;
      let pointsToRefund = 0;
      for (const row of historyRows) {
        if (row.tipe === 'earn') pointsToDeduct += Number(row.jumlah_poin);
        if (row.tipe === 'redeem') pointsToRefund += Number(row.jumlah_poin);
      }
      if (pointsToDeduct > 0 || pointsToRefund > 0) {
        await conn.query('UPDATE members SET point = point - ? + ? WHERE id = ?', [pointsToDeduct, pointsToRefund, pesananData.member_id]);
        await conn.query('DELETE FROM member_points_history WHERE pesanan_id = ?', [id]);
      }
    }

    // Delete records
    await conn.query('DELETE FROM detail_pesanan WHERE pesanan_id = ?', [id]);
    await conn.query('DELETE FROM pembayaran WHERE pesanan_id = ?', [id]);
    await conn.query('DELETE FROM pesanan WHERE id = ?', [id]);

    await conn.commit();
    const io = req.app.get('io');
    if (io) {
      if (pesananData.meja_id) io.emit('status_meja', { meja_id: pesananData.meja_id, status: 'kosong' });
      io.emit('pesanan_batal', { pesanan_id: id });
    }

    res.json({ message: 'Pesanan dan histori poin berhasil dihapus' });
  } catch (err) {
    await conn.rollback();
    console.error(err); res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};

exports.autoCompleteOldOrders = async (io) => {
  const conn = await db.getConnection();
  try {
    const [oldOrders] = await conn.query(
      `SELECT id, meja_id FROM pesanan 
       WHERE (status = 'pending' OR status = 'diproses') 
       AND created_at < NOW() - INTERVAL 1 HOUR`
    );

    if (oldOrders.length > 0) {
      const orderIds = oldOrders.map(o => o.id);
      const mejaIds = oldOrders.map(o => o.meja_id).filter(id => id !== null);

      await conn.query(`UPDATE detail_pesanan SET status = 'selesai' WHERE pesanan_id IN (?)`, [orderIds]);
      await conn.query(`UPDATE pesanan SET status = 'selesai' WHERE id IN (?)`, [orderIds]);

      if (mejaIds.length > 0) {
        await conn.query(`UPDATE meja SET status = 'kosong' WHERE id IN (?)`, [mejaIds]);
      }

      console.log(`[Auto-Complete] ${oldOrders.length} orders older than 1 hour were marked as selesai.`);

      if (io) {
        orderIds.forEach(id => {
          io.emit('status_pesanan', { pesanan_id: id, status: 'selesai' });
        });
        mejaIds.forEach(id => {
          io.emit('status_meja', { meja_id: id, status: 'kosong' });
        });
        io.emit('mejaUpdated');
      }
    }
  } catch (err) {
    console.error('[Auto-Complete Error]', err);
  } finally {
    conn.release();
  }
};

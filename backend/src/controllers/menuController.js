const db = require('../config/database');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

exports.getKategori = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM kategori ORDER BY urutan');
    res.json(rows);
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};

exports.tambahKategori = async (req, res) => {
  try {
    const { nama, urutan, print_destination } = req.body;
    await db.query('INSERT INTO kategori (nama, urutan, print_destination) VALUES (?, ?, ?)', 
      [nama, urutan || 0, print_destination || 'dapur']);
    res.json({ message: 'Kategori berhasil ditambahkan' });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};

exports.updateKategori = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, urutan, print_destination } = req.body;
    await db.query('UPDATE kategori SET nama = ?, urutan = ?, print_destination = ? WHERE id = ?', 
      [nama, urutan || 0, print_destination || 'dapur', id]);
    res.json({ message: 'Kategori berhasil diupdate' });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};

exports.hapusKategori = async (req, res) => {
  try {
    const { id } = req.params;
    // Cek apakah ada menu yang menggunakan kategori ini
    const [menus] = await db.query('SELECT id FROM menu WHERE kategori_id = ? AND is_deleted = FALSE', [id]);
    if (menus.length > 0) {
      return res.status(400).json({ message: 'Kategori tidak bisa dihapus karena masih digunakan oleh menu.' });
    }
    await db.query('DELETE FROM kategori WHERE id = ?', [id]);
    res.json({ message: 'Kategori berhasil dihapus' });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};

exports.getMenu = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.*, k.nama as kategori_nama, k.print_destination as kategori_print_destination, k2.nama as kategori2_nama, k2.print_destination as kategori2_print_destination
      FROM menu m 
      LEFT JOIN kategori k ON m.kategori_id = k.id
      LEFT JOIN kategori k2 ON m.kategori2_id = k2.id
      WHERE m.is_deleted = FALSE
      ORDER BY k.urutan, m.nama
    `);

    const [variants] = await db.query('SELECT * FROM menu_varian');
    const variantMap = {};
    for (const v of variants) {
      if (!variantMap[v.menu_id]) variantMap[v.menu_id] = [];
      variantMap[v.menu_id].push({
        id: v.id,
        nama: v.nama,
        harga_tambahan: v.harga_tambahan || 0
      });
    }

    const [promos] = await db.query(`
      SELECT pm.menu_id, p.id, p.nama, p.tipe_promo, p.nilai_promo, p.mulai_jam, p.selesai_jam, p.hari
      FROM promosi_menu pm
      JOIN promosi p ON pm.promosi_id = p.id
    `);
    const promoMap = {};
    for (const p of promos) {
      if (!promoMap[p.menu_id]) promoMap[p.menu_id] = [];
      promoMap[p.menu_id].push({
        id: p.id,
        nama: p.nama,
        tipe_promo: p.tipe_promo,
        nilai_promo: Number(p.nilai_promo),
        mulai_jam: p.mulai_jam,
        selesai_jam: p.selesai_jam,
        hari: p.hari
      });
    }

    const result = rows.map(m => {
      let mappedVariants = variantMap[m.id] || [];
      // Keep legacy for backward compatibility during transition
      if (mappedVariants.length === 0 && m.pilihan_rasa) {
        mappedVariants = m.pilihan_rasa.split(',').map((r, i) => ({
          id: `legacy_${i}`,
          nama: r.trim(),
          harga_tambahan: 0
        })).filter(r => r.nama);
      }
      return {
        ...m,
        variants: mappedVariants,
        promosi: promoMap[m.id] || []
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};

exports.tambahMenu = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { kategori_id, kategori2_id, nama, deskripsi, harga, hpp } = req.body;
    let variants = [];
    try {
      if (req.body.variants) {
        variants = JSON.parse(req.body.variants);
      }
    } catch (e) {
      console.error('Error parsing variants:', e);
    }
    let gambar = '';

    if (!nama || !harga || !kategori_id) {
      await conn.rollback();
      return res.status(400).json({ message: 'Nama, harga, dan kategori wajib diisi' });
    }

    if (isNaN(harga) || Number(harga) < 0) {
      return res.status(400).json({ message: 'Harga tidak valid' });
    }
    
    if (req.file) {
      const webpFilename = `${req.file.filename.split('.')[0]}.webp`;
      const webpPath = path.join(req.file.destination, webpFilename);
      
      await sharp(req.file.path)
        .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(webpPath);
        
      if (req.file.path !== webpPath) {
        fs.unlinkSync(req.file.path);
      }
      
      gambar = `/uploads/${webpFilename}`;
    }
    
    const [result] = await conn.query(
      'INSERT INTO menu (kategori_id, kategori2_id, nama, deskripsi, harga, harga_diskon, hpp, gambar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [kategori_id, kategori2_id || null, nama, deskripsi || null, harga, req.body.harga_diskon || 0, hpp || 0, gambar]
    );

    const menuId = result.insertId;

    if (variants && variants.length > 0) {
      for (const v of variants) {
        if (v.nama) {
          await conn.query(
            'INSERT INTO menu_varian (menu_id, nama, harga_tambahan) VALUES (?, ?, ?)',
            [menuId, v.nama, v.harga_tambahan || 0]
          );
        }
      }
    }

    await conn.commit();
    
    const io = req.app.get('io');
    const [menuBaru] = await db.query(
      'SELECT m.*, k.nama as kategori_nama, k.print_destination as kategori_print_destination, k2.nama as kategori2_nama, k2.print_destination as kategori2_print_destination FROM menu m LEFT JOIN kategori k ON m.kategori_id = k.id LEFT JOIN kategori k2 ON m.kategori2_id = k2.id WHERE m.id = ?',
      [menuId]
    );
    io.emit('menuAdded', menuBaru[0]);
    
    res.status(201).json({ message: 'Menu ditambahkan', id: menuId });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error('❌ Error tambah menu:', err.message);
    console.error(err); res.status(500).json({ message: 'Server error' });
  } finally {
    if (conn) conn.release();
  }
};

exports.updateMenu = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;
    const { kategori_id, kategori2_id, nama, deskripsi, harga, hpp, tersedia } = req.body;
    let variants = [];
    try {
      if (req.body.variants) {
        variants = JSON.parse(req.body.variants);
      }
    } catch (e) {
      console.error('Error parsing variants:', e);
    }
    let gambar = req.body.gambar;

    if (!nama || !harga || !kategori_id) {
      await conn.rollback();
      return res.status(400).json({ message: 'Nama, harga, dan kategori wajib diisi' });
    }

    if (isNaN(harga) || Number(harga) < 0) {
      return res.status(400).json({ message: 'Harga tidak valid' });
    }
    
    if (req.file) {
      const webpFilename = `${req.file.filename.split('.')[0]}.webp`;
      const webpPath = path.join(req.file.destination, webpFilename);
      
      await sharp(req.file.path)
        .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(webpPath);
        
      if (req.file.path !== webpPath) {
        fs.unlinkSync(req.file.path);
      }
      
      gambar = `/uploads/${webpFilename}`;
    }
    
    await conn.query(
      'UPDATE menu SET kategori_id=?, kategori2_id=?, nama=?, deskripsi=?, harga=?, harga_diskon=?, hpp=?, gambar=?, tersedia=? WHERE id=?',
      [kategori_id, kategori2_id || null, nama, deskripsi || null, harga, req.body.harga_diskon || 0, hpp || 0, gambar, tersedia, id]
    );
    
    await conn.query('DELETE FROM menu_varian WHERE menu_id = ?', [id]);
    if (variants && variants.length > 0) {
      for (const v of variants) {
        if (v.nama) {
          await conn.query(
            'INSERT INTO menu_varian (menu_id, nama, harga_tambahan) VALUES (?, ?, ?)',
            [id, v.nama, v.harga_tambahan || 0]
          );
        }
      }
    }

    await conn.commit();

    const io = req.app.get('io');
    const [menuUpdated] = await db.query(
      'SELECT m.*, k.nama as kategori_nama, k.print_destination as kategori_print_destination, k2.nama as kategori2_nama, k2.print_destination as kategori2_print_destination FROM menu m LEFT JOIN kategori k ON m.kategori_id = k.id LEFT JOIN kategori k2 ON m.kategori2_id = k2.id WHERE m.id = ?',
      [id]
    );
    io.emit('menuUpdated', menuUpdated[0]);
    
    res.json({ message: 'Menu diupdate' });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error(err); res.status(500).json({ message: 'Server error' });
  } finally {
    if (conn) conn.release();
  }
};

exports.hapusMenu = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE menu SET is_deleted = TRUE WHERE id = ?', [id]);
    
    const io = req.app.get('io');
    io.emit('menuDeleted', { id: parseInt(id) });
    
    res.json({ message: 'Menu dihapus' });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};

exports.updateBulkPromo = async (req, res) => {
  try {
    const { action, menu_ids, value, type, promo_mulai_jam, promo_selesai_jam } = req.body;
    
    if (!Array.isArray(menu_ids) || menu_ids.length === 0) {
      return res.status(400).json({ message: 'Tidak ada menu yang dipilih' });
    }

    if (action === 'clear') {
      await db.query(`UPDATE menu SET harga_diskon = 0, promo_mulai_jam = NULL, promo_selesai_jam = NULL WHERE id IN (?)`, [menu_ids]);
    } else if (action === 'set') {
      if (!value || Number(value) < 0) {
        return res.status(400).json({ message: 'Nilai diskon tidak valid' });
      }

      const startJam = promo_mulai_jam && promo_mulai_jam.trim() !== '' ? promo_mulai_jam.trim() : null;
      const endJam = promo_selesai_jam && promo_selesai_jam.trim() !== '' ? promo_selesai_jam.trim() : null;

      if (type === 'fixed') {
        await db.query(`UPDATE menu SET harga_diskon = ?, promo_mulai_jam = ?, promo_selesai_jam = ? WHERE id IN (?)`, [Number(value), startJam, endJam, menu_ids]);
      } else if (type === 'nominal') {
        await db.query(`UPDATE menu SET harga_diskon = GREATEST(harga - ?, 0), promo_mulai_jam = ?, promo_selesai_jam = ? WHERE id IN (?)`, [Number(value), startJam, endJam, menu_ids]);
      } else if (type === 'percent') {
        const percent = Number(value) / 100;
        await db.query(`UPDATE menu SET harga_diskon = GREATEST(harga - (harga * ?), 0), promo_mulai_jam = ?, promo_selesai_jam = ? WHERE id IN (?)`, [percent, startJam, endJam, menu_ids]);
      } else {
        return res.status(400).json({ message: 'Tipe diskon tidak valid' });
      }
    } else {
      return res.status(400).json({ message: 'Aksi tidak valid' });
    }

    const io = req.app.get('io');
    if (io && menu_ids && menu_ids.length > 0) {
      const [updatedMenus] = await db.query(
        `SELECT m.*, k.nama as kategori_nama, k.print_destination as kategori_print_destination, k2.nama as kategori2_nama, k2.print_destination as kategori2_print_destination FROM menu m LEFT JOIN kategori k ON m.kategori_id = k.id LEFT JOIN kategori k2 ON m.kategori2_id = k2.id WHERE m.id IN (?)`,
        [menu_ids]
      );
      updatedMenus.forEach(menu => io.emit('menuUpdated', menu));
    }

    res.json({ message: 'Promo berhasil diperbarui' });
  } catch (err) {
    console.error('❌ Error update bulk promo:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createCampaignPromo = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { nama, type, value, mulai_jam, selesai_jam, hari, menu_ids } = req.body;

    if (!nama || !type || value === undefined || !Array.isArray(menu_ids) || menu_ids.length === 0) {
      await conn.rollback();
      return res.status(400).json({ message: 'Input data tidak lengkap atau tidak valid' });
    }

    const [result] = await conn.query(
      `INSERT INTO promosi (nama, tipe_promo, nilai_promo, mulai_jam, selesai_jam, hari) VALUES (?, ?, ?, ?, ?, ?)`,
      [nama, type, Number(value), mulai_jam || null, selesai_jam || null, hari || 'all']
    );
    const promosiId = result.insertId;

    for (const menuId of menu_ids) {
      await conn.query(
        `INSERT INTO promosi_menu (promosi_id, menu_id) VALUES (?, ?)`,
        [promosiId, menuId]
      );
    }

    await conn.commit();

    const io = req.app.get('io');
    if (io) {
        const [updatedMenus] = await db.query(
          `SELECT m.*, k.nama as kategori_nama, k.print_destination as kategori_print_destination, k2.nama as kategori2_nama, k2.print_destination as kategori2_print_destination FROM menu m LEFT JOIN kategori k ON m.kategori_id = k.id LEFT JOIN kategori k2 ON m.kategori2_id = k2.id WHERE m.id IN (?)`,
          [menu_ids]
        );
      const [allPromos] = await db.query(`
        SELECT pm.menu_id, p.id, p.nama, p.tipe_promo, p.nilai_promo, p.mulai_jam, p.selesai_jam, p.hari
        FROM promosi_menu pm
        JOIN promosi p ON pm.promosi_id = p.id
        WHERE pm.menu_id IN (?)
      `, [menu_ids]);

      const promoMap = {};
      allPromos.forEach(p => {
        if (!promoMap[p.menu_id]) promoMap[p.menu_id] = [];
        promoMap[p.menu_id].push(p);
      });

      updatedMenus.forEach(menu => {
        io.emit('menuUpdated', {
          ...menu,
          promosi: promoMap[menu.id] || []
        });
      });
    }

    res.status(201).json({ message: 'Promosi berhasil ditambahkan', promosi_id: promosiId });
  } catch (err) {
    await conn.rollback();
    console.error('Error createCampaignPromo:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};

exports.getCampaignPromos = async (req, res) => {
  try {
    const [promos] = await db.query(`
      SELECT p.*, COUNT(pm.menu_id) as total_menu
      FROM promosi p
      LEFT JOIN promosi_menu pm ON p.id = pm.promosi_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);

    for (const p of promos) {
      const [menus] = await db.query(`
        SELECT m.id, m.nama
        FROM promosi_menu pm
        JOIN menu m ON pm.menu_id = m.id
        WHERE pm.promosi_id = ?
      `, [p.id]);
      p.menus = menus;
    }

    res.json(promos);
  } catch (err) {
    console.error('Error getCampaignPromos:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteCampaignPromo = async (req, res) => {
  try {
    const { id } = req.params;

    const [menus] = await db.query(`SELECT menu_id FROM promosi_menu WHERE promosi_id = ?`, [id]);
    const menuIds = menus.map(m => m.menu_id);

    await db.query(`DELETE FROM promosi WHERE id = ?`, [id]);

    const io = req.app.get('io');
    if (io && menuIds.length > 0) {
        const [updatedMenus] = await db.query(
          `SELECT m.*, k.nama as kategori_nama, k.print_destination as kategori_print_destination, k2.nama as kategori2_nama, k2.print_destination as kategori2_print_destination FROM menu m LEFT JOIN kategori k ON m.kategori_id = k.id LEFT JOIN kategori k2 ON m.kategori2_id = k2.id WHERE m.id IN (?)`,
          [menuIds]
        );
      const [allPromos] = await db.query(`
        SELECT pm.menu_id, p.id, p.nama, p.tipe_promo, p.nilai_promo, p.mulai_jam, p.selesai_jam, p.hari
        FROM promosi_menu pm
        JOIN promosi p ON pm.promosi_id = p.id
        WHERE pm.menu_id IN (?)
      `, [menuIds]);

      const promoMap = {};
      allPromos.forEach(p => {
        if (!promoMap[p.menu_id]) promoMap[p.menu_id] = [];
        promoMap[p.menu_id].push(p);
      });

      updatedMenus.forEach(menu => {
        io.emit('menuUpdated', {
          ...menu,
          promosi: promoMap[menu.id] || []
        });
      });
    }

    res.json({ message: 'Promosi berhasil dihapus' });
  } catch (err) {
    console.error('Error deleteCampaignPromo:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateBulkHPP = async (req, res) => {
  try {
    // Formula: HPP = Harga Jual - 24% (Harga Jual * 0.76)
    await db.query(`UPDATE menu SET hpp = harga * 0.76`);

    res.json({ message: 'HPP berhasil diperbarui secara massal (Harga Jual - 24%)' });
  } catch (err) {
    console.error('❌ Error update bulk HPP:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};


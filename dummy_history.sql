USE db_warkop_stock;

-- 1. SET STOK AWAL AGAR TIDAK MINUS SAAT DIKURANGI PENJUALAN
-- Kita set stok saat ini = stok maksimum untuk semua bahan baku
UPDATE bahan_baku SET stok_saat_ini = stok_maksimum WHERE stok_maksimum > 0;

-- Catat sebagai stok awal di transaksi_stok
INSERT INTO transaksi_stok (id_bahan, jenis_transaksi, jumlah, id_satuan, stok_sebelum, stok_sesudah, keterangan, created_by)
SELECT id, 'masuk', stok_maksimum, id_satuan, 0, stok_maksimum, 'Stok Awal (Dummy)', 'System'
FROM bahan_baku
WHERE stok_maksimum > 0;

-- 2. GENERATE HISTORY PENJUALAN DUMMY (BEBERAPA TRANSAKSI)

-- Transaksi 1: TRX-20260601-001 (Jappanese & Cireng)
INSERT INTO penjualan (kode_transaksi, id_menu, jumlah, harga_satuan, total_harga, catatan, created_by) VALUES
('TRX-20260601-001A', 4, 2, 15000, 30000, 'Jappanese', 'Kasir 1'),
('TRX-20260601-001B', 52, 1, 15000, 15000, 'Cireng Rujak', 'Kasir 1');
CALL sp_kurangi_stok_penjualan(4, 2, 'TRX-20260601-001A', 'Kasir 1');
CALL sp_kurangi_stok_penjualan(52, 1, 'TRX-20260601-001B', 'Kasir 1');

-- Transaksi 2: TRX-20260601-002 (Kopi Cakra & Mie Tek-Tek)
INSERT INTO penjualan (kode_transaksi, id_menu, jumlah, harga_satuan, total_harga, catatan, created_by) VALUES
('TRX-20260601-002A', 12, 1, 20000, 20000, 'Kopi Cakra', 'Kasir 2'),
('TRX-20260601-002B', 44, 2, 18000, 36000, 'Mie Tek-Tek Sedang', 'Kasir 2');
CALL sp_kurangi_stok_penjualan(12, 1, 'TRX-20260601-002A', 'Kasir 2');
CALL sp_kurangi_stok_penjualan(44, 2, 'TRX-20260601-002B', 'Kasir 2');

-- Transaksi 3: TRX-20260602-001 (Steak Ayam & Lychee Tea & Dimsum)
INSERT INTO penjualan (kode_transaksi, id_menu, jumlah, harga_satuan, total_harga, catatan, created_by) VALUES
('TRX-20260602-001A', 61, 2, 25000, 50000, 'Steak Ayam BBQ', 'Kasir 1'),
('TRX-20260602-001B', 33, 2, 15000, 30000, 'Lychee Tea', 'Kasir 1'),
('TRX-20260602-001C', 50, 1, 15000, 15000, 'Dimsum', 'Kasir 1');
CALL sp_kurangi_stok_penjualan(61, 2, 'TRX-20260602-001A', 'Kasir 1');
CALL sp_kurangi_stok_penjualan(33, 2, 'TRX-20260602-001B', 'Kasir 1');
CALL sp_kurangi_stok_penjualan(50, 1, 'TRX-20260602-001C', 'Kasir 1');

-- Transaksi 4: TRX-20260603-001 (Rice Bowl Chicken & Mocktail)
INSERT INTO penjualan (kode_transaksi, id_menu, jumlah, harga_satuan, total_harga, catatan, created_by) VALUES
('TRX-20260603-001A', 35, 3, 22000, 66000, 'Rice Bowl Chicken', 'Kasir 2'),
('TRX-20260603-001B', 25, 3, 18000, 54000, 'Mocktail Perfreshlite', 'Kasir 2');
CALL sp_kurangi_stok_penjualan(35, 3, 'TRX-20260603-001A', 'Kasir 2');
CALL sp_kurangi_stok_penjualan(25, 3, 'TRX-20260603-001B', 'Kasir 2');

-- Transaksi 5: TRX-20260604-001 (Pempek & Shingthai & Espresso)
INSERT INTO penjualan (kode_transaksi, id_menu, jumlah, harga_satuan, total_harga, catatan, created_by) VALUES
('TRX-20260604-001A', 48, 1, 15000, 15000, 'Pempek', 'Kasir 1'),
('TRX-20260604-001B', 58, 2, 15000, 30000, 'Shingthai', 'Kasir 1'),
('TRX-20260604-001C', 19, 1, 12000, 12000, 'Espresso', 'Kasir 1');
CALL sp_kurangi_stok_penjualan(48, 1, 'TRX-20260604-001A', 'Kasir 1');
CALL sp_kurangi_stok_penjualan(58, 2, 'TRX-20260604-001B', 'Kasir 1');
CALL sp_kurangi_stok_penjualan(19, 1, 'TRX-20260604-001C', 'Kasir 1');

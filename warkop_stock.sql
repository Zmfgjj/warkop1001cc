-- ============================================
-- DATABASE STOCK MANAGEMENT - WARKOP 1001CC
-- ============================================

CREATE DATABASE IF NOT EXISTS db_warkop_stock;
USE db_warkop_stock;

-- ============================================
-- TABEL KATEGORI BAHAN BAKU
-- ============================================
CREATE TABLE kategori_bahan (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nama_kategori VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO kategori_bahan (nama_kategori) VALUES
('Kopi & Espresso'),
('Susu & Dairy'),
('Syrup & Perisa'),
('Gula & Pemanis'),
('Powder & Bubuk'),
('Soda & Minuman'),
('Bahan Makanan'),
('Bumbu & Rempah'),
('Sayuran & Pelengkap'),
('Daging & Protein'),
('Minyak & Lemak'),
('Lain-lain');

-- ============================================
-- TABEL SATUAN
-- ============================================
CREATE TABLE satuan (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nama_satuan VARCHAR(20) NOT NULL,
    singkatan VARCHAR(10) NOT NULL
);

INSERT INTO satuan (nama_satuan, singkatan) VALUES
('Mililiter', 'ml'),
('Gram', 'gr'),
('Kilogram', 'kg'),
('Liter', 'L'),
('Pcs / Butir', 'pcs'),
('Sendok Makan', 'sdm'),
('Sendok Teh', 'sdt'),
('Pump', 'pump'),
('Scoop', 'scoop'),
('Sachet', 'sachet');

-- ============================================
-- TABEL BAHAN BAKU
-- ============================================
CREATE TABLE bahan_baku (
    id INT PRIMARY KEY AUTO_INCREMENT,
    kode_bahan VARCHAR(20) NOT NULL UNIQUE,
    nama_bahan VARCHAR(100) NOT NULL,
    id_kategori INT NOT NULL,
    id_satuan INT NOT NULL,
    stok_saat_ini DECIMAL(10,2) DEFAULT 0,
    stok_minimum DECIMAL(10,2) DEFAULT 0,
    stok_maksimum DECIMAL(10,2) DEFAULT 0,
    harga_per_satuan DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_kategori) REFERENCES kategori_bahan(id),
    FOREIGN KEY (id_satuan) REFERENCES satuan(id)
);

INSERT INTO bahan_baku (kode_bahan, nama_bahan, id_kategori, id_satuan, stok_minimum, stok_maksimum) VALUES
-- Kopi & Espresso
('BB001', 'Biji Kopi Robusta', 1, 2, 500, 5000),
('BB002', 'Ground Coffee (V60/Jappanese)', 1, 2, 200, 2000),
('BB003', 'Bubuk Kopi Tubruk', 1, 2, 200, 2000),
('BB004', 'Bubuk Kopi Khusus (Avocado Coffee)', 1, 10, 20, 200),
-- Susu & Dairy
('BB005', 'UHT (Susu Cair)', 2, 1, 1000, 10000),
('BB006', 'SKM (Susu Kental Manis)', 2, 1, 500, 5000),
('BB007', 'Ice Cream', 2, 9, 50, 500),
('BB008', 'Margarin / Butter', 2, 2, 200, 2000),
-- Syrup & Perisa
('BB009', 'Syrup Peach', 3, 1, 500, 5000),
('BB010', 'Syrup Lychee', 3, 1, 500, 5000),
('BB011', 'Syrup Green Apple (Perfreshlite)', 3, 1, 500, 5000),
('BB012', 'Syrup Blue Curacao (Pertamix)', 3, 1, 500, 5000),
('BB013', 'Syrup Mango (Solar-Go)', 3, 1, 500, 5000),
('BB014', 'Ice Mint', 3, 8, 5, 50),
-- Gula & Pemanis
('BB015', 'Gula Pasir', 4, 2, 500, 5000),
('BB016', 'Brown Sugar / Gula Aren', 4, 1, 500, 5000),
('BB017', 'Fruktosa', 4, 1, 500, 5000),
-- Powder & Bubuk
('BB018', 'Powder Baileys', 5, 2, 200, 2000),
('BB019', 'Powder Machiato', 5, 2, 200, 2000),
('BB020', 'Powder Cappuccino', 5, 2, 200, 2000),
('BB021', 'Powder Matcha', 5, 2, 200, 2000),
('BB022', 'Powder Red Velvet', 5, 2, 200, 2000),
('BB023', 'Powder Dark Chocolate', 5, 2, 200, 2000),
('BB024', 'Powder Green Tea', 5, 2, 200, 2000),
('BB025', 'Powder Taro', 5, 2, 200, 2000),
('BB026', 'Powder Avocado', 5, 10, 20, 200),
-- Soda & Minuman
('BB027', 'Soda', 6, 1, 1000, 10000),
('BB028', 'Beer Banteng', 6, 1, 500, 5000),
('BB029', 'Temulawak (minuman)', 6, 1, 500, 5000),
('BB030', 'Yakult', 6, 5, 20, 200),
('BB031', 'Air Mineral', 6, 1, 2000, 20000),
('BB032', 'Teh', 6, 2, 200, 2000),
-- Bahan Makanan
('BB033', 'Nasi Putih', 7, 2, 2000, 10000),
('BB034', 'Mie', 7, 2, 500, 5000),
('BB035', 'Roti Tawar', 7, 5, 20, 200),
('BB036', 'Cilok', 7, 5, 50, 500),
('BB037', 'Siomay', 7, 5, 30, 300),
('BB038', 'Dimsum', 7, 5, 20, 200),
('BB039', 'Pempek Isi Telur', 7, 5, 20, 200),
('BB040', 'Pempek Kosongan', 7, 5, 20, 200),
('BB041', 'Nugget', 7, 5, 50, 500),
('BB042', 'Sosis', 7, 5, 50, 500),
('BB043', 'Kentang (Goreng/Steak)', 7, 2, 1000, 5000),
('BB044', 'Singkong', 7, 2, 1000, 5000),
('BB045', 'Pisang', 7, 5, 10, 100),
('BB046', 'Kulit Lumpia', 7, 5, 30, 300),
('BB047', 'Cireng', 7, 5, 50, 500),
('BB048', 'Tepung Pisang', 7, 2, 200, 2000),
('BB049', 'Tepung Terigu', 7, 2, 500, 5000),
-- Bumbu & Rempah
('BB050', 'Bumbu Merah', 8, 2, 200, 2000),
('BB051', 'Bumbu Putih', 8, 2, 200, 2000),
('BB052', 'Bumbu Bledeg', 8, 2, 200, 2000),
('BB053', 'Bawang Merah', 8, 2, 200, 2000),
('BB054', 'Bawang Putih', 8, 2, 200, 2000),
('BB055', 'Cabe Rawit', 8, 2, 100, 1000),
('BB056', 'Cabe Keriting', 8, 2, 100, 1000),
('BB057', 'Garam', 8, 2, 100, 1000),
('BB058', 'Royco / Masako / Sasa', 8, 2, 100, 1000),
('BB059', 'Kaldu Jamur', 8, 2, 100, 1000),
('BB060', 'Kecap Manis', 8, 1, 200, 2000),
('BB061', 'Saus Tomat', 8, 1, 200, 2000),
('BB062', 'Saus BBQ', 8, 1, 200, 2000),
('BB063', 'Saus Blackpepper', 8, 1, 200, 2000),
('BB064', 'Saus Teriyaki', 8, 1, 200, 2000),
('BB065', 'Bumbu Kacang (Siomay)', 8, 2, 200, 2000),
('BB066', 'Bumbu Rujak (Cireng)', 8, 2, 100, 1000),
('BB067', 'Kuah Cuko (Pempek)', 8, 1, 200, 2000),
('BB068', 'Maizena', 8, 2, 200, 2000),
('BB069', 'Sereh', 8, 2, 50, 500),
('BB070', 'Daun Jeruk', 8, 2, 50, 500),
('BB071', 'Daun Pandan', 8, 2, 50, 500),
('BB072', 'Rum', 8, 1, 200, 2000),
('BB073', 'Dark Chocolate', 8, 2, 200, 2000),
-- Sayuran & Pelengkap
('BB074', 'Selada', 9, 2, 200, 2000),
('BB075', 'Timun', 9, 5, 20, 200),
('BB076', 'Sawi', 9, 2, 200, 2000),
('BB077', 'Sayur Steak (Mix)', 9, 2, 200, 2000),
('BB078', 'Daun Bawang', 9, 2, 100, 1000),
('BB079', 'Buah Lychee', 9, 5, 10, 100),
('BB080', 'Lemon', 9, 5, 10, 100),
('BB081', 'Selasih', 9, 2, 50, 500),
-- Daging & Protein
('BB082', 'Ayam (Potong/Suir)', 10, 2, 500, 5000),
('BB083', 'Daging Sapi (Steak)', 10, 5, 10, 100),
('BB084', 'Telur Ayam', 10, 5, 50, 500),
-- Minyak & Lemak
('BB085', 'Minyak Goreng', 11, 1, 1000, 10000),
-- Lain-lain
('BB086', 'Springkle (Taburan)', 12, 2, 50, 500),
('BB087', 'Wijen', 12, 2, 50, 500),
('BB088', 'Mayonaise', 12, 1, 200, 2000),
('BB089', 'Fla (untuk Shingthai)', 12, 6, 10, 100),
('BB090', 'Paper Filter (V60)', 12, 5, 50, 500),
('BB091', 'Gula Pasir (cair/larutan)', 4, 1, 500, 5000);

-- ============================================
-- TABEL KATEGORI MENU
-- ============================================
CREATE TABLE kategori_menu (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nama_kategori VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO kategori_menu (nama_kategori) VALUES
('Coffee Series'),
('Non Coffee'),
('Mocktail Series'),
('Minuman Lainnya'),
('Rice Bowl'),
('Mie & Nasi'),
('Snack & Gorengan'),
('Dessert & Ice Cream'),
('Steak');

-- ============================================
-- TABEL MENU
-- ============================================
CREATE TABLE menu (
    id INT PRIMARY KEY AUTO_INCREMENT,
    kode_menu VARCHAR(20) NOT NULL UNIQUE,
    nama_menu VARCHAR(100) NOT NULL,
    id_kategori INT NOT NULL,
    harga DECIMAL(15,2) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_kategori) REFERENCES kategori_menu(id)
);

INSERT INTO menu (kode_menu, nama_menu, id_kategori, harga) VALUES
-- Coffee Series
('MN001', 'Black Series (Black Peach)', 1, 0),
('MN002', 'Black Series (Black Lychee)', 1, 0),
('MN003', 'Black Series (Black Mango)', 1, 0),
('MN004', 'Jappanese', 1, 0),
('MN005', 'V60', 1, 0),
('MN006', 'Americano', 1, 0),
('MN007', 'Butterscoth', 1, 0),
('MN008', 'Ice Coffee Latte', 1, 0),
('MN009', 'Baileys Coffee', 1, 0),
('MN010', 'Machiato', 1, 0),
('MN011', 'Coffee Beer Banteng', 1, 0),
('MN012', 'Kopi Cakra', 1, 0),
('MN013', 'Cappucino (Ice)', 1, 0),
('MN014', 'Kopi Susu Gula Aren', 1, 0),
('MN015', 'Affogato', 1, 0),
('MN016', 'Hot Cappucino', 1, 0),
('MN017', 'Kopi Tubruk', 1, 0),
('MN018', 'Avocado Coffee', 1, 0),
('MN019', 'Espresso', 1, 0),
-- Non Coffee
('MN020', 'Cakra Matcha', 2, 0),
('MN021', 'Non Coffee - Red Velvet', 2, 0),
('MN022', 'Non Coffee - Dark Chocolate', 2, 0),
('MN023', 'Non Coffee - Green Tea', 2, 0),
('MN024', 'Non Coffee - Taro', 2, 0),
-- Mocktail
('MN025', 'Mocktail - Perfreshlite', 3, 0),
('MN026', 'Mocktail - Pertamix', 3, 0),
('MN027', 'Mocktail - Pertamix Turbo', 3, 0),
('MN028', 'Mocktail - SolarGO', 3, 0),
('MN029', 'Creamy Fruit Mocktail', 3, 0),
-- Minuman Lainnya
('MN030', 'Temu Canda', 4, 0),
('MN031', 'Lemon Tea', 4, 0),
('MN032', 'Peach Tea', 4, 0),
('MN033', 'Lychee Tea', 4, 0),
('MN034', 'Yakult Squash', 4, 0),
-- Rice Bowl
('MN035', 'Rice Bowl Chicken Sambal Matah', 5, 0),
('MN036', 'Rice Bowl Telur Sambal Matah', 5, 0),
('MN037', 'Rice Bowl Blackpepper', 5, 0),
('MN038', 'Rice Bowl Teriyaki', 5, 0),
('MN039', 'Rice Bowl BBQ', 5, 0),
('MN040', 'Rice Bowl Turbo', 5, 0),
('MN041', 'Rice Bowl Bledeg (Ayam)', 5, 0),
('MN042', 'Rice Bowl Bledeg (Telur)', 5, 0),
('MN043', 'Rice Bowl Nugget', 5, 0),
-- Mie & Nasi
('MN044', 'Mie Tek-Tek', 6, 0),
('MN045', 'Nasi Telur Keling', 6, 0),
('MN046', 'Nasi Putih', 6, 0),
-- Snack
('MN047', 'Cilok Bumbu Sambal', 7, 0),
('MN048', 'Pempek', 7, 0),
('MN049', 'Siomay', 7, 0),
('MN050', 'Dimsum', 7, 0),
('MN051', 'Loeyam', 7, 0),
('MN052', 'Cireng Rujak', 7, 0),
('MN053', 'Roti Bakar', 7, 0),
('MN054', 'Singkong Goreng', 7, 0),
('MN055', 'Mix Platter', 7, 0),
('MN056', 'Pisang Cocol', 7, 0),
('MN057', 'Kentang Goreng', 7, 0),
-- Dessert
('MN058', 'Shingthai', 8, 0),
('MN059', 'Snack Ice Cream', 8, 0),
('MN060', 'Roti Bakar Ice Cream', 8, 0),
-- Steak
('MN061', 'Steak Ayam', 9, 0),
('MN062', 'Steak Daging', 9, 0);

-- ============================================
-- TABEL RESEP / BAHAN PER MENU (Resep)
-- ============================================
CREATE TABLE resep (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_menu INT NOT NULL,
    id_bahan INT NOT NULL,
    jumlah DECIMAL(10,2) NOT NULL,
    id_satuan INT NOT NULL,
    catatan VARCHAR(255),
    FOREIGN KEY (id_menu) REFERENCES menu(id),
    FOREIGN KEY (id_bahan) REFERENCES bahan_baku(id),
    FOREIGN KEY (id_satuan) REFERENCES satuan(id)
);

-- Resep: Black Series (Peach/Lychee/Mango) - MN001/002/003
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(1, 9, 30, 1, 'Syrup Peach'),
(1, 3, 50, 1, 'Espresso'),   -- pakai BB003 sebagai espresso
(1, 31, 60, 1, 'Air'),
(1, 15, 0, 2, 'Es batu secukupnya'),
(2, 10, 30, 1, 'Syrup Lychee'),
(2, 3, 50, 1, 'Espresso'),
(2, 31, 60, 1, 'Air'),
(3, 13, 30, 1, 'Syrup Mango'),
(3, 3, 50, 1, 'Espresso'),
(3, 31, 60, 1, 'Air');

-- Resep: Jappanese - MN004
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(4, 2, 20, 2, 'Ground Coffee'),
(4, 31, 100, 1, 'Air panas (bertahap)');

-- Resep: V60 - MN005
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(5, 2, 20, 2, 'Ground Coffee'),
(5, 31, 200, 1, 'Air panas (bertahap 50ml)');

-- Resep: Americano - MN006
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(6, 1, 60, 1, 'Espresso'),
(6, 31, 60, 1, 'Air');

-- Resep: Butterscoth - MN007
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(7, 9, 30, 1, 'Syrup Butterscoth'), -- pakai syrup peach placeholder
(7, 1, 50, 1, 'Espresso'),
(7, 17, 20, 1, 'Fruktosa'),
(7, 31, 60, 1, 'Air'),
(7, 5, 30, 1, 'UHT');

-- Resep: Ice Coffee Latte - MN008
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(8, 1, 25, 1, 'Espresso 1 shot'),
(8, 17, 30, 1, 'Fruktosa'),
(8, 5, 50, 1, 'UHT');

-- Resep: Baileys Coffee - MN009
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(9, 1, 50, 1, 'Espresso'),
(9, 18, 30, 2, 'Powder Baileys'),
(9, 31, 30, 1, 'Air'),
(9, 72, 20, 1, 'Rum'),
(9, 5, 30, 1, 'UHT');

-- Resep: Machiato - MN010
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(10, 1, 30, 1, 'Espresso'),
(10, 19, 30, 2, 'Powder Machiato'),
(10, 31, 35, 1, 'Air'),
(10, 15, 30, 1, 'Gula'),
(10, 5, 60, 1, 'UHT');

-- Resep: Coffee Beer Banteng - MN011
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(11, 1, 60, 1, 'Espresso'),
(11, 15, 30, 1, 'Gula'),
(11, 28, 200, 1, 'Beer Banteng sampai penuh');

-- Resep: Kopi Cakra - MN012
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(12, 1, 60, 1, 'Espresso'),
(12, 73, 30, 2, 'Dark Chocolate'),
(12, 31, 30, 1, 'Air'),
(12, 72, 15, 1, 'Rum'),
(12, 16, 10, 1, 'Brown Sugar'),
(12, 5, 50, 1, 'UHT');

-- Resep: Cappucino Ice - MN013
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(13, 1, 30, 1, 'Espresso'),
(13, 20, 60, 2, 'Powder Cappucino'),
(13, 31, 40, 1, 'Air'),
(13, 15, 15, 1, 'Sugar'),
(13, 6, 15, 1, 'SKM'),
(13, 5, 60, 1, 'UHT');

-- Resep: Kopi Susu Gula Aren - MN014
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(14, 1, 60, 1, 'Espresso'),
(14, 16, 30, 1, 'Brown Sugar'),
(14, 5, 30, 1, 'UHT');

-- Resep: Affogato - MN015
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(15, 1, 45, 1, 'Espresso'),
(15, 7, 4, 9, 'Ice Cream 4 scoop');

-- Resep: Hot Cappucino - MN016
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(16, 20, 30, 2, 'Powder Cappucino'),
(16, 1, 25, 1, 'Espresso'),
(16, 31, 15, 1, 'Air Panas'),
(16, 15, 5, 1, 'Gula'),
(16, 6, 15, 1, 'SKM');

-- Resep: Kopi Tubruk - MN017
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(17, 3, 10, 2, 'Bubuk Kopi'),
(17, 15, 10, 2, 'Gula (2 sdm, opsional)'),
(17, 31, 150, 1, 'Air Panas secukupnya');

-- Resep: Avocado Coffee - MN018
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(18, 4, 1, 10, 'Bubuk Kopi Khusus 1 sachet'),
(18, 26, 1, 10, 'Powder Avocado 1 sachet'),
(18, 31, 150, 1, 'Air Panas 120ml + Air 30ml');

-- Resep: Espresso - MN019
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(19, 1, 16.5, 2, 'Biji Robusta grind 1'),
(19, 31, 100, 1, 'Air di gelas bir + es'),
(19, 80, 1, 5, 'Irisan Lemon');

-- Resep: Cakra Matcha - MN020
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(20, 21, 50, 2, 'Powder Matcha'),
(20, 31, 40, 1, 'Air'),
(20, 16, 30, 1, 'Brown Sugar'),
(20, 5, 60, 1, 'UHT');

-- Resep: Non Coffee (21-24) semua sama formulanya
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(21, 22, 40, 2, 'Powder Red Velvet'),
(21, 15, 10, 1, 'Gula'),
(21, 31, 50, 1, 'Air'),
(21, 6, 10, 1, 'SKM'),
(21, 5, 40, 1, 'UHT'),
(22, 23, 40, 2, 'Powder Dark Chocolate'),
(22, 15, 10, 1, 'Gula'),
(22, 31, 50, 1, 'Air'),
(22, 6, 10, 1, 'SKM'),
(22, 5, 40, 1, 'UHT'),
(23, 24, 40, 2, 'Powder Green Tea'),
(23, 15, 10, 1, 'Gula'),
(23, 31, 50, 1, 'Air'),
(23, 6, 10, 1, 'SKM'),
(23, 5, 40, 1, 'UHT'),
(24, 25, 40, 2, 'Powder Taro'),
(24, 15, 10, 1, 'Gula'),
(24, 31, 50, 1, 'Air'),
(24, 6, 10, 1, 'SKM'),
(24, 5, 40, 1, 'UHT');

-- Resep: Mocktail Series (25-28)
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(25, 11, 45, 1, 'Syrup Green Apple'),
(25, 31, 10, 1, 'Air'),
(25, 14, 2, 8, 'Ice Mint 2 pump'),
(25, 27, 80, 1, 'Soda'),
(25, 81, 5, 2, 'Selasih 1 sdm'),
(26, 12, 45, 1, 'Syrup Blue Curacao'),
(26, 31, 10, 1, 'Air'),
(26, 14, 2, 8, 'Ice Mint 2 pump'),
(26, 27, 80, 1, 'Soda'),
(26, 81, 5, 2, 'Selasih 1 sdm'),
(27, 9, 45, 1, 'Syrup Peach (Pertamix Turbo)'),
(27, 31, 10, 1, 'Air'),
(27, 14, 2, 8, 'Ice Mint 2 pump'),
(27, 27, 80, 1, 'Soda'),
(27, 81, 5, 2, 'Selasih 1 sdm'),
(28, 13, 45, 1, 'Syrup Mango'),
(28, 31, 10, 1, 'Air'),
(28, 14, 2, 8, 'Ice Mint 2 pump'),
(28, 27, 80, 1, 'Soda'),
(28, 81, 5, 2, 'Selasih 1 sdm');

-- Resep: Creamy Fruit Mocktail - MN029
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(29, 9, 30, 1, 'Syrup sesuai pesanan'),
(29, 31, 10, 1, 'Air'),
(29, 14, 2, 8, 'Ice Mint 2 pump'),
(29, 27, 70, 1, 'Soda'),
(29, 7, 1, 9, 'Ice Cream 1 scoop');

-- Resep: Temu Canda - MN030
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(30, 5, 60, 1, 'UHT'),
(30, 15, 30, 1, 'Gula'),
(30, 29, 200, 1, 'Temulawak sampai penuh');

-- Resep: Lemon Tea - MN031
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(31, 9, 40, 2, 'Syrup'),
(31, 15, 20, 1, 'Gula'),
(31, 31, 90, 1, 'Air'),
(31, 32, 5, 2, 'Teh');

-- Resep: Peach Tea - MN032
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(32, 9, 30, 1, 'Syrup Peach'),
(32, 31, 10, 1, 'Air'),
(32, 32, 60, 1, 'Teh');

-- Resep: Lychee Tea - MN033
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(33, 10, 30, 1, 'Syrup Lychee'),
(33, 15, 20, 1, 'Sugar'),
(33, 31, 10, 1, 'Air'),
(33, 32, 60, 1, 'Teh'),
(33, 79, 1, 5, 'Buah Lychee 1 pcs');

-- Resep: Yakult Squash - MN034
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(34, 9, 30, 1, 'Syrup'),
(34, 31, 10, 1, 'Air'),
(34, 14, 2, 8, 'Ice Mint 2 pump'),
(34, 27, 60, 1, 'Soda'),
(34, 30, 50, 1, 'Yakult');

-- Resep: Rice Bowl Chicken Sambal Matah - MN035
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(35, 33, 200, 2, 'Nasi'),
(35, 82, 50, 2, 'Ayam'),
(35, 68, 5, 2, 'Maizena'),
(35, 74, 10, 2, 'Selada'),
(35, 75, 2, 5, 'Irisan Timun');

-- Resep: Rice Bowl Telur Sambal Matah - MN036
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(36, 33, 200, 2, 'Nasi'),
(36, 84, 1, 5, 'Telur'),
(36, 74, 10, 2, 'Selada'),
(36, 75, 2, 5, 'Irisan Timun');

-- Resep: Rice Bowl Blackpepper - MN037
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(37, 33, 200, 2, 'Nasi'),
(37, 82, 50, 2, 'Ayam'),
(37, 63, 15, 1, 'Saus Blackpepper'),
(37, 74, 10, 2, 'Selada'),
(37, 75, 2, 5, 'Irisan Timun');

-- Resep: Rice Bowl Teriyaki - MN038
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(38, 33, 200, 2, 'Nasi'),
(38, 82, 50, 2, 'Ayam'),
(38, 64, 15, 1, 'Saus Teriyaki'),
(38, 74, 10, 2, 'Selada'),
(38, 75, 2, 5, 'Irisan Timun'),
(38, 87, 2, 2, 'Wijen sejumput');

-- Resep: Rice Bowl BBQ - MN039
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(39, 33, 200, 2, 'Nasi'),
(39, 82, 50, 2, 'Ayam'),
(39, 62, 15, 1, 'Saus BBQ'),
(39, 74, 10, 2, 'Selada'),
(39, 75, 2, 5, 'Irisan Timun');

-- Resep: Rice Bowl Turbo - MN040
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(40, 33, 200, 2, 'Nasi'),
(40, 84, 1, 5, 'Telur Ceplok'),
(40, 50, 15, 2, 'Bumbu Merah 1 sdm'),
(40, 51, 5, 2, 'Bumbu Putih'),
(40, 74, 10, 2, 'Selada'),
(40, 75, 2, 5, 'Irisan Timun'),
(40, 78, 5, 2, 'Daun Bawang');

-- Resep: Rice Bowl Bledeg (Ayam/Telur) - MN041/042
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(41, 33, 200, 2, 'Nasi'),
(41, 82, 50, 2, 'Ayam'),
(41, 52, 10, 2, 'Bumbu Bledeg 1/4 sdm'),
(41, 70, 2, 2, 'Daun Jeruk'),
(41, 74, 10, 2, 'Selada'),
(41, 75, 2, 5, 'Irisan Timun'),
(42, 33, 200, 2, 'Nasi'),
(42, 84, 1, 5, 'Telur'),
(42, 52, 10, 2, 'Bumbu Bledeg 1/4 sdm'),
(42, 70, 2, 2, 'Daun Jeruk'),
(42, 74, 10, 2, 'Selada'),
(42, 75, 2, 5, 'Irisan Timun');

-- Resep: Rice Bowl Nugget - MN043
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(43, 33, 200, 2, 'Nasi'),
(43, 41, 5, 5, 'Nugget 5 pcs'),
(43, 61, 20, 1, 'Saus'),
(43, 88, 20, 1, 'Mayonaise'),
(43, 74, 10, 2, 'Selada'),
(43, 75, 2, 5, 'Irisan Timun');

-- Resep: Mie Tek-Tek - MN044
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(44, 34, 100, 2, 'Mie'),
(44, 84, 1, 5, 'Telur'),
(44, 50, 15, 2, 'Bumbu Merah 1 sdm'),
(44, 51, 5, 2, 'Bumbu Putih 1/4 sdm'),
(44, 42, 2, 5, 'Sosis 2 pcs, potong tipis'),
(44, 76, 10, 2, 'Sawi sedikit'),
(44, 60, 15, 1, 'Kecap Manis 1 sdm'),
(44, 61, 15, 1, 'Saus 1 sdm'),
(44, 74, 10, 2, 'Selada'),
(44, 75, 2, 5, 'Irisan Timun');

-- Resep: Nasi Telur Keling - MN045
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(45, 33, 200, 2, 'Nasi'),
(45, 84, 1, 5, 'Telur Ceplok'),
(45, 53, 10, 2, 'Bawang Merah'),
(45, 54, 5, 2, 'Bawang Putih'),
(45, 56, 5, 2, 'Cabe Keriting'),
(45, 60, 15, 1, 'Kecap'),
(45, 74, 10, 2, 'Selada'),
(45, 75, 2, 5, 'Irisan Timun');

-- Resep: Cilok Bumbu Sambal - MN047
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(47, 36, 8, 5, 'Cilok 8 pcs'),
(47, 50, 8, 2, 'Bumbu Merah 1/2 sdm'),
(47, 51, 8, 2, 'Bumbu Putih 1/2 sdm'),
(47, 60, 5, 1, 'Kecap 1/4 sdm'),
(47, 61, 5, 1, 'Saus 1/4 sdm');

-- Resep: Pempek - MN048
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(48, 39, 2, 5, 'Pempek Isi Telur'),
(48, 40, 1, 5, 'Pempek Kosongan'),
(48, 85, 50, 1, 'Minyak'),
(48, 67, 50, 1, 'Kuah Cuko'),
(48, 75, 2, 5, 'Irisan Timun');

-- Resep: Siomay - MN049
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(49, 37, 6, 5, 'Siomay 6 pcs'),
(49, 84, 1, 5, 'Telur 1 pcs'),
(49, 65, 50, 2, 'Bumbu Kacang'),
(49, 60, 10, 1, 'Kecap'),
(49, 61, 10, 1, 'Saus');

-- Resep: Dimsum - MN050
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(50, 38, 4, 5, 'Dimsum 4 pcs'),
(50, 61, 30, 1, 'Saus Dimsum');

-- Resep: Loeyam - MN051
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(51, 46, 5, 5, 'Kulit Lumpia 5 lembar'),
(51, 82, 30, 2, 'Ayam Suir 5 sdm'),
(51, 85, 50, 1, 'Minyak Goreng'),
(51, 61, 30, 1, 'Sambal');

-- Resep: Cireng Rujak - MN052
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(52, 47, 8, 5, 'Cireng 8 pcs'),
(52, 85, 50, 1, 'Minyak'),
(52, 66, 30, 2, 'Bumbu Rujak');

-- Resep: Singkong Goreng - MN054
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(54, 44, 180, 2, 'Singkong'),
(54, 85, 50, 1, 'Minyak'),
(54, 61, 20, 1, 'Saus'),
(54, 88, 20, 1, 'Mayonaise');

-- Resep: Mix Platter - MN055
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(55, 43, 70, 2, 'Kentang'),
(55, 41, 4, 5, 'Nugget 4 pcs'),
(55, 42, 3, 5, 'Sosis 3 pcs'),
(55, 85, 50, 1, 'Minyak'),
(55, 61, 20, 1, 'Saus'),
(55, 88, 20, 1, 'Mayonaise');

-- Resep: Pisang Cocol - MN056
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(56, 45, 3, 5, 'Pisang 3 buah'),
(56, 48, 20, 2, 'Tepung Pisang 2 sdm'),
(56, 49, 10, 2, 'Tepung Terigu 1 sdm'),
(56, 31, 100, 1, 'Air'),
(56, 5, 20, 1, 'Susu sedikit'),
(56, 87, 2, 2, 'Wijen sejumput'),
(56, 85, 50, 1, 'Minyak');

-- Resep: Kentang Goreng - MN057
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(57, 43, 180, 2, 'Kentang'),
(57, 85, 50, 1, 'Minyak'),
(57, 61, 20, 1, 'Saus'),
(57, 88, 20, 1, 'Mayonaise');

-- Resep: Shingthai - MN058
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(58, 44, 200, 2, 'Singkong'),
(58, 89, 45, 1, 'Fla 3 sdm'),
(58, 71, 2, 2, 'Daun Pandan sedikit'),
(58, 57, 2, 7, 'Garam sejumput');

-- Resep: Snack Ice Cream - MN059
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(59, 7, 7, 9, 'Ice Cream 7 scoop'),
(59, 22, 10, 2, 'Powder 2 sdm kecil sesuai pesanan'),
(59, 86, 5, 2, 'Springkle sedikit');

-- Resep: Roti Bakar Ice Cream - MN060
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(60, 35, 2, 5, 'Roti 2 pcs'),
(60, 7, 5, 9, 'Ice Cream 5 scoop'),
(60, 22, 10, 2, 'Powder sesuai pesanan'),
(60, 86, 5, 2, 'Springkle sejumput');

-- Resep: Steak Ayam - MN061
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(61, 82, 100, 2, 'Ayam'),
(61, 62, 45, 1, 'Saus BBQ/Blackpepper 3 sdm'),
(61, 77, 30, 2, 'Sayur Steak'),
(61, 43, 70, 2, 'Kentang Goreng'),
(61, 85, 50, 1, 'Minyak');

-- Resep: Steak Daging - MN062
INSERT INTO resep (id_menu, id_bahan, jumlah, id_satuan, catatan) VALUES
(62, 83, 1, 5, 'Daging 1 potong'),
(62, 62, 45, 1, 'Saus BBQ/Blackpepper 3 sdm'),
(62, 77, 30, 2, 'Sayur Steak'),
(62, 43, 70, 2, 'Kentang Goreng'),
(62, 85, 50, 1, 'Minyak');

-- ============================================
-- TABEL TRANSAKSI STOK
-- ============================================
CREATE TABLE transaksi_stok (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_bahan INT NOT NULL,
    jenis_transaksi ENUM('masuk', 'keluar', 'adjustment') NOT NULL,
    jumlah DECIMAL(10,2) NOT NULL,
    id_satuan INT NOT NULL,
    stok_sebelum DECIMAL(10,2) NOT NULL,
    stok_sesudah DECIMAL(10,2) NOT NULL,
    keterangan VARCHAR(255),
    id_referensi INT DEFAULT NULL COMMENT 'ID transaksi penjualan jika keluar karena penjualan',
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_bahan) REFERENCES bahan_baku(id),
    FOREIGN KEY (id_satuan) REFERENCES satuan(id)
);

-- ============================================
-- TABEL PENJUALAN (untuk kalkulasi HPP)
-- ============================================
CREATE TABLE penjualan (
    id INT PRIMARY KEY AUTO_INCREMENT,
    kode_transaksi VARCHAR(30) NOT NULL UNIQUE,
    id_menu INT NOT NULL,
    jumlah INT NOT NULL,
    harga_satuan DECIMAL(15,2) NOT NULL,
    total_harga DECIMAL(15,2) NOT NULL,
    catatan VARCHAR(255),
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_menu) REFERENCES menu(id)
);

-- ============================================
-- VIEW: STOK MENIPIS (di bawah minimum)
-- ============================================
CREATE OR REPLACE VIEW v_stok_menipis AS
SELECT 
    bb.kode_bahan,
    bb.nama_bahan,
    kb.nama_kategori,
    bb.stok_saat_ini,
    bb.stok_minimum,
    s.singkatan AS satuan,
    (bb.stok_minimum - bb.stok_saat_ini) AS kekurangan
FROM bahan_baku bb
JOIN kategori_bahan kb ON bb.id_kategori = kb.id
JOIN satuan s ON bb.id_satuan = s.id
WHERE bb.stok_saat_ini <= bb.stok_minimum
ORDER BY kekurangan DESC;

-- ============================================
-- VIEW: KEBUTUHAN BAHAN PER MENU
-- ============================================
CREATE OR REPLACE VIEW v_kebutuhan_bahan AS
SELECT 
    m.kode_menu,
    m.nama_menu,
    km.nama_kategori AS kategori_menu,
    bb.kode_bahan,
    bb.nama_bahan,
    r.jumlah,
    s.singkatan AS satuan,
    r.catatan AS keterangan_resep
FROM resep r
JOIN menu m ON r.id_menu = m.id
JOIN bahan_baku bb ON r.id_bahan = bb.id
JOIN kategori_menu km ON m.id_kategori = km.id
JOIN satuan s ON r.id_satuan = s.id
ORDER BY m.kode_menu, bb.nama_bahan;

-- ============================================
-- STORED PROCEDURE: KURANGI STOK SAAT ADA PENJUALAN
-- ============================================
DELIMITER //
CREATE PROCEDURE sp_kurangi_stok_penjualan(
    IN p_id_menu INT,
    IN p_jumlah_porsi INT,
    IN p_kode_transaksi VARCHAR(30),
    IN p_user VARCHAR(50)
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_id_bahan INT;
    DECLARE v_jumlah_resep DECIMAL(10,2);
    DECLARE v_id_satuan INT;
    DECLARE v_stok_sekarang DECIMAL(10,2);
    DECLARE v_kebutuhan DECIMAL(10,2);

    DECLARE cur_resep CURSOR FOR
        SELECT id_bahan, jumlah, id_satuan FROM resep WHERE id_menu = p_id_menu;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur_resep;
    read_loop: LOOP
        FETCH cur_resep INTO v_id_bahan, v_jumlah_resep, v_id_satuan;
        IF done THEN LEAVE read_loop; END IF;

        SET v_kebutuhan = v_jumlah_resep * p_jumlah_porsi;
        SELECT stok_saat_ini INTO v_stok_sekarang FROM bahan_baku WHERE id = v_id_bahan;

        UPDATE bahan_baku 
        SET stok_saat_ini = stok_saat_ini - v_kebutuhan
        WHERE id = v_id_bahan;

        INSERT INTO transaksi_stok 
            (id_bahan, jenis_transaksi, jumlah, id_satuan, stok_sebelum, stok_sesudah, keterangan, created_by)
        VALUES 
            (v_id_bahan, 'keluar', v_kebutuhan, v_id_satuan, v_stok_sekarang, v_stok_sekarang - v_kebutuhan, 
             CONCAT('Penjualan: ', p_kode_transaksi), p_user);
    END LOOP;
    CLOSE cur_resep;
END //
DELIMITER ;

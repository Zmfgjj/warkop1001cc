-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 25, 2026 at 03:59 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `warkop1001cc`
--

-- --------------------------------------------------------

--
-- Table structure for table `detail_pesanan`
--

CREATE TABLE `detail_pesanan` (
  `id` int(11) NOT NULL,
  `pesanan_id` int(11) DEFAULT NULL,
  `menu_id` int(11) DEFAULT NULL,
  `qty` int(11) NOT NULL,
  `harga` int(11) NOT NULL,
  `catatan` text DEFAULT NULL,
  `status` enum('pending','diproses','selesai') DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `detail_pesanan`
--

INSERT INTO `detail_pesanan` (`id`, `pesanan_id`, `menu_id`, `qty`, `harga`, `catatan`, `status`) VALUES
(35, 20, 9, 1, 20000, NULL, 'selesai'),
(36, 20, 11, 1, 23000, NULL, 'selesai'),
(37, 20, 5, 1, 19000, NULL, 'selesai'),
(38, 21, 12, 1, 20000, NULL, 'diproses'),
(39, 21, 9, 1, 20000, NULL, 'diproses'),
(40, 22, 12, 1, 20000, NULL, 'selesai'),
(41, 22, 9, 1, 20000, NULL, 'selesai'),
(42, 23, 12, 1, 20000, NULL, 'selesai'),
(43, 23, 11, 1, 23000, NULL, 'diproses'),
(44, 23, 44, 1, 21000, NULL, 'pending'),
(45, 24, 11, 1, 23000, NULL, 'pending'),
(46, 24, 38, 1, 22000, NULL, 'pending');

-- --------------------------------------------------------

--
-- Table structure for table `kategori`
--

CREATE TABLE `kategori` (
  `id` int(11) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `urutan` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `kategori`
--

INSERT INTO `kategori` (`id`, `nama`, `urutan`) VALUES
(4, 'Snack', 4),
(5, 'MAIN COURSE', 1),
(6, 'INDOMIE SERIES', 2),
(7, 'SIGNATURE', 4),
(8, 'SIGNATURE COFFEE BAR', 5),
(9, 'SIGNATURE MOCKTAIL', 6),
(10, 'MANUAL BREW', 7),
(11, 'PAKET', 8),
(12, 'LAIN-LAIN', 9);

-- --------------------------------------------------------

--
-- Table structure for table `meja`
--

CREATE TABLE `meja` (
  `id` int(11) NOT NULL,
  `nomor` varchar(10) NOT NULL,
  `qr_code` varchar(255) DEFAULT NULL,
  `status` enum('kosong','terisi','reserved') DEFAULT 'kosong'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `meja`
--

INSERT INTO `meja` (`id`, `nomor`, `qr_code`, `status`) VALUES
(13, '001', 'http://localhost:5174/menu/001', 'terisi'),
(14, '002', 'http://localhost:5174/menu/002', 'kosong'),
(15, '003', NULL, 'kosong'),
(16, '004', NULL, 'kosong'),
(17, '005', NULL, 'kosong'),
(18, '006', NULL, 'kosong'),
(19, '007', NULL, 'kosong'),
(20, '008', NULL, 'kosong'),
(21, '009', NULL, 'kosong'),
(22, '010', NULL, 'kosong'),
(23, '011', NULL, 'terisi'),
(24, '012', NULL, 'kosong'),
(25, '013', NULL, 'kosong'),
(26, '014', NULL, 'kosong'),
(27, '015', NULL, 'kosong'),
(28, '016', NULL, 'kosong'),
(29, '017', NULL, 'kosong'),
(30, '018', NULL, 'kosong'),
(31, '019', NULL, 'kosong'),
(32, '020', NULL, 'kosong'),
(33, '021', NULL, 'kosong'),
(34, '022', NULL, 'kosong'),
(35, '023', NULL, 'kosong'),
(36, '024', NULL, 'kosong'),
(37, '025', NULL, 'kosong'),
(38, '026', NULL, 'kosong'),
(39, '027', NULL, 'kosong'),
(40, '028', NULL, 'kosong'),
(41, '029', NULL, 'kosong'),
(42, '030', NULL, 'kosong'),
(43, '031', NULL, 'kosong'),
(44, '032', NULL, 'kosong'),
(45, '033', NULL, 'kosong'),
(46, '034', NULL, 'kosong'),
(47, '035', NULL, 'kosong'),
(48, '036', NULL, 'kosong'),
(49, '037', NULL, 'kosong'),
(50, '038', NULL, 'kosong'),
(51, '039', NULL, 'kosong'),
(52, '040', NULL, 'kosong'),
(53, '041', NULL, 'kosong'),
(54, '042', NULL, 'kosong');

-- --------------------------------------------------------

--
-- Table structure for table `menu`
--

CREATE TABLE `menu` (
  `id` int(11) NOT NULL,
  `kategori_id` int(11) DEFAULT NULL,
  `nama` varchar(100) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `harga` int(11) NOT NULL,
  `hpp` decimal(12,2) NOT NULL DEFAULT 0.00,
  `gambar` varchar(255) DEFAULT NULL,
  `tersedia` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `menu`
--

INSERT INTO `menu` (`id`, `kategori_id`, `nama`, `deskripsi`, `harga`, `hpp`, `gambar`, `tersedia`, `created_at`) VALUES
(4, 5, 'Rice Bowl Nugget', '', 15000, 0.00, '/uploads/Rice bowl nugget  (1)-1778790917128.jpg', 1, '2026-05-14 06:10:27'),
(5, 5, 'Rice Bowl Chicken Bbq', '', 19000, 0.00, '/uploads/Ricebowl Chicken BARBEQUE-1778790764361.jpg', 1, '2026-05-14 06:10:27'),
(6, 5, 'Rice Bowl Chicken Teriyaki', '', 19000, 0.00, '/uploads/Rice Bowl Teriyaki -1778790866733.jpg', 1, '2026-05-14 06:10:27'),
(7, 5, 'Rice Bowl Chicken Blackpapper', '', 19000, 0.00, '/uploads/Ricebowl Chicken blackpepper-1778790776124.jpg', 1, '2026-05-14 06:10:27'),
(8, 5, 'Rice Bowl Chicken Sambal Matah', '', 22000, 0.00, '/uploads/Ricebowl Chicken Sambal matah-1778790826853.jpg', 1, '2026-05-14 06:10:27'),
(9, 5, 'Nasi Ayam Suwir Daun Kemangi', '', 20000, 0.00, '/uploads/Nasi ayam suir kemangi-1778790731619.jpg', 1, '2026-05-14 06:10:27'),
(10, 5, 'Rice Bowl Chiken Sambal Bledeg', '', 22000, 0.00, '/uploads/Ricebowl Chicken Sambal Bledak-1778790906218.jpg', 1, '2026-05-14 06:10:27'),
(11, 5, 'Nasi Daun Jeruk Ayam Sambal Bawang', '', 23000, 0.00, '/uploads/Nasi daun jeruk ayam sambal bawang-1778790749793.jpg', 1, '2026-05-14 06:10:27'),
(12, 5, 'Mie Tek-tek', '', 20000, 0.00, '/uploads/Mie tek tek -1778790718086.jpg', 1, '2026-05-14 06:10:27'),
(13, 5, 'Steak Ayam', NULL, 35000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(14, 5, 'Steak Daging', NULL, 45000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(15, 6, 'Indomie Goreng Original', '', 10000, 0.00, '/uploads/Indomie Goreng -1778790933648.jpg', 1, '2026-05-14 06:10:27'),
(16, 6, 'Indomie Rendang', '', 10000, 0.00, '/uploads/Indomie Rendang-1778790965188.jpg', 1, '2026-05-14 06:10:27'),
(17, 6, 'Indomie Ayam Bawang', '', 10000, 0.00, '/uploads/Indomie Ayam Bawang-1778790945306.jpg', 1, '2026-05-14 06:10:27'),
(18, 6, 'Indomie Soto', '', 10000, 0.00, '/uploads/Indomie Soto-1778790978527.jpg', 1, '2026-05-14 06:10:27'),
(19, 4, 'Cireng Rujak', NULL, 15000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(20, 4, 'Kentang Goreng', NULL, 15000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(21, 4, 'Singkong Goreng', NULL, 15000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(22, 4, 'Loeyam (Lumpia Ayam)', NULL, 20000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(23, 4, 'Dimsum', NULL, 18000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(24, 4, 'Macaroni Schotel', NULL, 18000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(25, 4, 'Spaghetti Panggang', NULL, 18000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(26, 4, 'Snack Ice Cream', '', 18000, 0.00, '/uploads/Snack Ice Cream-1778791027920.jpg', 1, '2026-05-14 06:10:27'),
(27, 4, 'Cilok 1001cc', NULL, 18000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(28, 7, 'Cakra Matcha Latte', NULL, 25000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(29, 7, 'Affogato', NULL, 22000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(30, 7, 'Kopi Susu Gula Aren', NULL, 22000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(31, 8, 'Iced Baileys Coffee', NULL, 23000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(32, 8, 'Iced Black Mango', NULL, 20000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(33, 8, 'Iced Black Lychee', NULL, 20000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(34, 8, 'Iced Black Peach', NULL, 20000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(35, 8, 'Iced Butterscotch', NULL, 23000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(36, 8, 'Iced Machiato', NULL, 22000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(37, 8, 'Avocado Coffee', NULL, 23000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(38, 8, 'Cappucino (hot/ice)', NULL, 22000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(39, 8, 'Coffe Lattee (hot/ice)', NULL, 21000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(40, 8, 'Iced Americano', NULL, 18000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(41, 8, 'Espresso 1 shot', NULL, 17000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(42, 9, 'Perfreshlite Mocktail', NULL, 21000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(43, 9, 'Pertamix Mocktail', NULL, 21000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(44, 9, 'Pertamix Turbo Mocktail', NULL, 21000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(45, 9, 'SolarGO Mocktail', NULL, 21000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(46, 10, 'V60', NULL, 25000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(47, 10, 'Japanese', NULL, 25000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(48, 11, 'Paket Susu Santai 1', 'Susu Hangat + Pisang Goreng', 15000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(49, 12, 'Susu Hangat', NULL, 0, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(50, 12, 'Pisang Goreng', NULL, 0, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(51, 11, 'Paket Susu Santai 2', 'Susu Hangat + Roti Bakar', 15000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(52, 12, 'Roti Bakar', NULL, 0, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(53, 11, 'Paket Susu Santai 3', 'Susu Hangat + Pisang Kukus', 15000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(54, 12, 'Pisang Kukus', NULL, 0, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(55, 11, 'Paket Kopi Santai 1', 'Kopi Tubruk + Pisang Goreng', 20000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(56, 12, 'Kopi Tubruk', NULL, 0, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(57, 11, 'Paket Kopi Santai 2', 'Kopi Tubruk + Roti Bakar', 20000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(58, 11, 'Paket Kopi Santai 3', 'Kopi Tubruk + Pisang Kukus', 20000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(59, 11, 'Paket Santuy A', 'Kentang Goreng + Es Teh Manis', 22000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(60, 12, 'Es Teh Manis', NULL, 0, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(61, 11, 'Paket Santuy B', 'Cireng Rujak + Es Teh Manis', 22000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(62, 11, 'Ramean 1', 'Rice Bowl Chicken Teriyaki + Es Teh Manis', 23000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(63, 11, 'Ramean 2', 'Rice Bowl Chicken Bbq + Es Teh Manis', 23000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(64, 11, 'Ramean 3', 'Rice Bowl Chicken Blackpapper + Es Teh Manis', 23000, 0.00, NULL, 1, '2026-05-14 06:10:27'),
(65, 7, 'Kopi Cakra', NULL, 25000, 0.00, NULL, 1, '2026-05-14 20:29:10'),
(66, 12, 'Es Campur Ceria', '', 18000, 0.00, '/uploads/Es campur ceria-1778791067275.jpg', 1, '2026-05-14 20:37:47');

-- --------------------------------------------------------

--
-- Table structure for table `paket_item`
--

CREATE TABLE `paket_item` (
  `id` int(11) NOT NULL,
  `paket_id` int(11) NOT NULL,
  `menu_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `paket_item`
--

INSERT INTO `paket_item` (`id`, `paket_id`, `menu_id`) VALUES
(23, 48, 49),
(24, 48, 50),
(25, 51, 49),
(26, 51, 52),
(27, 53, 49),
(28, 53, 54),
(29, 55, 56),
(30, 55, 50),
(31, 57, 56),
(32, 57, 52),
(33, 58, 56),
(34, 58, 54),
(35, 59, 20),
(36, 59, 60),
(37, 61, 19),
(38, 61, 60),
(39, 62, 6),
(40, 62, 60),
(41, 63, 5),
(42, 63, 60),
(43, 64, 7),
(44, 64, 60);

-- --------------------------------------------------------

--
-- Table structure for table `pembayaran`
--

CREATE TABLE `pembayaran` (
  `id` int(11) NOT NULL,
  `pesanan_id` int(11) DEFAULT NULL,
  `metode` enum('cash','tunai','qris','transfer') NOT NULL,
  `status` enum('pending','sukses','gagal') DEFAULT 'pending',
  `midtrans_id` varchar(255) DEFAULT NULL,
  `jumlah` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pembayaran`
--

INSERT INTO `pembayaran` (`id`, `pesanan_id`, `metode`, `status`, `midtrans_id`, `jumlah`, `created_at`) VALUES
(16, 20, 'tunai', 'sukses', NULL, 62000, '2026-05-14 12:55:39'),
(17, 21, 'tunai', 'sukses', NULL, 40000, '2026-05-14 20:30:14'),
(18, 22, 'tunai', 'sukses', NULL, 40000, '2026-05-14 20:30:40'),
(19, 23, 'tunai', 'sukses', NULL, 64000, '2026-05-14 21:11:24');

-- --------------------------------------------------------

--
-- Table structure for table `pesanan`
--

CREATE TABLE `pesanan` (
  `id` int(11) NOT NULL,
  `meja_id` int(11) DEFAULT NULL,
  `kasir_id` int(11) DEFAULT NULL,
  `status` enum('pending','diproses','proses','siap','selesai','batal') DEFAULT 'pending',
  `tipe` enum('dine-in','take-away','dine_in','takeaway') DEFAULT 'dine-in',
  `total` int(11) DEFAULT 0,
  `catatan` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_open_bill` tinyint(1) DEFAULT 0,
  `dp_amount` decimal(10,2) DEFAULT 0.00,
  `nama_pelanggan` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pesanan`
--

INSERT INTO `pesanan` (`id`, `meja_id`, `kasir_id`, `status`, `tipe`, `total`, `catatan`, `created_at`, `is_open_bill`, `dp_amount`, `nama_pelanggan`) VALUES
(20, 13, 24, 'selesai', 'dine-in', 62000, NULL, '2026-05-14 12:55:39', 0, 0.00, NULL),
(21, 14, 22, 'selesai', 'dine-in', 40000, NULL, '2026-05-14 20:30:14', 0, 0.00, NULL),
(22, 15, 22, 'selesai', 'dine-in', 40000, NULL, '2026-05-14 20:30:40', 0, 0.00, NULL),
(23, 13, 22, 'diproses', 'dine-in', 64000, NULL, '2026-05-14 21:11:24', 0, 0.00, NULL),
(24, 23, NULL, 'pending', 'dine-in', 45000, '', '2026-05-25 13:50:20', 0, 0.00, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` int(11) NOT NULL,
  `key` varchar(100) NOT NULL,
  `nilai` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`id`, `key`, `nilai`, `created_at`, `updated_at`) VALUES
(1, 'ppn', '11', '2026-04-16 14:42:21', '2026-04-16 15:24:56');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('owner','manager','kasir','dapur') NOT NULL,
  `aktif` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `nama`, `username`, `password`, `role`, `aktif`, `created_at`) VALUES
(22, 'Owner Warkop', 'owner', '$2b$10$WoN2fbYW/Sxb0wC8NOInHeazSAOSYyeecZjBQGZwk/b/4kxxSljve', 'owner', 1, '2026-04-16 09:01:11'),
(23, 'Manager Warkop', 'manager', '$2b$10$WoN2fbYW/Sxb0wC8NOInHeazSAOSYyeecZjBQGZwk/b/4kxxSljve', 'manager', 1, '2026-04-16 09:01:11'),
(24, 'Kasir 1', 'kasir1', '$2b$10$WoN2fbYW/Sxb0wC8NOInHeazSAOSYyeecZjBQGZwk/b/4kxxSljve', 'kasir', 1, '2026-04-16 09:01:11'),
(25, 'Dapur 1', 'dapur', '$2b$10$WoN2fbYW/Sxb0wC8NOInHeazSAOSYyeecZjBQGZwk/b/4kxxSljve', 'dapur', 1, '2026-04-16 09:01:11'),
(26, 'Admin', 'admin', '$2b$10$WoN2fbYW/Sxb0wC8NOInHeazSAOSYyeecZjBQGZwk/b/4kxxSljve', '', 1, '2026-04-16 09:01:11'),
(27, 'jasmine', 'jasmine', '$2b$10$44aklISum4E9XMS.g7tn5.M6Hsl9Q6ovKJyE9T/VOxx2kfDHmj2LC', 'manager', 1, '2026-04-17 10:23:13');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `detail_pesanan`
--
ALTER TABLE `detail_pesanan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pesanan_id` (`pesanan_id`),
  ADD KEY `menu_id` (`menu_id`);

--
-- Indexes for table `kategori`
--
ALTER TABLE `kategori`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `meja`
--
ALTER TABLE `meja`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nomor` (`nomor`);

--
-- Indexes for table `menu`
--
ALTER TABLE `menu`
  ADD PRIMARY KEY (`id`),
  ADD KEY `kategori_id` (`kategori_id`);

--
-- Indexes for table `paket_item`
--
ALTER TABLE `paket_item`
  ADD PRIMARY KEY (`id`),
  ADD KEY `paket_id` (`paket_id`),
  ADD KEY `menu_id` (`menu_id`);

--
-- Indexes for table `pembayaran`
--
ALTER TABLE `pembayaran`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `pesanan_id` (`pesanan_id`);

--
-- Indexes for table `pesanan`
--
ALTER TABLE `pesanan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `meja_id` (`meja_id`),
  ADD KEY `kasir_id` (`kasir_id`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `key` (`key`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `detail_pesanan`
--
ALTER TABLE `detail_pesanan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT for table `kategori`
--
ALTER TABLE `kategori`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `meja`
--
ALTER TABLE `meja`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT for table `menu`
--
ALTER TABLE `menu`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=67;

--
-- AUTO_INCREMENT for table `paket_item`
--
ALTER TABLE `paket_item`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT for table `pembayaran`
--
ALTER TABLE `pembayaran`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `pesanan`
--
ALTER TABLE `pesanan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `detail_pesanan`
--
ALTER TABLE `detail_pesanan`
  ADD CONSTRAINT `detail_pesanan_ibfk_1` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`),
  ADD CONSTRAINT `detail_pesanan_ibfk_2` FOREIGN KEY (`menu_id`) REFERENCES `menu` (`id`);

--
-- Constraints for table `menu`
--
ALTER TABLE `menu`
  ADD CONSTRAINT `menu_ibfk_1` FOREIGN KEY (`kategori_id`) REFERENCES `kategori` (`id`);

--
-- Constraints for table `paket_item`
--
ALTER TABLE `paket_item`
  ADD CONSTRAINT `paket_item_ibfk_1` FOREIGN KEY (`paket_id`) REFERENCES `menu` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `paket_item_ibfk_2` FOREIGN KEY (`menu_id`) REFERENCES `menu` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `pembayaran`
--
ALTER TABLE `pembayaran`
  ADD CONSTRAINT `pembayaran_ibfk_1` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`);

--
-- Constraints for table `pesanan`
--
ALTER TABLE `pesanan`
  ADD CONSTRAINT `pesanan_ibfk_1` FOREIGN KEY (`meja_id`) REFERENCES `meja` (`id`),
  ADD CONSTRAINT `pesanan_ibfk_2` FOREIGN KEY (`kasir_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

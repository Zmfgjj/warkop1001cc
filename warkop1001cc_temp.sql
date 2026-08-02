뿯붿-- MySQL dump 10.13  Distrib 8.4.5, for Win64 (x86_64)
--
-- Host: localhost    Database: warkop1001cc
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `detail_pesanan`
--

DROP TABLE IF EXISTS `detail_pesanan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detail_pesanan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pesanan_id` int(11) DEFAULT NULL,
  `menu_id` int(11) DEFAULT NULL,
  `qty` int(11) NOT NULL,
  `harga` int(11) NOT NULL,
  `catatan` text DEFAULT NULL,
  `status` enum('pending','diproses','selesai') DEFAULT 'pending',
  PRIMARY KEY (`id`),
  KEY `pesanan_id` (`pesanan_id`),
  KEY `menu_id` (`menu_id`),
  CONSTRAINT `detail_pesanan_ibfk_1` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`),
  CONSTRAINT `detail_pesanan_ibfk_2` FOREIGN KEY (`menu_id`) REFERENCES `menu` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=114 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detail_pesanan`
--

LOCK TABLES `detail_pesanan` WRITE;
/*!40000 ALTER TABLE `detail_pesanan` DISABLE KEYS */;
INSERT INTO `detail_pesanan` VALUES (35,20,9,1,20000,NULL,'selesai'),(36,20,11,1,23000,NULL,'selesai'),(37,20,5,1,19000,NULL,'selesai'),(38,21,12,1,20000,NULL,'diproses'),(39,21,9,1,20000,NULL,'diproses'),(40,22,12,1,20000,NULL,'selesai'),(41,22,9,1,20000,NULL,'selesai'),(42,23,12,1,20000,NULL,'selesai'),(43,23,11,1,23000,NULL,'diproses'),(44,23,44,1,21000,NULL,'diproses'),(45,24,11,1,23000,NULL,'diproses'),(46,24,38,1,22000,NULL,'diproses'),(47,25,50,1,0,NULL,'diproses'),(48,25,56,1,0,NULL,'diproses'),(49,25,66,1,18000,NULL,'diproses'),(50,26,7,1,19000,NULL,'selesai'),(51,26,8,1,22000,NULL,'selesai'),(52,27,12,2,20000,NULL,'diproses'),(53,28,9,1,20000,NULL,'selesai'),(54,28,12,1,20000,NULL,'selesai'),(55,29,12,1,20000,NULL,'selesai'),(56,29,42,1,21000,NULL,'selesai'),(57,30,12,1,20000,NULL,'selesai'),(58,30,9,1,20000,NULL,'selesai'),(59,31,12,1,20000,NULL,'selesai'),(60,31,9,1,20000,NULL,'selesai'),(61,32,10,1,22000,NULL,'selesai'),(62,32,6,1,19000,NULL,'selesai'),(63,33,8,1,22000,NULL,'selesai'),(64,33,7,1,19000,NULL,'selesai'),(65,34,8,1,22000,NULL,'selesai'),(66,34,7,1,19000,NULL,'selesai'),(67,35,9,1,20000,NULL,'selesai'),(68,35,12,1,20000,NULL,'selesai'),(69,36,9,1,20000,NULL,'selesai'),(70,36,11,1,23000,NULL,'selesai'),(71,37,9,1,20000,NULL,'selesai'),(72,37,12,1,20000,NULL,'selesai'),(73,38,8,1,22000,NULL,'selesai'),(74,38,6,1,19000,NULL,'selesai'),(75,39,5,1,19000,NULL,'selesai'),(76,39,7,1,19000,NULL,'selesai'),(77,40,7,1,19000,NULL,'pending'),(78,40,8,1,22000,NULL,'pending'),(79,41,7,1,19000,NULL,'pending'),(80,41,5,1,19000,NULL,'pending'),(81,42,7,1,19000,NULL,'selesai'),(82,42,5,1,19000,NULL,'selesai'),(83,43,7,1,19000,NULL,'selesai'),(84,43,5,1,19000,NULL,'selesai'),(85,44,12,1,20000,NULL,'pending'),(86,44,9,1,20000,NULL,'pending'),(87,45,7,1,19000,NULL,'pending'),(88,45,5,1,19000,NULL,'pending'),(89,46,12,1,20000,NULL,'selesai'),(90,46,38,1,22000,NULL,'selesai'),(91,47,12,1,20000,NULL,'selesai'),(92,47,9,1,20000,NULL,'selesai'),(93,47,45,1,21000,NULL,'selesai'),(94,48,12,1,20000,NULL,'selesai'),(95,48,9,1,20000,NULL,'selesai'),(96,49,12,1,20000,NULL,'selesai'),(97,49,11,1,23000,NULL,'selesai'),(98,49,6,1,19000,NULL,'selesai'),(99,49,41,1,17000,NULL,'selesai'),(100,50,33,1,20000,NULL,'selesai'),(101,50,19,1,15000,NULL,'selesai'),(102,51,8,1,22000,NULL,'pending'),(103,51,7,1,19000,NULL,'pending'),(104,51,5,1,21000,'[Varian: Level 2 (Pedas)]','pending'),(105,52,12,1,20000,NULL,'selesai'),(106,52,9,1,20000,NULL,'selesai'),(107,52,38,1,22000,NULL,'selesai'),(108,53,12,1,20000,NULL,'selesai'),(109,53,9,1,20000,NULL,'selesai'),(110,54,12,1,20000,NULL,'selesai'),(111,54,9,1,20000,NULL,'selesai'),(112,55,5,1,19000,NULL,'selesai'),(113,55,7,1,19000,NULL,'selesai');
/*!40000 ALTER TABLE `detail_pesanan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kategori`
--

DROP TABLE IF EXISTS `kategori`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kategori` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama` varchar(100) NOT NULL,
  `urutan` int(11) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kategori`
--

LOCK TABLES `kategori` WRITE;
/*!40000 ALTER TABLE `kategori` DISABLE KEYS */;
INSERT INTO `kategori` VALUES (4,'Snack',4),(5,'MAIN COURSE',1),(6,'INDOMIE SERIES',2),(7,'SIGNATURE',4),(8,'SIGNATURE COFFEE BAR',5),(9,'SIGNATURE MOCKTAIL',6),(10,'MANUAL BREW',7),(11,'PAKET',8),(12,'LAIN-LAIN',9);
/*!40000 ALTER TABLE `kategori` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meja`
--

DROP TABLE IF EXISTS `meja`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meja` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nomor` varchar(10) NOT NULL,
  `qr_code` varchar(255) DEFAULT NULL,
  `status` enum('kosong','terisi','reserved') DEFAULT 'kosong',
  PRIMARY KEY (`id`),
  UNIQUE KEY `nomor` (`nomor`)
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meja`
--

LOCK TABLES `meja` WRITE;
/*!40000 ALTER TABLE `meja` DISABLE KEYS */;
INSERT INTO `meja` VALUES (13,'001','http://localhost:5173/menu/001','terisi'),(14,'002','http://localhost:5174/menu/002','terisi'),(15,'003',NULL,'terisi'),(16,'004',NULL,'kosong'),(17,'005',NULL,'kosong'),(18,'006',NULL,'kosong'),(19,'007',NULL,'kosong'),(20,'008',NULL,'kosong'),(21,'009',NULL,'kosong'),(22,'010',NULL,'kosong'),(23,'011',NULL,'terisi'),(24,'012',NULL,'kosong'),(25,'013',NULL,'kosong'),(26,'014',NULL,'kosong'),(27,'015',NULL,'kosong'),(28,'016',NULL,'kosong'),(29,'017',NULL,'kosong'),(30,'018',NULL,'kosong'),(31,'019',NULL,'kosong'),(32,'020',NULL,'kosong'),(33,'021',NULL,'kosong'),(34,'022',NULL,'kosong'),(35,'023',NULL,'kosong'),(36,'024',NULL,'kosong'),(37,'025',NULL,'kosong'),(38,'026',NULL,'kosong'),(39,'027',NULL,'kosong'),(40,'028',NULL,'kosong'),(41,'029',NULL,'kosong'),(42,'030',NULL,'kosong'),(43,'031',NULL,'kosong'),(44,'032',NULL,'kosong'),(45,'033',NULL,'kosong'),(46,'034',NULL,'kosong'),(47,'035',NULL,'kosong'),(48,'036',NULL,'kosong'),(49,'037',NULL,'kosong'),(50,'038',NULL,'kosong'),(51,'039',NULL,'kosong'),(52,'040',NULL,'kosong'),(53,'041',NULL,'kosong'),(54,'042',NULL,'kosong');
/*!40000 ALTER TABLE `meja` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu`
--

DROP TABLE IF EXISTS `menu`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `kategori_id` int(11) DEFAULT NULL,
  `nama` varchar(100) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `harga` int(11) NOT NULL,
  `harga_diskon` int(11) DEFAULT 0,
  `hpp` decimal(12,2) NOT NULL DEFAULT 0.00,
  `gambar` varchar(255) DEFAULT NULL,
  `tersedia` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `pilihan_rasa` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `kategori_id` (`kategori_id`),
  CONSTRAINT `menu_ibfk_1` FOREIGN KEY (`kategori_id`) REFERENCES `kategori` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=67 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu`
--

LOCK TABLES `menu` WRITE;
/*!40000 ALTER TABLE `menu` DISABLE KEYS */;
INSERT INTO `menu` VALUES (4,5,'Rice Bowl Nugget','',15000,0,12750.00,'/uploads/Rice bowl nugget  (1)-1778790917128.jpg',1,'2026-05-14 06:10:27',NULL),(5,5,'Rice Bowl Chicken Bbq','',19000,0,16150.00,'/uploads/Ricebowl Chicken BARBEQUE-1778790764361.jpg',1,'2026-05-14 06:10:27',NULL),(6,5,'Rice Bowl Chicken Teriyaki','',19000,0,16150.00,'/uploads/Rice Bowl Teriyaki -1778790866733.jpg',1,'2026-05-14 06:10:27',NULL),(7,5,'Rice Bowl Chicken Blackpapper','',19000,0,16150.00,'/uploads/Ricebowl Chicken blackpepper-1778790776124.jpg',1,'2026-05-14 06:10:27',NULL),(8,5,'Rice Bowl Chicken Sambal Matah','',22000,0,18700.00,'/uploads/Ricebowl Chicken Sambal matah-1778790826853.jpg',1,'2026-05-14 06:10:27',NULL),(9,5,'Nasi Ayam Suwir Daun Kemangi','',20000,0,17000.00,'/uploads/Nasi ayam suir kemangi-1778790731619.jpg',1,'2026-05-14 06:10:27',NULL),(10,5,'Rice Bowl Chiken Sambal Bledeg','',22000,0,18700.00,'/uploads/Ricebowl Chicken Sambal Bledak-1778790906218.jpg',1,'2026-05-14 06:10:27',NULL),(11,5,'Nasi Daun Jeruk Ayam Sambal Bawang','',23000,0,19550.00,'/uploads/Nasi daun jeruk ayam sambal bawang-1778790749793.jpg',1,'2026-05-14 06:10:27',NULL),(12,5,'Mie Tek-tek','',20000,0,17000.00,'/uploads/Mie tek tek -1778790718086.jpg',1,'2026-05-14 06:10:27',NULL),(13,5,'Steak Ayam',NULL,35000,0,29750.00,NULL,1,'2026-05-14 06:10:27',NULL),(14,5,'Steak Daging',NULL,45000,0,38250.00,NULL,1,'2026-05-14 06:10:27',NULL),(15,6,'Indomie Goreng Original','',10000,0,8500.00,'/uploads/Indomie Goreng -1778790933648.jpg',1,'2026-05-14 06:10:27',NULL),(16,6,'Indomie Rendang','',10000,0,8500.00,'/uploads/Indomie Rendang-1778790965188.jpg',1,'2026-05-14 06:10:27',NULL),(17,6,'Indomie Ayam Bawang','',10000,0,8500.00,'/uploads/Indomie Ayam Bawang-1778790945306.jpg',1,'2026-05-14 06:10:27',NULL),(18,6,'Indomie Soto','',10000,0,8500.00,'/uploads/Indomie Soto-1778790978527.jpg',1,'2026-05-14 06:10:27',NULL),(19,4,'Cireng Rujak',NULL,15000,0,12750.00,NULL,1,'2026-05-14 06:10:27',NULL),(20,4,'Kentang Goreng',NULL,15000,0,12750.00,NULL,1,'2026-05-14 06:10:27',NULL),(21,4,'Singkong Goreng',NULL,15000,0,12750.00,NULL,1,'2026-05-14 06:10:27',NULL),(22,4,'Loeyam (Lumpia Ayam)',NULL,20000,0,17000.00,NULL,1,'2026-05-14 06:10:27',NULL),(23,4,'Dimsum',NULL,18000,0,15300.00,NULL,1,'2026-05-14 06:10:27',NULL),(24,4,'Macaroni Schotel',NULL,18000,0,15300.00,NULL,1,'2026-05-14 06:10:27',NULL),(25,4,'Spaghetti Panggang',NULL,18000,0,15300.00,NULL,1,'2026-05-14 06:10:27',NULL),(26,4,'Snack Ice Cream','',18000,0,15300.00,'/uploads/Snack Ice Cream-1778791027920.jpg',1,'2026-05-14 06:10:27',NULL),(27,4,'Cilok 1001cc',NULL,18000,0,15300.00,NULL,1,'2026-05-14 06:10:27',NULL),(28,7,'Cakra Matcha Latte',NULL,25000,0,21250.00,NULL,1,'2026-05-14 06:10:27',NULL),(29,7,'Affogato',NULL,22000,0,18700.00,NULL,1,'2026-05-14 06:10:27',NULL),(30,7,'Kopi Susu Gula Aren',NULL,22000,0,18700.00,NULL,1,'2026-05-14 06:10:27',NULL),(31,8,'Iced Baileys Coffee',NULL,23000,0,19550.00,NULL,1,'2026-05-14 06:10:27',NULL),(32,8,'Iced Black Mango',NULL,20000,0,17000.00,NULL,1,'2026-05-14 06:10:27',NULL),(33,8,'Iced Black Lychee',NULL,20000,0,17000.00,NULL,1,'2026-05-14 06:10:27',NULL),(34,8,'Iced Black Peach',NULL,20000,0,17000.00,NULL,1,'2026-05-14 06:10:27',NULL),(35,8,'Iced Butterscotch',NULL,23000,0,19550.00,NULL,1,'2026-05-14 06:10:27',NULL),(36,8,'Iced Machiato',NULL,22000,0,18700.00,NULL,1,'2026-05-14 06:10:27',NULL),(37,8,'Avocado Coffee',NULL,23000,0,19550.00,NULL,1,'2026-05-14 06:10:27',NULL),(38,8,'Cappucino (hot/ice)',NULL,22000,0,18700.00,NULL,1,'2026-05-14 06:10:27',NULL),(39,8,'Coffe Lattee (hot/ice)',NULL,21000,0,17850.00,NULL,1,'2026-05-14 06:10:27',NULL),(40,8,'Iced Americano',NULL,18000,0,15300.00,NULL,1,'2026-05-14 06:10:27',NULL),(41,8,'Espresso 1 shot',NULL,17000,0,14450.00,NULL,1,'2026-05-14 06:10:27',NULL),(42,9,'Perfreshlite Mocktail',NULL,21000,0,17850.00,NULL,1,'2026-05-14 06:10:27',NULL),(43,9,'Pertamix Mocktail',NULL,21000,0,17850.00,NULL,1,'2026-05-14 06:10:27',NULL),(44,9,'Pertamix Turbo Mocktail',NULL,21000,0,17850.00,NULL,1,'2026-05-14 06:10:27',NULL),(45,9,'SolarGO Mocktail',NULL,21000,0,17850.00,NULL,1,'2026-05-14 06:10:27',NULL),(46,10,'V60',NULL,25000,0,21250.00,NULL,1,'2026-05-14 06:10:27',NULL),(47,10,'Japanese',NULL,25000,0,21250.00,NULL,1,'2026-05-14 06:10:27',NULL),(48,11,'Paket Susu Santai 1','Susu Hangat + Pisang Goreng',15000,0,12750.00,NULL,1,'2026-05-14 06:10:27',NULL),(49,12,'Susu Hangat',NULL,0,0,0.00,NULL,1,'2026-05-14 06:10:27',NULL),(50,12,'Pisang Goreng',NULL,0,0,0.00,NULL,1,'2026-05-14 06:10:27',NULL),(51,11,'Paket Susu Santai 2','Susu Hangat + Roti Bakar',15000,0,12750.00,NULL,1,'2026-05-14 06:10:27',NULL),(52,12,'Roti Bakar','',10000,0,8500.00,NULL,1,'2026-05-14 06:10:27','vanilla,cokelat,original,keju'),(53,11,'Paket Susu Santai 3','Susu Hangat + Pisang Kukus',15000,0,12750.00,NULL,1,'2026-05-14 06:10:27',NULL),(54,12,'Pisang Kukus',NULL,0,0,0.00,NULL,1,'2026-05-14 06:10:27',NULL),(55,11,'Paket Kopi Santai 1','Kopi Tubruk + Pisang Goreng',20000,0,17000.00,NULL,1,'2026-05-14 06:10:27',NULL),(56,12,'Kopi Tubruk',NULL,0,0,0.00,NULL,1,'2026-05-14 06:10:27',NULL),(57,11,'Paket Kopi Santai 2','Kopi Tubruk + Roti Bakar',20000,0,17000.00,NULL,1,'2026-05-14 06:10:27',NULL),(58,11,'Paket Kopi Santai 3','Kopi Tubruk + Pisang Kukus',20000,0,17000.00,NULL,1,'2026-05-14 06:10:27',NULL),(59,11,'Paket Santuy A','Kentang Goreng + Es Teh Manis',22000,0,18700.00,NULL,1,'2026-05-14 06:10:27',NULL),(60,12,'Es Teh Manis',NULL,0,0,0.00,NULL,1,'2026-05-14 06:10:27',NULL),(61,11,'Paket Santuy B','Cireng Rujak + Es Teh Manis',22000,0,18700.00,NULL,1,'2026-05-14 06:10:27',NULL),(62,11,'Ramean 1','Rice Bowl Chicken Teriyaki + Es Teh Manis',23000,0,19550.00,NULL,1,'2026-05-14 06:10:27',NULL),(63,11,'Ramean 2','Rice Bowl Chicken Bbq + Es Teh Manis',23000,0,19550.00,NULL,1,'2026-05-14 06:10:27',NULL),(64,11,'Ramean 3','Rice Bowl Chicken Blackpapper + Es Teh Manis',23000,0,19550.00,NULL,1,'2026-05-14 06:10:27',NULL),(65,7,'Kopi Cakra',NULL,25000,0,21250.00,NULL,1,'2026-05-14 20:29:10',NULL),(66,12,'Es Campur Ceria','',18000,0,15300.00,'/uploads/Es campur ceria-1778791067275.jpg',1,'2026-05-14 20:37:47',NULL);
/*!40000 ALTER TABLE `menu` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_varian`
--

DROP TABLE IF EXISTS `menu_varian`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_varian` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `menu_id` int(11) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `harga_tambahan` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `menu_id` (`menu_id`),
  CONSTRAINT `menu_varian_ibfk_1` FOREIGN KEY (`menu_id`) REFERENCES `menu` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_varian`
--

LOCK TABLES `menu_varian` WRITE;
/*!40000 ALTER TABLE `menu_varian` DISABLE KEYS */;
/*!40000 ALTER TABLE `menu_varian` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `paket_item`
--

DROP TABLE IF EXISTS `paket_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `paket_item` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `paket_id` int(11) NOT NULL,
  `menu_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `paket_id` (`paket_id`),
  KEY `menu_id` (`menu_id`),
  CONSTRAINT `paket_item_ibfk_1` FOREIGN KEY (`paket_id`) REFERENCES `menu` (`id`) ON DELETE CASCADE,
  CONSTRAINT `paket_item_ibfk_2` FOREIGN KEY (`menu_id`) REFERENCES `menu` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paket_item`
--

LOCK TABLES `paket_item` WRITE;
/*!40000 ALTER TABLE `paket_item` DISABLE KEYS */;
INSERT INTO `paket_item` VALUES (23,48,49),(24,48,50),(25,51,49),(26,51,52),(27,53,49),(28,53,54),(29,55,56),(30,55,50),(31,57,56),(32,57,52),(33,58,56),(34,58,54),(35,59,20),(36,59,60),(37,61,19),(38,61,60),(39,62,6),(40,62,60),(41,63,5),(42,63,60),(43,64,7),(44,64,60);
/*!40000 ALTER TABLE `paket_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pembayaran`
--

DROP TABLE IF EXISTS `pembayaran`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pembayaran` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pesanan_id` int(11) DEFAULT NULL,
  `metode` enum('cash','tunai','qris','transfer') NOT NULL,
  `status` enum('pending','sukses','gagal') DEFAULT 'pending',
  `midtrans_id` varchar(255) DEFAULT NULL,
  `jumlah` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `pesanan_id` (`pesanan_id`),
  CONSTRAINT `pembayaran_ibfk_1` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pembayaran`
--

LOCK TABLES `pembayaran` WRITE;
/*!40000 ALTER TABLE `pembayaran` DISABLE KEYS */;
INSERT INTO `pembayaran` VALUES (16,20,'tunai','sukses',NULL,62000,'2026-05-14 12:55:39'),(17,21,'tunai','sukses',NULL,40000,'2026-05-14 20:30:14'),(18,22,'tunai','sukses',NULL,40000,'2026-05-14 20:30:40'),(19,23,'tunai','sukses',NULL,64000,'2026-05-14 21:11:24'),(20,26,'qris','pending',NULL,41000,'2026-06-03 01:05:10'),(21,27,'qris','pending',NULL,40000,'2026-06-03 01:07:26'),(22,29,'qris','pending',NULL,41000,'2026-06-03 09:35:57'),(23,30,'qris','pending',NULL,40000,'2026-06-03 09:44:00'),(24,32,'qris','pending',NULL,41000,'2026-06-03 10:58:46'),(25,33,'qris','sukses',NULL,41000,'2026-06-08 13:47:17'),(26,31,'qris','sukses',NULL,40000,'2026-06-08 13:47:36'),(27,36,'qris','sukses',NULL,43000,'2026-06-08 13:51:30'),(28,37,'qris','sukses',NULL,40000,'2026-06-16 08:57:40'),(29,38,'qris','pending',NULL,41000,'2026-06-16 08:57:56'),(30,39,'qris','sukses',NULL,38000,'2026-06-17 03:17:22'),(31,42,'qris','sukses',NULL,38000,'2026-06-17 03:24:38'),(32,43,'qris','sukses',NULL,38000,'2026-06-17 03:26:07'),(33,46,'qris','sukses',NULL,42000,'2026-06-17 10:45:58'),(34,47,'qris','sukses',NULL,61000,'2026-06-17 10:58:50'),(35,48,'qris','sukses',NULL,40000,'2026-06-17 11:03:44'),(36,49,'qris','sukses',NULL,79000,'2026-06-18 09:49:15'),(37,50,'qris','sukses',NULL,35000,'2026-06-18 09:49:41'),(38,52,'qris','sukses',NULL,62000,'2026-06-18 11:10:22'),(39,53,'qris','sukses',NULL,40000,'2026-06-18 11:11:12'),(40,54,'qris','sukses',NULL,40000,'2026-06-18 11:18:27'),(41,55,'qris','sukses',NULL,38000,'2026-06-19 03:40:20');
/*!40000 ALTER TABLE `pembayaran` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pesanan`
--

DROP TABLE IF EXISTS `pesanan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pesanan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `meja_id` int(11) DEFAULT NULL,
  `kasir_id` int(11) DEFAULT NULL,
  `status` enum('pending','diproses','proses','siap','selesai','batal') DEFAULT 'pending',
  `payment_status` enum('unpaid','pending_verification','paid') DEFAULT 'unpaid',
  `tipe` enum('dine-in','take-away','dine_in','takeaway') DEFAULT 'dine-in',
  `total` int(11) DEFAULT 0,
  `catatan` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_open_bill` tinyint(1) DEFAULT 0,
  `dp_amount` decimal(10,2) DEFAULT 0.00,
  `nama_pelanggan` varchar(255) DEFAULT NULL,
  `no_telepon` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `bukti_pembayaran` varchar(255) DEFAULT NULL,
  `nomor_antrean` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `meja_id` (`meja_id`),
  KEY `kasir_id` (`kasir_id`),
  CONSTRAINT `pesanan_ibfk_1` FOREIGN KEY (`meja_id`) REFERENCES `meja` (`id`),
  CONSTRAINT `pesanan_ibfk_2` FOREIGN KEY (`kasir_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pesanan`
--

LOCK TABLES `pesanan` WRITE;
/*!40000 ALTER TABLE `pesanan` DISABLE KEYS */;
INSERT INTO `pesanan` VALUES (20,13,24,'selesai','unpaid','dine-in',62000,NULL,'2026-05-14 12:55:39',0,0.00,NULL,NULL,NULL,NULL,NULL),(21,14,22,'selesai','unpaid','dine-in',40000,NULL,'2026-05-14 20:30:14',0,0.00,NULL,NULL,NULL,NULL,NULL),(22,15,22,'selesai','unpaid','dine-in',40000,NULL,'2026-05-14 20:30:40',0,0.00,NULL,NULL,NULL,NULL,NULL),(23,13,22,'selesai','unpaid','dine-in',64000,NULL,'2026-05-14 21:11:24',0,0.00,NULL,NULL,NULL,NULL,NULL),(24,23,NULL,'selesai','unpaid','dine-in',45000,'','2026-05-25 13:50:20',0,0.00,NULL,NULL,NULL,NULL,NULL),(25,23,NULL,'selesai','unpaid','dine-in',18000,'','2026-06-02 05:42:25',0,0.00,NULL,NULL,NULL,NULL,NULL),(26,13,22,'selesai','unpaid','dine-in',41000,NULL,'2026-06-03 01:05:09',0,0.00,NULL,NULL,NULL,NULL,NULL),(27,13,22,'selesai','unpaid','dine-in',40000,NULL,'2026-06-03 01:07:25',0,0.00,NULL,NULL,NULL,NULL,NULL),(28,23,NULL,'selesai','unpaid','dine-in',40000,'','2026-06-03 09:31:08',0,0.00,NULL,NULL,NULL,NULL,NULL),(29,13,24,'selesai','unpaid','dine-in',41000,NULL,'2026-06-03 09:35:57',0,0.00,NULL,NULL,NULL,NULL,NULL),(30,14,22,'selesai','unpaid','dine-in',40000,NULL,'2026-06-03 09:44:00',0,0.00,NULL,NULL,NULL,NULL,NULL),(31,23,NULL,'selesai','paid','dine-in',40000,'','2026-06-03 09:49:31',0,0.00,NULL,NULL,NULL,NULL,NULL),(32,13,22,'selesai','paid','dine-in',41000,NULL,'2026-06-03 10:58:45',0,0.00,NULL,NULL,NULL,NULL,NULL),(33,23,NULL,'selesai','paid','dine-in',41000,'[Jeremy Sinuraya]','2026-06-08 13:26:35',0,0.00,'Jeremy Sinuraya','085179915926','jeremycarhvalos@gmail.com',NULL,NULL),(34,23,NULL,'selesai','unpaid','dine-in',41000,'[Jeremy Sinuraya]','2026-06-08 13:41:45',0,0.00,'Jeremy Sinuraya','085179915926','jeremycarhvalos@gmail.com',NULL,NULL),(35,23,NULL,'selesai','pending_verification','dine-in',40000,'[Jeremy Sinuraya]','2026-06-08 13:42:11',0,0.00,'Jeremy Sinuraya','085179915926','jeremycarhvalos@gmail.com','/uploads/9ad6e672-cb3b-4918-9f30-3976579ac6df.jpeg',NULL),(36,23,NULL,'selesai','paid','dine-in',43000,'[Jeremy Sinuraya]','2026-06-08 13:51:10',0,0.00,'Jeremy Sinuraya','085179915926','jeremycarhvalos@gmail.com','/uploads/edc9b0bb-56fb-4f63-8806-b5eda1d917f9.jpeg',NULL),(37,23,NULL,'selesai','paid','dine-in',40000,'[Jeremy Sinuraya]','2026-06-09 01:43:14',0,0.00,'Jeremy Sinuraya','085179915926','jeremycarhvalos@gmail.com',NULL,NULL),(38,15,22,'selesai','paid','dine-in',41000,NULL,'2026-06-16 08:57:56',0,0.00,NULL,NULL,NULL,NULL,NULL),(39,23,NULL,'selesai','paid','dine-in',38000,'[Jeremy Sinuraya]','2026-06-17 03:13:21',0,0.00,'Jeremy Sinuraya','085179915926','jeremycarhvalos@gmail.com',NULL,NULL),(40,23,NULL,'batal','unpaid','dine-in',41000,'[Jeremy Sinuraya]','2026-06-17 03:17:45',0,0.00,'Jeremy Sinuraya','085179915926','jeremycarhvalos@gmail.com',NULL,NULL),(41,23,NULL,'batal','unpaid','dine-in',38000,'[Jeremy Sinuraya]','2026-06-17 03:19:37',0,0.00,'Jeremy Sinuraya','085179915926','jeremycarhvalos@gmail.com',NULL,NULL),(42,23,NULL,'selesai','paid','dine-in',38000,'[Jeremy Sinuraya]','2026-06-17 03:23:59',0,0.00,'Jeremy Sinuraya','085179915926','jeremycarhvalos@gmail.com',NULL,NULL),(43,23,NULL,'selesai','paid','dine-in',38000,'[Jeremy Sinuraya]','2026-06-17 03:25:05',0,0.00,'Jeremy Sinuraya','085179915926','jeremycarhvalos@gmail.com','/uploads/e41ecb52-2025-4202-978d-949f2920b7a5.jpeg',NULL),(44,23,NULL,'batal','unpaid','dine-in',40000,'[Jeremy Sinuraya]','2026-06-17 03:27:30',0,0.00,'Jeremy Sinuraya','085179915926','jeremycarhvalos@gmail.com',NULL,NULL),(45,23,NULL,'batal','unpaid','dine-in',38000,'[Jeremy Sinuraya]','2026-06-17 03:28:20',0,0.00,'Jeremy Sinuraya','085179915926','jeremycarhvalos@gmail.com',NULL,NULL),(46,23,NULL,'selesai','paid','dine-in',42000,'[Jeremy Sinuraya]','2026-06-17 10:45:40',0,0.00,'Jeremy Sinuraya','085179915926','jeremycarhvalos@gmail.com','/uploads/a4dce31c-743e-4dfc-bda3-4a0888eb0c4e.jpeg',NULL),(47,23,NULL,'selesai','paid','dine-in',61000,'[Jeremy Sinuraya]','2026-06-17 10:57:57',0,0.00,'Jeremy Sinuraya','085179915926','jeremycarhvalos@gmail.com','/uploads/6f497f65-9e53-4eb0-9c4a-7f8f9c9e0101.jpeg',NULL),(48,NULL,22,'selesai','paid','dine-in',40000,NULL,'2026-06-17 11:03:44',0,0.00,NULL,NULL,NULL,NULL,31),(49,NULL,22,'selesai','paid','dine-in',79000,NULL,'2026-06-18 09:49:15',0,0.00,NULL,NULL,NULL,NULL,31),(50,NULL,22,'selesai','paid','dine-in',35000,NULL,'2026-06-18 09:49:41',0,0.00,NULL,NULL,NULL,NULL,31),(51,23,NULL,'batal','unpaid','dine-in',62000,'[jjj]','2026-06-18 09:56:12',0,0.00,'jjj','','',NULL,NULL),(52,23,NULL,'selesai','paid','dine-in',62000,'[Jeremy Sinuraya]','2026-06-18 11:09:13',0,0.00,'Jeremy Sinuraya','085179915926','jeremycarhvalos@gmail.com','/uploads/d2cef9d0-a389-4cb8-bec0-f71b0c36fbe1.jpeg',NULL),(53,NULL,22,'selesai','paid','dine-in',40000,NULL,'2026-06-18 11:11:12',0,0.00,NULL,NULL,NULL,NULL,31),(54,NULL,22,'selesai','paid','dine-in',40000,NULL,'2026-06-18 11:18:27',0,0.00,NULL,NULL,NULL,NULL,31),(55,23,NULL,'selesai','paid','dine-in',38000,'[fadya]','2026-06-19 03:40:14',0,0.00,'fadya','081514296260','',NULL,NULL);
/*!40000 ALTER TABLE `pesanan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`permissions`)),
  `is_system` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'owner','{\"dashboard\":{\"view\":true,\"edit\":true},\"pos\":{\"view\":true,\"edit\":true},\"manajemen_menu\":{\"view\":true,\"edit\":true},\"manajemen_meja\":{\"view\":true,\"edit\":true},\"kds\":{\"view\":true,\"edit\":true},\"laporan\":{\"view\":true,\"edit\":true},\"user_manage\":{\"view\":true,\"edit\":true},\"bonus_karyawan\":{\"view\":true,\"edit\":true},\"manajemen_promo\":{\"view\":true,\"edit\":true},\"crm\":{\"view\":true,\"edit\":true}}',1,'2026-06-02 16:07:01'),(2,'manager','{\"dashboard\": {\"view\": true, \"edit\": true}, \"pos\": {\"view\": true, \"edit\": true}, \"manajemen_menu\": {\"view\": true, \"edit\": true}, \"manajemen_meja\": {\"view\": true, \"edit\": true}, \"kds\": {\"view\": true, \"edit\": true}, \"laporan\": {\"view\": true, \"edit\": true}, \"user_manage\": {\"view\": true, \"edit\": false}, \"bonus_karyawan\": {\"view\": true, \"edit\": true}}',1,'2026-06-02 16:07:01'),(3,'kasir','{\"dashboard\":{\"view\":true,\"edit\":false},\"pos\":{\"view\":true,\"edit\":true},\"manajemen_menu\":{\"view\":true,\"edit\":false},\"manajemen_meja\":{\"view\":true,\"edit\":false},\"kds\":{\"view\":true,\"edit\":true},\"laporan\":{\"view\":false,\"edit\":false},\"user_manage\":{\"view\":false,\"edit\":false}}',1,'2026-06-02 16:07:01'),(4,'dapur','{\"dashboard\":{\"view\":false,\"edit\":false},\"pos\":{\"view\":false,\"edit\":false},\"manajemen_menu\":{\"view\":false,\"edit\":false},\"manajemen_meja\":{\"view\":false,\"edit\":false},\"kds\":{\"view\":true,\"edit\":true},\"laporan\":{\"view\":false,\"edit\":false},\"user_manage\":{\"view\":false,\"edit\":false}}',1,'2026-06-02 16:07:01'),(5,'investor','{\"dashboard\":{\"view\":true,\"edit\":false},\"pos\":{\"view\":true,\"edit\":false},\"manajemen_menu\":{\"view\":true,\"edit\":false},\"manajemen_meja\":{\"view\":true,\"edit\":false},\"kds\":{\"view\":true,\"edit\":false},\"laporan\":{\"view\":true,\"edit\":false},\"user_manage\":{\"view\":true,\"edit\":false}}',0,'2026-06-03 09:24:21');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `key` varchar(100) NOT NULL,
  `nilai` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (1,'ppn','10','2026-04-16 14:42:21','2026-06-19 03:46:45');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'kasir',
  `aktif` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (22,'Owner Warkop','owner','$2b$10$No0P0imRsKEfcDIsUda5SecAGc2nSIUyhtw1JEJRNOubtSI8mIW.C','owner',1,'2026-04-16 09:01:11'),(23,'Manager Warkop','manager','$2b$10$No0P0imRsKEfcDIsUda5SecAGc2nSIUyhtw1JEJRNOubtSI8mIW.C','manager',1,'2026-04-16 09:01:11'),(24,'Kasir 1','kasir1','$2b$10$No0P0imRsKEfcDIsUda5SecAGc2nSIUyhtw1JEJRNOubtSI8mIW.C','kasir',1,'2026-04-16 09:01:11'),(25,'Dapur 1','dapur','$2b$10$No0P0imRsKEfcDIsUda5SecAGc2nSIUyhtw1JEJRNOubtSI8mIW.C','dapur',1,'2026-04-16 09:01:11'),(34,'septian','septian','$2b$10$vxFVKw1A98ryniluhGBzve9plS7OYW.ZjIpYeFCIbbghIFEZWwiHK','investor',1,'2026-06-03 09:25:13');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-19 17:32:31

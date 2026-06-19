# 📦 Rencana Migrasi Manajemen Stock (Laravel ➡️ Node.js & React)

Dokumen ini adalah cetak biru (blueprint) untuk menjalankan **Opsi 3**, yaitu menulis ulang (rewrite) sistem Manajemen Stock dari project RPL (Laravel) menjadi fitur asli (native) di dalam project Warkop 1001 CC saat ini menggunakan ekosistem Node.js, Express, dan React.

Tujuan utama dari migrasi ini adalah membuat aplikasi berjalan sebagai **satu project utuh (MERN-like)** tanpa perlu menggunakan *iframe* atau menjalankan dua server yang berbeda (PHP & Node).

---

## FASE 1: Perancangan & Migrasi Database
Karena kita sudah menggunakan MySQL, kita hanya perlu menambahkan tabel-tabel baru ke dalam database `warkop1001cc` saat ini untuk mendukung sistem stok.

### Tabel Baru yang Dibutuhkan:
1.  **`bahan_baku` (Raw Materials)**
    Menyimpan master data barang yang ada di gudang.
    *   `id` (INT, PK)
    *   `nama_bahan` (VARCHAR)
    *   `kategori` (VARCHAR) - misal: Bubuk, Cairan, Kemasan
    *   `satuan` (VARCHAR) - misal: gram, ml, pcs
    *   `stok_sekarang` (DECIMAL)
    *   `stok_minimum` (DECIMAL) - Untuk trigger peringatan stok menipis

2.  **`resep` (Menu to Material Mapping)**
    Menghubungkan `menu` dengan `bahan_baku`. (Contoh: Kopi Susu butuh Kopi 15gr, Susu 100ml).
    *   `id` (INT, PK)
    *   `menu_id` (INT, FK ke tabel `menu`)
    *   `bahan_baku_id` (INT, FK ke tabel `bahan_baku`)
    *   `jumlah_dibutuhkan` (DECIMAL) - Jumlah yang dikurangi per 1 porsi pesanan

3.  **`log_stok` (Stock Movements/History)**
    Mencatat histori barang masuk (kulakan) dan barang keluar (terjual/rusak).
    *   `id` (INT, PK)
    *   `bahan_baku_id` (INT, FK ke tabel `bahan_baku`)
    *   `jenis_pergerakan` (ENUM: 'MASUK', 'KELUAR', 'PENYESUAIAN')
    *   `jumlah` (DECIMAL)
    *   `keterangan` (VARCHAR) - misal: "Restock dari supplier", "Pengurangan pesanan #123"
    *   `created_by` (INT, FK ke tabel `users`)
    *   `created_at` (TIMESTAMP)

---

## FASE 2: Pembuatan API Backend (Node.js/Express)
Kita akan membuat modul backend baru untuk mengelola stok, sama seperti modul `menu` atau `pesanan`.

### File yang akan dibuat/diubah:
*   **`backend/src/controllers/stockController.js`**
    Membuat fungsi CRUD:
    *   `getBahanBaku()`: Mengambil daftar bahan baku + status peringatan stok.
    *   `tambahBahanBaku()` / `editBahanBaku()` / `hapusBahanBaku()`.
    *   `catatStokMasuk()`: Endpoint khusus untuk menambah stok (pembelian).
    *   `getLogStok()`: Riwayat pergerakan barang.
    *   `getResep()` & `updateResep()`: Mengatur komposisi per menu.

*   **`backend/src/routes/stock.js`**
    Mendefinisikan *routing* untuk API stok yang diproteksi dengan otorisasi role (misal: Admin/Owner/Manajer).

*   **`backend/src/controllers/pesananController.js` (Modifikasi Kritis)**
    Mengubah logika di dalam fungsi `updateStatusDetail` atau saat `konfirmasiPembayaran`. Jika pesanan berstatus **'selesai'**, sistem akan **otomatis memotong `stok_sekarang`** berdasarkan tabel `resep`.

---

## FASE 3: Pembuatan Antarmuka Frontend (React/Vite)
Kita akan membongkar `ManajemenStock.jsx` yang sekarang berisi *iframe* menjadi halaman dashboard murni berbasis React.

### Komponen UI yang akan dibuat:
1.  **Dashboard Stok:**
    Menampilkan kartu ringkasan (Total Bahan Baku, Total Aset Stok, Peringatan Stok Menipis).
2.  **Tab "Data Bahan Baku":**
    Tabel (seperti Manajemen Menu) untuk CRUD bahan baku (Nama, Stok, Satuan).
3.  **Tab "Barang Masuk (Restock)":**
    Form khusus untuk mencatat pembelian barang dari supplier.
4.  **Tab "Manajemen Resep":**
    Antarmuka untuk mengklik Menu tertentu, lalu menambahkan bahan baku apa saja yang diperlukan untuk membuatnya.
5.  **Tab "Riwayat Stok":**
    Log/tabel yang mencatat histori keluar-masuknya barang dengan timestamp yang jelas.

---

## URUTAN EKSEKUSI (Langkah-langkah Penerapan)

Jika Anda siap untuk memulai migrasi ini, kita akan mengerjakannya dengan urutan berikut (langkah demi langkah agar aplikasi tetap stabil):

*   **Langkah 1:** Jalankan script SQL untuk membuat 3 tabel baru di database MySQL Anda.
*   **Langkah 2:** Buat file `stockController.js` dan `stock.js` (Routes) di backend, lalu daftarkan ke `app.js`. Uji endpoint dengan Postman atau *browser*.
*   **Langkah 3:** Mulai desain UI menggunakan Tailwind dan Lucide-React di dalam `ManajemenStock.jsx`, buang kode *iframe*.
*   **Langkah 4:** Sambungkan UI React (Frontend) dengan API Node.js (Backend) menggunakan `axios`.
*   **Langkah 5 (Final):** Terapkan logika pemotongan stok otomatis ke dalam `pesananController.js` saat transaksi selesai.

> *Rencana ini tersimpan di root folder project Anda. Beri tahu saya jika Anda ingin memulai "Langkah 1" kapan pun Anda siap!*

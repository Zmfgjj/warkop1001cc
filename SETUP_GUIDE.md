# Panduan Menggunakan Aplikasi Warkop KDS

## Setup Database dan Pengguna

### 1. Setup Pengguna Default

Jalankan query SQL di file `backend/seed_users.sql` ke database Anda untuk membuat pengguna default:

```sql
INSERT INTO users (nama, username, password, role, aktif, created_at) VALUES 
('Owner Warkop', 'owner', '$2a$10$Y9jtsilJ2.Ccm3.linHK6OPST9/PgBkqquzi.Oy1skWyQcsqC9YFm', 'owner', 1, NOW()),
('Manager Warkop', 'manager', '$2a$10$Y9jtsilJ2.Ccm3.linHK6OPST9/PgBkqquzi.Oy1skWyQcsqC9YFm', 'manager', 1, NOW()),
('Kasir 1', 'kasir1', '$2a$10$Y9jtsilJ2.Ccm3.linHK6OPST9/PgBkqquzi.Oy1skWyQcsqC9YFm', 'kasir', 1, NOW()),
('Dapur 1', 'dapur', '$2a$10$Y9jtsilJ2.Ccm3.linHK6OPST9/PgBkqquzi.Oy1skWyQcsqC9YFm', 'dapur', 1, NOW()),
('Admin', 'admin', '$2a$10$Y9jtsilJ2.Ccm3.linHK6OPST9/PgBkqquzi.Oy1skWyQcsqC9YFm', 'admin', 1, NOW());
```

**Password untuk semua user: `password123`**

---

## Role dan Hak Akses

### 1. **Owner** (Admin Penuh)
- Username: `owner`
- Dapat: Mengelola semua user, update role, delete user, akses semua halaman termasuk KDS
- Rute yang dapat diakses: `/kasir`, `/kasir/pos`, `/kasir/kds`, `/kasir/user-manage`

### 2. **Manager**
- Username: `manager`
- Dapat: Melihat daftar user, akses KDS
- Rute yang dapat diakses: `/kasir`, `/kasir/pos`, `/kasir/kds`

### 3. **Kasir**
- Username: `kasir1`
- Dapat: POS system, membuat pesanan
- Rute yang dapat diakses: `/kasir`, `/kasir/pos`

### 4. **Dapur** (Kitchen Display System)
- Username: `dapur`
- Dapat: Melihat pesanan dan update status di KDS
- Rute yang dapat diakses: `/kasir/kds`

### 5. **Admin**
- Username: `admin`
- Dapat: Sama seperti Owner, akses penuh ke semua halaman

---

## Cara Mengakses Halaman KDS

1. **Login dengan salah satu role:**
   - `dapur` / `password123`
   - `owner` / `password123`
   - `manager` / `password123`
   - `admin` / `password123`

2. **Navigasi ke halaman KDS:**
   - Setelah login, klik menu "📡 KDS" di sidebar
   - Atau akses langsung: `http://localhost:5174/kasir/kds`

3. **Jika halaman KDS masih tidak muncul:**
   - Buka DevTools (F12) dan cek console untuk error messages
   - Pastikan backend sedang berjalan di port 3000
   - Pastikan database sudah terkoneksi dengan benar

---

## Mengubah dan Menghapus Role User

### Hanya role `owner` yang bisa:
1. Menambah user baru
2. Mengubah role user lain
3. Menghapus user

### Cara mengubah role:
1. Login sebagai `owner`
2. Klik menu "👤 User Manage"
3. Pilih user yang ingin diubah rolenya
4. Klik tombol "Edit Role" dan pilih role baru
5. Klik "Simpan"

### Cara menghapus user:
1. Login sebagai `owner`
2. Klik menu "👤 User Manage"
3. Pilih user yang ingin dihapus
4. Klik tombol "Hapus"
5. Konfirmasi penghapusan

---

## Troubleshooting

### Halaman KDS tidak muncul
- Pastikan Anda login dengan role yang benar (`dapur`, `owner`, `manager`, atau `admin`)
- Bersihkan cache browser (Ctrl+Shift+Delete) dan reload halaman
- Cek console browser (F12) untuk error messages

### Tidak bisa update/delete user
- Pastikan Anda login sebagai `owner`
- Jika Anda login sebagai owner tetapi masih ditolak, cekTokennya dengan membuka browser DevTools → Application → Local Storage dan pastikan `token` tersimpan dengan benar

### Backend error / database tidak terkoneksi
- Jalankan backend dengan: `cd backend && npm run dev`
- Pastikan file `.env` di folder `backend` sudah dikonfigurasi dengan benar
- Pastikan MySQL/database sudah berjalan

---

## Port Configuration

- **Frontend:** http://localhost:5174
- **Backend API:** http://localhost:3000
- **Database:** Sesuai konfigurasi di `.env`

---

Jika masih ada masalah, cek console browser dan terminal backend untuk error messages yang lebih detail!

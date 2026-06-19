# Warkop 1001cc - Point of Sale & KDS

Aplikasi Point of Sale (POS) dan Kitchen Display System (KDS) untuk Warkop 1001cc. Proyek ini terdiri dari *frontend* (React/Vite) dan *backend* (Node.js/Express/MySQL).

---

## 🚀 Panduan Setup untuk Komputer Baru (Setelah Clone)

Ikuti langkah-langkah berikut untuk menjalankan aplikasi ini di komputer lain dengan data dan gambar yang sudah ada.

### Prasyarat:
Pastikan komputer Anda sudah terinstal:
- [Node.js](https://nodejs.org/) (Disarankan versi 18+)
- [MySQL Server](https://dev.mysql.com/downloads/mysql/) (XAMPP / Laragon / Standalone)
- [Git](https://git-scm.com/)

---

### Langkah 1: Setup Database MySQL
1. Buka MySQL (melalui phpMyAdmin, DBeaver, atau MySQL CLI).
2. Buat database baru dengan nama `warkop1001cc`:
   ```sql
   CREATE DATABASE warkop1001cc;
   ```
3. Import file `warkop1001cc.sql` yang ada di dalam folder `backend/` ke dalam database `warkop1001cc` yang baru dibuat.
   *(File ini berisi seluruh struktur tabel dan data terakhir, termasuk user dan menu)*.

### Langkah 2: Setup Backend (API & Server)
1. Buka terminal/command prompt, arahkan ke folder `backend`:
   ```bash
   cd backend
   ```
2. Instal semua dependensi:
   ```bash
   npm install
   ```
3. Copy file `env.example` menjadi `.env`:
   - Di Windows (Command Prompt): `copy env.example .env`
   - Di Mac/Linux: `cp env.example .env`
4. Buka file `.env` dan pastikan konfigurasi database sesuai dengan komputer Anda (terutama `DB_PASSWORD` jika ada).
5. Jalankan server backend:
   ```bash
   npm run dev
   ```
   *Backend akan berjalan di port 3000.*

### Langkah 3: Setup Frontend (UI)
1. Buka terminal **baru**, arahkan ke folder `frontend`:
   ```bash
   cd frontend
   ```
2. Instal semua dependensi:
   ```bash
   npm install
   ```
3. Jalankan aplikasi frontend:
   ```bash
   npm run dev
   ```
   *Frontend akan berjalan di browser, biasanya di http://localhost:5173 atau port lain yang tertera di terminal.*

> **Catatan WhatsApp Gateway:**
> Backend sekarang sudah dilengkapi dengan Local WhatsApp Gateway (menggunakan `whatsapp-web.js`). Saat pertama kali di-*run* (`npm install` atau `npm run dev`), sistem mungkin akan mendownload Chromium secara otomatis. Pastikan koneksi internet stabil. Scan QR Code WhatsApp tersedia di halaman CRM pada Frontend untuk menghubungkan nomor pengirim.
4. Jika ingin mengekspose menu publik lewat tunnel, jalankan:
   ```bash
   npm run tunnel
   ```
   *Tunnel akan membuat URL publik yang meneruskan ke frontend dev server.*

   > Contoh: `https://warkop1001cc-publik.loca.lt/menu/011`

---

## 🖼️ Catatan Tentang Gambar Menu
Semua gambar yang telah diupload untuk menu tersimpan di folder `backend/public/uploads/`. Karena folder ini ikut di-*push* ke Github, maka gambar-gambar tersebut akan otomatis muncul saat Anda menjalankan project di komputer baru asalkan database (Langkah 1) telah di-import dengan benar.

## 👥 Akun Default (Login)
Gunakan salah satu akun berikut untuk login ke aplikasi (jika Anda tidak mengubahnya sebelum export):
- **Owner**: `owner` / `password123`
- **Manager**: `manager` / `password123`
- **Kasir**: `kasir1` / `password123`
- **Dapur (KDS)**: `dapur` / `password123`

Untuk panduan penggunaan fitur secara lengkap, silakan lihat file [SETUP_GUIDE.md](./SETUP_GUIDE.md).

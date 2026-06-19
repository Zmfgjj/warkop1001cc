# ☕ Warkop 1001cc - Point of Sale (POS) & KDS

Sistem **Point of Sale (POS)** dan **Kitchen Display System (KDS)** komprehensif yang dirancang khusus untuk operasional Warkop 1001cc. Aplikasi ini mengusung arsitektur modern (MERN-like) dengan antarmuka kasir *offline-first* dan manajemen pesanan publik berbasis *QR Code*.

---

## 🌟 Fitur Utama

1. **POS & Open Bill**: Mendukung pesanan *dine-in* (meja) dengan sistem *Open Bill* (bisa nambah pesanan tanpa harus bayar dulu).
2. **KDS (Kitchen Display System)**: Layar sinkronisasi *real-time* untuk dapur menggunakan `Socket.io`.
3. **Menu Publik (QR Order)**: Pelanggan dapat memindai QR Code di meja untuk memesan secara mandiri dari HP mereka (dilengkapi varian harga dan *rate limiter* anti-spam).
4. **WhatsApp CRM**: *Local WhatsApp Gateway* terintegrasi. Broadcast otomatis pesan promosi ke database pelanggan menggunakan `whatsapp-web.js`.
5. **Role & Dynamic Permissions**: Sistem *Role-Based Access Control* (RBAC). Admin bisa mengatur fitur mana saja yang boleh dibuka oleh *Kasir*, *Dapur*, atau *Investor* (read-only).
6. **Sistem Bonus Karyawan**: Perhitungan otomatis bonus kasir & dapur berdasarkan persentase dari Net Profit (Total Pendapatan - HPP - PPN).
7. **Integrasi Stok**: Menampilkan modul Manajemen Stok berbasis Laravel melalui antarmuka *Iframe*.

---

## 🛠️ Tech Stack

- **Frontend:** React.js, Vite, TailwindCSS, Socket.io-client, idb-keyval (Offline DB).
- **Backend:** Node.js, Express.js, Socket.io, whatsapp-web.js, bcryptjs, jsonwebtoken (JWT).
- **Database:** MySQL 8+ (menggunakan `mysql2/promise` pool).

---

## 🚀 Panduan Instalasi (Development)

Ikuti langkah-langkah berikut untuk menjalankan aplikasi di lingkungan lokal.

### 1. Setup Database MySQL
1. Buat database baru bernama `warkop1001cc`.
2. Lakukan *import* struktur tabel dari file `backend/scripts/` (atau *dump* terakhir Anda).

### 2. Setup Backend (Node.js)
```bash
cd backend
npm install
```
Copy file environment:
```bash
cp env.example .env
```
Sesuaikan konfigurasi `.env` Anda (Lihat bagian Konfigurasi `.env` di bawah).

Jalankan server backend:
```bash
npm run dev
```

### 3. Setup Frontend (React/Vite)
Buka terminal baru:
```bash
cd frontend
npm install
```
Buat file `frontend/.env` dan sesuaikan URL-nya (jika tidak menggunakan *default*):
```env
VITE_API_URL=http://localhost:3000
VITE_STOCK_URL=http://localhost:8000
```
Jalankan server frontend:
```bash
npm run dev
```

---

## 🔐 Konfigurasi `.env` (Production)

Saat akan merilis ke *Production* (server *live*), pastikan file `backend/.env` dikonfigurasi dengan ketat:

```env
PORT=3000
NODE_ENV=production

# Konfigurasi MySQL
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password_database_anda
DB_NAME=warkop1001cc

# Keamanan (WAJIB DIGANTI SAAT LIVE)
JWT_SECRET=gunakan_string_acak_64_karakter_disini
JWT_EXPIRES_IN=7d

# Konfigurasi URL (Mencegah error QR Code & CORS)
FRONTEND_URL=https://warkop1001cc.cloud
ALLOWED_ORIGINS=https://warkop1001cc.cloud,http://localhost:5173
```

---

## 👥 Akun Default (Login)
Jika menggunakan *database seed* bawaan, Anda bisa login dengan:
- **Owner**: `owner` / `password`
- **Manager**: `manager` / `password`
- **Kasir**: `kasir1` / `password`
- **Dapur (KDS)**: `dapur` / `password`
- **Investor**: `investor` / `password` (Hak akses *Read-Only*)

---

## 📦 Dokumen Lainnya
- [Rencana Integrasi Payment Gateway](./PAYMENT_GATEWAY_PLAN.md)
- [Rencana Migrasi Native Node.js Stock](./STOCK_MIGRATION_PLAN.md)

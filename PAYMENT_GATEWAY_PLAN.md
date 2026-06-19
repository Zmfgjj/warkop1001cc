# 💳 Opsi Integrasi Payment Gateway (Midtrans / Xendit)

Dokumen ini adalah ringkasan arsitektur jika mitra memutuskan untuk beralih dari **QRIS Manual (Cek Mutasi)** ke sistem **Payment Gateway Otomatis** (seperti Midtrans atau Xendit).

---

## ⚖️ Perbandingan Metode Pembayaran

| Fitur | QRIS Dinamis Saat Ini (Manual) | Payment Gateway (Midtrans/Xendit) |
| :--- | :--- | :--- |
| **Pengecekan Pembayaran** | **Manual:** Kasir harus cek mutasi di aplikasi M-Banking, lalu klik "Lunas". | **Otomatis:** Sistem langsung mendeteksi pembayaran dan update status pesanan. |
| **Metode Pembayaran** | Hanya QRIS (E-Wallet & M-Banking). | QRIS, Virtual Account (BCA, Mandiri, dll), ShopeePay, GoPay, OVO, Kartu Kredit. |
| **Biaya Transaksi (MDR)** | ~0.3% - 0.7% (Tergantung Bank/Penyedia QRIS). | Biasanya ada biaya flat + MDR (misal: Rp 1.500 + 0.7% per transaksi). |
| **Pencairan Dana (Settlement)** | Langsung masuk ke rekening bank Warkop (H+1 atau real-time). | Masuk ke saldo Payment Gateway dulu, baru bisa ditarik ke rekening bank. |
| **Kemungkinan Kasir Lengah** | Tinggi (Kasir bisa tertipu struk palsu jika tidak mengecek mutasi). | Nol (Sistem yang mengecek validitas uang masuk secara real-time). |

---

## ⚙️ Bagaimana Payment Gateway Akan Bekerja di Warkop 1001 CC?

Jika mitra memilih opsi Payment Gateway, arsitektur aplikasi Warkop 1001 CC sudah sangat siap untuk mengintegrasikannya. Berikut adalah alur kerjanya:

### 1. Pelanggan Memesan (Frontend Menu Publik)
*   Pelanggan memilih menu dan menekan "Pesan & Bayar".
*   Frontend mengirimkan data pesanan ke Backend.

### 2. Pembuatan Tagihan (Backend Node.js)
*   Backend Node.js akan menghubungi API Midtrans/Xendit untuk membuat "Transaksi Baru" dengan nominal total pesanan.
*   Midtrans/Xendit akan membalas dengan sebuah *Token Pembayaran* (Snap Token) atau URL *Checkout*.

### 3. Tampilan Pembayaran (Frontend)
*   Frontend memunculkan *Pop-up* Midtrans (Snap) yang elegan langsung di layar HP pelanggan.
*   Pelanggan bebas memilih bayar pakai ShopeePay, GoPay, QRIS, atau Virtual Account.

### 4. Konfirmasi Otomatis (Webhook)
*   Saat pelanggan berhasil bayar, Midtrans/Xendit akan mengirimkan sinyal rahasia (Webhook) ke backend kita secara otomatis: `POST /api/pembayaran/webhook`.
*   Backend kita memverifikasi *signature* (untuk mencegah *hacker* memalsukan pembayaran).
*   Jika valid, backend otomatis mengubah status pesanan menjadi `paid`, mengupdate tabel `pembayaran`, dan menembakkan *Socket.IO* ke layar Kasir & KDS (Dapur) bahwa pesanan sudah lunas dan siap dimasak!

---

## 🛠️ Persiapan Teknis (Langkah Implementasi)

Jika mitra berkata *"Ya, mari pakai Payment Gateway"*, inilah yang akan kita lakukan secara teknis:

1.  **Daftar Akun PG:** Mitra harus mendaftar akun bisnis di Midtrans atau Xendit (membutuhkan KTP/NPWP usaha).
2.  **Update `.env`:** Memasukkan `MIDTRANS_SERVER_KEY` dan `MIDTRANS_CLIENT_KEY` ke dalam environment server.
3.  **Ubah `publikController.js`:** Menambahkan pemanggilan API `midtrans-client` setelah pesanan di-insert ke database.
4.  **Buat Webhook Route:** Menambahkan endpoint baru untuk mendengarkan callback dari server Payment Gateway.
5.  **Hapus Upload Bukti:** Menghapus sepenuhnya fitur "Upload Bukti Transfer" karena sudah tidak diperlukan lagi.

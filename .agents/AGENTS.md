# Warkop 1001cc POS & Web App Development Rules

## Frontend Deployment & Android APK Build Requirement
**CRITICAL RULE:**
Setiap kali melakukan perubahan atau pembaruan pada kode frontend (web app POS, KDS, CRM, Manajemen Menu, User Manage, dll.), **JANGAN HANYA** meng-update versi web apps-nya saja. Anda **WAJIB** melakukan prosedur build dan deploy untuk **Web APP** DAN **Android APK** sekaligus dengan urutan langkah berikut:

1. **Build Web & Deploy VPS:**
   - Jalankan `npm run build` di folder `frontend`.
   - Deploy bundle ke VPS web server (menggunakan `node deploy_frontend.js`).

2. **Sync & Build Android APK:**
   - Sinkronisasikan bundle web ke dalam proyek Android: jalankan `npx cap sync android` di folder `frontend`.
   - Compile APK Android: jalankan `.\gradlew assembleDebug` (atau `assembleRelease`) di dalam folder `frontend/android`.
   - Salin dan timpa hasil build APK ke root workspace dengan nama: `warkop-pos.apk`.

3. **Upload APK ke VPS Web Server (Link Unduhan Publik):**
   - Upload file APK baru (`warkop-pos.apk`) ke server VPS (misalnya via `scp` ke `/root/warkop.apk`, lalu `cp` ke `/var/www/landing_page/warkop.apk` dan `/var/www/frontend/warkop.apk` dengan izin `chmod 644`).
   - Pastikan link unduhan APK selalu terupdate dan siap diunduh pengguna dari:
     - `https://warkop1001cc.cloud/warkop.apk`
    

## Aturan OTA (Hot Code Push) Bundle ZIP
**CRITICAL RULE:**
Saat memperbarui aplikasi melalui OTA (tanpa menyusun ulang APK), Anda hanya perlu mengunggah aset web ke server dan mem-bundle-nya ke dalam `.zip`. 
1. **Wajib menyertakan `capacitor.config.json`** ke dalam root file zip (misal: di-copy ke `/var/www/frontend/` sebelum di-zip). Plugin `CapacitorUpdater` akan gagal mengeksekusi OTA jika file konfigurasi ini tidak ada.
2. File zip OTA **tidak boleh berisi APK**. Gunakan flag exclude saat melakukan kompresi (`-x '*.apk'`).
3. Selalu ubah nilai `CURRENT_APP_VERSION` di `frontend/src/components/UpdateChecker.jsx` serta fallback di `backend/src/app.js` (atau `.env` di VPS) menjadi versi terbaru agar aplikasi bisa mendeteksinya.

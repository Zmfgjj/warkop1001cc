import { getOfflineOrders, clearOfflineOrders } from './offlineStore';
import api from '../api/auth'; // Using your configured axios instance

export const syncOfflineOrders = async () => {
  const offlineOrders = await getOfflineOrders();
  if (!offlineOrders || offlineOrders.length === 0) return;

  console.log(`[Sync] Menemukan ${offlineOrders.length} pesanan offline. Mulai sinkronisasi...`);

  let successCount = 0;
  
  for (const order of offlineOrders) {
    try {
      // Kirim data pesanan dan pembayaran secara atomis dalam satu request
      await api.post('/pesanan', {
        ...order,
        is_offline_sync: true
      });
      
      successCount++;
    } catch (error) {
      console.error('[Sync] Gagal sinkronisasi pesanan:', error);
    }
  }

  // Jika semua berhasil, hapus queue.
  if (successCount === offlineOrders.length) {
    await clearOfflineOrders();
    console.log('[Sync] Sinkronisasi berhasil, antrian dihapus.');
  } else {
    console.log('[Sync] Sinkronisasi selesai dengan beberapa kegagalan. Coba lagi nanti.');
  }
};

// Setup background sync listener saat online
export const initSyncManager = () => {
  if (navigator.onLine) {
    syncOfflineOrders();
  }
  window.addEventListener('online', () => {
    console.log('[Sync] Koneksi internet kembali. Menjalankan syncManager...');
    syncOfflineOrders();
  });
};

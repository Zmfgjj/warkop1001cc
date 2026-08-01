import { getOfflineOrders, clearOfflineOrders } from './offlineStore';
import api from '../api/auth';

export const syncOfflineOrders = async () => {
  const offlineOrders = await getOfflineOrders();
  if (!offlineOrders || offlineOrders.length === 0) return;

  console.log(`[Sync] Menemukan ${offlineOrders.length} pesanan offline. Mulai sinkronisasi...`);

  const failedOrders = [];
  let successCount = 0;
  
  for (const order of offlineOrders) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('[Sync] Tidak ada token auth, lewati sync.');
        failedOrders.push(order);
        continue;
      }

      // Kirim pesanan dengan flag is_offline_sync agar backend skip open-bill check
      await api.post('/pesanan', {
        ...order,
        is_offline_sync: true
      });
      
      successCount++;
      console.log('[Sync] Pesanan offline berhasil disinkron:', order.local_id);
    } catch (error) {
      console.error('[Sync] Gagal sinkronisasi pesanan:', order.local_id, error?.response?.data || error.message);
      // Hanya skip jika duplicate (409) atau bad request (400)
      // Jika server down (5xx) atau network error, masukkan ke daftar gagal
      const status = error?.response?.status;
      if (status === 409 || status === 400) {
        // Data sudah masuk atau invalid — tidak perlu retry
        console.warn('[Sync] Pesanan dilewati (duplikat/invalid):', order.local_id);
      } else {
        failedOrders.push(order); // Retry nanti
      }
    }
  }

  // Simpan kembali hanya yang gagal, hapus yang berhasil
  if (successCount > 0) {
    if (failedOrders.length === 0) {
      await clearOfflineOrders();
    } else {
      localStorage.setItem('offlineOrders', JSON.stringify(failedOrders));
    }
    console.log(`[Sync] Berhasil: ${successCount}, Gagal (retry nanti): ${failedOrders.length}`);
  } else if (failedOrders.length > 0) {
    console.warn('[Sync] Semua pesanan gagal disinkron. Akan dicoba lagi saat online berikutnya.');
  }
};

// Setup background sync listener saat online
export const initSyncManager = () => {
  if (navigator.onLine) {
    syncOfflineOrders();
  }
  window.addEventListener('online', () => {
    console.log('[SyncManager] Koneksi internet kembali. Menjalankan sync localStorage...');
    syncOfflineOrders();
  });
};

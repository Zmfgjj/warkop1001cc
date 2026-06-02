import { getOfflineOrders, clearOfflineOrders } from './offlineStore';
import api from '../api/auth'; // Using your configured axios instance

export const syncOfflineOrders = async () => {
  const offlineOrders = await getOfflineOrders();
  if (!offlineOrders || offlineOrders.length === 0) return;

  console.log(`[Sync] Menemukan ${offlineOrders.length} pesanan offline. Mulai sinkronisasi...`);

  let successCount = 0;
  
  for (const order of offlineOrders) {
    try {
      const { pembayaran, ...pesananData } = order;
      
      // Buat pesanan
      const resPesanan = await api.post('/pesanan', pesananData);
      
      // Catat pembayaran jika ada
      if (pembayaran && resPesanan.data && resPesanan.data.pesanan_id) {
        await api.post('/pembayaran', { 
          pesanan_id: resPesanan.data.pesanan_id, 
          metode: pembayaran.metode, 
          jumlah: pembayaran.jumlah 
        });
      }
      
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
  window.addEventListener('online', () => {
    console.log('[Sync] Koneksi internet kembali. Menjalankan syncManager...');
    syncOfflineOrders();
  });
};

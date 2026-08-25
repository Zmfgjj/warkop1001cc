import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';
import { dbService } from './DatabaseService';
import { getOfflineOrders, removeOfflineOrder } from '../utils/offlineStore';
import api from '../api/auth';

class SyncService {
  constructor() {
    this.isSyncing = false;
    this.intervalId = null;
    this.networkStatus = { connected: true };
  }

  async init() {
    // Listen to Capacitor network changes (native)
    Network.addListener('networkStatusChange', status => {
      console.log('[SyncService] Network status changed', status);
      this.networkStatus = status;
      if (status.connected) {
        console.log('[SyncService] Kembali online! Memulai sinkronisasi pesanan offline...');
        this.syncOrders();
      }
    });

    // Listen to App state to trigger sync on resume from background
    App.addListener('appStateChange', ({ isActive }) => {
      console.log('[SyncService] App state changed. isActive:', isActive);
      if (isActive && (this.networkStatus.connected || navigator.onLine)) {
        this.syncOrders();
      }
    });

    // Juga listen ke browser online event sebagai fallback (web + native)
    window.addEventListener('online', () => {
      console.log('[SyncService] window.online fired. Memulai sinkronisasi...');
      this.networkStatus = { connected: true };
      this.syncOrders();
    });

    // Get initial network status
    this.networkStatus = await Network.getStatus();

    // Start periodic sync (every 2 minutes) untuk jaga-jaga
    this.intervalId = setInterval(() => {
      if (this.networkStatus.connected || navigator.onLine) {
        this.syncOrders();
      }
      this.cleanupOldOrders();
    }, 2 * 60 * 1000);

    // Initial sync attempt if online
    if (this.networkStatus.connected || navigator.onLine) {
      setTimeout(() => {
        this.syncOrders();
        this.cleanupOldOrders();
      }, 2000);
    }
  }

  async syncOrders() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const unsyncedOrders = await dbService.getUnsyncedOrders();
      const localOfflineOrders = await getOfflineOrders();
      
      if (unsyncedOrders.length === 0 && localOfflineOrders.length === 0) {
        this.isSyncing = false;
        return;
      }

      console.log(`[SyncService] Found ${unsyncedOrders.length} DB order(s) and ${localOfflineOrders.length} LocalStorage order(s)`);

      for (const order of unsyncedOrders) {
        try {
          // Format payload to match expected backend format for /api/pesanan
          const payload = {
            local_id: order.local_id,
            meja_id: order.meja_id || null,
            kasir_id: order.kasir_id,
            tipe: order.tipe,
            catatan: order.catatan || null,
            items: order.items.map(item => ({
              menu_id: item.menu_id,
              qty: item.qty,
              harga: item.harga,
              catatan: item.catatan || null
            })),
            is_offline_sync: order.was_offline === 1, // flag to skip open bill check & auto pay (hanya jika memang offline)
            pembayaran: {
              metode: order.metode_bayar || 'tunai',
              jumlah: order.jumlah_bayar || order.total
            },
            nama_pelanggan: order.nama_pelanggan || null,
            no_telepon: order.no_telepon || null,
            discount_name: order.diskon_nama || null,
            discount_value: order.diskon_nilai || 0,
            created_at: order.created_at || new Date().toISOString(),
            nomor_antrean: order.nomor_antrean || null
          };

          const response = await api.post(`/pesanan`, payload);
          if (response.status === 200 || response.status === 201) {
            await dbService.markAsSynced(order.local_id);
            console.log(`[SyncService] Order ${order.local_id} synced successfully`);
          }
        } catch (err) {
          console.error(`[SyncService] Failed to sync DB order ${order.local_id}`, err);
          
          if (err.response && err.response.status >= 400 && err.response.status < 500) {
            console.warn(`[SyncService] Order ${order.local_id} permanently rejected by server (4xx). Skipping to unblock queue.`);
            // Jika ingin menghapus order yang korup agar tidak spam: await dbService.markAsSynced(order.local_id);
            // Untuk saat ini kita continue saja agar tidak memblokir antrian.
            continue;
          }

          // Stop syncing if backend is down (5xx) or network failed midway to prevent duplicate processing issues
          break; 
        }
      }

      for (const order of localOfflineOrders) {
        try {
          const payload = {
            local_id: order.local_id,
            meja_id: order.meja_id || null,
            kasir_id: order.kasir_id,
            tipe: order.tipe,
            catatan: order.catatan || null,
            items: order.items.map(item => ({
              menu_id: item.menu_id,
              qty: item.qty,
              harga: item.harga,
              catatan: item.catatan || null
            })),
            is_offline_sync: true,
            pembayaran: {
              metode: order.pembayaran?.metode || order.metode_bayar || 'tunai',
              jumlah: order.pembayaran?.jumlah || order.jumlah_bayar || order.total
            },
            nama_pelanggan: order.nama_pelanggan || null,
            no_telepon: order.no_telepon || null,
            discount_name: order.discount_name || order.diskon_nama || null,
            discount_value: order.discount_value || order.diskon_nilai || 0,
            created_at: order.created_at || new Date().toISOString(),
            nomor_antrean: order.nomor_antrean || null
          };

          const response = await api.post(`/pesanan`, payload);
          if (response.status === 200 || response.status === 201) {
            await removeOfflineOrder(order._offlineId);
            console.log(`[SyncService] LocalStorage Order ${order._offlineId} synced successfully`);
          }
        } catch (err) {
          console.error(`[SyncService] Failed to sync LocalStorage order ${order._offlineId}`, err);

          if (err.response && err.response.status >= 400 && err.response.status < 500) {
            console.warn(`[SyncService] LocalStorage Order ${order._offlineId} permanently rejected by server (4xx). Skipping to unblock queue.`);
            continue;
          }

          break;
        }
      }
    } catch (err) {
      console.error('[SyncService] Sync process error', err);
    } finally {
      this.isSyncing = false;
    }
  }

  // Hapus data order yang sudah disinkronisasi & berumur lebih dari 7 hari
  async cleanupOldOrders() {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const limitDateStr = sevenDaysAgo.toISOString();
      
      const count = await dbService.deleteOldSyncedOrders(limitDateStr);
      if (count > 0) {
        console.log(`[SyncService] Cleaned up ${count} old synced orders.`);
      }
    } catch (err) {
      console.error('[SyncService] Failed to clean up old orders:', err);
    }
  }
}

export const syncService = new SyncService();

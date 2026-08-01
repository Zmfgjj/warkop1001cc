import { Network } from '@capacitor/network';
import { dbService } from './DatabaseService';
import axios from 'axios';

// Konfigurasi endpoint base url (asumsikan kita baca dari env)
const getApiUrl = () => {
  return import.meta.env.VITE_API_URL || 'https://warkop1001cc.cloud/api';
};

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
      if (unsyncedOrders.length === 0) {
        this.isSyncing = false;
        return;
      }

      console.log(`[SyncService] Found ${unsyncedOrders.length} unsynced order(s)`);

      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('[SyncService] No auth token found, cannot sync yet.');
        this.isSyncing = false;
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      const apiUrl = getApiUrl();

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
            is_offline_sync: true, // flag to skip open bill check & auto pay
            pembayaran: {
              metode: order.metode_bayar || 'tunai',
              jumlah: order.jumlah_bayar || order.total
            },
            nama_pelanggan: order.nama_pelanggan || null,
            no_telepon: order.no_telepon || null,
            discount_name: order.diskon_nama || null,
            discount_value: order.diskon_nilai || 0
          };

          const response = await axios.post(`${apiUrl}/pesanan`, payload, { headers });
          if (response.status === 200 || response.status === 201) {
            await dbService.markAsSynced(order.local_id);
            console.log(`[SyncService] Order ${order.local_id} synced successfully`);
          }
        } catch (err) {
          console.error(`[SyncService] Failed to sync order ${order.local_id}`, err);
          // Stop syncing if backend is down or network failed midway to prevent duplicate processing issues
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

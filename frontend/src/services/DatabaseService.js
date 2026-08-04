import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';

const sqlite = new SQLiteConnection(CapacitorSQLite);

class DatabaseService {
  constructor() {
    this.db = null;
    this.isReady = false;
  }

  async init() {
    // Only initialize SQLite on native platforms (Android/iOS)
    if (!Capacitor.isNativePlatform()) {
      console.log('[SQLite] Running on web, SQLite bypassed.');
      return false;
    }

    try {
      console.log('[SQLite] Initializing database...');
      const db = await sqlite.createConnection('warkopos', false, 'no-encryption', 1, false);
      await db.open();
      
      const schema = `
        CREATE TABLE IF NOT EXISTS local_orders (
          local_id TEXT PRIMARY KEY,
          meja_id INTEGER,
          kasir_id INTEGER,
          tipe TEXT,
          catatan TEXT,
          total REAL,
          diskon_nama TEXT,
          diskon_nilai REAL,
          nama_pelanggan TEXT,
          no_telepon TEXT,
          metode_bayar TEXT,
          jumlah_bayar REAL,
          kembali REAL,
          synced INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS local_order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          local_id TEXT,
          menu_id INTEGER,
          qty INTEGER,
          harga REAL,
          catatan TEXT,
          FOREIGN KEY(local_id) REFERENCES local_orders(local_id)
        );
      `;
      await db.execute(schema);
      
      this.db = db;
      this.isReady = true;
      console.log('[SQLite] Local database initialized successfully');
      return true;
    } catch (error) {
      console.error('[SQLite] Initialization failed', error);
      return false;
    }
  }

  async saveOrder(orderData, itemsData) {
    if (!this.isReady) {
      console.warn('[SQLite] DB not ready. Cannot save offline order.');
      return false;
    }
    
    try {
      const qOrder = `INSERT INTO local_orders (
        local_id, meja_id, kasir_id, tipe, catatan, total, diskon_nama, diskon_nilai,
        nama_pelanggan, no_telepon, metode_bayar, jumlah_bayar, kembali, synced, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`;
      
      const vOrder = [
        orderData.local_id, orderData.meja_id || null, orderData.kasir_id || null, orderData.tipe, 
        orderData.catatan || null, orderData.total, orderData.discount_name || null, orderData.discount_value || 0,
        orderData.nama_pelanggan || null, orderData.no_telepon || null, orderData.metodeBayar || null, 
        orderData.jumlahBayar || 0, orderData.kembali || 0, orderData.created_at || new Date().toISOString()
      ];

      await this.db.run(qOrder, vOrder);

      const qItem = `INSERT INTO local_order_items (local_id, menu_id, qty, harga, catatan) VALUES (?, ?, ?, ?, ?)`;
      for (const item of itemsData) {
        await this.db.run(qItem, [orderData.local_id, item.menu_id, item.qty, item.harga, item.catatan || null]);
      }
      
      console.log('[SQLite] Order saved locally:', orderData.local_id);
      return true;
    } catch (err) {
      console.error('[SQLite] Error saving order:', err);
      return false;
    }
  }

  async getUnsyncedOrders() {
    if (!this.isReady) return [];
    
    try {
      const result = await this.db.query('SELECT * FROM local_orders WHERE synced = 0');
      const orders = result.values || [];
      
      for (const order of orders) {
        const itemsRes = await this.db.query('SELECT * FROM local_order_items WHERE local_id = ?', [order.local_id]);
        order.items = itemsRes.values || [];
      }
      
      return orders;
    } catch (err) {
      console.error('[SQLite] Error getting unsynced orders:', err);
      return [];
    }
  }

  async markAsSynced(local_id) {
    if (!this.isReady) return;
    try {
      await this.db.run('UPDATE local_orders SET synced = 1 WHERE local_id = ?', [local_id]);
    } catch (err) {
      console.error('[SQLite] Error marking order as synced:', err);
    }
  }

  async deleteOldSyncedOrders(limitDateIsoString) {
    if (!this.isReady) return 0;
    try {
      // Get old orders
      const res = await this.db.query('SELECT local_id FROM local_orders WHERE synced = 1 AND created_at < ?', [limitDateIsoString]);
      const oldOrders = res.values || [];
      
      if (oldOrders.length > 0) {
        let count = 0;
        for (const order of oldOrders) {
          await this.db.run('DELETE FROM local_order_items WHERE local_id = ?', [order.local_id]);
          await this.db.run('DELETE FROM local_orders WHERE local_id = ?', [order.local_id]);
          count++;
        }
        return count;
      }
      return 0;
    } catch (err) {
      console.error('[SQLite] Error deleting old synced orders:', err);
      return 0;
    }
  }
}

export const dbService = new DatabaseService();

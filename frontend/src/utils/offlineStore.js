import { get, set } from 'idb-keyval';

// Simpan data master
export const saveMasterData = async (key, data) => {
  await set(key, data);
};

// Ambil data master
export const getMasterData = async (key) => {
  return await get(key);
};

// Queue untuk pesanan offline
export const queueOfflineOrder = async (orderData) => {
  const currentQueue = await get('offlineOrders') || [];
  // tambahkan id sementara (timestamp) untuk referensi internal jika diperlukan
  const newOrder = { ...orderData, _offlineId: Date.now() };
  currentQueue.push(newOrder);
  await set('offlineOrders', currentQueue);
  return newOrder;
};

// Ambil antrian pesanan offline
export const getOfflineOrders = async () => {
  return await get('offlineOrders') || [];
};

// Hapus antrian (setelah sync)
export const clearOfflineOrders = async () => {
  await set('offlineOrders', []);
};

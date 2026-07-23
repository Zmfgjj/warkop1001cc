// Simpan data master
export const saveMasterData = async (key, data) => {
  try {
    localStorage.setItem(`master_${key}`, JSON.stringify(data));
  } catch (e) {
    console.error("Gagal saveMasterData ke localStorage", e);
  }
};

// Ambil data master
export const getMasterData = async (key) => {
  try {
    const data = localStorage.getItem(`master_${key}`);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error("Gagal getMasterData dari localStorage", e);
    return null;
  }
};

// Queue untuk pesanan offline
export const queueOfflineOrder = async (orderData) => {
  try {
    const currentQueue = JSON.parse(localStorage.getItem('offlineOrders') || '[]');
    const newOrder = { ...orderData, _offlineId: Date.now() };
    currentQueue.push(newOrder);
    localStorage.setItem('offlineOrders', JSON.stringify(currentQueue));
    return newOrder;
  } catch (e) {
    console.error("Gagal queueOfflineOrder", e);
    return null;
  }
};

// Ambil antrian pesanan offline
export const getOfflineOrders = async () => {
  try {
    return JSON.parse(localStorage.getItem('offlineOrders') || '[]');
  } catch (e) {
    console.error("Gagal getOfflineOrders", e);
    return [];
  }
};

// Hapus antrian (setelah sync)
export const clearOfflineOrders = async () => {
  localStorage.removeItem('offlineOrders');
};

import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import api from '../api/auth';

const CURRENT_APP_VERSION = '1.0.0';

export default function UpdateChecker() {
  const [updateInfo, setUpdateInfo] = useState(null);

  useEffect(() => {
    const checkUpdate = async () => {
      // Hanya cek update jika dijalankan sebagai APK Native
      if (!Capacitor.isNativePlatform()) return;

      try {
        const res = await api.get('/version');
        const { latest_version, force_update, download_url, message } = res.data;

        if (latest_version !== CURRENT_APP_VERSION) {
          setUpdateInfo({ latest_version, force_update, download_url, message });
        }
      } catch (err) {
        console.log('Gagal mengecek update', err);
      }
    };

    checkUpdate();
  }, []);

  if (!updateInfo) return null;

  // Jika force_update true, tampilkan full screen blocker
  if (updateInfo.force_update) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#F9F5F0] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full border-t-4 border-[#634930]">
          <h2 className="text-2xl font-black text-[#634930] mb-2">Update Wajib</h2>
          <p className="text-gray-600 mb-6 text-sm">
            {updateInfo.message || 'Versi aplikasi Warkop Anda sudah kadaluwarsa. Silakan download versi terbaru untuk melanjutkan.'}
          </p>
          <p className="text-xs font-bold text-gray-500 mb-4">Versi Terbaru: {updateInfo.latest_version}</p>
          <a
            href={updateInfo.download_url}
            target="_blank"
            rel="noreferrer"
            className="block w-full py-3 px-4 bg-[#634930] hover:bg-[#4d3925] text-white font-bold rounded-lg shadow-md transition-all text-center"
          >
            Download Sekarang
          </a>
        </div>
      </div>
    );
  }

  // Jika force_update false, tampilkan banner di paling atas layar yang bisa di-close
  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-[#634930] text-white px-4 py-3 shadow-lg flex items-center justify-between">
      <div className="flex-1 pr-4">
        <p className="font-bold text-sm">Update Tersedia ({updateInfo.latest_version})</p>
        <p className="text-xs opacity-90">{updateInfo.message}</p>
      </div>
      <div className="flex items-center gap-2">
        <a
          href={updateInfo.download_url}
          target="_blank"
          rel="noreferrer"
          className="px-3 py-1.5 bg-white text-[#634930] text-xs font-black rounded hover:bg-gray-100 transition-all whitespace-nowrap"
        >
          Update
        </a>
        <button
          onClick={() => setUpdateInfo(null)}
          className="p-1 hover:bg-white/20 rounded transition-all"
        >
          <span className="text-xl leading-none">&times;</span>
        </button>
      </div>
    </div>
  );
}

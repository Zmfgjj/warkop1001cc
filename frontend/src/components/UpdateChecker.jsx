import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import api from '../api/auth';

export const CURRENT_APP_VERSION = '1.0.60'; // Sesuaikan ini setiap kali build APK / OTA baru

export default function UpdateChecker() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');

  useEffect(() => {
    const checkUpdate = async () => {
      // Hanya cek update jika dijalankan sebagai APK Native
      if (!Capacitor.isNativePlatform()) return;

      try {
        const res = await api.get('/version');
        const { latest_version, force_update, download_url, bundle_url, message } = res.data;

        if (latest_version && latest_version !== CURRENT_APP_VERSION) {
          setUpdateInfo({ latest_version, force_update, download_url, bundle_url, message });
        }
      } catch (err) {
        console.log('Gagal mengecek update', err);
      }
    };

    checkUpdate();
  }, []);

  const handleOtaUpdate = async () => {
    if (!updateInfo) return;

    // Jika tidak ada bundle_url, buka link download APK biasa (fallback)
    if (!updateInfo.bundle_url) {
      if (updateInfo.download_url) {
        window.open(updateInfo.download_url, '_blank');
      }
      return;
    }

    setIsUpdating(true);
    setProgress(0);
    setStatusText('Mengunduh paket pembaruan (OTA)...');

    let listener;
    try {
      listener = await CapacitorUpdater.addListener('download', (info) => {
        const pct = Math.round(info.percent || 0);
        setProgress(pct);
        setStatusText(`Mengunduh: ${pct}%`);
      });

      const version = await CapacitorUpdater.download({
        url: updateInfo.bundle_url,
        version: updateInfo.latest_version
      });

      setStatusText('Memasang pembaruan & memuat ulang...');
      await CapacitorUpdater.set({ id: version.id });
      // Setelah dipanggil set(), WebView akan otomatis reload ke versi baru!
    } catch (err) {
      console.error('OTA Update gagal:', err);
      setStatusText('Gagal memasang OTA. Beralih ke download APK...');
      setTimeout(() => {
        setIsUpdating(false);
        if (updateInfo.download_url) {
          window.open(updateInfo.download_url, '_blank');
        }
      }, 2000);
    } finally {
      if (listener && listener.remove) {
        listener.remove();
      }
    }
  };

  if (!updateInfo) return null;

  if (isUpdating) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="bg-[#634930] p-8 rounded-2xl shadow-2xl max-w-sm w-full border border-white/20 flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4" />
          <h3 className="text-lg font-black mb-2">Memperbarui Aplikasi</h3>
          <p className="text-xs opacity-90 mb-4">{statusText}</p>
          <div className="w-full bg-black/30 rounded-full h-3 overflow-hidden p-0.5 border border-white/20">
            <div 
              className="bg-[#0B8500] h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs font-bold mt-2">{progress}%</p>
        </div>
      </div>
    );
  }

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
          <button
            onClick={handleOtaUpdate}
            className="block w-full py-3 px-4 bg-[#634930] hover:bg-[#4d3925] text-white font-bold rounded-lg shadow-md transition-all text-center"
          >
            Update & Restart
          </button>
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
        <button
          onClick={handleOtaUpdate}
          className="px-3 py-1.5 bg-white text-[#634930] text-xs font-black rounded hover:bg-gray-100 transition-all whitespace-nowrap"
        >
          Update & Restart
        </button>
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

import { useNetwork } from '../hooks/useNetwork';

export default function OfflineBanner() {
  const isOnline = useNetwork();

  if (isOnline) return null;

  return (
    <div className="bg-red-500 text-white text-center py-2 px-4 text-sm font-medium z-50 fixed top-0 w-full shadow-md">
      Menjalankan dalam Mode Offline. Pesanan akan disimpan dan otomatis disinkronkan saat terhubung kembali.
    </div>
  );
}

import { useState } from 'react'
import MobileLayout from '../components/MobileLayout'
import { Package, ExternalLink, RefreshCw } from 'lucide-react'

export default function ManajemenStock() {
  const [iframeError, setIframeError] = useState(false)
  const laravelUrl = 'http://localhost:8000'

  return (
    <MobileLayout activeMenu="Manajemen Stock">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 h-full flex flex-col">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#634930] text-white flex items-center justify-center shadow-lg shadow-[#634930]/20">
              <Package size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#634930] tracking-tight">Manajemen Stock (RPL)</h1>
              <p className="text-sm font-medium text-gray-500">Integrasi Sistem Inventory Warkop 1001 CC</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIframeError(false)
                document.getElementById('stock-iframe').src = laravelUrl
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white text-[#634930] rounded-xl font-bold shadow-sm border border-gray-100 hover:bg-gray-50 transition-all"
            >
              <RefreshCw size={18} /> Refresh
            </button>
            <a
              href={laravelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-[#634930] text-white rounded-xl font-bold shadow-md hover:bg-[#4A3320] transition-all"
            >
              <ExternalLink size={18} /> Buka di Tab Baru
            </a>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative min-h-[500px]">
          {iframeError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-amber-50/50">
              <Package size={48} className="text-amber-500 mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Gagal Memuat Sistem Stock</h3>
              <p className="text-gray-500 max-w-md mb-6">
                Sistem stock (Laravel) kemungkinan belum berjalan atau menolak untuk ditampilkan di dalam iframe. 
                Pastikan Anda telah menjalankan perintah <code className="bg-gray-100 px-2 py-1 rounded text-[#634930] font-mono text-sm">php artisan serve</code> di folder RPL.
              </p>
              <a
                href={laravelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-[#634930] text-white rounded-xl font-bold shadow-md hover:bg-[#4A3320] transition-all"
              >
                Buka Sistem Stock di Tab Baru
              </a>
            </div>
          ) : (
            <iframe
              id="stock-iframe"
              src={laravelUrl}
              title="Sistem Manajemen Stock"
              className="w-full h-full border-0"
              onError={() => setIframeError(true)}
              onLoad={(e) => {
                // If it loads a blank page or an error page, we might not be able to catch it cross-origin,
                // but if we do catch an error, it'll show the fallback.
              }}
            />
          )}
        </div>
      </div>
    </MobileLayout>
  )
}

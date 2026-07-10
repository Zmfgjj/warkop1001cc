import { useState } from 'react';
import api from '../api/auth';

// Ambil IP/Domain dasar dari pengaturan API (misal: "http://103.253.213.177/api" menjadi "http://103.253.213.177")
const baseDomain = api.defaults.baseURL.replace(/\/api\/?$/, '');

export default function ImageLoader({ src, alt, className, priority = false }) {
  const [isLoaded, setIsLoaded] = useState(false);

  // Paksa semua gambar "/uploads/..." untuk mengarah ke IP VPS
  const fullSrc = (src && src.startsWith('/uploads/'))
    ? `${baseDomain}${src}`
    : src;

  return (
    <div className={`relative ${className} overflow-hidden bg-gray-200`}>
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gray-300"></div>
      )}
      <img
        src={fullSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        loading={priority ? "eager" : "lazy"}
        fetchpriority={priority ? "high" : "auto"}
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
}

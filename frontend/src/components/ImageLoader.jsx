import { useState } from 'react';
import api from '../api/auth';

// Ambil API base URL (misal: "http://103.253.213.177/api")
const baseURL = api.defaults.baseURL.replace(/\/$/, '');

export default function ImageLoader({ src, alt, className, priority = false }) {
  const [isLoaded, setIsLoaded] = useState(false);

  // Gambar disimpan di DB sebagai "/uploads/...". 
  // Gabungkan dengan baseURL menjadi "http://103.253.213.177/api/uploads/..." agar tembus Nginx proxy.
  const fullSrc = (src && src.startsWith('/uploads/'))
    ? `${baseURL}${src}`
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

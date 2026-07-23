import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Utensils } from 'lucide-react';

const isNative = Capacitor.isNativePlatform();

export default function ImageLoader({ src, alt, className, priority = false }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  let fullSrc = src;
  if (src && src.startsWith('/uploads/')) {
    const serverOrigin = (import.meta.env.VITE_API_URL || 'http://202.155.157.13:3000').replace(/\/api\/?$/, '');
    fullSrc = `${serverOrigin}${src}`;
  }

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-[#F5F0E8] text-[#C4A882] ${className}`}>
        <Utensils size={28} />
      </div>
    );
  }

  return (
    <div className={`relative ${className} overflow-hidden bg-gray-200`}>
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gray-300"></div>
      )}
      <img
        src={fullSrc}
        alt={alt || 'Menu Image'}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        loading={priority ? "eager" : "lazy"}
        fetchpriority={priority ? "high" : "auto"}
        onLoad={() => setIsLoaded(true)}
        onError={(e) => {
          console.error('Image load error for src:', fullSrc);
          setHasError(true);
        }}
      />
    </div>
  );
}

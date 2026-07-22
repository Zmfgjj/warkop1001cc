import { useState } from 'react';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

export default function ImageLoader({ src, alt, className, priority = false }) {
  const [isLoaded, setIsLoaded] = useState(false);

  let fullSrc = src;
  if (src && src.startsWith('/uploads/')) {
    const serverOrigin = (import.meta.env.VITE_API_URL || 'http://202.155.157.13:3000').replace(/\/api\/?$/, '');
    fullSrc = `${serverOrigin}${src}`;
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
          setIsLoaded(true);
        }}
      />
    </div>
  );
}

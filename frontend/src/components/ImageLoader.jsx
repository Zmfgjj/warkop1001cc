import { useState } from 'react';

export default function ImageLoader({ src, alt, className, priority = false }) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`relative ${className} overflow-hidden bg-gray-200`}>
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gray-300"></div>
      )}
      <img
        src={src}
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

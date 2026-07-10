import { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

export function useNetwork() {
  const [isOnline, setNetwork] = useState(window.navigator.onLine);

  useEffect(() => {
    // Standard web fallback
    const updateNetwork = () => {
      setNetwork(window.navigator.onLine);
    };

    window.addEventListener('offline', updateNetwork);
    window.addEventListener('online', updateNetwork);

    // Native Capacitor Network listener (much more accurate)
    let networkListener;
    if (Capacitor.isNativePlatform()) {
      Network.getStatus().then(status => {
        setNetwork(status.connected);
      });
      
      Network.addListener('networkStatusChange', status => {
        setNetwork(status.connected);
      }).then(listener => {
        networkListener = listener;
      });
    }

    return () => {
      window.removeEventListener('offline', updateNetwork);
      window.removeEventListener('online', updateNetwork);
      if (networkListener) {
        networkListener.remove();
      }
    };
  }, []);

  return isOnline;
}

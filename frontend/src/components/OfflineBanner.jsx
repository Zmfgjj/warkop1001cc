import { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';
import { WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const checkNetwork = async () => {
      const status = await Network.getStatus();
      setIsOffline(!status.connected);
    };

    checkNetwork();

    const handler = Network.addListener('networkStatusChange', status => {
      setIsOffline(!status.connected);
    });

    return () => {
      if (handler && handler.remove) {
        handler.remove();
      }
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-amber-100 text-amber-800 px-4 py-1.5 flex items-center justify-center text-xs font-medium z-50">
      <WifiOff className="w-4 h-4 mr-2" />
      <span>Mode Offline - Order akan disinkronisasi saat online</span>
    </div>
  );
}

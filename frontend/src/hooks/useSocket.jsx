import { useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { Capacitor } from '@capacitor/core';

let sharedSocket = null;
let refCount = 0;
let releaseTimer = null;

const socketUrl = Capacitor.isNativePlatform()
  ? (import.meta.env.VITE_API_URL || 'http://202.155.157.13:3000')
  : window.location.origin;

function getSocket() {
  // Batalkan pending disconnect kalau ada komponen baru yang mount
  if (releaseTimer) {
    clearTimeout(releaseTimer);
    releaseTimer = null;
  }
  if (!sharedSocket) {
    sharedSocket = io(socketUrl, {
      reconnection: true,
      reconnectionDelay: 3000,        // Tunggu 3 detik sebelum retry (bukan 1 detik)
      reconnectionDelayMax: 30000,    // Max 30 detik delay (bukan 5 detik)
      randomizationFactor: 0.5,       // Jitter supaya tidak semua client retry bersamaan
      reconnectionAttempts: 20,       // Max 20 percobaan (bukan Infinity)
      transports: ['websocket'],      // Websocket only - hapus polling yang bikin banjir HTTP
      timeout: 10000,                 // Timeout koneksi 10 detik
    });
  }
  refCount++;
  return sharedSocket;
}

function releaseSocket() {
  refCount--;
  if (refCount <= 0) {
    // Debounce disconnect 3 detik - cegah rapid disconnect saat komponen remount
    releaseTimer = setTimeout(() => {
      if (refCount <= 0 && sharedSocket) {
        sharedSocket.disconnect();
        sharedSocket = null;
        refCount = 0;
      }
      releaseTimer = null;
    }, 3000);
  }
}

export function useSocket() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const s = getSocket();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    if (s.connected) setConnected(true);

    setSocket(s);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      releaseSocket();
    };
  }, []);

  const reconnect = useCallback(() => {
    if (sharedSocket) {
      sharedSocket.disconnect();
      sharedSocket.connect();
    }
  }, []);

  return { socket, connected, reconnect };
}

export function useDebouncedCallback(callback, delay = 400) {
  const timerRef = useRef(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const debounced = useCallback((...args) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return debounced;
}

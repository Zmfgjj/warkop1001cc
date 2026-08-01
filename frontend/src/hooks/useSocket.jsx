import { useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { Capacitor } from '@capacitor/core';

let sharedSocket = null;
let refCount = 0;

const socketUrl = Capacitor.isNativePlatform()
  ? (import.meta.env.VITE_API_URL || 'http://202.155.157.13:3000')
  : window.location.origin;

function getSocket() {
  if (!sharedSocket) {
    sharedSocket = io(socketUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      transports: ['websocket', 'polling'],
    });
  }
  refCount++;
  return sharedSocket;
}

function releaseSocket() {
  refCount--;
  if (refCount <= 0 && sharedSocket) {
    sharedSocket.disconnect();
    sharedSocket = null;
    refCount = 0;
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

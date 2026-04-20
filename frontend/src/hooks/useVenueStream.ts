import { useState, useEffect, useRef } from 'react';
import type { VenueSnapshot } from '../types';
import { getApiUrl } from '../utils/config';

/**
 * Custom hook to manage the real-time WebSocket data stream.
 * Handles automatic reconnection, snapshot dispatching, and connection status.
 */
export const useVenueStream = (sessionToken: string | undefined) => {
  const [snapshot, setSnapshot] = useState<VenueSnapshot | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(Date.now());
  
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!sessionToken) return;

    const connect = () => {
      const apiUrl = getApiUrl().trim().replace(/\/$/, "");
      const wsUrl = (apiUrl.startsWith('https') 
        ? apiUrl.replace(/^https/, 'wss') + '/api/ws/venue'
        : apiUrl.replace(/^http/, 'ws') + '/api/ws/venue') + `?token=${sessionToken}`;
      
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setWsConnected(true);
      };

      socket.onmessage = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'SNAPSHOT_UPDATE') {
            setSnapshot(message.data);
            setRefreshTrigger(Date.now());
          }
        } catch (err) {
          console.error('Socket message error:', err);
        }
      };

      socket.onclose = () => {
        setWsConnected(false);
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      socket.onerror = (err) => {
        console.error('WebSocket Error:', err);
        socket.close();
      };
    };

    connect();

    return () => {
      if (socketRef.current) socketRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [sessionToken]);

  return { snapshot, wsConnected, refreshTrigger, setRefreshTrigger };
};

import { useState, useEffect, useRef, useCallback } from 'react';
import type { VenueSnapshot } from '../types';
import { getApiUrl } from '../utils/config';
import { supabase } from '../supabaseClient';

export const useVenueStream = (sessionToken: string | undefined) => {
  const [snapshot, setSnapshot] = useState<VenueSnapshot | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(Date.now());

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectCounterRef = useRef(0);

  const connect = useCallback(() => {
    if (!sessionToken) return;

    if (socketRef.current) {
      socketRef.current.close();
    }

    const apiUrl = getApiUrl().trim().replace(/\/$/, "");
    const wsUrl = (apiUrl.startsWith('https')
      ? apiUrl.replace(/^https/, 'wss') + '/api/ws/venue'
      : apiUrl.replace(/^http/, 'ws') + '/api/ws/venue') + `?token=${sessionToken}`;

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setWsConnected(true);
      reconnectCounterRef.current = 0;
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
      reconnectCounterRef.current += 1;
      const delay = Math.min(1000 * Math.pow(2, reconnectCounterRef.current), 30000);
      reconnectTimeoutRef.current = setTimeout(connect, delay);
    };

    socket.onerror = (err) => {
      console.error('WebSocket Error:', err);
      socket.close();
    };
  }, [sessionToken]);

  useEffect(() => {
    if (!sessionToken) return;

    connect();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        reconnectCounterRef.current = 0;
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        connect();
      }
    });

    return () => {
      subscription.unsubscribe();
      if (socketRef.current) socketRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [sessionToken, connect]);

  return { snapshot, wsConnected, refreshTrigger, setRefreshTrigger };
};

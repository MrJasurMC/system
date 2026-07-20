import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
export const CHARACTER_QUERY_KEY = ['character', 'mine'];

/**
 * Single source of truth for the current character, shared by the Dashboard,
 * the persistent sidebar XP readout, and any reward animation that needs to
 * know "where things stand" without re-fetching itself. Auto-invalidates
 * whenever the server tells us XP/level/gold changed, so every consumer
 * stays in sync without polling.
 */
export function useCharacter() {
  const {
    socket
  } = useAuth();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: CHARACTER_QUERY_KEY,
    queryFn: () => api.get('/characters')
  });
  useEffect(() => {
    if (!socket) return;
    const invalidate = () => queryClient.invalidateQueries({
      queryKey: CHARACTER_QUERY_KEY
    });
    socket.on('level:up', invalidate);
    socket.on('quest:claimed', invalidate);
    socket.on('streak:update', invalidate);
    socket.on('exchange:purchased', invalidate);
    socket.on('item:sold', invalidate);
    return () => {
      socket.off('level:up', invalidate);
      socket.off('quest:claimed', invalidate);
      socket.off('streak:update', invalidate);
      socket.off('exchange:purchased', invalidate);
      socket.off('item:sold', invalidate);
    };
  }, [socket, queryClient]);
  return query;
}
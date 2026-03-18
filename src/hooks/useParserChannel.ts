/**
 * Subscribe to parser WebSocket channel for real-time updates.
 * Replaces polling when Echo/Reverb is configured.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getEcho } from '@/lib/echo';

export interface UseParserChannelCallbacks {
  onParserStarted?: (job: { job: { id: number } }) => void;
  onProgress?: (data: { job: { id: number; progress: { saved: number; errors: number; percent: number; current_action?: string } } }) => void;
  onProductParsed?: (data: { job_id: number; product: { id: number; title: string } }) => void;
  onParserFinished?: (data: { job: { id: number; status: string }; status: string }) => void;
  onParserError?: (data: { message: string; job: { id: number } }) => void;
}

export function useParserChannel(callbacks: UseParserChannelCallbacks = {}) {
  const queryClient = useQueryClient();
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['parser-status'] });
    queryClient.invalidateQueries({ queryKey: ['parser-status-header'] });
    queryClient.invalidateQueries({ queryKey: ['parser-stats'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['logs'] });
  }, [queryClient]);

  useEffect(() => {
    const echo = getEcho();
    if (!echo) return;

    const channel = echo.channel('parser');

    channel
      .listen('.ParserStarted', (data: { job: { id: number } }) => {
        invalidate();
        callbacksRef.current.onParserStarted?.(data);
      })
      .listen('.ParserProgressUpdated', (data: { job: { id: number; progress: { saved: number; errors: number; percent: number; current_action?: string } } }) => {
        invalidate();
        callbacksRef.current.onProgress?.(data);
      })
      .listen('.ProductParsed', (data: { job_id: number; product: { id: number; title: string } }) => {
        invalidate();
        callbacksRef.current.onProductParsed?.(data);
      })
      .listen('.ParserFinished', (data: { job: { id: number; status: string }; status: string }) => {
        invalidate();
        callbacksRef.current.onParserFinished?.(data);
      })
      .listen('.ParserError', (data: { message: string; job: { id: number } }) => {
        invalidate();
        callbacksRef.current.onParserError?.(data);
      });

    return () => {
      echo.leave('parser');
    };
  }, [invalidate]);
}

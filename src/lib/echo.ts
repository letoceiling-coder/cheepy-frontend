/**
 * Laravel Echo + Reverb WebSocket client for real-time parser updates
 */

import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo;
  }
}

const key = import.meta.env.VITE_REVERB_APP_KEY;
const host = import.meta.env.VITE_REVERB_HOST || 'localhost';
const port = parseInt(String(import.meta.env.VITE_REVERB_PORT || '8080'), 10);
const scheme = import.meta.env.VITE_REVERB_SCHEME || 'http';
const useTLS = scheme === 'https';

window.Pusher = Pusher;

let echoInstance: Echo | null = null;

export function getEcho(): Echo | null {
  if (!key) {
    if (import.meta.env.DEV) {
      console.warn('[Echo] VITE_REVERB_APP_KEY not set, WebSocket disabled. Polling every 30s will be used.');
    }
    return null;
  }

  if (!echoInstance) {
    const wsPort = useTLS ? 80 : (port || 8080);
    const wssPort = useTLS ? (port || 443) : 443;
    echoInstance = new Echo({
      broadcaster: 'reverb',
      key,
      wsHost: host,
      wsPort,
      wssPort,
      forceTLS: useTLS,
      enabledTransports: ['ws', 'wss'],
      disableStats: true,
    });
    if (import.meta.env.DEV) {
      console.log('[Echo] WebSocket configured:', { host, wsPort, wssPort, useTLS });
    }
  }

  return echoInstance;
}

export type ParserJob = {
  id: number;
  type: string;
  status: string;
  progress: {
    categories: { done: number; total: number };
    products: { done: number; total: number };
    saved: number;
    errors: number;
    percent: number;
    current_action?: string;
    current_page?: number;
    total_pages?: number;
    current_category?: string;
  };
  error_message?: string;
  started_at?: string;
  finished_at?: string;
  [key: string]: unknown;
};

export type ParserChannelEvents = {
  ParserStarted: (data: { job: ParserJob; timestamp: string }) => void;
  ParserProgressUpdated: (data: { job: ParserJob; timestamp: string }) => void;
  ProductParsed: (data: { job_id: number; job: ParserJob; product: { id: number; external_id: string; title: string }; timestamp: string }) => void;
  ParserFinished: (data: { job: ParserJob; status: string; timestamp: string }) => void;
  ParserError: (data: { job: ParserJob; message: string; context: Record<string, unknown>; timestamp: string }) => void;
};

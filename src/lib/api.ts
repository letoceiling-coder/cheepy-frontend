/**
 * API client for Parser backend (online-parser.siteaacess.store)
 */

const DEFAULT_API_URL = 'https://online-parser.siteaacess.store/api/v1';

function resolveApiBaseUrl(): string {
  const raw = String(import.meta.env.VITE_API_URL || '').trim();
  if (!raw) return DEFAULT_API_URL;

  try {
    const u = new URL(raw);
    const host = (u.hostname || '').toLowerCase();
    const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.loc');
    const isPrivateLan =
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);

    // Never allow local/LAN endpoints in production build runtime.
    if (import.meta.env.PROD && (isLocalHost || isPrivateLan)) {
      return DEFAULT_API_URL;
    }

    // Avoid mixed content on HTTPS pages.
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && u.protocol === 'http:') {
      if (import.meta.env.PROD) {
        return DEFAULT_API_URL;
      }
      u.protocol = 'https:';
      return u.toString().replace(/\/$/, '');
    }

    return u.toString().replace(/\/$/, '');
  } catch {
    return DEFAULT_API_URL;
  }
}

const BASE_URL = resolveApiBaseUrl();

/** Публичные URL из API (`/storage/...`) без домена — браузер резолвит от витрины; подставляем origin бэкенда. */
export function resolveCrmMediaAssetUrl(url: string): string {
  const u = String(url || '').trim();
  if (!u) return '';
  let out: string;
  if (/^https?:\/\//i.test(u)) {
    out = u;
  } else {
    try {
      const origin = new URL(BASE_URL).origin;
      if (u.startsWith('/')) out = `${origin}${u}`;
      else out = `${origin}/${u.replace(/^\/+/, '')}`;
    } catch {
      return u;
    }
  }
  // Mixed content: HTTPS CRM не загрузит http:// картинку с API
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && out.startsWith('http://')) {
    try {
      const x = new URL(out);
      x.protocol = 'https:';
      out = x.toString();
    } catch {
      out = out.replace(/^http:\/\//i, 'https://');
    }
  }
  return out;
}

/** Single source for GET/POST — all `request()` calls use BASE_URL + path */
console.log('API URL', BASE_URL);
if (import.meta.env.DEV) {
  console.log('[API] VITE_API_URL:', import.meta.env.VITE_API_URL || '(default)');
}

// Callback for 401 — logout and redirect (set by AdminAuthProvider)
let onUnauthorized: (() => void) | null = null;
export function setOnUnauthorized(cb: () => void) {
  onUnauthorized = cb;
}

// ──────────────────────────────────────────────
// HTTP helpers
// ──────────────────────────────────────────────

function getToken(): string | null {
  return localStorage.getItem('admin_token');
}

/** Bearer JWT for protected API calls (same token as admin panel). */
function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  isPublic = false
): Promise<T> {
  const token = localStorage.getItem('admin_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (!isPublic) {
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401) {
      // Не вызывать logout при неверном пароле на POST /auth/login или /auth/refresh
      const isAuthFailure = isPublic && (path === '/auth/login' || path === '/auth/refresh');
      if (typeof window !== 'undefined' && !isAuthFailure) {
        const p = window.location.pathname;
        if (p.startsWith('/crm')) {
          const next = encodeURIComponent(p + window.location.search);
          window.location.assign(`/admin/login?next=${next}`);
        } else if (p.startsWith('/admin') && onUnauthorized) {
          onUnauthorized();
        }
      }
      const err = await res.json().catch(() => ({ error: 'Unauthorized' }));
      throw new ApiError(401, err.error || 'Unauthorized');
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: res.statusText }));
      if (import.meta.env.DEV) {
        console.error('[API] Error:', res.status, url, error);
      }
      const errObj = error as { message?: string; error?: string; errors?: Record<string, string[]> };
      const rawMessage = typeof errObj.message === "string" ? errObj.message.trim() : "";
      const rawError = typeof errObj.error === "string" ? errObj.error.trim() : "";
      const msg =
        (rawMessage && rawMessage !== "Bad Request" ? rawMessage : "") ||
        (rawError && rawError !== "Bad Request" ? rawError : "") ||
        rawMessage ||
        rawError ||
        res.statusText;
      throw new ApiError(res.status, msg, errObj.errors);
    }

    if (res.status === 204) return undefined as T;
    const data = await res.json();
    if (import.meta.env.DEV && import.meta.env.VITE_LOG_API === '1') {
      console.log('[API]', method, path, data);
    }
    return data;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (import.meta.env.DEV) {
      console.error('[API] Network/request error:', url, e);
    }
    throw e;
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
  }
}

/** Превью через JWT, если публичный /storage в <img> даёт 404 или mixed content. */
export async function fetchCrmMediaBlobUrl(fileId: number): Promise<string> {
  const token = localStorage.getItem('admin_token');
  if (!token) throw new Error('Требуется вход');
  const url = `${BASE_URL}/admin/media/files/${fileId}/content`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: '*/*' },
  });
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      if (p.startsWith('/crm')) {
        const next = encodeURIComponent(p + window.location.search);
        window.location.assign(`/admin/login?next=${next}`);
      }
    }
    throw new ApiError(401, 'Unauthorized');
  }
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try {
      const j = JSON.parse(text) as { message?: string };
      if (j?.message) msg = j.message;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, msg || res.statusText);
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

const get = <T>(path: string, isPublic = false) => request<T>('GET', path, undefined, isPublic);
const post = <T>(path: string, body?: unknown, isPublic = false) => request<T>('POST', path, body, isPublic);
const put = <T>(path: string, body?: unknown) => request<T>('PUT', path, body);
const patch = <T>(path: string, body?: unknown) => request<T>('PATCH', path, body);
const del = <T>(path: string) => request<T>('DELETE', path);

/** Multipart upload with optional progress callback. */
export async function postFormData<T>(
  path: string,
  formData: FormData,
  onProgress?: (percent: number) => void
): Promise<T> {
  const token = localStorage.getItem('admin_token');
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const url = `${BASE_URL}${path}`;
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));

    xhr.upload.onprogress = (ev) => {
      if (!onProgress) return;
      if (!ev.lengthComputable || ev.total <= 0) return;
      const p = Math.min(100, Math.max(0, Math.round((ev.loaded / ev.total) * 100)));
      onProgress(p);
    };

    xhr.onerror = () => reject(new Error('Network error'));
    xhr.onload = () => {
      const status = xhr.status;
      const text = xhr.responseText || '';
      const json = (() => {
        try {
          return text ? JSON.parse(text) : {};
        } catch {
          return {};
        }
      })();

      if (status === 401) {
        if (typeof window !== 'undefined') {
          const p = window.location.pathname;
          if (p.startsWith('/crm')) {
            const next = encodeURIComponent(p + window.location.search);
            window.location.assign(`/admin/login?next=${next}`);
          }
        }
        reject(new ApiError(401, json.error || 'Unauthorized'));
        return;
      }

      if (status === 204) {
        resolve(undefined as T);
        return;
      }

      if (status < 200 || status >= 300) {
        reject(new ApiError(status, json.error || xhr.statusText || 'Request failed', json.errors));
        return;
      }

      resolve((json ?? {}) as T);
    };

    xhr.send(formData);
  });
}

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; per_page: number; current_page: number; last_page: number };
}

export interface Product {
  id: number;
  external_id: string;
  title: string;
  price: string | null;
  price_raw: number | null;
  status: 'active' | 'hidden' | 'excluded' | 'error' | 'pending';
  is_relevant: boolean;
  photos_count: number;
  thumbnail: string | null;
  category: { id: number; name: string; slug: string } | null;
  seller: { id: number; name: string; slug: string } | null;
  parsed_at: string | null;
}

export interface ProductFull extends Product {
  source_url: string | null;
  description: string | null;
  color: string | null;
  size_range: string | null;
  characteristics: Record<string, string> | null;
  source_link: string | null;
  source_published_at: string | null;
  category_slugs: string[];
  photos: string[];
  photos_downloaded: boolean;
  photos_detail: Array<{
    id: number;
    original_url: string;
    local_path: string | null;
    is_primary: boolean;
    download_status: string;
    sort_order: number;
  }>;
  attributes: Array<{ name: string; value: string; type: string }>;
  brand: { id: number; name: string; slug: string; logo_url: string | null } | null;
}

export interface Category {
  id: number;
  external_slug: string | null;
  name: string;
  slug: string;
  source_url?: string | null;
  parent_id: number | null;
  sort_order: number;
  icon: string | null;
  enabled: boolean;
  linked_to_parser: boolean;
  parser_products_limit?: number | null;
  parser_max_pages?: number | null;
  parser_depth_limit?: number | null;
  products_count: number;
  last_parsed_at: string | null;
  children?: Category[];
}

export interface Seller {
  id: number;
  slug: string;
  name: string;
  avatar?: string | null;
  pavilion: string | null;
  pavilion_line?: string | null;
  pavilion_number?: string | null;
  source_url?: string | null;
  status: string;
  is_verified: boolean;
  products_count: number;
  created_at?: string | null;
}

export interface SellerFull extends Seller {
  source_url: string | null;
  description: string | null;
  last_parsed_at?: string | null;
  contacts?: {
    phone: string | null;
    whatsapp_url: string | null;
    whatsapp_number: string | null;
    telegram_url: string | null;
    vk_url: string | null;
  };
  seller_categories?: string[];
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  status: string;
  seo_title: string | null;
  category_ids: number[];
}

export interface ExcludedRule {
  id: number;
  pattern: string;
  type: 'word' | 'phrase' | 'regex';
  action: 'delete' | 'replace' | 'hide' | 'flag';
  replacement: string | null;
  scope: 'global' | 'category' | 'product_type' | 'temporary';
  category_id: number | null;
  is_active: boolean;
  priority: number;
  expires_at: string | null;
  comment: string | null;
}

export interface FilterConfig {
  id: number;
  category_id: number;
  attr_name: string;
  display_name: string;
  display_type: 'checkbox' | 'select' | 'range' | 'radio';
  sort_order: number;
  is_active: boolean;
  is_filterable: boolean;
  preset_values: string[] | null;
  range_min: number | null;
  range_max: number | null;
}

export interface ParserJob {
  id: number;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: {
    categories: { done: number; total: number };
    products: { done: number; total: number };
    saved: number;
    errors: number;
    photos: { downloaded: number; failed: number };
    percent: number;
    current_action: string | null;
    current_page: number;
    total_pages: number;
    current_category: string | null;
  };
  started_at: string | null;
  finished_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface ParserStatus {
  is_running: boolean;
  daemon_enabled?: boolean;
  parser_state?: 'running' | 'stopped' | 'paused' | 'paused_network';
  current_job: ParserJob | null;
  last_completed: ParserJob | null;
  queue_parser_size?: number;
  queue_default_size?: number;
  queue_photos_size?: number;
  queue_total_size?: number;
  workers_running?: number;
  photo_workers_running?: number;
  queue_workers_stalled?: boolean;
  photo_queue_workers_stalled?: boolean;
  warning?: string | null;
  proxy_blocked?: boolean;
  proxy_blocked_until?: string | null;
  proxy_block_reason?: string | null;
  proxy_last_action?: string | null;
}

export interface DashboardData {
  products: {
    total: number; active: number; hidden: number; new_today: number;
    /** Errors today: products with status=error updated today + parser_logs errors today (same as diagnostics) */
    errors: number;
    /** Total products still in status=error (any date) */
    errors_all_time_products?: number;
    with_photos: number; pending_photos: number;
  };
  categories: {
    total: number;
    enabled: number;
    linked_to_parser: number;
    /** Сколько категорий реально пойдёт в полный прогон парсера (учитывает фильтр default_category_ids). */
    selected_for_parser?: number;
  };
  sellers: { total: number; active: number };
  parser: {
    is_running: boolean;
    current_job: { id: number; status: string; current_action: string | null; saved_products: number; progress_percent: number } | null;
    last_run_at: string | null;
    last_run_saved: number | null;
  };
  weekly_stats: Record<string, number>;
  top_categories: Array<{ id: number; name: string; slug: string; products_count: number }>;
  recent_logs: Array<{ id: number; level: string; module: string; message: string; logged_at: string }>;
}

export interface Setting {
  value: string | number | boolean | null;
  type: string;
  label: string | null;
  description: string | null;
}

export interface LogEntry {
  id: number;
  job_id: number | null;
  level: 'info' | 'warn' | 'error' | 'debug';
  module: string;
  message: string;
  context: unknown;
  logged_at: string;
}

// ──────────────────────────────────────────────
// AUTH
// ──────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    post<{ token: string; user: { id: number; name: string; email: string; role: string } }>(
      '/auth/login', { email, password }, true
    ),
  me: () => get<{ user: { id: number; name: string; email: string; role: string } }>('/auth/me'),
  refresh: () => post<{ token: string }>('/auth/refresh'),
  logout: () => { localStorage.removeItem('admin_token'); },
};

// ──────────────────────────────────────────────
// DASHBOARD
// ──────────────────────────────────────────────

export const dashboardApi = {
  get: () => get<DashboardData>('/dashboard'),
};

// ──────────────────────────────────────────────
// SYSTEM MONITORING
// ──────────────────────────────────────────────

export interface SystemStatus {
  error_metrics?: {
    today_total: number;
    today_products: number;
    today_parser_logs: number;
    last_15m: number;
    last_1h: number;
    last_24h: number;
  };
  error_reasons?: Array<{
    module: string;
    message: string;
    count: number;
    last_seen: string;
    age_minutes?: number;
    is_active_15m?: boolean;
  }>;
  error_reasons_last_1h?: Array<{
    module: string;
    message: string;
    count: number;
    last_seen: string;
    age_minutes?: number;
    is_active_15m?: boolean;
  }>;
  recent_error_logs?: Array<{
    id: number;
    module: string;
    message: string;
    logged_at: string;
  }>;
  parser_running: boolean;
  queue_workers: number;
  parser_warning?: string | null;
  queue_size: number;
  products_total: number;
  products_today: number;
  errors_today: number;
  last_parser_run: string | null;
  redis_status: string;
  websocket: string;
  cpu_load: string;
  memory_usage: string;
  disk?: { used: number; total: number };
  timestamp: string;
  requests_per_minute?: number;
  blocked_requests?: number;
  retry_count?: number;
}

export const systemApi = {
  status: () => get<SystemStatus>('/system/status'),
};

// ──────────────────────────────────────────────
// PARSER
// ──────────────────────────────────────────────

export interface StartParserOptions {
  type?: 'full' | 'menu_only' | 'category' | 'seller';
  /** Category IDs to parse (e.g. [1, 2, 3]). Backend filters to these only when provided. */
  categories?: number[];
  linked_only?: boolean;
  products_per_category?: number;
  max_pages?: number;
  no_details?: boolean;
  save_photos?: boolean;
  save_to_db?: boolean;
  category_slug?: string;
}

export interface ErrorsTodayBreakdown {
  products_status_error: number;
  parser_logs_error: number;
}

export interface ParserStats {
  products_total: number;
  products_today: number;
  parser_running: boolean;
  queue_size: number;
  errors_today: number;
  /** Sum of products with status=error (today) + parser_logs level=error (today); see diagnostics/system error_metrics */
  errors_today_breakdown?: ErrorsTodayBreakdown;
  last_parser_run: string | null;
}

export interface ParserDiagnostics {
  workers_running: number;
  /** Воркеры очереди `photos` (отдельно от parser). */
  photo_workers_running?: number;
  /** В очереди parser/default есть задачи, но нет процессов `queue:work` для `parser`. */
  queue_workers_stalled?: boolean;
  /** В очереди photos есть задачи, но нет воркеров для `photos`. */
  photo_queue_workers_stalled?: boolean;
  /** Отладка: сколько нашли через supervisor vs ps */
  workers_detection?: {
    supervisor_parser: number;
    ps_parser: number;
    supervisor_photo: number;
    ps_photo: number;
  };
  worker_status?: 'running' | 'stopped';
  parser_running: boolean;
  /** То же, что parser_state === running: демон включён. */
  daemon_enabled?: boolean;
  parser_state?: 'running' | 'stopped' | 'paused' | 'paused_network';
  parser_queue_size: number;
  photos_queue_size: number;
  failed_jobs_count: number;
  parser_lock_status: 'held' | 'free';
  products_total: number;
  products_today: number;
  errors_today: number;
  errors_today_breakdown?: ErrorsTodayBreakdown;
  memory_usage?: number | string | null;
  last_errors?: Array<{
    id: number;
    level: string;
    message: string;
    logged_at: string;
    url?: string | null;
    attempt?: number | null;
  }>;
  error_frequency?: {
    last_hour?: number;
  };
  proxy_status?: 'ok' | 'failed';
  proxy_blocked?: boolean;
  proxy_blocked_until?: string | null;
  proxy_block_reason?: string | null;
  proxy_block_streak?: number;
  proxy_last_action?: string | null;
  proxy_last_url?: string | null;
  sadovodbaza_status?: 'ok' | 'failed';
  progress?: {
    job_id?: number;
    total_items: number;
    processed_items: number;
    failed_items: number;
    current_url?: string | null;
    speed_per_min?: number;
    updated_at?: string | null;
  } | null;
  metrics?: {
    products_per_minute?: number;
    requests_per_minute?: number;
    blocked_requests?: number;
    retry_count?: number;
  };
  /** Сводное предупреждение (орфаны, переполнение, воркеры остановлены и т.д.) */
  warning?: string | null;
}

export interface ParserHealth {
  parser_state: 'running' | 'stopped' | 'paused' | 'paused_network';
  queue_size: {
    parser: number;
    photos: number;
    total: number;
  };
  workers: number;
  proxy_status: 'ok' | 'failed';
  proxy_blocked?: boolean;
  proxy_blocked_until?: string | null;
  proxy_block_reason?: string | null;
  proxy_last_action?: string | null;
  sadovodbaza_status: 'ok' | 'failed';
  timestamp: string;
}

export interface ParserSettings {
  id: number;
  download_photos: boolean;
  store_photo_links: boolean;
  download_medium: boolean;
  update_existing: boolean;
  incremental_tail_pages: number;
  update_availability_only: boolean;
  daemon_interval_seconds: number;
  max_workers: number;
  request_delay_min: number;
  request_delay_max: number;
  timeout_seconds: number;
  workers_parser: number;
  workers_photos: number;
  proxy_enabled: boolean;
  /** Legacy single URL; kept in sync with proxy_urls[0] on backend */
  proxy_url?: string | null;
  /** Multiple proxy endpoints for rotation (preferred over proxy_url alone) */
  proxy_urls?: string[] | null;
  queue_threshold: number;
  /** Persisted defaults for daemon / full runs (POST /admin/parser/settings) */
  default_max_pages?: number;
  default_products_per_category?: number;
  default_linked_only?: boolean;
  default_category_ids?: number[];
  default_no_details?: boolean;
}

export interface ParserProgressOverview {
  total_items: number;
  processed_items: number;
  failed_items: number;
  current_url: string | null;
  speed_per_min: number;
  updated_at: string | null;
}

export interface ParserStateResponse {
  status: 'running' | 'stopped' | 'paused' | 'paused_network';
  locked: boolean;
  last_start: string | null;
  last_stop: string | null;
  proxy_blocked?: boolean;
  proxy_blocked_until?: string | null;
  proxy_block_reason?: string | null;
  proxy_last_action?: string | null;
  updated_at: string;
}

/** Parser admin API — Laravel registers routes under api/v1/admin/parser/* */
export const parserApi = {
  status: () => get<ParserStatus>('/admin/parser/status'),
  state: () => get<ParserStateResponse>('/admin/parser/state'),
  settings: () => get<ParserSettings>('/admin/parser/settings'),
  updateSettings: (payload: Partial<ParserSettings>) =>
    post<{ message: string; data: ParserSettings }>('/admin/parser/settings', payload),
  stats: () => get<ParserStats>('/admin/parser/stats'),
  diagnostics: () => get<ParserDiagnostics>('/admin/parser/diagnostics'),
  health: () => get<ParserHealth>('/admin/parser/health'),
  progressOverview: (jobId?: number) =>
    get<ParserProgressOverview>(`/admin/parser/progress-overview${jobId ? `?job_id=${jobId}` : ''}`),
  start: (opts?: StartParserOptions) => post<{ message: string; job_id: number; job: ParserJob }>('/admin/parser/start', opts),
  startDaemon: () => post<{ message: string; daemon_enabled: boolean }>('/admin/parser/start-daemon'),
  stop: () => post<{ message: string }>('/admin/parser/stop'),
  stopDaemon: () => post<{ message: string; daemon_enabled: boolean }>('/admin/parser/stop-daemon'),
  pause: () => post<{ message: string; status: string }>('/admin/parser/pause'),
  restart: () => post<{ message: string }>('/admin/parser/restart'),
  queueClear: (queue: 'parser' | 'photos' | 'default' = 'parser') =>
    post<{ message: string }>('/admin/parser/queue-clear', { queue }),
  queueFlush: () => post<{ message: string; queues: string[] }>('/admin/parser/queue-flush'),
  queueRestart: () => post<{ message: string }>('/admin/parser/queue-restart'),
  clearFailedJobs: () => post<{ message: string }>('/admin/parser/clear-failed'),
  failedJobs: () => get<{ data: Array<{ id: number; uuid: string; queue: string; display_name: string; exception: string | null; failed_at: string }> }>('/admin/parser/failed-jobs'),
  retryJob: (id: number) => post<{ message: string }>(`/admin/parser/retry-job/${id}`),
  killStuck: (idleMinutes?: number) =>
    post<{ message: string }>('/admin/parser/kill-stuck', idleMinutes ? { idle_minutes: idleMinutes } : undefined),
  releaseLock: () => post<{ message: string }>('/admin/parser/release-lock'),
  reset: () => post<{ message: string }>('/admin/parser/reset'),
  jobs: (page = 1, perPage = 20) => get<PaginatedResponse<ParserJob>>(`/admin/parser/jobs?page=${page}&per_page=${perPage}`),
  jobDetail: (id: number) => get<ParserJob & { logs: LogEntry[] }>(`/admin/parser/jobs/${id}`),
  downloadPhotos: (opts?: { limit?: number; product_id?: number }) =>
    post<{ downloaded: number; failed: number; skipped: number; products: number }>('/admin/parser/photos/download', opts),

  /** Sync categories from donor. Parses donor menu, creates/updates categories, builds tree. */
  categoriesSync: () =>
    post<{ message: string; created: number; updated: number; last_synced_at?: string }>('/admin/parser/categories/sync'),

  /** URL for SSE progress stream (EventSource doesn't support Auth header) */
  progressUrl: (jobId?: number): string => {
    const params = new URLSearchParams();
    if (jobId) params.set('job_id', String(jobId));
    const t = getToken();
    if (t) params.set('token', t);
    return `${BASE_URL}/admin/parser/progress${params.toString() ? '?' + params : ''}`;
  },
  /** SSE stream — возвращает EventSource */
  progressStream: (jobId?: number): EventSource => {
    return new EventSource(parserApi.progressUrl(jobId));
  },
};

// ──────────────────────────────────────────────
// PRODUCTS (Admin)
// ──────────────────────────────────────────────

export interface ProductFilters {
  search?: string;
  status?: string;
  category_id?: number;
  seller_id?: number;
  photos_only?: boolean;
  no_photos?: boolean;
  price_from?: number;
  price_to?: number;
  is_relevant?: boolean;
  sort_by?: 'parsed_at' | 'price_raw' | 'title' | 'created_at' | 'photos_count';
  sort_dir?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export const productsApi = {
  list: (filters: ProductFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') params.set(k, String(v)); });
    return get<PaginatedResponse<Product>>(`/admin/parser/products?${params}`);
  },
  get: (id: string | number) => get<ProductFull>(`/admin/parser/products/${id}`),
  update: (id: number, data: Partial<ProductFull>) => patch<ProductFull>(`/admin/parser/products/${id}`, data),
  delete: (id: number) => del(`/admin/parser/products/${id}`),
  bulk: (ids: number[], action: 'delete' | 'hide' | 'publish') =>
    post<{ message: string }>('/admin/parser/products/bulk', { ids, action }),
};

// ──────────────────────────────────────────────
// CATEGORIES (Admin)
// ──────────────────────────────────────────────

export const categoriesApi = {
  list: (params?: { tree?: boolean; search?: string; enabled_only?: boolean; per_page?: number }) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined) q.set(k, String(v)); });
    return get<{ data: Category[]; total?: number }>(`/categories?${q}`);
  },
  get: (id: number) => get<Category & { parent: Category | null; parser_settings: Record<string, number> }>(`/categories/${id}`),
  update: (id: number, data: Partial<Category & { parser_settings: Record<string, number> }>) =>
    patch<Category>(`/categories/${id}`, data),
  reorder: (items: Array<{ id: number; sort_order: number; parent_id?: number | null }>) =>
    post('/categories/reorder', { items }),
  availableFilters: (id: number) => get<{ category_id: number; attributes: Array<{ attr_name: string; values: string[] }> }>(
    `/categories/${id}/filters`
  ),
};

// ──────────────────────────────────────────────
// ADMIN CATALOG (donor/catalog mapping)
// ──────────────────────────────────────────────

export interface MappingSuggestion {
  donor_id: number;
  donor_name: string;
  catalog_id: number;
  catalog_name: string;
  score: number;
}

export interface CatalogCategoryItem {
  id: number;
  name: string;
  slug: string;
  parent_id?: number | null;
  sort_order?: number;
  is_active?: boolean;
  products_count?: number;
}

export interface CategoryMappingItem {
  id: number;
  donor_category_id: number;
  catalog_category_id: number;
  confidence?: number;
  is_manual?: boolean;
  donor_category?: { id: number; name: string; slug: string };
  catalog_category?: { id: number; name: string; slug: string };
}

export const adminCatalogApi = {
  mappingSuggestions: (params?: { limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.limit != null) q.set('limit', String(params.limit));
    return get<{ data: MappingSuggestion[] }>(`/admin/catalog/mapping/suggestions${q.toString() ? `?${q}` : ''}`);
  },
  categoryMappingList: (params?: { per_page?: number; page?: number }) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined) q.set(k, String(v)); });
    return get<{ data: CategoryMappingItem[]; meta: { total: number; per_page: number; current_page: number; last_page: number } }>(
      `/admin/catalog/category-mapping${q.toString() ? `?${q}` : ''}`
    );
  },
  catalogCategoriesList: (params?: { per_page?: number; page?: number }) => {
    const q = new URLSearchParams();
    if (params?.per_page != null) q.set('per_page', String(params.per_page));
    if (params?.page != null) q.set('page', String(params.page));
    return get<{
      data: CatalogCategoryItem[];
      meta?: { total: number; per_page: number; current_page: number; last_page: number };
    }>(`/admin/catalog/categories${q.toString() ? `?${q}` : ''}`);
  },
  /** Same-level order; body is JSON array [{ id, sort_order }, ...] */
  catalogCategoriesReorder: (items: Array<{ id: number; sort_order: number }>) =>
    patch<{ message?: string }>('/admin/catalog/categories/reorder', items),
  catalogCategoryPatch: (id: number, body: { name?: string; is_active?: boolean; parent_id?: number | null }) =>
    patch<CatalogCategoryItem>(`/admin/catalog/categories/${id}`, body),
  catalogCategoryStore: (data: {
    name: string;
    slug: string;
    parent_id?: number | null;
    sort_order?: number;
    is_active?: boolean;
  }) => post<CatalogCategoryItem>('/admin/catalog/categories', data),
  catalogCategoryDelete: (id: number) =>
    del<{ message?: string }>(`/admin/catalog/categories/${id}`),
  createMapping: (body: { donor_category_id: number; catalog_category_id: number; confidence?: number; is_manual?: boolean }) =>
    post<{ data: CategoryMappingItem }>('/admin/catalog/category-mapping', body).then((r) => r.data),
};

// ──────────────────────────────────────────────
// SELLERS (Admin)
// ──────────────────────────────────────────────

export interface AdminSellerProductsParams {
  page?: number;
  per_page?: number;
  category_id?: number;
  status?: string;
  price_from?: number;
  price_to?: number;
  search?: string;
  sort_by?: 'parsed_at' | 'price_raw' | 'title' | 'created_at';
  sort_dir?: 'asc' | 'desc';
}

export const sellersApi = {
  list: (params?: { search?: string; status?: string; pavilion?: string; has_products?: boolean; page?: number; per_page?: number }) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined) q.set(k, String(v)); });
    return get<PaginatedResponse<Seller>>(`/admin/parser/sellers?${q}`);
  },
  get: (idOrSlug: string | number) => get<SellerFull>(`/admin/parser/sellers/${idOrSlug}`),
  products: (idOrSlug: string | number, params?: AdminSellerProductsParams) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined) q.set(k, String(v)); });
    return get<PaginatedResponse<Product> & { seller: Seller }>(`/admin/parser/sellers/${idOrSlug}/products?${q}`);
  },
  update: (id: number, data: Partial<Seller>) => patch<Seller>(`/admin/parser/sellers/${id}`, data),
};

// ──────────────────────────────────────────────
// BRANDS (Admin)
// ──────────────────────────────────────────────

export const brandsApi = {
  list: (params?: { search?: string; status?: string; page?: number }) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined) q.set(k, String(v)); });
    return get<{ data: Brand[]; total: number }>(`/brands?${q}`);
  },
  get: (id: number) => get<Brand>(`/brands/${id}`),
  create: (data: Partial<Brand>) => post<Brand>('/brands', data),
  update: (id: number, data: Partial<Brand>) => put<Brand>(`/brands/${id}`, data),
  delete: (id: number) => del(`/brands/${id}`),
};

// ──────────────────────────────────────────────
// EXCLUDED RULES (Admin)
// ──────────────────────────────────────────────

export const excludedApi = {
  list: (params?: { scope?: string; type?: string; active_only?: boolean; per_page?: number }) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined) q.set(k, String(v)); });
    return get<{ data: ExcludedRule[]; total: number }>(`/excluded?${q}`);
  },
  create: (data: Partial<ExcludedRule>) => post<ExcludedRule>('/excluded', data),
  update: (id: number, data: Partial<ExcludedRule>) => put<ExcludedRule>(`/excluded/${id}`, data),
  delete: (id: number) => del(`/excluded/${id}`),
  test: (text: string, field?: string, categoryId?: number) =>
    post<{ original: string; result: string; flagged: boolean; hide: boolean; delete: boolean }>(
      '/excluded/test', { text, field, category_id: categoryId }
    ),
};

// ──────────────────────────────────────────────
// FILTERS CONFIG (Admin)
// ──────────────────────────────────────────────

export const filtersApi = {
  list: (categoryId?: number, activeOnly?: boolean) => {
    const q = new URLSearchParams();
    if (categoryId) q.set('category_id', String(categoryId));
    if (activeOnly) q.set('active_only', '1');
    return get<{ data: FilterConfig[] }>(`/filters?${q}`);
  },
  create: (data: Partial<FilterConfig>) => post<FilterConfig>('/filters', data),
  update: (id: number, data: Partial<FilterConfig>) => put<FilterConfig>(`/filters/${id}`, data),
  delete: (id: number) => del(`/filters/${id}`),
  values: (categoryId: number) =>
    get<{ category_id: number; filters: Array<{ attr_name: string; display_name: string; display_type: string; values?: string[]; min?: number; max?: number }> }>(
      `/filters/${categoryId}/values`
    ),
};

// ──────────────────────────────────────────────
// ADMIN USERS (Admin — users.manage)
// ──────────────────────────────────────────────

export interface AdminUserRecord {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  roles: Array<{ id: number; name: string; slug: string }>;
  created_at?: string;
}

export interface RoleRecord {
  id: number;
  name: string;
  slug: string;
  users_count?: number;
}

export const adminUsersApi = {
  list: (params?: { search?: string; page?: number; per_page?: number }) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined) q.set(k, String(v)); });
    return get<{ data: AdminUserRecord[]; meta: { total: number; per_page: number; current_page: number; last_page: number } }>(`/admin/users?${q}`);
  },
  create: (data: { name: string; email: string; password: string; role?: string; is_active?: boolean; role_ids?: number[] }) =>
    post<AdminUserRecord>('/admin/users', data),
  update: (id: number, data: Partial<{ name: string; email: string; password?: string; role: string; is_active: boolean; role_ids: number[] }>) =>
    put<AdminUserRecord>(`/admin/users/${id}`, data),
  delete: (id: number) => del(`/admin/users/${id}`),
};

export const adminRolesApi = {
  list: (params?: { page?: number; per_page?: number }) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined) q.set(k, String(v)); });
    return get<{ data: RoleRecord[]; meta: { total: number; per_page: number; current_page: number; last_page: number } }>(`/admin/roles?${q}`);
  },
  create: (data: { name: string; slug: string }) => post<RoleRecord>('/admin/roles', data),
  update: (id: number, data: Partial<{ name: string; slug: string }>) => put<RoleRecord>(`/admin/roles/${id}`, data),
  delete: (id: number) => del(`/admin/roles/${id}`),
};

// ──────────────────────────────────────────────
// SYSTEM PRODUCTS (Admin — CRM)
// ──────────────────────────────────────────────

export type SystemProductStatus = 'draft' | 'pending' | 'approved' | 'published' | 'needs_review';

export interface SystemProductItem {
  id: number;
  name: string;
  description?: string | null;
  price?: string | null;
  price_raw?: number | null;
  status: SystemProductStatus;
  seller_id?: number | null;
  category_id?: number | null;
  /** Витринная категория из category_mapping по донорской категории (если в БД category_id ещё null). */
  mapping_suggested_category_id?: number | null;
  brand_id?: number | null;
  /**
   * Ручной порядок в списках/блоках витрины (меньше — выше при сортировке по позиции).
   * Публичный каталог: sort_by=position в категории.
   */
  list_position?: number;
  /** URL превью для списков (CRM-фото или донор). */
  thumbnail_url?: string | null;
  created_at?: string;
  updated_at?: string;
  seller?: { id: number; name: string; slug: string } | null;
  category?: { id: number; name: string; slug: string } | null;
  brand?: { id: number; name: string; slug: string } | null;
  /** Полный ответ GET /admin/system-products/:id */
  attributes?: Array<{
    attr_name: string;
    attr_value: string;
    attr_type?: string;
    value_int?: number | null;
    value_float?: number | null;
  }>;
  photos?: Array<{
    id?: number;
    url: string;
    is_primary?: boolean;
    sort_order?: number;
    is_enabled?: boolean;
    media_file_id?: number | null;
  }>;
  donor_sources?: Array<{
    donor_product_id: number;
    source?: string;
    donor?: {
      id: number;
      external_id?: string;
      title?: string;
      price?: string;
      source_url?: string;
      photos?: string[];
      thumbnail?: string | null;
      category?: { id: number; name: string; slug: string };
      seller?: { id: number; name: string; slug: string };
    } | null;
  }>;
  product_sources?: Array<{
    id: number;
    product_id: number;
    product?: { id: number; external_id?: string; title?: string; source_url?: string } | null;
  }>;
}

export const adminSystemProductsApi = {
  list: (params?: {
    status?: string;
    search?: string;
    page?: number;
    per_page?: number;
    category_id?: number;
    seller_id?: number;
    sort_by?: 'created_at' | 'updated_at' | 'name' | 'status' | 'price_raw' | 'list_position';
    sort_dir?: 'asc' | 'desc';
  }) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined) q.set(k, String(v)); });
    return get<{ data: SystemProductItem[]; meta: { total: number; per_page: number; current_page: number; last_page: number } }>(
      `/admin/system-products${q.toString() ? `?${q}` : ''}`
    );
  },
  get: (id: number) => get<SystemProductItem>(`/admin/system-products/${id}`),
  /** Решение модерации — только статус (бэкенд: PATCH .../moderate). */
  moderate: (id: number, body: { status: SystemProductStatus }) =>
    patch<SystemProductItem>(`/admin/system-products/${id}/moderate`, body),
  /** Редактор каталога: поля карточки без смены статуса через этот метод. */
  update: (
    id: number,
    body: Partial<Pick<SystemProductItem, "name" | "description" | "price" | "price_raw" | "seller_id" | "category_id" | "brand_id" | "list_position">>
  ) => patch<SystemProductItem>(`/admin/system-products/${id}`, body),
  /** Только CRM: атрибуты карточки (парсер не меняется). */
  syncCrmAttributes: (id: number, body: { attributes: Array<{ attr_name: string; attr_value?: string | null }> }) =>
    patch<SystemProductItem>(`/admin/system-products/${id}/crm-attributes`, body),
  /** Только CRM: фото, порядок, вкл/выкл (парсер не меняется). */
  syncCrmPhotos: (
    id: number,
    body: {
      photos: Array<{
        id?: number | null;
        url: string;
        sort_order: number;
        is_primary?: boolean;
        is_enabled?: boolean;
        media_file_id?: number | null;
      }>;
    }
  ) => patch<SystemProductItem>(`/admin/system-products/${id}/crm-photos`, body),
};

export type SiteAlChatResponse = {
  reply: string | null;
  conversationId?: string | null;
};

export type SiteAlPhotoVerifyOptions = {
  minConfidence?: number;
  concurrency?: number;
  language?: "ru" | "en";
};

export type SiteAlPhotoVerifyRequest = {
  productName: string;
  description?: string | null;
  color?: string | null;
  photos: Array<{ url: string }>;
  options?: SiteAlPhotoVerifyOptions;
};

export type SiteAlPhotoVerifyResultItem = {
  url: string;
  active: boolean;
  match?: boolean;
  confidence?: number;
  issues?: string[];
  error?: string;
};

export type SiteAlPhotoVerifyResponse = {
  productName?: string;
  description?: string | null;
  color?: string | null;
  modelUsed?: string;
  minConfidence?: number;
  photos: SiteAlPhotoVerifyResultItem[];
};

/** Прокси к внешнему агенту site-al (ключ на бэкенде). */
export const adminSiteAlApi = {
  chat: (body: {
    message: string;
    conversationId?: string | null;
    agentId?: string;
    model?: string;
  }) => post<SiteAlChatResponse>('/admin/site-al/chat', body),
  verifyProductPhotos: (body: SiteAlPhotoVerifyRequest) =>
    post<SiteAlPhotoVerifyResponse>("/admin/site-al/product-photos/verify", body),
};

// ──────────────────────────────────────────────
// CRM MEDIA LIBRARY
// ──────────────────────────────────────────────

export interface CrmMediaFolder {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  is_system: boolean;
  sort_order: number;
}

export interface CrmMediaFile {
  id: number;
  folder_id: number;
  original_name: string;
  mime_type: string | null;
  size_bytes: number;
  url: string;
  restore_folder_id: number | null;
}

export const crmMediaApi = {
  folders: (params?: { parent_id?: number | null }) => {
    const q = new URLSearchParams();
    if (params?.parent_id !== undefined && params.parent_id !== null) q.set('parent_id', String(params.parent_id));
    return get<{ data: CrmMediaFolder[] }>(`/admin/media/folders${q.toString() ? `?${q}` : ''}`);
  },
  createFolder: (body: { name: string; parent_id?: number | null }) =>
    post<CrmMediaFolder>('/admin/media/folders', body),
  updateFolder: (id: number, body: { name: string }) => patch<CrmMediaFolder>(`/admin/media/folders/${id}`, body),
  deleteFolder: (id: number) => del(`/admin/media/folders/${id}`),
  files: (params: {
    folder_id: number;
    search?: string;
    mime?: string;
    page?: number;
    per_page?: number;
  }) => {
    const q = new URLSearchParams();
    q.set('folder_id', String(params.folder_id));
    if (params.search) q.set('search', params.search);
    if (params.mime) q.set('mime', params.mime);
    if (params.page) q.set('page', String(params.page));
    if (params.per_page) q.set('per_page', String(params.per_page));
    return get<{ data: CrmMediaFile[]; meta: PaginatedResponse<CrmMediaFile>['meta'] }>(`/admin/media/files?${q}`);
  },
  /**
   * По одному файлу на запрос: сбой одного не отменяет остальные.
   * Возвращает загруженные записи и список ошибок по имени файла.
   */
  upload: async (
    folderId: number,
    files: File[],
    onProgress?: (percent: number) => void
  ): Promise<{
    data: CrmMediaFile[];
    failures: Array<{ name: string; status: number; message: string }>;
  }> => {
    const data: CrmMediaFile[] = [];
    const failures: Array<{ name: string; status: number; message: string }> = [];
    const n = files.length;
    if (n === 0) return { data: [], failures: [] };

    for (let i = 0; i < n; i++) {
      const file = files[i];
      const fd = new FormData();
      fd.append('folder_id', String(folderId));
      fd.append('files[]', file);
      try {
        const res = await postFormData<{ data: CrmMediaFile[] }>('/admin/media/files', fd, (p) => {
          if (!onProgress) return;
          const overall = Math.round((i * 100 + p) / n);
          onProgress(overall);
        });
        data.push(...(res.data ?? []));
      } catch (e: unknown) {
        const ae = e instanceof ApiError ? e : null;
        failures.push({
          name: file.name,
          status: ae?.status ?? 0,
          message: ae?.message ?? (e instanceof Error ? e.message : String(e)),
        });
      }
    }
    return { data, failures };
  },
  moveFiles: (body: { file_ids: number[]; folder_id: number }) =>
    post<{ message: string }>('/admin/media/files/move', body),
  restoreFile: (id: number) => post<CrmMediaFile>(`/admin/media/files/${id}/restore`, {}),
  emptyTrash: () => post<{ message: string }>('/admin/media/trash/empty', {}),
};

// ──────────────────────────────────────────────
// LOGS (Admin)
// ──────────────────────────────────────────────

export const logsApi = {
  list: (params?: { level?: string; module?: string; job_id?: number; search?: string; page?: number; per_page?: number }) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined) q.set(k, String(v)); });
    return get<PaginatedResponse<LogEntry>>(`/logs?${q}`);
  },
  clear: (before?: string) => del(`/logs/clear${before ? `?before=${before}` : ''}`),
};

// ──────────────────────────────────────────────
// SETTINGS (Admin)
// ──────────────────────────────────────────────

export const settingsApi = {
  list: (group?: string) =>
    get<{ data: Record<string, Record<string, Setting>> }>(`/settings${group ? `?group=${group}` : ''}`),
  update: (settings: Record<string, unknown>) => put<{ message: string; count: number }>('/settings', { settings }),
  updateOne: (key: string, value: unknown, group?: string) =>
    put(`/settings/${key}`, { value, group }),
};

// ──────────────────────────────────────────────
// PUBLIC API (user-facing pages)
// ──────────────────────────────────────────────

export const publicApi = {
  menu: () => get<{ categories: Category[] }>('/public/menu', true),
  globalLayout: () =>
    get<{
      template_key: string | null;
      updated_at: string | null;
      blocks: Array<{
        block_type: string;
        settings: Record<string, unknown>;
        is_enabled: boolean;
        is_visible: boolean;
        sort_order: number;
      }>;
    }>('/public/layout/global', true),
  pageLayout: (pageKey: string) =>
    get<{
      template_key: string | null;
      updated_at: string | null;
      blocks: Array<{
        block_type: string;
        settings: Record<string, unknown>;
        is_enabled: boolean;
        is_visible: boolean;
        sort_order: number;
      }>;
    }>(`/public/layout/page/${encodeURIComponent(pageKey)}`, true),

  categoryProducts: (
    slug: string,
    params?: { page?: number; per_page?: number; sort_by?: string; search?: string; price_from?: number; price_to?: number; [key: string]: unknown }
  ) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined) q.set(k, String(v)); });
    return get<{
      category: { id: number; name: string; slug: string };
      filters: Array<{ attr_name: string; display_name: string; display_type: string; values?: string[] }>;
      data: Product[];
      meta: PaginatedResponse<Product>['meta'];
    }>(`/public/categories/${slug}/products?${q}`, true);
  },

  product: (externalId: string) =>
    get<{ product: ProductFull; seller_products: Product[] }>(`/public/products/${externalId}`, true),

  seller: (slug: string, page = 1) =>
    get<{ seller: SellerFull; data: Product[]; meta: PaginatedResponse<Product>['meta'] }>(
      `/public/sellers/${slug}?page=${page}`, true
    ),

  search: (q: string, page = 1, perPage = 20) =>
    get<{ query: string; data: Product[]; meta: PaginatedResponse<Product>['meta'] }>(
      `/public/search?q=${encodeURIComponent(q)}&page=${page}&per_page=${perPage}`, true
    ),

  featured: (limit = 24) =>
    get<{ data: Product[] }>(`/public/featured?limit=${limit}`, true),
};

// ──────────────────────────────────────────────
// ATTRIBUTE RULES
// ──────────────────────────────────────────────

export interface AttributeRule {
  id: number;
  attribute_key: string;
  display_name: string;
  rule_type: 'regex' | 'keyword';
  pattern: string;
  apply_synonyms: boolean;
  attr_type: 'text' | 'size' | 'color' | 'number';
  priority: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AttributeSynonym {
  id: number;
  attribute_key: string | null;
  word: string;
  normalized_value: string;
}

export interface AttributeDictionaryEntry {
  id: number;
  attribute_key: string;
  value: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AttributeCanonical {
  id: number;
  attribute_key: string;
  raw_value: string;
  normalized_value: string;
  created_at: string;
  updated_at: string;
}

export interface AttributeFacetValue {
  value: string;
  count: number;
}

export interface AttributeFacet {
  attribute_key: string;
  display_name: string;
  values: AttributeFacetValue[];
}

export interface AttributeAuditAttribute {
  attr_name: string;
  attr_type: string;
  count: number;
  unique_values: number;
  avg_confidence: number;
  top_values: Array<{ value: string; count: number; avg_conf: number }>;
}

export interface AttributeExtracted {
  attribute_key: string;
  attr_name: string;
  attr_value: string;
  attr_type: string;
  confidence: number;
  match_type: string;
}

export const attributeRulesApi = {
  list: (params?: { attribute_key?: string }) => {
    const q = new URLSearchParams();
    if (params?.attribute_key) q.set('attribute_key', params.attribute_key);
    return get<{ data: AttributeRule[] }>(`/attribute-rules?${q}`);
  },
  create: (data: Partial<AttributeRule>) => post<AttributeRule>('/attribute-rules', data),
  update: (id: number, data: Partial<AttributeRule>) => patch<AttributeRule>(`/attribute-rules/${id}`, data),
  remove: (id: number) => del<{ message: string }>(`/attribute-rules/${id}`),
  test: (text: string) => post<{ extracted: AttributeExtracted[]; data: AttributeExtracted[] }>('/attribute-rules/test', { text }),
  rebuild: () => post<{ message: string; processed?: number; saved?: number }>('/attribute-rules/rebuild', {}),
  audit: () => get<{
    total_products: number;
    products_with_attributes: number;
    total_attribute_rows: number;
    attributes: AttributeAuditAttribute[];
  }>('/attribute-rules/audit'),

  synonyms: (params?: { attribute_key?: string }) => {
    const q = new URLSearchParams();
    if (params?.attribute_key) q.set('attribute_key', params.attribute_key);
    return get<{ data: AttributeSynonym[] }>(`/attribute-rules/synonyms?${q}`);
  },
  createSynonym: (data: Partial<AttributeSynonym>) => post<AttributeSynonym>('/attribute-rules/synonyms', data),
  removeSynonym: (id: number) => del<{ message: string }>(`/attribute-rules/synonyms/${id}`),

  // Dictionary
  dictionary: (params?: { attribute_key?: string }) => {
    const q = new URLSearchParams();
    if (params?.attribute_key) q.set('attribute_key', params.attribute_key);
    return get<{ data: AttributeDictionaryEntry[] }>(`/attribute-dictionary?${q}`);
  },
  createDictionary: (data: Partial<AttributeDictionaryEntry>) => post<AttributeDictionaryEntry>('/attribute-dictionary', data),
  updateDictionary: (id: number, data: Partial<AttributeDictionaryEntry>) => patch<AttributeDictionaryEntry>(`/attribute-dictionary/${id}`, data),
  removeDictionary: (id: number) => del<{ message: string }>(`/attribute-dictionary/${id}`),

  // Canonical normalization
  canonical: (params?: { attribute_key?: string; search?: string; page?: number }) => {
    const q = new URLSearchParams();
    if (params?.attribute_key) q.set('attribute_key', params.attribute_key);
    if (params?.search) q.set('search', params.search);
    if (params?.page) q.set('page', String(params.page));
    return get<{ data: { data: AttributeCanonical[]; total: number; current_page: number; last_page: number } }>(`/attribute-canonical?${q}`);
  },
  createCanonical: (data: Partial<AttributeCanonical>) => post<AttributeCanonical>('/attribute-canonical', data),
  updateCanonical: (id: number, data: { normalized_value: string }) => patch<AttributeCanonical>(`/attribute-canonical/${id}`, data),
  removeCanonical: (id: number) => del<{ message: string }>(`/attribute-canonical/${id}`),

  // Facets
  facets: (params?: { category_id?: number; min_confidence?: number }) => {
    const q = new URLSearchParams();
    if (params?.category_id) q.set('category_id', String(params.category_id));
    if (params?.min_confidence !== undefined) q.set('min_confidence', String(params.min_confidence));
    return get<{ data: AttributeFacet[]; category_id: number | null }>(`/attribute-facets?${q}`);
  },
  rebuildFacets: (categoryId?: number) => post<{ data: AttributeFacet[] }>('/attribute-facets/rebuild', categoryId ? { category_id: categoryId } : {}),
};

// ──────────────────────────────────────────────
// CRM API (API Keys, etc.)
// ──────────────────────────────────────────────

export interface CrmApiKeyItem {
  id: number;
  name: string;
  api_key?: string;
  balance: number;
  usage_today?: number;
  requests_per_minute?: number;
  is_active: boolean;
}

export type CrmApiKeyDetail = CrmApiKeyItem;

export const crmApi = {
  apiKeys: {
    list: (params?: { page?: number; per_page?: number }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set('page', String(params.page));
      if (params?.per_page) q.set('per_page', String(params.per_page));
      return get<PaginatedResponse<CrmApiKeyItem>>(`/crm/api-keys${q.toString() ? `?${q}` : ''}`);
    },
    get: (id: number) => get<CrmApiKeyItem>(`/crm/api-keys/${id}`),
    update: (id: number, data: Partial<CrmApiKeyItem>) => patch<CrmApiKeyItem>(`/crm/api-keys/${id}`, data),
  },
};

// ──────────────────────────────────────────────
// CRM PAYMENT PROVIDERS
// ──────────────────────────────────────────────

export interface PaymentProviderItem {
  name: string;
  title: string;
  is_active: boolean;
  status: 'connected' | 'disconnected';
  config: Record<string, unknown>;
}

export interface ConfigSchemaField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'select';
  required?: boolean;
  readonly?: boolean;
  options?: { value: string; label: string }[];
}

export interface PaymentProviderDetail extends PaymentProviderItem {
  notification_url?: string;
  config_schema: ConfigSchemaField[];
}

export interface WebhookLogItem {
  id: number;
  event_id?: string | null;
  provider?: string;
  status: string;
  error: string | null;
  created_at: string;
}

export const crmPaymentProvidersApi = {
  list: () => get<PaymentProviderItem[]>('/crm/payment-providers'),
  get: (name: string) => get<PaymentProviderDetail>(`/crm/payment-providers/${name}`),
  update: (name: string, data: Record<string, string | number | boolean | null>) =>
    patch<PaymentProviderItem>(`/crm/payment-providers/${name}`, data),
  test: (name: string) => post<{ success: boolean; message: string }>(`/crm/payment-providers/${name}/test`, {}),
  createTestPayment: (name: string, apiKeyId?: number) =>
    post<{ message: string; payment_id: number; amount: number; api_key_id: number; new_balance: number }>(
      `/crm/payment-providers/${name}/test-payment`,
      apiKeyId ? { api_key_id: apiKeyId } : {}
    ),
  logs: (name: string, limit = 20) =>
    get<{ data: WebhookLogItem[] }>(`/crm/payment-providers/${name}/logs?limit=${limit}`),
  allLogs: (limit = 50) =>
    get<{ data: WebhookLogItem[] }>(`/crm/webhook-logs?limit=${limit}`),
  paymentAlerts: () =>
    get<{
      has_alerts: boolean;
      webhook_failures_24h: number;
      atol_failures_24h: number;
      recent: Array<{ id: number; provider: string; error: string | null; created_at: string }>;
    }>('/crm/payment-alerts'),
};

// ──────────────────────────────────────────────
// CMS (динамические страницы конструктора, JWT для админки)
// ──────────────────────────────────────────────

/** Произвольные настройки блока — расширяемый JSON, как в БД cms_page_blocks.settings */
export type CmsBlockSettings = Record<string, unknown>;

export interface CmsPageBlockPayload {
  block_type: string;
  sort_order?: number;
  settings?: CmsBlockSettings;
  client_key?: string | null;
  is_enabled?: boolean;
  is_visible?: boolean;
  is_required?: boolean;
  is_locked?: boolean;
  slot_key?: string | null;
}

export interface CmsPageListItem {
  id: number;
  page_key: string;
  page_type: string;
  path_prefix: string;
  slug: string;
  title: string;
  is_active: boolean;
  status: string;
  updated_at: string | null;
}

export interface CmsPageVersionSummary {
  id: number;
  version_number: number;
  status: string;
}

export interface CmsPageDetail {
  id: number;
  page_key: string;
  page_type: string;
  path_prefix: string;
  slug: string;
  title: string;
  is_active: boolean;
  status: string;
  published_version_id: number | null;
  seo: {
    title: string | null;
    description: string | null;
    og_title: string | null;
    og_description: string | null;
    og_image_url: string | null;
    canonical_url: string | null;
    robots: string | null;
    extra: Record<string, unknown>;
  };
  versions: CmsPageVersionSummary[];
}

export interface CmsPagePublicResponse {
  page: {
    id: number;
    page_key: string;
    page_type: string;
    path_prefix: string;
    slug: string;
    title: string;
    seo: {
      title: string | null;
      description: string | null;
      og_title: string | null;
      og_description: string | null;
      og_image_url: string | null;
      canonical_url: string | null;
      robots: string | null;
      extra: Record<string, unknown>;
    };
  };
  blocks: Array<{
    block_type: string;
    sort_order: number;
    settings: CmsBlockSettings;
    client_key: string | null;
    is_visible: boolean;
  }>;
}

export const publicCmsApi = {
  /** GET /api/v1/public/cms/pages/{pathPrefix}/{slug} */
  getPage: (pathPrefix: string, slug: string) =>
    get<CmsPagePublicResponse>(
      `/public/cms/pages/${encodeURIComponent(pathPrefix)}/${encodeURIComponent(slug)}`,
      true
    ),
};

export const adminCmsApi = {
  list: (params?: { page?: number; per_page?: number; status?: string; is_active?: boolean; search?: string }) => {
    const q = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) q.set(k, String(v));
      });
    }
    return get<{ data: CmsPageListItem[]; meta: { total: number; per_page: number; current_page: number; last_page: number } }>(
      `/admin/cms/pages${q.toString() ? `?${q}` : ''}`
    );
  },
  get: (id: number) => get<CmsPageDetail>(`/admin/cms/pages/${id}`),
  create: (body: { title: string; slug: string; path_prefix?: string; page_type?: string; page_key?: string }) =>
    post<CmsPageDetail>('/admin/cms/pages', body),
  update: (
    id: number,
    body: Partial<{
      title: string;
      is_active: boolean;
      seo_title: string | null;
      seo_description: string | null;
      og_title: string | null;
      og_description: string | null;
      og_image_url: string | null;
      canonical_url: string | null;
      robots: string | null;
      seo_extra: Record<string, unknown> | null;
    }>
  ) => patch<CmsPageDetail>(`/admin/cms/pages/${id}`, body),
  publish: (id: number) => post<CmsPageDetail>(`/admin/cms/pages/${id}/publish`),
  getVersion: (pageId: number, versionId: number) =>
    get<{ page_id: number; version: { id: number; version_number: number; status: string; blocks: unknown[] } }>(
      `/admin/cms/pages/${pageId}/versions/${versionId}`
    ),
  syncBlocks: (pageId: number, versionId: number, body: { blocks: CmsPageBlockPayload[] }) =>
    put<{ version: { id: number; version_number: number; status: string; blocks: unknown[] } }>(
      `/admin/cms/pages/${pageId}/versions/${versionId}/blocks`,
      body
    ),
};

// ──────────────────────────────────────────────
// Конструктор витрины — шаблоны макетов (JWT)
// ──────────────────────────────────────────────

export interface ConstructorLayoutTemplateRow {
  id: number;
  template_key: string;
  name: string;
  description?: string | null;
  template_type: "system" | "content";
  page_scope: "page" | "global";
  page_key: string | null;
  is_system: boolean;
  is_editable: boolean;
  is_active: boolean;
  sort_order: number;
  blocks_count: number;
  updated_at: string | null;
}

export interface ConstructorLayoutTemplateDetail {
  id: number;
  template_key: string;
  name: string;
  description?: string | null;
  template_type: "system" | "content";
  page_scope: "page" | "global";
  page_key: string | null;
  is_system: boolean;
  is_editable: boolean;
  is_active: boolean;
  sort_order: number;
  updated_at: string | null;
  blocks: Array<{
    id: number;
    block_type: string;
    sort_order: number;
    settings: CmsBlockSettings;
    client_key: string | null;
    is_enabled: boolean;
    is_visible: boolean;
    is_required: boolean;
    is_locked: boolean;
    slot_key: string | null;
  }>;
}

export const adminConstructorLayoutApi = {
  list: (params?: { template_type?: "system" | "content"; page_scope?: "page" | "global"; is_active?: boolean }) => {
    const q = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) q.set(k, String(v));
      });
    }
    return get<{ data: ConstructorLayoutTemplateRow[] }>(
      `/admin/constructor/layout-templates${q.toString() ? `?${q}` : ""}`
    );
  },
  show: (id: number) => get<ConstructorLayoutTemplateDetail>(`/admin/constructor/layout-templates/${id}`),
  create: (body: { name: string; description?: string | null; blocks?: CmsPageBlockPayload[] }) =>
    post<ConstructorLayoutTemplateDetail>('/admin/constructor/layout-templates', body),
  syncBlocks: (id: number, body: { blocks: CmsPageBlockPayload[] }) =>
    put<ConstructorLayoutTemplateDetail>(`/admin/constructor/layout-templates/${id}/blocks`, body),
  remove: (id: number) => del<{ ok: boolean }>(`/admin/constructor/layout-templates/${id}`),
};

// Constructor dynamic data contracts (forms + preview)
export const constructorDataApi = {
  categories: (params?: { per_page?: number; page?: number }) =>
    adminCatalogApi.catalogCategoriesList(params),
  products: (params?: {
    status?: string;
    search?: string;
    page?: number;
    per_page?: number;
    category_id?: number;
    seller_id?: number;
    sort_by?: 'created_at' | 'updated_at' | 'name' | 'status' | 'price_raw' | 'list_position';
    sort_dir?: 'asc' | 'desc';
  }) => adminSystemProductsApi.list(params),
  sellers: (params?: { search?: string; status?: string; page?: number; per_page?: number }) =>
    sellersApi.list(params),
  brands: (params?: { search?: string; status?: string; page?: number }) =>
    brandsApi.list(params),
  reviews: (limit = 20) => get<{ data: LogEntry[] }>(`/logs?module=reviews&per_page=${limit}`),
};

// Payment status — public, for return pages
export interface PaymentStatus {
  id: number;
  status: string;
  amount: number;
  provider: string;
}

export const paymentStatusApi = {
  get: (id: number, returnToken?: string) => {
    const path = returnToken ? `/payments/${id}?return_token=${encodeURIComponent(returnToken)}` : `/payments/${id}`;
    return get<PaymentStatus>(path, true);
  },
};

// Health check — /up is at Laravel root, not under /api/v1
export const healthApi = {
  check: () => {
    const base = BASE_URL.replace(/\/api\/v1\/?$/, '');
    return fetch(`${base}/up`, { method: 'GET' });
  },
};

export default {
  auth: authApi,
  dashboard: dashboardApi,
  parser: parserApi,
  products: productsApi,
  categories: categoriesApi,
  sellers: sellersApi,
  brands: brandsApi,
  excluded: excludedApi,
  filters: filtersApi,
  adminUsers: adminUsersApi,
  adminRoles: adminRolesApi,
  logs: logsApi,
  settings: settingsApi,
  public: publicApi,
  publicCms: publicCmsApi,
  adminCms: adminCmsApi,
  adminConstructorLayout: adminConstructorLayoutApi,
  constructorData: constructorDataApi,
  attributeRules: attributeRulesApi,
  attributeDictionary: attributeRulesApi.dictionary,
  attributeCanonical: attributeRulesApi.canonical,
};

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

// Log API URL in development
if (import.meta.env.DEV) {
  console.log('[API] VITE_API_URL:', import.meta.env.VITE_API_URL || '(default)');
  console.log('[API] BASE_URL:', BASE_URL);
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
      if (typeof window !== 'undefined') {
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
      throw new ApiError(res.status, error.error || res.statusText, error.errors);
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

const get = <T>(path: string, isPublic = false) => request<T>('GET', path, undefined, isPublic);
const post = <T>(path: string, body?: unknown, isPublic = false) => request<T>('POST', path, body, isPublic);
const put = <T>(path: string, body?: unknown) => request<T>('PUT', path, body);
const patch = <T>(path: string, body?: unknown) => request<T>('PATCH', path, body);
const del = <T>(path: string) => request<T>('DELETE', path);

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
  current_job: ParserJob | null;
  last_completed: ParserJob | null;
  queue_parser_size?: number;
  queue_photos_size?: number;
}

export interface DashboardData {
  products: {
    total: number; active: number; hidden: number; new_today: number;
    errors: number; with_photos: number; pending_photos: number;
  };
  categories: { total: number; enabled: number; linked_to_parser: number };
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

export interface ParserStats {
  products_total: number;
  products_today: number;
  parser_running: boolean;
  queue_size: number;
  errors_today: number;
  last_parser_run: string | null;
}

export interface ParserDiagnostics {
  workers_running: number;
  worker_status?: 'running' | 'stopped';
  parser_running: boolean;
  parser_state?: 'running' | 'stopped' | 'paused' | 'paused_network';
  parser_queue_size: number;
  photos_queue_size: number;
  failed_jobs_count: number;
  parser_lock_status: 'held' | 'free';
  products_total: number;
  products_today: number;
  errors_today: number;
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
  sadovodbaza_status: 'ok' | 'failed';
  timestamp: string;
}

export interface ParserSettings {
  id: number;
  download_photos: boolean;
  store_photo_links: boolean;
  max_workers: number;
  request_delay_min: number;
  request_delay_max: number;
  timeout_seconds: number;
  workers_parser: number;
  workers_photos: number;
  proxy_enabled: boolean;
  proxy_url?: string | null;
  queue_threshold: number;
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
  updated_at: string;
}

export const parserApi = {
  status: () => get<ParserStatus>('/parser/status'),
  state: () => get<ParserStateResponse>('/parser/state'),
  settings: () => get<ParserSettings>('/parser/settings'),
  updateSettings: (payload: Partial<ParserSettings>) =>
    post<{ message: string; data: ParserSettings }>('/parser/settings', payload),
  stats: () => get<ParserStats>('/parser/stats'),
  diagnostics: () => get<ParserDiagnostics>('/parser/diagnostics'),
  health: () => get<ParserHealth>('/parser/health'),
  progressOverview: (jobId?: number) =>
    get<ParserProgressOverview>(`/parser/progress-overview${jobId ? `?job_id=${jobId}` : ''}`),
  start: (opts?: StartParserOptions) => post<{ message: string; job_id: number; job: ParserJob }>('/parser/start', opts),
  startDaemon: () => post<{ message: string; daemon_enabled: boolean }>('/parser/start-daemon'),
  stop: () => post<{ message: string }>('/parser/stop'),
  stopDaemon: () => post<{ message: string; daemon_enabled: boolean }>('/parser/stop-daemon'),
  pause: () => post<{ message: string; status: string }>('/parser/pause'),
  restart: () => post<{ message: string }>('/parser/restart'),
  queueClear: (queue: 'parser' | 'photos' | 'default' = 'parser') =>
    post<{ message: string }>('/parser/queue-clear', { queue }),
  queueFlush: () => post<{ message: string; queues: string[] }>('/parser/queue-flush'),
  queueRestart: () => post<{ message: string }>('/parser/queue-restart'),
  clearFailedJobs: () => post<{ message: string }>('/parser/clear-failed'),
  failedJobs: () => get<{ data: Array<{ id: number; uuid: string; queue: string; display_name: string; exception: string | null; failed_at: string }> }>('/parser/failed-jobs'),
  retryJob: (id: number) => post<{ message: string }>(`/parser/retry-job/${id}`),
  killStuck: (idleMinutes?: number) =>
    post<{ message: string }>('/parser/kill-stuck', idleMinutes ? { idle_minutes: idleMinutes } : undefined),
  releaseLock: () => post<{ message: string }>('/parser/release-lock'),
  reset: () => post<{ message: string }>('/parser/reset'),
  jobs: (page = 1, perPage = 20) => get<PaginatedResponse<ParserJob>>(`/parser/jobs?page=${page}&per_page=${perPage}`),
  jobDetail: (id: number) => get<ParserJob & { logs: LogEntry[] }>(`/parser/jobs/${id}`),
  downloadPhotos: (opts?: { limit?: number; product_id?: number }) =>
    post<{ downloaded: number; failed: number; skipped: number; products: number }>('/parser/photos/download', opts),

  /** Sync categories from donor. Parses donor menu, creates/updates categories, builds tree. */
  categoriesSync: () =>
    post<{ message: string; created: number; updated: number; last_synced_at?: string }>('/parser/categories/sync'),

  /** URL for SSE progress stream (EventSource doesn't support Auth header) */
  progressUrl: (jobId?: number): string => {
    const params = new URLSearchParams();
    if (jobId) params.set('job_id', String(jobId));
    const t = getToken();
    if (t) params.set('token', t);
    return `${BASE_URL}/parser/progress${params.toString() ? '?' + params : ''}`;
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
    return get<PaginatedResponse<Product>>(`/products?${params}`);
  },
  get: (id: string | number) => get<ProductFull>(`/products/${id}`),
  update: (id: number, data: Partial<ProductFull>) => patch<ProductFull>(`/products/${id}`, data),
  delete: (id: number) => del(`/products/${id}`),
  bulk: (ids: number[], action: 'delete' | 'hide' | 'publish') =>
    post<{ message: string }>('/products/bulk', { ids, action }),
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
  catalogCategoryPatch: (id: number, body: { name?: string; is_active?: boolean }) =>
    patch<CatalogCategoryItem>(`/admin/catalog/categories/${id}`, body),
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
    return get<PaginatedResponse<Seller>>(`/sellers?${q}`);
  },
  get: (idOrSlug: string | number) => get<SellerFull>(`/sellers/${idOrSlug}`),
  products: (idOrSlug: string | number, params?: AdminSellerProductsParams) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined) q.set(k, String(v)); });
    return get<PaginatedResponse<Product> & { seller: Seller }>(`/sellers/${idOrSlug}/products?${q}`);
  },
  update: (id: number, data: Partial<Seller>) => patch<Seller>(`/sellers/${id}`, data),
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
  attributeRules: attributeRulesApi,
  attributeDictionary: attributeRulesApi.dictionary,
  attributeCanonical: attributeRulesApi.canonical,
};

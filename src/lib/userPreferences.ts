/**
 * Клиентская аналитика пользовательских предпочтений (без авторизации, без сервера).
 *
 * Хранится в localStorage; используется блоком MinimalProductGrid (auto)
 * и любым другим блоком/хуком, которому нужно «как у пользователя».
 *
 * Формат счётчиков построен с весом по событию: просмотр < корзина < покупка / лайк.
 * Со временем вес угасает (decay) — приоритет у недавних взаимодействий.
 */

const STORAGE_KEY = "cheepy_user_preferences_v1";
const MAX_PRODUCT_ENTRIES = 200;
const MAX_CATEGORY_ENTRIES = 100;
const MAX_SEARCH_ENTRIES = 50;

export type PreferenceEvent =
  | "view"
  | "click"
  | "favorite"
  | "unfavorite"
  | "cart"
  | "purchase"
  | "search";

const EVENT_WEIGHT: Record<PreferenceEvent, number> = {
  view: 1,
  click: 2,
  favorite: 4,
  unfavorite: -3,
  cart: 5,
  purchase: 10,
  search: 1,
};

/** Время полураспада веса (миллисекунд). Через половинный период score уменьшается вдвое. */
const HALF_LIFE_MS = 14 * 24 * 60 * 60 * 1000;

interface CounterEntry {
  /** Накопительный score (с учётом decay в момент записи). */
  score: number;
  /** Кол-во наблюдений (без decay) — для аналитики. */
  count: number;
  /** Время последнего события (мс). */
  lastAt: number;
}

interface ProductCounter extends CounterEntry {
  /** id связанной категории, если известна — нужно для рекомендаций. */
  categoryId?: number;
  categorySlug?: string;
}

interface CategoryCounter extends CounterEntry {
  slug?: string;
  name?: string;
}

interface PreferenceState {
  version: 1;
  products: Record<number, ProductCounter>;
  categories: Record<number, CategoryCounter>;
  /** Поисковые термы — нормализованные в нижнем регистре. */
  searches: Array<{ term: string; lastAt: number; count: number }>;
  updatedAt: number;
}

function emptyState(): PreferenceState {
  return { version: 1, products: {}, categories: {}, searches: [], updatedAt: Date.now() };
}

function readState(): PreferenceState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<PreferenceState> | null;
    if (!parsed || typeof parsed !== "object" || parsed.version !== 1) return emptyState();
    return {
      version: 1,
      products: (parsed.products && typeof parsed.products === "object") ? parsed.products as Record<number, ProductCounter> : {},
      categories: (parsed.categories && typeof parsed.categories === "object") ? parsed.categories as Record<number, CategoryCounter> : {},
      searches: Array.isArray(parsed.searches) ? parsed.searches as PreferenceState["searches"] : [],
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now(),
    };
  } catch {
    return emptyState();
  }
}

function writeState(state: PreferenceState) {
  if (typeof window === "undefined") return;
  try {
    state.updatedAt = Date.now();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("cheepy:user-preferences-changed"));
  } catch {
    // localStorage может быть отключён — молча игнорируем
  }
}

/** Применяет экспоненциальный спад к score между предыдущим временем и now. */
function decayed(prevScore: number, prevAt: number, now: number): number {
  if (!Number.isFinite(prevScore) || prevScore === 0) return 0;
  const dt = Math.max(0, now - prevAt);
  if (dt === 0) return prevScore;
  const factor = Math.pow(0.5, dt / HALF_LIFE_MS);
  return prevScore * factor;
}

function trimRecord<T extends Record<number, CounterEntry>>(rec: T, max: number): T {
  const ids = Object.keys(rec).map((x) => Number(x));
  if (ids.length <= max) return rec;
  const sorted = ids
    .map((id) => ({ id, score: rec[id].score, lastAt: rec[id].lastAt }))
    .sort((a, b) => b.score - a.score || b.lastAt - a.lastAt);
  const keep = new Set(sorted.slice(0, max).map((x) => x.id));
  const next = {} as T;
  for (const id of Object.keys(rec) as Array<keyof T>) {
    if (keep.has(Number(id))) next[id] = rec[id];
  }
  return next;
}

export interface ProductTrackPayload {
  productId: number;
  categoryId?: number | null;
  categorySlug?: string | null;
}

export interface CategoryTrackPayload {
  categoryId: number;
  slug?: string | null;
  name?: string | null;
}

export function trackProductEvent(event: PreferenceEvent, payload: ProductTrackPayload) {
  if (!payload?.productId || payload.productId <= 0) return;
  const w = EVENT_WEIGHT[event] ?? 0;
  if (!w) return;
  const state = readState();
  const now = Date.now();
  const prev = state.products[payload.productId] ?? { score: 0, count: 0, lastAt: now };
  const newScore = Math.max(0, decayed(prev.score, prev.lastAt, now) + w);
  state.products[payload.productId] = {
    score: newScore,
    count: prev.count + 1,
    lastAt: now,
    categoryId: payload.categoryId ?? prev.categoryId,
    categorySlug: payload.categorySlug ?? prev.categorySlug,
  };
  if (payload.categoryId && payload.categoryId > 0) {
    const prevCat = state.categories[payload.categoryId] ?? { score: 0, count: 0, lastAt: now };
    state.categories[payload.categoryId] = {
      score: Math.max(0, decayed(prevCat.score, prevCat.lastAt, now) + w * 0.6),
      count: prevCat.count + 1,
      lastAt: now,
      slug: payload.categorySlug ?? prevCat.slug,
      name: prevCat.name,
    };
  }
  state.products = trimRecord(state.products, MAX_PRODUCT_ENTRIES);
  state.categories = trimRecord(state.categories, MAX_CATEGORY_ENTRIES);
  writeState(state);
}

export function trackCategoryEvent(event: PreferenceEvent, payload: CategoryTrackPayload) {
  if (!payload?.categoryId || payload.categoryId <= 0) return;
  const w = EVENT_WEIGHT[event] ?? 0;
  if (!w) return;
  const state = readState();
  const now = Date.now();
  const prev = state.categories[payload.categoryId] ?? { score: 0, count: 0, lastAt: now };
  state.categories[payload.categoryId] = {
    score: Math.max(0, decayed(prev.score, prev.lastAt, now) + w),
    count: prev.count + 1,
    lastAt: now,
    slug: payload.slug ?? prev.slug,
    name: payload.name ?? prev.name,
  };
  state.categories = trimRecord(state.categories, MAX_CATEGORY_ENTRIES);
  writeState(state);
}

export function trackSearchTerm(rawTerm: string) {
  const term = String(rawTerm ?? "").trim().toLowerCase();
  if (!term || term.length > 80) return;
  const state = readState();
  const now = Date.now();
  const idx = state.searches.findIndex((x) => x.term === term);
  if (idx >= 0) {
    state.searches[idx] = { term, lastAt: now, count: state.searches[idx].count + 1 };
  } else {
    state.searches.unshift({ term, lastAt: now, count: 1 });
  }
  state.searches = state.searches
    .sort((a, b) => b.lastAt - a.lastAt)
    .slice(0, MAX_SEARCH_ENTRIES);
  writeState(state);
}

export interface RankedItem<T> {
  item: T;
  score: number;
  count: number;
  lastAt: number;
}

export interface PreferenceSummary {
  totalProducts: number;
  totalCategories: number;
  totalSearches: number;
  topProducts: Array<RankedItem<{ id: number; categoryId?: number; categorySlug?: string }>>;
  topCategories: Array<RankedItem<{ id: number; slug?: string }>>;
  recentSearches: Array<{ term: string; lastAt: number; count: number }>;
}

function rankWithDecay<T extends CounterEntry>(rec: Record<number, T>, now: number): Array<{ id: number; entry: T; score: number }> {
  const arr = Object.entries(rec).map(([id, entry]) => ({
    id: Number(id),
    entry,
    score: decayed(entry.score, entry.lastAt, now),
  }));
  arr.sort((a, b) => b.score - a.score || b.entry.lastAt - a.entry.lastAt);
  return arr;
}

/** Топ N товарных предпочтений с учётом времени. */
export function getTopPreferredProductIds(limit = 20): number[] {
  const state = readState();
  const ranked = rankWithDecay(state.products, Date.now());
  return ranked.slice(0, limit).map((x) => x.id);
}

/** Топ N категорий пользователя. */
export function getTopPreferredCategories(limit = 5): Array<{ id: number; slug?: string; score: number }> {
  const state = readState();
  const ranked = rankWithDecay(state.categories, Date.now());
  return ranked
    .slice(0, limit)
    .filter((x) => x.score > 0)
    .map((x) => ({ id: x.id, slug: x.entry.slug, score: x.score }));
}

export function getPreferenceSummary(): PreferenceSummary {
  const state = readState();
  const now = Date.now();
  const topP = rankWithDecay(state.products, now).slice(0, 50);
  const topC = rankWithDecay(state.categories, now).slice(0, 20);
  return {
    totalProducts: Object.keys(state.products).length,
    totalCategories: Object.keys(state.categories).length,
    totalSearches: state.searches.length,
    topProducts: topP.map(({ id, entry, score }) => ({
      item: { id, categoryId: entry.categoryId, categorySlug: entry.categorySlug },
      score,
      count: entry.count,
      lastAt: entry.lastAt,
    })),
    topCategories: topC.map(({ id, entry, score }) => ({
      item: { id, slug: entry.slug },
      score,
      count: entry.count,
      lastAt: entry.lastAt,
    })),
    recentSearches: state.searches.slice(0, 20),
  };
}

export function clearUserPreferences() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("cheepy:user-preferences-changed"));
  } catch {
    // ignore
  }
}

import { trackProductEvent } from "@/lib/userPreferences";

const STORAGE_KEY = "cheepy_favorites_v1";
const EVENT_NAME = "cheepy:favorites-changed";

export interface FavoriteEntry {
  productId: number;
  categoryId?: number;
  categorySlug?: string;
  addedAt: number;
}

interface FavoritesState {
  version: 1;
  items: Record<number, FavoriteEntry>;
}

function readState(): FavoritesState {
  if (typeof window === "undefined") return { version: 1, items: {} };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: 1, items: {} };
    const parsed = JSON.parse(raw) as Partial<FavoritesState> | null;
    if (!parsed || typeof parsed !== "object" || parsed.version !== 1) return { version: 1, items: {} };
    return { version: 1, items: (parsed.items && typeof parsed.items === "object") ? parsed.items as Record<number, FavoriteEntry> : {} };
  } catch {
    return { version: 1, items: {} };
  }
}

function writeState(state: FavoritesState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    // ignore
  }
}

export function isFavorite(productId: number | string | undefined | null): boolean {
  const id = Number(productId);
  if (!id || id <= 0) return false;
  const s = readState();
  return Boolean(s.items[id]);
}

export function listFavoriteIds(): number[] {
  const s = readState();
  return Object.keys(s.items)
    .map((x) => Number(x))
    .filter((x) => Number.isFinite(x) && x > 0)
    .sort((a, b) => (s.items[b]?.addedAt ?? 0) - (s.items[a]?.addedAt ?? 0));
}

export function listFavorites(): FavoriteEntry[] {
  const s = readState();
  return Object.values(s.items).sort((a, b) => b.addedAt - a.addedAt);
}

export interface ToggleFavoriteOptions {
  categoryId?: number | null;
  categorySlug?: string | null;
}

/** Добавляет/убирает товар в избранном. Возвращает финальное состояние (true — теперь в избранном). */
export function toggleFavorite(productId: number | string, opts?: ToggleFavoriteOptions): boolean {
  const id = Number(productId);
  if (!id || id <= 0) return false;
  const s = readState();
  const exists = Boolean(s.items[id]);
  if (exists) {
    delete s.items[id];
    writeState(s);
    trackProductEvent("unfavorite", {
      productId: id,
      categoryId: opts?.categoryId ?? null,
      categorySlug: opts?.categorySlug ?? null,
    });
    return false;
  }
  s.items[id] = {
    productId: id,
    categoryId: opts?.categoryId ?? undefined,
    categorySlug: opts?.categorySlug ?? undefined,
    addedAt: Date.now(),
  };
  writeState(s);
  trackProductEvent("favorite", {
    productId: id,
    categoryId: opts?.categoryId ?? null,
    categorySlug: opts?.categorySlug ?? null,
  });
  return true;
}

export function clearFavorites() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    // ignore
  }
}

export const FAVORITES_EVENT_NAME = EVENT_NAME;

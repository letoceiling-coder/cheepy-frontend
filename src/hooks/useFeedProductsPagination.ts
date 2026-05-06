import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { publicApi, type Product } from "@/lib/api";

/**
 * Постраничный/«infinite»-агрегатор по нескольким категориям витрины.
 * Возвращает уникальные товары и состояние для кнопки «Показать ещё» / IO‑sentinel.
 *
 * Работает поверх `publicApi.categoryProducts(slug, { page, per_page })`.
 */
export interface FeedPaginationOptions {
  /** Сlug‑и категорий витрины, из которых собираем ленту. */
  slugs: string[];
  /** Сколько карточек показываем «за один шаг» (page size блока). */
  pageSize: number;
  /** Сортировка для запросов категорий. */
  sortBy?: string;
  sortDir?: "asc" | "desc";
  /** Дополнительный suffix для queryKey (на случай, когда блок имеет фильтры по предпочтениям). */
  cacheKey?: string;
  /** Включить ли подгрузку (false — компонент ещё не готов). */
  enabled?: boolean;
}

interface CategoryCursor {
  slug: string;
  /** Следующая страница для запроса (1‑based). */
  nextPage: number;
  /** true, когда сервер вернул last_page. */
  exhausted: boolean;
}

export interface FeedPaginationState {
  items: Product[];
  /** Текущий шаг пагинации (1‑based) — сколько раз пользователь нажал «ещё»/доскроллил. */
  step: number;
  /** Идёт догрузка следующего шага. */
  isFetching: boolean;
  /** Все категории исчерпаны и больше нечего показать. */
  hasMore: boolean;
  /** Полная ошибка по последнему запросу. */
  error: Error | null;
  /** Загрузить следующий шаг. */
  loadMore: () => void;
  /** Сбросить агрегатор и перезагрузить с первой страницы. */
  reset: () => void;
}

const inflight = new WeakMap<object, AbortController>();

export function useFeedProductsPagination(options: FeedPaginationOptions): FeedPaginationState {
  const enabled = options.enabled !== false;
  const slugsKey = options.slugs.join("|");

  const [items, setItems] = useState<Product[]>([]);
  const [step, setStep] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [cursors, setCursors] = useState<CategoryCursor[]>([]);

  const seenIdsRef = useRef<Set<string>>(new Set());
  const tokenRef = useRef<{ value: number }>({ value: 0 });

  const reset = useCallback(() => {
    tokenRef.current.value++;
    setItems([]);
    setStep(0);
    setIsFetching(false);
    setError(null);
    seenIdsRef.current = new Set();
    setCursors(options.slugs.map((slug) => ({ slug, nextPage: 1, exhausted: false })));
  }, [slugsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    reset();
  }, [reset, options.cacheKey]);

  const hasMore = useMemo(() => cursors.some((c) => !c.exhausted), [cursors]);

  const loadMore = useCallback(() => {
    if (!enabled) return;
    if (isFetching) return;
    if (!hasMore && step > 0) return;
    if (cursors.length === 0) return;

    const myToken = ++tokenRef.current.value;
    setIsFetching(true);
    setError(null);

    const sortBy = options.sortBy ?? "list_position";
    const sortDir = options.sortDir ?? "desc";
    const remaining = options.pageSize;
    const perCat = Math.max(1, Math.ceil(remaining / Math.max(1, cursors.filter((c) => !c.exhausted).length)));

    void (async () => {
      const next: CategoryCursor[] = cursors.map((c) => ({ ...c }));
      const collected: Product[] = [];
      try {
        for (const cur of next) {
          if (cur.exhausted) continue;
          const res = await publicApi.categoryProducts(cur.slug, {
            page: cur.nextPage,
            per_page: perCat,
            sort_by: sortBy,
            sort_dir: sortDir,
          });
          if (myToken !== tokenRef.current.value) return;
          const rows = Array.isArray(res?.data) ? res.data : [];
          for (const p of rows) {
            const key = String(p.id);
            if (seenIdsRef.current.has(key)) continue;
            seenIdsRef.current.add(key);
            collected.push(p);
          }
          const meta = res?.meta;
          const isLast = !meta || (meta.current_page ?? cur.nextPage) >= (meta.last_page ?? cur.nextPage);
          cur.nextPage = (meta?.current_page ?? cur.nextPage) + 1;
          cur.exhausted = isLast;
        }
        if (myToken !== tokenRef.current.value) return;
        setCursors(next);
        setItems((prev) => prev.concat(collected.slice(0, remaining)));
        setStep((prev) => prev + 1);
      } catch (e) {
        if (myToken !== tokenRef.current.value) return;
        setError(e instanceof Error ? e : new Error("Failed to load products"));
      } finally {
        if (myToken === tokenRef.current.value) setIsFetching(false);
      }
    })();
  }, [enabled, isFetching, hasMore, step, cursors, options.pageSize, options.sortBy, options.sortDir]);

  // Auto load first page when cursors are set and we're enabled.
  useEffect(() => {
    if (!enabled) return;
    if (step !== 0) return;
    if (cursors.length === 0) return;
    if (isFetching) return;
    loadMore();
    // intentionally only depend on enabled+cursors+step to avoid loops
  }, [enabled, cursors, step, isFetching, loadMore]);

  return { items, step, isFetching, hasMore, error, loadMore, reset };
}

void inflight; // reserved for future request cancellation

import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Heart, Loader2, ShoppingCart } from "lucide-react";
import { publicApi, type Category, type Product } from "@/lib/api";
import type { ProductFeedSettings } from "@/constructor/settingsProfiles";
import { useFeedProductsPagination } from "@/hooks/useFeedProductsPagination";
import { useIsFavorite, useToggleFavorite } from "@/hooks/useFavorites";
import { useTopPreferredCategories } from "@/hooks/useUserPreferences";
import { trackProductEvent } from "@/lib/userPreferences";
import { mockProducts } from "@/data/mock-data";
import type { StorefrontProduct } from "@/types/storefront-product";
import { useConstructorCanvasPreview } from "@/constructor/context/ConstructorCanvasPreviewContext";

const DEFAULT_TITLE = "Для вас";
const DEFAULT_SUBTITLE = "Персональная подборка";
const DEFAULT_LIMIT = 10;

export interface MinimalProductGridProps {
  title?: string;
  subtitle?: string;
  /** Настройки источника товаров (формат raw block.settings.feed) — режим, категории, лимит, поведение подгрузки. */
  feed?: Partial<ProductFeedSettings>;
}

function flattenCategories(items: Category[] | undefined): Category[] {
  if (!Array.isArray(items)) return [];
  const out: Category[] = [];
  const stack = [...items];
  while (stack.length) {
    const c = stack.shift()!;
    out.push(c);
    if (Array.isArray(c.children)) stack.unshift(...c.children);
  }
  return out;
}

function findDescendantIds(items: Category[], rootIds: number[]): number[] {
  if (!rootIds.length) return [];
  const childrenMap = new Map<number, number[]>();
  for (const c of items) {
    if (c.parent_id != null) {
      const arr = childrenMap.get(c.parent_id) ?? [];
      arr.push(c.id);
      childrenMap.set(c.parent_id, arr);
    }
  }
  const visited = new Set<number>();
  const queue = [...rootIds];
  while (queue.length) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const ch = childrenMap.get(id);
    if (ch) queue.push(...ch);
  }
  return Array.from(visited);
}

function MinimalGridProductCard({ p }: { p: Product }) {
  const navigate = useNavigate();
  const isFavorite = useIsFavorite(p.id);
  const toggleFav = useToggleFavorite();
  const priceRaw = typeof p.price_raw === "number" && Number.isFinite(p.price_raw) ? p.price_raw : 0;
  const img = p.thumbnail || "";
  const pid = Number(p.id);

  const openProduct = () => {
    if (!Number.isFinite(pid) || pid <= 0) return;
    trackProductEvent("click", {
      productId: pid,
      categoryId: p.category?.id ?? null,
      categorySlug: p.category?.slug ?? null,
    });
    navigate(`/product/${p.id}`);
  };

  const onHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!Number.isFinite(pid) || pid <= 0) return;
    toggleFav(pid, {
      categoryId: p.category?.id ?? null,
      categorySlug: p.category?.slug ?? null,
    });
  };

  return (
    <div
      className="group cursor-pointer text-left rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      tabIndex={0}
      onClick={openProduct}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openProduct();
        }
      }}
      aria-label={`${p.title}${priceRaw > 0 ? `, ${priceRaw.toLocaleString()} ₽` : ""}`}
    >
      <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2 bg-secondary">
        {img ? (
          <img
            src={img}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-muted/40" />
        )}
        <button
          type="button"
          aria-label={isFavorite ? "Убрать из избранного" : "В избранное"}
          aria-pressed={isFavorite}
          className={`absolute bottom-2 right-2 z-20 rounded-full bg-background/90 p-2 shadow-md border border-border transition-colors hover:bg-background ${
            isFavorite ? "text-primary" : "text-muted-foreground hover:text-primary"
          }`}
          onClick={onHeartClick}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? "fill-primary" : ""}`} />
        </button>
        <span className="pointer-events-none absolute bottom-2 left-2 right-14 h-8 rounded-lg gradient-primary text-primary-foreground text-xs font-medium flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          <ShoppingCart size={12} aria-hidden /> В корзину
        </span>
      </div>
      <p className="text-xs text-foreground truncate" title={p.title}>{p.title}</p>
      <div className="flex items-baseline gap-1 mt-0.5">
        {priceRaw > 0 ? (
          <span className="text-sm font-bold text-foreground">{priceRaw.toLocaleString()} ₽</span>
        ) : (
          <span className="text-sm font-bold text-muted-foreground">—</span>
        )}
      </div>
    </div>
  );
}

function MinimalPreviewProductCard({ p }: { p: StorefrontProduct }) {
  const navigate = useNavigate();
  const isFavorite = useIsFavorite(p.id);
  const toggleFav = useToggleFavorite();
  const pid = typeof p.id === "number" ? p.id : Number(p.id);
  const img = p.images[0] ?? "";

  const openProduct = () => {
    if (Number.isFinite(pid) && pid > 0) navigate(`/product/${p.id}`);
  };

  const onHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!Number.isFinite(pid) || pid <= 0) return;
    toggleFav(pid);
  };

  return (
    <div
      className="group cursor-pointer text-left rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      tabIndex={0}
      onClick={openProduct}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openProduct();
        }
      }}
      aria-label={p.name}
    >
      <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2 bg-secondary">
        <img src={img} alt="" className="w-full h-full object-cover" />
        <button
          type="button"
          aria-label={isFavorite ? "Убрать из избранного" : "В избранное"}
          aria-pressed={isFavorite}
          className={`absolute bottom-2 right-2 z-20 rounded-full bg-background/90 p-2 shadow-md border border-border transition-colors hover:bg-background ${
            isFavorite ? "text-primary" : "text-muted-foreground hover:text-primary"
          }`}
          onClick={onHeartClick}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? "fill-primary" : ""}`} />
        </button>
      </div>
      <p className="text-xs text-foreground truncate">{p.name}</p>
      <div className="flex items-baseline gap-1 mt-0.5">
        <span className="text-sm font-bold text-foreground">{p.price.toLocaleString()} ₽</span>
        {p.oldPrice && <span className="text-xs text-muted-foreground line-through">{p.oldPrice.toLocaleString()} ₽</span>}
      </div>
    </div>
  );
}

const MinimalProductGrid: React.FC<MinimalProductGridProps> = (props) => {
  const constructorPreview = useConstructorCanvasPreview();
  const feed = props.feed ?? {};

  const dataMode: "manual" | "auto" = feed.mode === "auto" ? "auto" : "manual";
  const pageSize = Math.min(60, Math.max(4, typeof feed.limit === "number" ? feed.limit : DEFAULT_LIMIT));
  const showButton = feed.showLoadMoreButton !== false;
  const infinite = feed.infiniteScroll === true;
  const includeDescendants = feed.includeDescendants !== false;
  const categoryIds = Array.isArray(feed.categoryIds) ? feed.categoryIds : [];
  const sortBy = (feed.sortBy as "list_position" | "price_raw" | "created_at" | "updated_at" | "name" | undefined) ?? undefined;
  const sortDir = feed.sortDir;

  const displayTitle = (props.title ?? "").trim() || DEFAULT_TITLE;
  const displaySubtitle = (props.subtitle ?? "").trim() || DEFAULT_SUBTITLE;

  const menuQuery = useQuery({
    queryKey: ["public-menu-categories"],
    queryFn: () => publicApi.menu(),
    staleTime: 5 * 60_000,
  });
  const flatCats = useMemo(() => flattenCategories(menuQuery.data?.categories), [menuQuery.data]);
  const slugById = useMemo(() => {
    const m = new Map<number, string>();
    for (const c of flatCats) if (c.slug) m.set(c.id, c.slug);
    return m;
  }, [flatCats]);

  const preferredCats = useTopPreferredCategories(8);

  // Резолвим итоговый набор slug'ов категорий, из которых будет собираться лента.
  const resolvedSlugs = useMemo(() => {
    if (dataMode === "manual") {
      const ids = categoryIds.filter((x) => Number.isFinite(x) && x > 0);
      if (ids.length === 0) return [];
      const targetIds = includeDescendants ? findDescendantIds(flatCats, ids) : ids;
      const slugs: string[] = [];
      for (const id of targetIds) {
        const s = slugById.get(id);
        if (s && !slugs.includes(s)) slugs.push(s);
      }
      return slugs;
    }

    // auto: берём топ‑категории пользователя; если slug отсутствует в LS — добиваем по меню.
    const slugs: string[] = [];
    for (const c of preferredCats) {
      let slug = c.slug;
      if (!slug) slug = slugById.get(c.id) ?? undefined;
      if (slug && !slugs.includes(slug)) slugs.push(slug);
      if (slugs.length >= 5) break;
    }
    if (slugs.length === 0 && flatCats.length > 0) {
      // Холодный старт: берём первые 3 категории верхнего уровня с товарами.
      const cold = flatCats
        .filter((c) => c.parent_id == null && c.products_count > 0)
        .slice(0, 3)
        .map((c) => c.slug)
        .filter(Boolean);
      slugs.push(...cold);
    }
    return slugs;
  }, [dataMode, categoryIds, includeDescendants, flatCats, slugById, preferredCats]);

  const cacheKey = useMemo(() => {
    return `${dataMode}:${resolvedSlugs.join(",")}:${pageSize}:${sortBy ?? ""}:${sortDir ?? ""}`;
  }, [dataMode, resolvedSlugs, pageSize, sortBy, sortDir]);

  const enabled = resolvedSlugs.length > 0 && !menuQuery.isPending;

  const pagination = useFeedProductsPagination({
    slugs: resolvedSlugs,
    pageSize,
    sortBy,
    sortDir,
    cacheKey,
    enabled,
  });

  // IntersectionObserver для бесконечной подгрузки.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!infinite) return;
    if (!enabled) return;
    if (!pagination.hasMore) return;
    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !pagination.isFetching) {
            pagination.loadMore();
            break;
          }
        }
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [infinite, enabled, pagination.hasMore, pagination.isFetching, pagination.loadMore]);

  const showingMockSample = constructorPreview && (resolvedSlugs.length === 0 || (!pagination.isFetching && pagination.items.length === 0));

  // Витрина: если auto не нашла данных и аналитика пуста — не показываем блок.
  if (!constructorPreview) {
    if (dataMode === "manual" && categoryIds.length === 0) return null;
    if (resolvedSlugs.length === 0) return null;
    if (pagination.items.length === 0 && !pagination.isFetching && !pagination.hasMore) return null;
  }

  // Заглушка для конструктора (нет реальных данных) — показываем мок‑карточки как образец.
  if (showingMockSample) {
    const mocks = mockProducts.slice(0, Math.min(pageSize, mockProducts.length));
    return (
      <section className="py-6">
        <div className="flex items-baseline gap-3 mb-2">
          <h2 className="text-2xl font-bold text-foreground">{displayTitle}</h2>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Образец</span>
        </div>
        <p className="text-muted-foreground text-sm mb-6">{displaySubtitle}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {mocks.map((p) => (
            <MinimalPreviewProductCard key={p.id} p={p} />
          ))}
        </div>
      </section>
    );
  }

  const skeletons = pagination.isFetching ? Array.from({ length: Math.min(pageSize, 5) }) : [];

  return (
    <section className="py-6">
      <h2 className="text-2xl font-bold text-foreground mb-2">{displayTitle}</h2>
      <p className="text-muted-foreground text-sm mb-6">{displaySubtitle}</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {pagination.items.map((p) => (
          <MinimalGridProductCard key={String(p.id)} p={p} />
        ))}

        {skeletons.map((_, i) => (
          <div key={`skeleton-${i}`} className="animate-pulse">
            <div className="aspect-[3/4] rounded-lg bg-muted/40 mb-2" />
            <div className="h-3 rounded bg-muted/40 mb-1.5 w-4/5" />
            <div className="h-3 rounded bg-muted/40 w-2/5" />
          </div>
        ))}
      </div>

      {/* Sentinel для бесконечной подгрузки + кнопка «Показать ещё». Высота фиксированная — блок не «прыгает». */}
      <div className="mt-6 flex flex-col items-center justify-center min-h-[48px]" aria-live="polite">
        {pagination.error && (
          <p className="text-xs text-destructive mb-2">Не удалось загрузить товары. Попробуйте ещё раз.</p>
        )}
        {pagination.hasMore && showButton && (
          <button
            type="button"
            onClick={() => pagination.loadMore()}
            disabled={pagination.isFetching}
            className="px-5 h-10 rounded-full border border-border bg-background hover:bg-secondary transition-colors text-sm font-medium inline-flex items-center gap-2 disabled:opacity-60"
          >
            {pagination.isFetching ? <Loader2 size={14} className="animate-spin" /> : null}
            {pagination.isFetching ? "Загружаем…" : "Показать ещё"}
          </button>
        )}
        {pagination.hasMore && infinite && (
          <div ref={sentinelRef} className="h-px w-full" aria-hidden="true" />
        )}
        {!pagination.hasMore && pagination.items.length > 0 && (
          <p className="text-xs text-muted-foreground">Это все подходящие товары</p>
        )}
      </div>
    </section>
  );
};

export default MinimalProductGrid;

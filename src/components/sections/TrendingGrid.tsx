import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDragScroll } from "@/hooks/useDragScroll";
import { Heart, ShoppingCart } from "lucide-react";
import { mockProducts } from "@/data/mock-data";
import type { ProductFeedSettings } from "@/constructor/settingsProfiles";
import { useConstructorCanvasPreview } from "@/constructor/context/ConstructorCanvasPreviewContext";
import { useResolvedCatalogSlugsForProductFeed } from "@/hooks/useResolvedCatalogSlugsForProductFeed";
import { useFeedProductsPagination } from "@/hooks/useFeedProductsPagination";
import type { Product } from "@/lib/api";
import { useIsFavorite, useToggleFavorite } from "@/hooks/useFavorites";
import { trackProductEvent } from "@/lib/userPreferences";

const DEFAULT_TITLE = "В тренде";
const DEFAULT_SUBTITLE = "Самые популярные товары прямо сейчас";
const DEFAULT_LIMIT = 8;

export type TrendingGridProps = {
  title?: string;
  subtitle?: string;
  feed?: Partial<ProductFeedSettings>;
};

function ApiProductCard({ p }: { p: Product }) {
  const navigate = useNavigate();
  const isFavorite = useIsFavorite(p.id);
  const toggleFav = useToggleFavorite();
  const priceRaw = typeof p.price_raw === "number" && Number.isFinite(p.price_raw) ? p.price_raw : 0;
  const img = p.thumbnail || "";
  const pid = Number(p.id);
  const sellerLabel = p.seller?.name ?? "";

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
      role="link"
      tabIndex={0}
      className="group rounded-xl border border-border bg-card overflow-hidden cursor-pointer flex flex-col"
      onClick={openProduct}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openProduct();
        }
      }}
    >
      <div className="relative overflow-hidden aspect-[3/4] flex-none">
        {img ? (
          <img src={img} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-muted/40" />
        )}
        <button
          type="button"
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:bg-destructive hover:text-destructive-foreground"
          aria-label={isFavorite ? "Убрать из избранного" : "В избранное"}
          onClick={onHeartClick}
        >
          <Heart size={14} className={isFavorite ? "fill-primary text-primary" : ""} />
        </button>
        <span className="absolute bottom-3 left-3 right-3 h-10 rounded-lg gradient-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 pointer-events-none">
          <ShoppingCart size={14} /> В корзину
        </span>
      </div>
      <div className="p-3 flex-1 min-h-0">
        {sellerLabel ? <p className="text-xs text-muted-foreground mb-1 truncate">{sellerLabel}</p> : null}
        <h3 className="text-sm font-medium text-foreground truncate">{p.title}</h3>
        <div className="flex items-center gap-2 mt-2">
          <span className="font-bold text-sm text-foreground">{priceRaw > 0 ? `${priceRaw.toLocaleString()} ₽` : "—"}</span>
        </div>
      </div>
    </div>
  );
}

const TrendingGrid = ({ title, subtitle, feed: feedProp }: TrendingGridProps) => {
  const scrollRef = useDragScroll<HTMLDivElement>();
  const constructorPreview = useConstructorCanvasPreview();
  const [hoveredMockId, setHoveredMockId] = useState<number | null>(null);
  const feed = feedProp ?? {};
  const pageSize = Math.min(60, Math.max(4, typeof feed.limit === "number" ? feed.limit : DEFAULT_LIMIT));
  const sortBy = feed.sortBy as typeof feed.sortBy | undefined;
  const sortDir = feed.sortDir;

  const { resolvedSlugs, menuPending } = useResolvedCatalogSlugsForProductFeed(feed);
  const cacheKey = useMemo(() => `trending:${resolvedSlugs.join(",")}:${pageSize}:${sortBy ?? ""}:${sortDir ?? ""}`, [resolvedSlugs, pageSize, sortBy, sortDir]);
  const useApi = resolvedSlugs.length > 0 && !menuPending;

  const pagination = useFeedProductsPagination({
    slugs: resolvedSlugs,
    pageSize,
    sortBy,
    sortDir,
    cacheKey,
    enabled: useApi,
  });

  const displayTitle = (title ?? "").trim() || DEFAULT_TITLE;
  const displaySubtitle = (subtitle ?? "").trim() || DEFAULT_SUBTITLE;

  /** Подтянуть достаточно карточек для мобильной полосы при первом ответе API. */
  useEffect(() => {
    if (!useApi) return;
    if (!pagination.hasMore) return;
    const need = Math.min(12, pageSize);
    if (pagination.items.length >= need) return;
    if (pagination.isFetching) return;
    pagination.loadMore();
  }, [useApi, pagination.hasMore, pagination.items.length, pagination.isFetching, pagination.loadMore, pageSize]);

  const apiProducts = useMemo(() => {
    const cap = Math.min(12, Math.max(4, pageSize));
    return pagination.items.slice(0, cap);
  }, [pagination.items, pageSize]);

  const mockRows = useMemo(() => mockProducts.slice(0, Math.min(12, pageSize)), [pageSize]);

  if (useApi && !constructorPreview && pagination.items.length === 0 && !pagination.isFetching && pagination.error) {
    return null;
  }

  if (useApi && apiProducts.length > 0) {
    return (
      <section className="py-6">
        <h2 className="text-lg font-bold text-foreground mb-2">{displayTitle}</h2>
        <p className="text-muted-foreground text-sm mb-4">{displaySubtitle}</p>
        <div className="hidden md:grid grid-cols-4 gap-4 mb-4">
          {apiProducts.slice(0, 8).map((p) => (
            <ApiProductCard key={String(p.id)} p={p} />
          ))}
        </div>
        <div className="hidden sm:grid md:hidden grid-cols-2 gap-4 mb-4">{apiProducts.slice(0, 4).map((p) => (<ApiProductCard key={String(p.id)} p={p} />))}</div>
        <div ref={scrollRef} className="sm:hidden overflow-x-auto flex gap-3 snap-x snap-mandatory no-scrollbar pb-2 cursor-grab active:cursor-grabbing">
          {apiProducts.map((p) => (
            <div key={String(p.id)} className="shrink-0 w-[160px] snap-start">
              <ApiProductCard p={p} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (useApi && pagination.isFetching && apiProducts.length === 0) {
    return (
      <section className="py-6">
        <h2 className="text-lg font-bold text-foreground mb-2">{displayTitle}</h2>
        <p className="text-muted-foreground text-sm mb-4">{displaySubtitle}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border overflow-hidden">
              <div className="aspect-[3/4] bg-muted/40" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-muted/40 rounded w-2/3" />
                <div className="h-3 bg-muted/40 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  /** Витрина: ждём меню каталога — скелетон, без мок-карточек. */
  if (!constructorPreview && menuPending) {
    return (
      <section className="py-6">
        <h2 className="text-lg font-bold text-foreground mb-2">{displayTitle}</h2>
        <p className="text-muted-foreground text-sm mb-4">{displaySubtitle}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border overflow-hidden">
              <div className="aspect-[3/4] bg-muted/40" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-muted/40 rounded w-2/3" />
                <div className="h-3 bg-muted/40 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  /** Витрина: нет категорий или пустой ответ API — блок скрыт (не подставляем образец). */
  if (!constructorPreview && (!useApi || (useApi && !pagination.isFetching && apiProducts.length === 0))) {
    return null;
  }

  /** Конструктор (или превью с пустым ответом): образец на mockProducts. */
  const products = mockRows;
  return (
    <section className="py-6">
      <h2 className="text-lg font-bold text-foreground mb-2">{displayTitle}</h2>
      <p className="text-muted-foreground text-sm mb-4">{displaySubtitle}</p>

      <div className="hidden md:grid grid-cols-4 gap-4 mb-4">
        {products.slice(0, 8).map((p) => (
          <div
            key={p.id}
            className="group rounded-xl border border-border bg-card overflow-hidden cursor-pointer flex flex-col"
            onMouseEnter={() => setHoveredMockId(p.id)}
            onMouseLeave={() => setHoveredMockId(null)}
          >
            <Link to={`/product/${p.id}`} className="block flex flex-col flex-1 min-h-0">
              <div className="relative overflow-hidden aspect-[3/4] flex-none">
                <img
                  src={p.images[0]}
                  alt=""
                  className={`w-full h-full object-cover transition-transform duration-500 ${hoveredMockId === p.id ? "scale-110" : "scale-100"}`}
                />
                <button
                  type="button"
                  className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:bg-destructive hover:text-destructive-foreground ${hoveredMockId === p.id ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}
                  aria-label="В избранное"
                >
                  <Heart size={14} />
                </button>
                <span className="pointer-events-none absolute bottom-3 left-3 right-3 h-10 rounded-lg gradient-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  <ShoppingCart size={14} /> В корзину
                </span>
                {p.oldPrice ? (
                  <span className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-md font-medium">
                    -{Math.round((1 - p.price / p.oldPrice) * 100)}%
                  </span>
                ) : null}
              </div>
              <div className="p-3 flex-1 min-h-0">
                <p className="text-xs text-muted-foreground mb-1">{p.seller}</p>
                <h3 className="text-sm font-medium text-foreground truncate">{p.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`font-bold text-sm ${p.oldPrice ? "text-destructive" : "text-foreground"}`}>
                    {p.price.toLocaleString()} ₽
                  </span>
                  {p.oldPrice ? <span className="text-xs text-muted-foreground line-through">{p.oldPrice.toLocaleString()} ₽</span> : null}
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      <div className="hidden sm:grid md:hidden grid-cols-2 gap-4 mb-4">
        {products.slice(0, 4).map((p) => (
          <Link key={p.id} to={`/product/${p.id}`} className="group rounded-xl border border-border bg-card overflow-hidden flex flex-col">
            <div className="relative overflow-hidden aspect-[3/4] flex-none">
              <img src={p.images[0]} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              {p.oldPrice ? (
                <span className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-md font-medium">
                  -{Math.round((1 - p.price / p.oldPrice) * 100)}%
                </span>
              ) : null}
            </div>
            <div className="p-3 flex-1 min-h-0">
              <p className="text-xs text-muted-foreground mb-1">{p.seller}</p>
              <h3 className="text-sm font-medium text-foreground truncate">{p.name}</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className={`font-bold text-sm ${p.oldPrice ? "text-destructive" : "text-foreground"}`}>{p.price.toLocaleString()} ₽</span>
                {p.oldPrice ? <span className="text-xs text-muted-foreground line-through">{p.oldPrice.toLocaleString()} ₽</span> : null}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div ref={scrollRef} className="sm:hidden overflow-x-auto flex gap-3 snap-x snap-mandatory no-scrollbar pb-2 cursor-grab active:cursor-grabbing">
        {products.slice(0, 12).map((p) => (
          <Link
            key={p.id}
            to={`/product/${p.id}`}
            className="shrink-0 w-[160px] group rounded-xl border border-border bg-card overflow-hidden snap-start flex flex-col"
          >
            <div className="relative overflow-hidden aspect-[3/4] flex-none">
              <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
              <button type="button" className="absolute top-2 right-2 w-7 h-7 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center">
                <Heart size={12} />
              </button>
              {p.oldPrice ? (
                <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded font-medium">
                  -{Math.round((1 - p.price / p.oldPrice) * 100)}%
                </span>
              ) : null}
            </div>
            <div className="p-2">
              <p className="text-[10px] text-muted-foreground mb-1 truncate">{p.seller}</p>
              <h3 className="text-[11px] font-medium text-foreground line-clamp-2 mb-1">{p.name}</h3>
              <div className="flex items-center gap-1">
                <span className={`font-bold text-[11px] ${p.oldPrice ? "text-destructive" : "text-foreground"}`}>{p.price.toLocaleString()} ₽</span>
                {p.oldPrice ? (
                  <span className="text-[9px] text-muted-foreground line-through">{p.oldPrice.toLocaleString()} ₽</span>
                ) : null}
              </div>
            </div>
          </Link>
        ))}
      </div>
      {constructorPreview && (!useApi || (!pagination.isFetching && apiProducts.length === 0 && useApi)) ? (
        <p className="text-[11px] text-muted-foreground mt-2 italic">Подключите категории в настройках ленты или оставьте демонстрацию.</p>
      ) : null}
    </section>
  );
};

export default TrendingGrid;

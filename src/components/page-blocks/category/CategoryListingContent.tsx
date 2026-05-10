import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronDown, SlidersHorizontal, Grid2X2, LayoutList, X } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api";
import { publicListProductToStorefront } from "@/lib/mapPublicProduct";
import { trackCategoryEvent } from "@/lib/userPreferences";

const PRICE_FILTER_DEBOUNCE_MS = 450;

/** Вынесено из листинга: иначе при каждом ре-рендере родителя компонент «новый», сбрасывается useState(open). */
function CategoryFilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border pb-4 mb-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-sm font-semibold text-foreground mb-2"
      >
        {title}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && children}
    </div>
  );
}

export default function CategoryListingContent() {
  const { slug } = useParams();
  const [sortBy, setSortBy] = useState("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  /** Локальное состояние полей «от / до»; запросы уходят с задержкой через priceQuery. */
  const [priceDraft, setPriceDraft] = useState<[number, number]>([0, 0]);
  /** Диапазон, который реально передаётся в API (после debounce). */
  const [priceQuery, setPriceQuery] = useState<[number, number]>([0, 0]);
  const priceSeedKeyRef = useRef<string>("");
  const [facetSelections, setFacetSelections] = useState<Record<string, string[]>>({});

  const sortParams = useMemo(() => {
    switch (sortBy) {
      case "price_asc":
        return { sort_by: "price_asc" };
      case "price_desc":
        return { sort_by: "price_desc" };
      case "new":
        return { sort_by: "new" };
      default:
        return { sort_by: "list_position", sort_dir: "desc" as const };
    }
  }, [sortBy]);

  const facetQueryKey = useMemo(
    () =>
      Object.entries(facetSelections)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, vals]) => `${k}:${[...vals].sort().join("|")}`)
        .join(";"),
    [facetSelections],
  );

  const facetsForApi = useMemo(() => {
    const out: Record<string, string[]> = {};
    for (const [k, vals] of Object.entries(facetSelections)) {
      const u = [...new Set(vals.map((x) => String(x).trim()).filter(Boolean))];
      if (u.length) out[k] = u;
    }
    return out;
  }, [facetSelections]);

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["category-products", slug, currentPage, sortBy, priceQuery[0], priceQuery[1], facetQueryKey],
    queryFn: () =>
      publicApi.categoryProducts(String(slug), {
        page: currentPage,
        per_page: 12,
        ...sortParams,
        price_from: priceQuery[0] > 0 ? priceQuery[0] : undefined,
        price_to: priceQuery[1] > 0 ? priceQuery[1] : undefined,
        ...(Object.keys(facetsForApi).length > 0 ? { facets: facetsForApi } : {}),
      }),
    enabled: Boolean(slug),
    staleTime: 30_000,
    placeholderData: (previousData, previousQuery) => {
      const prevSlug = previousQuery?.queryKey[1];
      if (previousData && typeof prevSlug === "string" && prevSlug === String(slug)) {
        return previousData;
      }
      return undefined;
    },
  });

  useEffect(() => {
    priceSeedKeyRef.current = "";
    setPriceDraft([0, 0]);
    setPriceQuery([0, 0]);
    setCurrentPage(1);
    setFacetSelections({});
  }, [slug]);

  const toggleFacetValue = (attrName: string, value: string) => {
    const v = value.trim();
    if (!v) return;
    setFacetSelections((prev) => {
      const cur = [...(prev[attrName] ?? [])];
      const ix = cur.indexOf(v);
      if (ix >= 0) cur.splice(ix, 1);
      else cur.push(v);
      const next = { ...prev };
      if (cur.length === 0) delete next[attrName];
      else next[attrName] = cur;
      return next;
    });
    setCurrentPage(1);
  };

  const clearFacetSelections = () => {
    setFacetSelections({});
    setCurrentPage(1);
  };

  useEffect(() => {
    const slugStr = slug ? String(slug) : "";
    const rawMax = data?.price_range?.max;
    const rawMin = data?.price_range?.min ?? 0;
    if (!slugStr || typeof rawMax !== "number" || rawMax < 1) return;
    const key = `${slugStr}:${rawMax}:${rawMin}`;
    if (priceSeedKeyRef.current === key) return;
    priceSeedKeyRef.current = key;
    setPriceDraft([0, rawMax]);
    setPriceQuery([0, rawMax]);
  }, [slug, data?.price_range?.min, data?.price_range?.max]);

  const products = data?.data ?? [];
  const meta = data?.meta;
  const apiFilters = data?.filters ?? [];
  const catalogPriceMin = typeof data?.price_range?.min === "number" ? data.price_range.min : null;
  const catalogPriceMax = typeof data?.price_range?.max === "number" ? data.price_range.max : null;
  const totalPages = meta?.last_page ?? 1;

  useEffect(() => {
    if (!catalogPriceMax || catalogPriceMax < 1) return;
    if (priceDraft[0] === priceQuery[0] && priceDraft[1] === priceQuery[1]) return;
    const id = window.setTimeout(() => {
      setPriceQuery(priceDraft);
      setCurrentPage(1);
    }, PRICE_FILTER_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [priceDraft, priceQuery, catalogPriceMax]);

  useEffect(() => {
    const cat = data?.category;
    if (!cat?.id) return;
    trackCategoryEvent("view", { categoryId: cat.id, slug: cat.slug, name: cat.name });
  }, [data?.category?.id, data?.category?.slug, data?.category?.name]);

  const filtersContent = (
    <div className="space-y-0">
      <CategoryFilterSection title="Цена">
        {!catalogPriceMax || catalogPriceMax < 1 ? (
          <p className="text-xs text-muted-foreground">Цены недоступны для фильтра в этой категории.</p>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={catalogPriceMax}
                value={priceDraft[1] > 0 ? priceDraft[0] : ""}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(+e.target.value || 0, catalogPriceMax));
                  setPriceDraft([v, priceDraft[1] > 0 ? priceDraft[1] : catalogPriceMax]);
                }}
                className="w-full py-2 px-3 rounded-lg border border-border bg-background text-foreground text-sm"
                placeholder="От"
              />
              <span className="text-muted-foreground shrink-0">—</span>
              <input
                type="number"
                min={0}
                max={catalogPriceMax}
                value={priceDraft[1] > 0 ? priceDraft[1] : ""}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(+e.target.value || 0, catalogPriceMax));
                  const lo = Math.min(priceDraft[0], v);
                  setPriceDraft([lo, v]);
                }}
                className="w-full py-2 px-3 rounded-lg border border-border bg-background text-foreground text-sm"
                placeholder="До"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              По каталогу до {catalogPriceMax.toLocaleString("ru-RU")} ₽
              {catalogPriceMin != null && catalogPriceMin > 0 ? ` · от ${catalogPriceMin.toLocaleString("ru-RU")} ₽` : ""}.
            </p>
          </div>
        )}
      </CategoryFilterSection>

      {apiFilters
        .filter((f) => Array.isArray(f.values) && f.values.length > 0)
        .map((f) => (
          <CategoryFilterSection key={f.attr_name} title={f.display_name || f.attr_name} defaultOpen={false}>
            <div className="flex flex-wrap gap-2">
              {f.values!.slice(0, 40).map((v) => {
                const picked = facetSelections[f.attr_name]?.includes(v) ?? false;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => toggleFacetValue(f.attr_name, v)}
                    aria-pressed={picked}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                      picked
                        ? "border-primary bg-primary/15 text-foreground font-medium"
                        : "border-border bg-secondary text-foreground hover:bg-secondary/90"
                    }`}
                  >
                    {v}
                  </button>
                );
              })}
            </div>
          </CategoryFilterSection>
        ))}
      {Object.keys(facetSelections).length > 0 ? (
        <Button variant="outline" size="sm" className="w-full h-8 text-xs" type="button" onClick={() => clearFacetSelections()}>
          Сбросить характеристики
        </Button>
      ) : null}
    </div>
  );

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-sm">
        Не удалось загрузить товары категории. Проверьте адрес или попробуйте позже.
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-6">
        <aside className="hidden lg:block w-[260px] shrink-0">
          <div className="sticky top-[180px]">
            <h2 className="text-lg font-bold text-foreground mb-4">Фильтры</h2>
            {filtersContent}
          </div>
        </aside>

        <button
          type="button"
          onClick={() => setShowFilters(true)}
          className="lg:hidden fixed bottom-20 right-4 z-40 gradient-primary text-primary-foreground p-3 rounded-full shadow-lg"
          aria-label="Фильтры"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>

        {showFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button type="button" className="absolute inset-0 bg-foreground/50" aria-label="Закрыть" onClick={() => setShowFilters(false)} />
            <div className="absolute right-0 top-0 bottom-0 w-[320px] bg-background overflow-y-auto p-4 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Фильтры</h2>
                <button type="button" onClick={() => setShowFilters(false)} aria-label="Закрыть">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {filtersContent}
              <Button onClick={() => setShowFilters(false)} className="w-full gradient-primary text-primary-foreground rounded-lg mt-4">
                Применить
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">
              {isLoading && !data ? (
                "Загрузка…"
              ) : (
                <>
                  {meta?.total ?? products.length} товаров
                  {isFetching ? <span className="ml-1.5 text-muted-foreground/80">· обновление…</span> : null}
                </>
              )}
            </span>
            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-sm py-2 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary"
              >
                <option value="popular">По каталогу</option>
                <option value="price_asc">Сначала дешёвые</option>
                <option value="price_desc">Сначала дорогие</option>
                <option value="new">По дате</option>
              </select>
              <div className="hidden md:flex border border-border rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
                  aria-label="Сетка"
                >
                  <Grid2X2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
                  aria-label="Список"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {isLoading && !data ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div
              className={`${viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 gap-4" : "flex flex-col gap-3"} ${isFetching ? "opacity-70 transition-opacity" : ""}`}
            >
              {products.map((p) => {
                const card = publicListProductToStorefront(p);
                return (
                  <Link key={p.id} to={`/product/${p.id}`} className={viewMode === "list" ? "block" : "block"}>
                    <ProductCard product={card} variant={viewMode === "list" ? "list" : "grid"} />
                  </Link>
                );
              })}
            </div>
          )}

          {!isLoading && !isFetching && products.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8">В этой категории пока нет товаров.</p>
          ) : null}

          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === p ? "gradient-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

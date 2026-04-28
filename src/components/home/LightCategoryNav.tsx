import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDragScroll } from "@/hooks/useDragScroll";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { publicApi, publicCrmMediaFileUrl, resolveCrmMediaAssetUrl } from "@/lib/api";
import product1 from "@/assets/product-1.jpg";

type FeedSettings = {
  categoryIds?: number[];
  limit?: number;
  imageOverrides?: Array<{ categoryId: number; mediaFileId?: number | null; imageUrl?: string | null }>;
};

type Props = {
  title?: string;
  subtitle?: string;
  feed?: FeedSettings;
};

type MenuCategory = {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
  products_count?: number;
  children?: MenuCategory[];
};

function flatten(nodes: MenuCategory[]): MenuCategory[] {
  return nodes.flatMap((node) => [node, ...(Array.isArray(node.children) ? flatten(node.children) : [])]);
}

const LightCategoryNav = ({ feed }: Props) => {
  const [current, setCurrent] = useState(0);
  const scrollRef = useDragScroll<HTMLDivElement>();
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [pickedCategories, setPickedCategories] = useState<MenuCategory[]>([]);
  const [pickedLoading, setPickedLoading] = useState(() => Boolean(feed?.categoryIds?.length));
  const [menuReady, setMenuReady] = useState(false);
  const [fallbackById, setFallbackById] = useState<Record<number, string>>({});

  useEffect(() => {
    let mounted = true;
    publicApi
      .menu()
      .then((res) => {
        if (!mounted) return;
        const raw = Array.isArray(res.categories) ? (res.categories as MenuCategory[]) : [];
        setMenuCategories(flatten(raw));
      })
      .catch(() => setMenuCategories([]))
      .finally(() => {
        if (mounted) setMenuReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const selectedIds = feed?.categoryIds ?? [];
  const overrides = feed?.imageOverrides ?? [];
  const limit = feed?.limit ?? 24;

  useEffect(() => {
    let mounted = true;
    if (selectedIds.length === 0) {
      setPickedCategories([]);
      setPickedLoading(false);
      return () => {
        mounted = false;
      };
    }
    setPickedLoading(true);
    publicApi
      .categoriesByIds(selectedIds)
      .then((res) => {
        if (!mounted) return;
        const rows = Array.isArray(res.data) ? (res.data as MenuCategory[]) : [];
        setPickedCategories(rows);
      })
      .catch(() => setPickedCategories([]))
      .finally(() => {
        if (mounted) setPickedLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [selectedIds.join(",")]);

  const sliderCategories = useMemo(() => {
    const baseRaw = selectedIds.length > 0 ? pickedCategories : menuCategories;
    const base = baseRaw.filter((c) => Number(c.products_count ?? 0) > 0);
    const sliced = base.slice(0, Math.max(1, Number(limit) || 24));
    return sliced.map((cat) => {
      const override = overrides.find((x) => Number(x.categoryId) === Number(cat.id));
      const image =
        override?.mediaFileId
          ? publicCrmMediaFileUrl(Number(override.mediaFileId))
          : override?.imageUrl
            ? resolveCrmMediaAssetUrl(String(override.imageUrl))
            : fallbackById[cat.id] || product1;
      return {
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        count: Number(cat.products_count ?? 0),
        image,
      };
    });
  }, [fallbackById, limit, menuCategories, overrides, pickedCategories, selectedIds]);

  const total = sliderCategories.length;

  const scrollToIndex = useCallback((index: number) => {
    const scroller = scrollRef.current;
    const el = itemRefs.current[index];
    if (!scroller || !el) return;
    // Only horizontal scroll. scrollIntoView can cause page (vertical) scroll jumps.
    const left = el.offsetLeft - scroller.offsetLeft;
    scroller.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [scrollRef]);

  useEffect(() => {
    setCurrent(0);
  }, [total]);

  // Keep a tiny delay so layout is ready before the first scrollIntoView
  useEffect(() => {
    const t = window.setTimeout(() => scrollToIndex(current), 0);
    return () => window.clearTimeout(t);
  }, [current, scrollToIndex]);

  useEffect(() => {
    let cancelled = false;
    const need = sliderCategories.filter((c) => {
      const override = overrides.find((x) => Number(x.categoryId) === Number(c.id));
      if (override?.mediaFileId || override?.imageUrl) return false;
      if (c.count <= 0) return false;
      return !fallbackById[c.id];
    });
    if (need.length === 0) return;
    void (async () => {
      const entries = await Promise.all(
        need.map(async (c) => {
          try {
            const res = await publicApi.categoryProducts(c.slug, { page: 1, per_page: 1 });
            const thumb = res.data?.[0]?.thumbnail ? resolveCrmMediaAssetUrl(res.data[0].thumbnail) : '';
            return [c.id, thumb] as const;
          } catch {
            return [c.id, ''] as const;
          }
        })
      );
      if (cancelled) return;
      setFallbackById((prev) => {
        const next = { ...prev };
        for (const [id, url] of entries) {
          if (url) next[id] = url;
        }
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [sliderCategories, fallbackById, overrides]);

  const ready = selectedIds.length > 0 ? !pickedLoading : menuReady;

  const next = useCallback(() => {
    setCurrent((prev) => (total <= 0 ? 0 : (prev + 1) % total));
  }, [total]);

  const prev = useCallback(() => {
    setCurrent((prev) => (total <= 0 ? 0 : (prev - 1 + total) % total));
  }, [total]);

  const progress = total > 0 ? ((current + 1) / total) * 100 : 0;

  if (pickedLoading && selectedIds.length > 0) return null;
  if (ready && total === 0) return null;

  return (
    <section className="mb-8 w-full">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        {/* Left controls */}
        <div className="flex-shrink-0 flex flex-col gap-3 min-w-[140px]">
          {/* Page indicator */}
          <div className="flex items-baseline gap-1 text-foreground">
            <span className="text-lg font-bold leading-none">{String(current + 1).padStart(2, "0")}</span>
            <span className="text-sm text-muted-foreground font-normal">/ {String(total).padStart(2, "0")}</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-[2px] bg-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300 ease-in-out bg-destructive"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={prev}
              className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Назад"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-sm font-medium text-foreground">
              {current + 1}
            </span>
            <button
              onClick={next}
              className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Вперед"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right - cards (native horizontal scroll; no transform/oversized widths) */}
        <div ref={scrollRef} className="flex-1 overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing">
          <div className="flex gap-2 min-w-max pr-2">
            {sliderCategories.map((cat, i) => (
              <div
                key={`light-${cat.slug}`}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                className="shrink-0"
              >
                <Link to={`/category/${cat.slug}`} className="group flex items-center gap-3 px-3 py-2">
                  <div className="w-14 h-14 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium text-foreground truncate">{cat.name}</span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive inline-block flex-shrink-0" />
                      {cat.count} товаров
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-auto transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LightCategoryNav;

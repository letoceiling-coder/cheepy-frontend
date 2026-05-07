import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDragScroll } from "@/hooks/useDragScroll";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { publicApi, publicCrmMediaFileUrl, resolveCrmMediaAssetUrl } from "@/lib/api";
import { fetchCategoryProductThumbnails } from "@/lib/categoryFeedThumbnails";
import { usePublicMenuCategories, type PublicMenuCategory } from "@/hooks/usePublicMenuCategories";

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

type CatSlide = {
  id: number;
  slug: string;
  name: string;
  count: number;
  icon: string | null;
};

const LightCategoryNav = ({ feed }: Props) => {
  const [current, setCurrent] = useState(0);
  const scrollRef = useDragScroll<HTMLDivElement>();
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [pickedCategories, setPickedCategories] = useState<PublicMenuCategory[]>([]);
  const [pickedLoading, setPickedLoading] = useState(() => Boolean(feed?.categoryIds?.length));
  const [fallbackById, setFallbackById] = useState<Record<number, string>>({});
  const [thumbSettled, setThumbSettled] = useState(true);

  const { data: menuCategories = [], isPending: menuPending, isFetched: menuFetched } = usePublicMenuCategories();

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
        const rows = Array.isArray(res.data) ? (res.data as PublicMenuCategory[]) : [];
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

  const categoryBase = useMemo((): CatSlide[] => {
    const baseRaw = selectedIds.length > 0 ? pickedCategories : menuCategories;
    const base = baseRaw.filter((c) => Number(c.products_count ?? 0) > 0);
    const sliced = base.slice(0, Math.max(1, Number(limit) || 24));
    return sliced.map((cat) => ({
      id: cat.id,
      slug: cat.slug,
      name: cat.name,
      count: Number(cat.products_count ?? 0),
      icon: typeof cat.icon === "string" && cat.icon.trim() ? cat.icon.trim() : null,
    }));
  }, [limit, menuCategories, pickedCategories, selectedIds.length]);

  const thumbFetchKey = useMemo(() => {
    const slugPart = categoryBase
      .filter((c) => {
        const override = overrides.find((x) => Number(x.categoryId) === Number(c.id));
        if (override?.mediaFileId || override?.imageUrl) return false;
        if (c.icon) return false;
        return c.count > 0;
      })
      .map((c) => c.slug)
      .sort()
      .join("|");
    return `${selectedIds.join(",")}|${slugPart}`;
  }, [categoryBase, overrides, selectedIds.join(",")]);

  useEffect(() => {
    const needRows = categoryBase.filter((c) => {
      const override = overrides.find((x) => Number(x.categoryId) === Number(c.id));
      if (override?.mediaFileId || override?.imageUrl) return false;
      if (c.icon) return false;
      return c.count > 0;
    });
    if (needRows.length === 0) {
      setThumbSettled(true);
      return;
    }
    setThumbSettled(false);
    let cancelled = false;
    void (async () => {
      const map = await fetchCategoryProductThumbnails(
        needRows.map((c) => ({ id: c.id, slug: c.slug })),
        { concurrency: 5, pauseBetweenChunksMs: 50 },
      );
      if (cancelled) return;
      setFallbackById((prev) => {
        const next = { ...prev };
        for (const [id, url] of Object.entries(map)) {
          if (url) next[Number(id)] = url;
        }
        return next;
      });
      setThumbSettled(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [thumbFetchKey]);

  const sliderCategories = useMemo(() => {
    const needsFetchWave = categoryBase.some((c) => {
      const o = overrides.find((x) => Number(x.categoryId) === Number(c.id));
      if (o?.mediaFileId || o?.imageUrl) return false;
      if (c.icon) return false;
      return c.count > 0;
    });

    return categoryBase.map((cat) => {
      const override = overrides.find((x) => Number(x.categoryId) === Number(cat.id));
      const fromOverride =
        override?.mediaFileId
          ? publicCrmMediaFileUrl(Number(override.mediaFileId))
          : override?.imageUrl
            ? resolveCrmMediaAssetUrl(String(override.imageUrl))
            : null;
      const fromIcon = cat.icon ? resolveCrmMediaAssetUrl(cat.icon) : null;
      const fromFetch = fallbackById[cat.id] ?? null;
      const imagePendingFetch =
        needsFetchWave && !thumbSettled && !fromOverride && !fromIcon && cat.count > 0;
      const resolved = fromOverride || fromIcon || fromFetch;
      const image: string | null = imagePendingFetch ? null : resolved || null;
      return {
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        count: cat.count,
        image,
      };
    });
  }, [categoryBase, overrides, fallbackById, thumbSettled]);

  const total = sliderCategories.length;

  const scrollToIndex = useCallback((index: number) => {
    const scroller = scrollRef.current;
    const el = itemRefs.current[index];
    if (!scroller || !el) return;
    const left = el.offsetLeft - scroller.offsetLeft;
    scroller.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [scrollRef]);

  useEffect(() => {
    setCurrent(0);
  }, [total]);

  useEffect(() => {
    const t = window.setTimeout(() => scrollToIndex(current), 0);
    return () => window.clearTimeout(t);
  }, [current, scrollToIndex]);

  const ready = selectedIds.length > 0 ? !pickedLoading : menuFetched;
  const menuLoading = selectedIds.length === 0 && menuPending;

  const next = useCallback(() => {
    setCurrent((prev) => (total <= 0 ? 0 : (prev + 1) % total));
  }, [total]);

  const prev = useCallback(() => {
    setCurrent((prev) => (total <= 0 ? 0 : (prev - 1 + total) % total));
  }, [total]);

  const progress = total > 0 ? ((current + 1) / total) * 100 : 0;

  if (pickedLoading && selectedIds.length > 0) return null;
  if (ready && total === 0) return null;

  const Row = sliderCategories.map((cat, i) => (
    <div
      key={`light-${cat.slug}`}
      ref={(el) => {
        itemRefs.current[i] = el;
      }}
      className="shrink-0"
    >
      <Link to={`/category/${cat.slug}`} className="group flex items-center gap-3 px-3 py-2">
        <div className="w-14 h-14 rounded-md overflow-hidden bg-muted flex-shrink-0">
          {cat.image ? (
            <img src={cat.image} alt="" loading="lazy" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-muted animate-pulse" aria-hidden />
          )}
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
  ));

  if (menuLoading) {
    return (
      <section className="mb-8 w-full" aria-busy>
        <div className="flex flex-col md:flex-row md:items-center gap-6 animate-pulse">
          <div className="flex-shrink-0 space-y-2 min-w-[140px]">
            <div className="h-6 w-20 bg-muted rounded" />
            <div className="h-1 w-full bg-muted rounded-full" />
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-muted" />
              <div className="w-8 h-8 rounded-full bg-muted" />
            </div>
          </div>
          <div className="flex-1 flex gap-2 overflow-hidden">
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3 px-3 py-2 shrink-0">
                <div className="w-14 h-14 rounded-md bg-muted" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-3 w-14 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8 w-full" aria-busy={!thumbSettled ? true : undefined}>
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex-shrink-0 flex flex-col gap-3 min-w-[140px]">
          <div className="flex items-baseline gap-1 text-foreground">
            <span className="text-lg font-bold leading-none">{String(current + 1).padStart(2, "0")}</span>
            <span className="text-sm text-muted-foreground font-normal">/ {String(total).padStart(2, "0")}</span>
          </div>

          <div className="w-full h-[2px] bg-border rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300 ease-in-out bg-destructive" style={{ width: `${progress}%` }} />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
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
              type="button"
              onClick={next}
              className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Вперед"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing">
          <div className="flex gap-2 min-w-max pr-2">{Row}</div>
        </div>
      </div>
    </section>
  );
};

export default LightCategoryNav;

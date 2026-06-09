import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useDragScroll } from "@/hooks/useDragScroll";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { publicApi, publicCrmMediaFileUrl, resolveCrmMediaAssetUrl } from "@/lib/api";
import { fetchCategoryProductThumbnails } from "@/lib/categoryFeedThumbnails";
import { usePublicMenuCategories, type PublicMenuCategory } from "@/hooks/usePublicMenuCategories";

type FeedSettings = {
  categoryIds?: number[];
  limit?: number;
  imageOverrides?: Array<{ categoryId: number; mediaFileId?: number | null; imageUrl?: string | null }>;
};

type Props = {
  title?: string | null;
  subtitle?: string | null;
  feed?: FeedSettings;
};

type CatRow = {
  id: number;
  slug: string;
  name: string;
  count: number;
  icon: string | null;
};

function PopularCategories({ title, subtitle, feed }: Props) {
  const scrollRef = useDragScroll<HTMLDivElement>();
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

  const categoryBase = useMemo((): CatRow[] => {
    const baseRaw = selectedIds.length > 0 ? pickedCategories : menuCategories;
    const base = baseRaw.filter((c) => Number(c.products_count ?? 0) > 0);
    const sliced = selectedIds.length > 0 ? base : base.slice(0, Math.max(1, Number(limit) || 24));
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

  const cats = useMemo(() => {
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

  const ready = selectedIds.length > 0 ? !pickedLoading : menuFetched;
  const menuLoading = selectedIds.length === 0 && menuPending;

  const showCards = !(pickedLoading && selectedIds.length > 0) && cats.length > 0;

  if (ready && cats.length === 0) return null;

  const CardBg = ({
    cat,
    className,
  }: {
    cat: { slug: string; name: string; count: number; image: string | null };
    className?: string;
  }) =>
    cat.image ? (
      <img
        src={cat.image}
        alt=""
        loading="lazy"
        className={className}
      />
    ) : (
      <div className={`bg-muted animate-pulse ${className ?? ""}`} aria-hidden />
    );

  return (
    <section className="mb-6" aria-busy={menuLoading || !thumbSettled ? true : undefined}>
      <div className="flex items-baseline gap-3 mb-3">
        <div className="space-y-0.5 flex-1 min-w-0">
          <h2 className="text-lg font-bold text-foreground">{String(title || "ПОПУЛЯРНЫЕ КАТЕГОРИИ")}</h2>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        <Link to="/categories" className="text-sm text-primary hover:underline ml-auto shrink-0">
          Все категории
        </Link>
      </div>

      {menuLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="relative h-[180px] rounded-xl overflow-hidden bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="hidden md:grid md:grid-cols-3 gap-4">
            {showCards ? (
              cats.map((cat) => (
                <Link key={cat.slug} to={`/category/${cat.slug}`} className="group relative h-[180px] rounded-xl overflow-hidden">
                  <CardBg cat={cat} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-foreground/40 group-hover:bg-foreground/55 transition-colors duration-300" />
                  <div className="absolute inset-0 flex flex-col items-start justify-end p-5">
                    <h3 className="text-lg font-bold text-primary-foreground mb-0.5">{cat.name}</h3>
                    <p className="text-sm text-primary-foreground/70 mb-3">{cat.count.toLocaleString()} товаров</p>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-primary-foreground bg-primary/80 px-4 py-1.5 rounded-full group-hover:bg-primary transition-colors">
                      Перейти <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ))
            ) : null}
          </div>

          <div className="md:hidden relative">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollRef.current?.scrollBy({ left: -260, behavior: "smooth" })}
                className="shrink-0 w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground"
                aria-label="Назад"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div
                ref={scrollRef}
                className="flex-1 overflow-x-auto flex gap-3 no-scrollbar snap-x snap-mandatory py-1 cursor-grab active:cursor-grabbing"
              >
                {showCards ? (
                  cats.map((cat) => (
                    <Link
                      key={cat.slug}
                      to={`/category/${cat.slug}`}
                      className="group shrink-0 w-[200px] h-[140px] relative rounded-xl overflow-hidden snap-start"
                    >
                      <CardBg cat={cat} className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-foreground/40" />
                      <div className="absolute inset-0 flex flex-col items-start justify-end p-4">
                        <h3 className="text-base font-bold text-primary-foreground">{cat.name}</h3>
                        <p className="text-xs text-primary-foreground/70">{cat.count.toLocaleString()} товаров</p>
                      </div>
                    </Link>
                  ))
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => scrollRef.current?.scrollBy({ left: 260, behavior: "smooth" })}
                className="shrink-0 w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground"
                aria-label="Вперёд"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default PopularCategories;

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDragScroll } from "@/hooks/useDragScroll";
import CategoryCard from "./CategoryCard";
import CategorySliderControls from "./CategorySliderControls";
import { publicCrmMediaFileUrl, resolveCrmMediaAssetUrl } from "@/lib/api";
import { fetchCategoryProductThumbnails } from "@/lib/categoryFeedThumbnails";
import { useConstructorCanvasPreview } from "@/constructor/context/ConstructorCanvasPreviewContext";
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

const CategorySliderSection = ({ feed }: Props) => {
  const [current, setCurrent] = useState(0);
  const scrollRef = useDragScroll<HTMLDivElement>();
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [fallbackById, setFallbackById] = useState<Record<number, string>>({});
  const [thumbSettled, setThumbSettled] = useState(true);

  const constructorPreview = useConstructorCanvasPreview();
  const { data: menuCategories = [], isPending: menuPending, isError: menuError } = usePublicMenuCategories();

  const selectedIds = feed?.categoryIds ?? [];
  const overrides = feed?.imageOverrides ?? [];
  const limit = feed?.limit ?? 24;

  const rowMeta = useMemo(() => {
    const base = selectedIds.length > 0 ? menuCategories.filter((x) => selectedIds.includes(Number(x.id))) : menuCategories;
    const sliced = base.slice(0, Math.max(1, Number(limit) || 24));
    return sliced.map((cat: PublicMenuCategory) => {
      const override = overrides.find((x) => Number(x.categoryId) === Number(cat.id));
      const overrideFromFile = override?.mediaFileId ? publicCrmMediaFileUrl(Number(override.mediaFileId)) : "";
      const overrideFromUrl = override?.imageUrl ? resolveCrmMediaAssetUrl(String(override.imageUrl)) : "";
      const overrideUrl = overrideFromFile || overrideFromUrl;
      const iconUrl = typeof cat.icon === "string" && cat.icon.trim() ? resolveCrmMediaAssetUrl(cat.icon.trim()) : "";
      return {
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        count: Number(cat.products_count ?? 0),
        iconUrl,
        hasOverrideUrl: Boolean(overrideUrl),
        overrideUrl,
      };
    });
  }, [limit, menuCategories, overrides, selectedIds]);

  const thumbFetchKey = useMemo(() => {
    const slugPart = rowMeta
      .filter((r) => !r.hasOverrideUrl && !r.iconUrl && r.count > 0)
      .map((r) => r.slug)
      .sort()
      .join("|");
    return `${selectedIds.join(",")}|${slugPart}`;
  }, [rowMeta, selectedIds.join(",")]);

  useEffect(() => {
    const needRows = rowMeta.filter((r) => !r.hasOverrideUrl && !r.iconUrl && r.count > 0);
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

  const needsFetchWave = useMemo(
    () => rowMeta.some((r) => !r.hasOverrideUrl && !r.iconUrl && r.count > 0),
    [rowMeta],
  );

  const sliderCategories = useMemo(() => {
    return rowMeta.map((r) => {
      const baseUrl = r.overrideUrl || r.iconUrl || fallbackById[r.id] || null;
      const imagePendingFetch = needsFetchWave && !thumbSettled && !r.hasOverrideUrl && !r.iconUrl && r.count > 0;
      const image: string | null = imagePendingFetch ? null : baseUrl;
      return {
        id: r.id,
        slug: r.slug,
        name: r.name,
        count: r.count,
        image,
      };
    });
  }, [rowMeta, fallbackById, needsFetchWave, thumbSettled]);

  const total = sliderCategories.length;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setCurrent(0);
  }, [total]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    itemRefs.current[index]?.scrollIntoView({
      behavior: "smooth",
      inline: "start",
      block: "nearest",
    });
  }, []);

  const next = useCallback(() => {
    setCurrent((prev) => {
      const n = (prev + 1) % total;
      scrollToIndex(n);
      return n;
    });
  }, [scrollToIndex, total]);

  const prev = useCallback(() => {
    setCurrent((prev) => {
      const n = (prev - 1 + total) % total;
      scrollToIndex(n);
      return n;
    });
  }, [scrollToIndex, total]);

  if (!constructorPreview && menuPending) {
    return (
      <section className="mb-8 w-full">
        <div className="rounded-2xl bg-muted/40 animate-pulse" style={{ minHeight: "200px" }} aria-busy aria-label="Загрузка слайдера категорий" />
      </section>
    );
  }

  if (!constructorPreview && menuError) return null;
  if (!constructorPreview && !menuPending && total === 0) return null;

  return (
    <section className="mb-8 w-full">
      <div className="rounded-2xl" style={{ background: "hsl(0, 0%, 13%)" }}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
          <div className="md:col-span-3 p-6 md:p-8 flex flex-col justify-center border-b md:border-b-0 md:border-r border-primary-foreground/10">
            <CategorySliderControls current={current} total={total || 1} onPrev={prev} onNext={next} />
          </div>

          <div className="md:col-span-9">
            <div
              ref={scrollRef}
              className={
                "flex gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory cursor-grab active:cursor-grabbing " +
                (isMobile ? "p-4" : "p-6")
              }
            >
              {sliderCategories.map((cat, i) => (
                <div
                  key={cat.slug}
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  className="flex-shrink-0 snap-start"
                >
                  <CategoryCard slug={cat.slug} name={cat.name} count={cat.count} image={cat.image} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategorySliderSection;

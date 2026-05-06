import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDragScroll } from "@/hooks/useDragScroll";
import CategoryCard from "./CategoryCard";
import CategorySliderControls from "./CategorySliderControls";
import { publicApi, resolveCrmMediaAssetUrl } from "@/lib/api";
import { fetchCategoryProductThumbnails } from "@/lib/categoryFeedThumbnails";
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

const CategorySliderSection = ({ feed }: Props) => {
  const [current, setCurrent] = useState(0);
  const scrollRef = useDragScroll<HTMLDivElement>();
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
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
      .catch(() => setMenuCategories([]));
    return () => {
      mounted = false;
    };
  }, []);

  const selectedIds = feed?.categoryIds ?? [];
  const overrides = feed?.imageOverrides ?? [];
  const limit = feed?.limit ?? 24;

  const rowMeta = useMemo(() => {
    const base = selectedIds.length > 0 ? menuCategories.filter((x) => selectedIds.includes(Number(x.id))) : menuCategories;
    const sliced = base.slice(0, Math.max(1, Number(limit) || 24));
    return sliced.map((cat) => {
      const override = overrides.find((x) => Number(x.categoryId) === Number(cat.id));
      const overrideUrl = override?.imageUrl ? resolveCrmMediaAssetUrl(String(override.imageUrl)) : "";
      return {
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        count: Number(cat.products_count ?? 0),
        iconUrl: cat.icon || "",
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
    if (needRows.length === 0) return;
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
    })();
    return () => {
      cancelled = true;
    };
  }, [thumbFetchKey]);

  const sliderCategories = useMemo(() => {
    return rowMeta.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      count: r.count,
      image: r.overrideUrl || r.iconUrl || fallbackById[r.id] || product1,
    }));
  }, [rowMeta, fallbackById]);

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

  return (
    <section className="mb-8 w-full">
      <div className="rounded-2xl" style={{ background: "hsl(0, 0%, 13%)" }}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
          {/* Left control panel */}
          <div className="md:col-span-3 p-6 md:p-8 flex flex-col justify-center border-b md:border-b-0 md:border-r border-primary-foreground/10">
            <CategorySliderControls current={current} total={total} onPrev={prev} onNext={next} />
          </div>

          {/* Right - category cards (native horizontal scroll; no transform/oversized widths) */}
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

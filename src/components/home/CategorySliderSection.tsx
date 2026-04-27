import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDragScroll } from "@/hooks/useDragScroll";
import CategoryCard from "./CategoryCard";
import CategorySliderControls from "./CategorySliderControls";
import { publicApi, resolveCrmMediaAssetUrl } from "@/lib/api";
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

  const sliderCategories = useMemo(() => {
    const base = selectedIds.length > 0 ? menuCategories.filter((x) => selectedIds.includes(Number(x.id))) : menuCategories;
    const sliced = base.slice(0, Math.max(1, Number(limit) || 24));
    return sliced.map((cat) => {
      const override = overrides.find((x) => Number(x.categoryId) === Number(cat.id));
      const overrideUrl = override?.imageUrl ? resolveCrmMediaAssetUrl(String(override.imageUrl)) : '';
      const image = overrideUrl || cat.icon || fallbackById[cat.id] || product1;
      return {
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        count: Number(cat.products_count ?? 0),
        image,
      };
    });
  }, [fallbackById, limit, menuCategories, overrides, selectedIds]);

  const total = sliderCategories.length;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Reset cursor when list changes (e.g., settings updated)
    setCurrent(0);
  }, [total]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const need = sliderCategories.filter((c) => !c.image || c.image === product1).map((c) => c);
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
  }, [sliderCategories]);

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

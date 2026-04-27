import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { useDragScroll } from "@/hooks/useDragScroll";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Link } from "react-router-dom";
import { publicApi, publicCrmMediaFileUrl, resolveCrmMediaAssetUrl } from "@/lib/api";
import product1 from "@/assets/product-1.jpg";

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

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const FeaturedCategories = ({ title, subtitle, feed }: Props) => {
  const scrollRef = useDragScroll<HTMLDivElement>();
  const { ref, isVisible } = useScrollAnimation();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [pickedCategories, setPickedCategories] = useState<MenuCategory[]>([]);
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

  useEffect(() => {
    let mounted = true;
    if (selectedIds.length === 0) {
      setPickedCategories([]);
      return () => {
        mounted = false;
      };
    }
    publicApi
      .categoriesByIds(selectedIds)
      .then((res) => {
        if (!mounted) return;
        const rows = Array.isArray(res.data) ? (res.data as MenuCategory[]) : [];
        setPickedCategories(rows);
      })
      .catch(() => setPickedCategories([]));
    return () => {
      mounted = false;
    };
  }, [selectedIds.join(",")]);

  const categories = useMemo(() => {
    const base = selectedIds.length > 0 ? pickedCategories : menuCategories;
    const sliced = base.slice(0, Math.max(1, Number(limit) || 24));
    return sliced.map((cat) => {
      const override = overrides.find((x) => Number(x.categoryId) === Number(cat.id));
      const image =
        override?.mediaFileId
          ? publicCrmMediaFileUrl(Number(override.mediaFileId))
          : override?.imageUrl
            ? resolveCrmMediaAssetUrl(String(override.imageUrl))
            : cat.icon || fallbackById[cat.id] || product1;
      return {
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        count: Number(cat.products_count ?? 0),
        image,
      };
    });
  }, [fallbackById, limit, menuCategories, overrides, pickedCategories, selectedIds.length]);

  useEffect(() => {
    let cancelled = false;
    const need = categories.filter((c) => !c.image || c.image === product1);
    if (need.length === 0) return;
    void (async () => {
      await sleep(30);
      const entries = await Promise.all(
        need.map(async (c) => {
          try {
            const res = await publicApi.categoryProducts(c.slug, { page: 1, per_page: 1 });
            const thumb = res.data?.[0]?.thumbnail ? resolveCrmMediaAssetUrl(res.data[0].thumbnail) : "";
            return [c.id, thumb] as const;
          } catch {
            return [c.id, ""] as const;
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
  }, [categories]);

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  return (
    <section
      ref={ref}
      className={`py-6 transition-opacity duration-700 ${isVisible ? "opacity-100" : "opacity-0"}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">{String(title || "Популярные категории")}</h2>
          <p className="text-muted-foreground text-sm mt-1">{String(subtitle || "Исследуйте лучшие категории маркетплейса")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => scroll(-1)} className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => scroll(1)} className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-5 overflow-x-auto no-scrollbar pb-2 cursor-grab active:cursor-grabbing">
        {categories.map((cat, i) => {
          return (
            <Link
              key={`${cat.slug}-${i}`}
              to={`/category/${cat.slug}`}
              className="min-w-[240px] md:min-w-[260px] max-h-[340px] rounded-xl overflow-hidden relative cursor-pointer group flex-shrink-0"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className="relative h-[180px] overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className={`w-full h-full object-cover transition-transform duration-500 ${hoveredIdx === i ? "scale-110" : "scale-100"}`}
                />
                <div className={`absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent transition-opacity duration-300 ${hoveredIdx === i ? "opacity-90" : "opacity-70"}`} />
                <div className={`absolute inset-0 transition-all duration-300 ${hoveredIdx === i ? "shadow-[inset_0_0_40px_hsl(262,83%,58%,0.3)]" : ""}`} />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg gradient-primary flex items-center justify-center transition-transform duration-300 ${hoveredIdx === i ? "scale-110" : ""}`}>
                    <ShoppingBag size={20} className="text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary-foreground">{cat.name}</h3>
                    <p className="text-primary-foreground/70 text-sm">{cat.count} товаров</p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default FeaturedCategories;

import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useDragScroll } from "@/hooks/useDragScroll";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
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

const PopularCategories = ({ title, subtitle, feed }: Props) => {
  const scrollRef = useDragScroll<HTMLDivElement>();
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

  const cats = useMemo(() => {
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
    const need = cats.filter((c) => !c.image || c.image === product1);
    if (need.length === 0) return;
    void (async () => {
      // small throttle to avoid burst when blocks mount together
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
  }, [cats]);

  return (
    <section className="mb-6">
      <div className="flex items-baseline gap-3 mb-3">
        <div className="space-y-0.5">
          <h2 className="text-lg font-bold text-foreground">{String(title || "ПОПУЛЯРНЫЕ КАТЕГОРИИ")}</h2>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        <Link to="/category/all" className="text-sm text-primary hover:underline ml-auto">Все категории</Link>
      </div>

      {/* Desktop: 2x3 grid */}
      <div className="hidden md:grid grid-cols-3 grid-rows-2 gap-4">
        {cats.map((cat) => (
          <Link
            key={cat.slug}
            to={`/category/${cat.slug}`}
            className="group relative h-[180px] rounded-xl overflow-hidden"
          >
            <img
              src={cat.image}
              alt={cat.name}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-foreground/40 group-hover:bg-foreground/55 transition-colors duration-300" />
            <div className="absolute inset-0 flex flex-col items-start justify-end p-5">
              <h3 className="text-lg font-bold text-primary-foreground mb-0.5">{cat.name}</h3>
              <p className="text-sm text-primary-foreground/70 mb-3">{cat.count.toLocaleString()} товаров</p>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-primary-foreground bg-primary/80 px-4 py-1.5 rounded-full group-hover:bg-primary transition-colors">
                Перейти <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Mobile: horizontal slider */}
      <div className="md:hidden relative">
        <div className="flex items-center gap-2">
          <button
            onClick={() => scrollRef.current?.scrollBy({ left: -260, behavior: "smooth" })}
            className="shrink-0 w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground"
            aria-label="Назад"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div ref={scrollRef} className="flex-1 overflow-x-auto flex gap-3 no-scrollbar snap-x snap-mandatory py-1 cursor-grab active:cursor-grabbing">
            {cats.map((cat) => (
              <Link
                key={cat.slug}
                to={`/category/${cat.slug}`}
                className="group shrink-0 w-[200px] h-[140px] relative rounded-xl overflow-hidden snap-start"
              >
                <img src={cat.image} alt={cat.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-foreground/40" />
                <div className="absolute inset-0 flex flex-col items-start justify-end p-4">
                  <h3 className="text-base font-bold text-primary-foreground">{cat.name}</h3>
                  <p className="text-xs text-primary-foreground/70">{cat.count.toLocaleString()} товаров</p>
                </div>
              </Link>
            ))}
          </div>
          <button
            onClick={() => scrollRef.current?.scrollBy({ left: 260, behavior: "smooth" })}
            className="shrink-0 w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground"
            aria-label="Вперёд"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default PopularCategories;

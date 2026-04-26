import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useDragScroll } from "@/hooks/useDragScroll";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { publicApi, resolveCrmMediaAssetUrl } from "@/lib/api";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import product5 from "@/assets/product-5.jpg";
import product6 from "@/assets/product-6.jpg";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";

const categories = [
  { id: 1, slug: "kurtki", name: "Куртки", image: product1, products_count: 0 },
  { id: 2, slug: "obuv", name: "Обувь", image: product2, products_count: 0 },
  { id: 3, slug: "platya", name: "Платья", image: product3, products_count: 0 },
  { id: 4, slug: "sumki", name: "Сумки", image: product4, products_count: 0 },
  { id: 5, slug: "dzhinsy", name: "Джинсы", image: product5, products_count: 0 },
  { id: 6, slug: "svitshoty", name: "Свитшоты", image: product6, products_count: 0 },
  { id: 7, slug: "palto", name: "Пальто", image: hero1, products_count: 0 },
  { id: 8, slug: "aksessuary", name: "Аксессуары", image: hero2, products_count: 0 },
  { id: 9, slug: "sport", name: "Спорт", image: product1, products_count: 0 },
  { id: 10, slug: "premium", name: "Премиум", image: product3, products_count: 0 },
];

type CategoryCircleSliderProps = {
  title?: string;
  feed?: {
    categoryIds?: number[];
    imageOverrides?: Array<{ categoryId: number; mediaFileId?: number | null; imageUrl?: string }>;
  };
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

const CategoryCircleSlider = ({ title = "Каталог", feed }: CategoryCircleSliderProps) => {
  const { ref, isVisible } = useScrollAnimation();
  const scrollRef = useDragScroll<HTMLDivElement>();
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);

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

  const scroll = (dir: number) => scrollRef.current?.scrollBy({ left: dir * 200, behavior: "smooth" });
  const selectedIds = feed?.categoryIds ?? [];
  const overrides = feed?.imageOverrides ?? [];

  const sourceCategories = useMemo(() => {
    if (!menuCategories.length) return categories;
    const base = selectedIds.length > 0 ? menuCategories.filter((x) => selectedIds.includes(Number(x.id))) : menuCategories;
    const withImages = base.map((cat) => {
      const override = overrides.find((x) => Number(x.categoryId) === Number(cat.id));
      const image = override?.imageUrl ? resolveCrmMediaAssetUrl(override.imageUrl) : cat.icon || product1;
      return { ...cat, image };
    });
    return withImages.length > 0 ? withImages : categories;
  }, [menuCategories, overrides, selectedIds]);

  return (
    <section ref={ref} className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">{title || "Каталог"}</h2>
        <div className="flex gap-2">
          <button onClick={() => scroll(-1)} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"><ChevronLeft size={16} /></button>
          <button onClick={() => scroll(1)} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"><ChevronRight size={16} /></button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-6 overflow-x-auto no-scrollbar pb-2 cursor-grab active:cursor-grabbing">
        {sourceCategories.map((c, i) => (
          <Link key={`${c.slug}-${i}`} to={`/category/${c.slug}`} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-border group-hover:border-primary transition-colors">
              <img src={(c as any).image} alt={c.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            </div>
            <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors whitespace-nowrap">{c.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default CategoryCircleSlider;

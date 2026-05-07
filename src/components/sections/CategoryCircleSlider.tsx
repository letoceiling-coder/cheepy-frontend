import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useDragScroll } from "@/hooks/useDragScroll";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { publicCrmMediaFileUrl, resolveCrmMediaAssetUrl } from "@/lib/api";
import { useConstructorCanvasPreview } from "@/constructor/context/ConstructorCanvasPreviewContext";
import { usePublicMenuCategories, type PublicMenuCategory } from "@/hooks/usePublicMenuCategories";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import product5 from "@/assets/product-5.jpg";
import product6 from "@/assets/product-6.jpg";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";

/** Только превью в конструкторе (холст), не для витрины. */
const constructorDemoCategories = [
  { id: 1, slug: "kurtki", name: "Куртки", image: product1, products_count: 0 },
  { id: 2, slug: "obuv", name: "Обувь", image: product2, products_count: 0 },
  { id: 3, slug: "platya", name: "Платья", image: product3, products_count: 0 },
  { id: 4, slug: "sumki", name: "Сумки", image: product4, products_count: 0 },
  { id: 5, slug: "dzhinsy", name: "Джинсы", image: product5, products_count: 0 },
  { id: 6, slug: "svitshoty", name: "Свитшоты", image: product6, products_count: 0 },
  { id: 7, slug: "palto", name: "Пальто", image: hero1, products_count: 0 },
  { id: 8, slug: "aksessuary", name: "Аксессуары", image: hero2, products_count: 0 },
] as const;

type CategoryCircleSliderProps = {
  title?: string;
  feed?: {
    categoryIds?: number[];
    imageOverrides?: Array<{ categoryId: number; mediaFileId?: number | null; imageUrl?: string }>;
  };
};

function CircleSkeletonStrip() {
  return (
    <div className="flex gap-6 overflow-x-auto no-scrollbar pb-2" aria-busy aria-label="Загрузка каталога">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2 shrink-0 w-[88px] md:w-[104px]">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-muted animate-pulse border-2 border-border" />
          <div className="h-3 w-full max-w-[72px] rounded bg-muted/80 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

const CategoryCircleSlider = ({ title = "Каталог", feed }: CategoryCircleSliderProps) => {
  const { ref, isVisible } = useScrollAnimation();
  const scrollRef = useDragScroll<HTMLDivElement>();
  const constructorPreview = useConstructorCanvasPreview();

  const { data: menuCategories = [], isPending, isError, isSuccess } = usePublicMenuCategories();

  const scroll = (dir: number) => scrollRef.current?.scrollBy({ left: dir * 200, behavior: "smooth" });
  const selectedIds = feed?.categoryIds ?? [];
  const overrides = feed?.imageOverrides ?? [];

  const sourceCategories = useMemo(() => {
    if (constructorPreview && (isPending || (isSuccess && menuCategories.length === 0))) {
      return constructorDemoCategories.map((c) => ({ ...c, image: c.image as string }));
    }
    const baseRaw: PublicMenuCategory[] =
      selectedIds.length > 0 ? menuCategories.filter((x) => selectedIds.includes(Number(x.id))) : menuCategories;
    const withImages = baseRaw.map((cat) => {
      const override = overrides.find((x) => Number(x.categoryId) === Number(cat.id));
      const image = override?.mediaFileId
        ? publicCrmMediaFileUrl(Number(override.mediaFileId))
        : override?.imageUrl
          ? resolveCrmMediaAssetUrl(override.imageUrl)
          : cat.icon && String(cat.icon).trim()
            ? resolveCrmMediaAssetUrl(String(cat.icon))
            : "";
      return { id: cat.id, slug: cat.slug, name: cat.name, image, products_count: cat.products_count ?? 0 };
    });
    return withImages.filter((c) => c.slug && c.name);
  }, [constructorPreview, isPending, isSuccess, menuCategories, overrides, selectedIds]);

  if (!constructorPreview && isPending) {
    return (
      <section ref={ref} className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-40 rounded-lg bg-muted animate-pulse" />
          <div className="flex gap-2">
            <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
            <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
          </div>
        </div>
        <CircleSkeletonStrip />
      </section>
    );
  }

  if (!constructorPreview && isError) return null;
  if (!constructorPreview && isSuccess && sourceCategories.length === 0) return null;

  return (
    <section ref={ref} className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">{title || "Каталог"}</h2>
        <div className="flex gap-2">
          <button type="button" onClick={() => scroll(-1)} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors" aria-label="Назад">
            <ChevronLeft size={16} />
          </button>
          <button type="button" onClick={() => scroll(1)} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors" aria-label="Вперёд">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-6 overflow-x-auto no-scrollbar pb-2 cursor-grab active:cursor-grabbing">
        {sourceCategories.map((c, i) => {
          const slug = String(c.slug);
          const hasImage = Boolean((c as { image?: string }).image);
          return (
            <Link key={`${slug}-${i}`} to={`/category/${slug}`} className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-border group-hover:border-primary transition-colors bg-muted/30">
                {hasImage ? (
                  <img src={(c as { image: string }).image} alt={c.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full bg-muted animate-pulse" />
                )}
              </div>
              <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors whitespace-nowrap">{c.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default CategoryCircleSlider;

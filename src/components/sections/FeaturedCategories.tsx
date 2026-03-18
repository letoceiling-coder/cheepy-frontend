import { useState } from "react";
import { ChevronLeft, ChevronRight, Shirt, Footprints, Watch, Gem, ShoppingBag, Glasses } from "lucide-react";
import { useDragScroll } from "@/hooks/useDragScroll";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import product5 from "@/assets/product-5.jpg";
import product6 from "@/assets/product-6.jpg";

const categories = [
  { name: "Верхняя одежда", count: 1240, image: product1, icon: Shirt },
  { name: "Обувь", count: 890, image: product2, icon: Footprints },
  { name: "Аксессуары", count: 980, image: product3, icon: Watch },
  { name: "Украшения", count: 450, image: product4, icon: Gem },
  { name: "Сумки", count: 560, image: product5, icon: ShoppingBag },
  { name: "Очки", count: 320, image: product6, icon: Glasses },
  { name: "Спорт", count: 730, image: product1, icon: Shirt },
  { name: "Премиум", count: 210, image: product2, icon: Gem },
];

const FeaturedCategories = () => {
  const scrollRef = useDragScroll<HTMLDivElement>();
  const { ref, isVisible } = useScrollAnimation();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

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
          <h2 className="text-lg font-bold text-foreground">Популярные категории</h2>
          <p className="text-muted-foreground text-sm mt-1">Исследуйте лучшие категории маркетплейса</p>
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
          const Icon = cat.icon;
          return (
            <div
              key={i}
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
                    <Icon size={20} className="text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary-foreground">{cat.name}</h3>
                    <p className="text-primary-foreground/70 text-sm">{cat.count} товаров</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FeaturedCategories;

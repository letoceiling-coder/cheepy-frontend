import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDragScroll } from "@/hooks/useDragScroll";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import product5 from "@/assets/product-5.jpg";
import product6 from "@/assets/product-6.jpg";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";

const categories = [
  { name: "Куртки", image: product1 },
  { name: "Обувь", image: product2 },
  { name: "Платья", image: product3 },
  { name: "Сумки", image: product4 },
  { name: "Джинсы", image: product5 },
  { name: "Свитшоты", image: product6 },
  { name: "Пальто", image: hero1 },
  { name: "Аксессуары", image: hero2 },
  { name: "Спорт", image: product1 },
  { name: "Премиум", image: product3 },
];

const CategoryCircleSlider = () => {
  const { ref, isVisible } = useScrollAnimation();
  const scrollRef = useDragScroll<HTMLDivElement>();

  const scroll = (dir: number) => scrollRef.current?.scrollBy({ left: dir * 200, behavior: "smooth" });

  return (
    <section ref={ref} className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Каталог</h2>
        <div className="flex gap-2">
          <button onClick={() => scroll(-1)} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"><ChevronLeft size={16} /></button>
          <button onClick={() => scroll(1)} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"><ChevronRight size={16} /></button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-6 overflow-x-auto no-scrollbar pb-2 cursor-grab active:cursor-grabbing">
        {categories.map((c, i) => (
          <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-border group-hover:border-primary transition-colors">
              <img src={c.image} alt={c.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            </div>
            <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors whitespace-nowrap">{c.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CategoryCircleSlider;

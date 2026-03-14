import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";

const tiles = [
  { name: "Верхняя одежда", count: 1240, image: product1 },
  { name: "Обувь", count: 890, image: product2 },
  { name: "Аксессуары", count: 980, image: product3 },
];

const CategoryMosaic = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <h2 className="text-2xl font-bold text-foreground mb-6">Категории</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-[220px] md:auto-rows-[280px]">
        {/* Large card */}
        <div className="col-span-2 row-span-2 rounded-xl overflow-hidden relative cursor-pointer group">
          <img src={tiles[0].image} alt={tiles[0].name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
          <div className="absolute bottom-6 left-6">
            <h3 className="text-2xl font-bold text-primary-foreground mb-1">{tiles[0].name}</h3>
            <p className="text-primary-foreground/70 text-sm mb-3">{tiles[0].count} товаров</p>
            <span className="flex items-center gap-1 text-primary-foreground text-sm font-medium group-hover:gap-2 transition-all">
              Смотреть <ArrowRight size={14} />
            </span>
          </div>
        </div>
        {/* Small cards */}
        {tiles.slice(1).map((t, i) => (
          <div key={i} className="col-span-1 rounded-xl overflow-hidden relative cursor-pointer group">
            <img src={t.image} alt={t.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <h3 className="font-semibold text-primary-foreground">{t.name}</h3>
              <p className="text-primary-foreground/70 text-xs">{t.count} товаров</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CategoryMosaic;

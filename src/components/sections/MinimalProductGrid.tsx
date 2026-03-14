import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { mockProducts } from "@/data/mock-data";

const MinimalProductGrid = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const products = mockProducts.slice(0, 10);

  return (
    <section ref={ref} className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <h2 className="text-2xl font-bold text-foreground mb-2">Для вас</h2>
      <p className="text-muted-foreground text-sm mb-6">Персональная подборка</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {products.map((p) => {
          const isHovered = hoveredId === p.id;
          return (
            <div
              key={p.id}
              className="group cursor-pointer"
              onMouseEnter={() => setHoveredId(p.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2">
                <img
                  src={isHovered && p.images[1] ? p.images[1] : p.images[0]}
                  alt={p.name}
                  className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                />
                <button className={`absolute bottom-2 left-2 right-2 h-8 rounded-lg gradient-primary text-primary-foreground text-xs font-medium flex items-center justify-center gap-1 transition-all duration-300 ${isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
                  <ShoppingCart size={12} /> В корзину
                </button>
              </div>
              <p className="text-xs text-foreground truncate">{p.name}</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-sm font-bold text-foreground">{p.price.toLocaleString()} ₽</span>
                {p.oldPrice && <span className="text-xs text-muted-foreground line-through">{p.oldPrice.toLocaleString()} ₽</span>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default MinimalProductGrid;

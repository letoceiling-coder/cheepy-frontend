import { useState } from "react";
import { useDragScroll } from "@/hooks/useDragScroll";
import { ShoppingCart, Heart } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { mockProducts } from "@/data/mock-data";

const TrendingGrid = () => {
  const { ref, isVisible } = useScrollAnimation();
  const scrollRef = useDragScroll<HTMLDivElement>();
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const products = mockProducts.slice(0, 8);

  return (
    <section ref={ref} className={`py-6 transition-all duration-700 ${isVisible ? "opacity-100" : "opacity-0"}`}>
      <h2 className="text-lg font-bold text-foreground mb-2">В тренде</h2>
      <p className="text-muted-foreground text-sm mb-4">Самые популярные товары прямо сейчас</p>
      
      {/* Desktop: 4 cards */}
      <div className="hidden md:grid grid-cols-4 gap-4 mb-4">
        {products.slice(0, 8).map((p) => (
          <div
            key={p.id}
            className="group rounded-xl border border-border bg-card overflow-hidden cursor-pointer flex flex-col"
            onMouseEnter={() => setHoveredId(p.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div className="relative overflow-hidden aspect-[3/4] flex-none">
              <img
                src={p.images[0]}
                alt={p.name}
                className={`w-full h-full object-cover transition-transform duration-500 ${hoveredId === p.id ? "scale-110" : "scale-100"}`}
              />
              <button
                className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:bg-destructive hover:text-destructive-foreground ${hoveredId === p.id ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}
              >
                <Heart size={14} />
              </button>
              <button
                className={`absolute bottom-3 left-3 right-3 h-10 rounded-lg gradient-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 transition-all duration-300 ${hoveredId === p.id ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              >
                <ShoppingCart size={14} /> В корзину
              </button>
              {p.oldPrice && (
                <span className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-md font-medium">
                  -{Math.round((1 - p.price / p.oldPrice) * 100)}%
                </span>
              )}
            </div>
            <div className="p-3 flex-1 min-h-0">
              <p className="text-xs text-muted-foreground mb-1">{p.seller}</p>
              <h3 className="text-sm font-medium text-foreground truncate">{p.name}</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className={`font-bold text-sm ${p.oldPrice ? "text-destructive" : "text-foreground"}`}>
                  {p.price.toLocaleString()} ₽
                </span>
                {p.oldPrice && (
                  <span className="text-xs text-muted-foreground line-through">{p.oldPrice.toLocaleString()} ₽</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tablet: 2 cards */}
      <div className="hidden sm:grid md:hidden grid-cols-2 gap-4 mb-4">
        {products.slice(0, 4).map((p) => (
          <div
            key={p.id}
            className="group rounded-xl border border-border bg-card overflow-hidden cursor-pointer flex flex-col"
            onMouseEnter={() => setHoveredId(p.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div className="relative overflow-hidden aspect-[3/4] flex-none">
              <img
                src={p.images[0]}
                alt={p.name}
                className={`w-full h-full object-cover transition-transform duration-500 ${hoveredId === p.id ? "scale-110" : "scale-100"}`}
              />
              <button
                className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:bg-destructive hover:text-destructive-foreground ${hoveredId === p.id ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}
              >
                <Heart size={14} />
              </button>
              <button
                className={`absolute bottom-3 left-3 right-3 h-10 rounded-lg gradient-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 transition-all duration-300 ${hoveredId === p.id ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              >
                <ShoppingCart size={14} /> В корзину
              </button>
              {p.oldPrice && (
                <span className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-md font-medium">
                  -{Math.round((1 - p.price / p.oldPrice) * 100)}%
                </span>
              )}
            </div>
            <div className="p-3 flex-1 min-h-0">
              <p className="text-xs text-muted-foreground mb-1">{p.seller}</p>
              <h3 className="text-sm font-medium text-foreground truncate">{p.name}</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className={`font-bold text-sm ${p.oldPrice ? "text-destructive" : "text-foreground"}`}>
                  {p.price.toLocaleString()} ₽
                </span>
                {p.oldPrice && (
                  <span className="text-xs text-muted-foreground line-through">{p.oldPrice.toLocaleString()} ₽</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: horizontal carousel */}
      <div ref={scrollRef} className="sm:hidden overflow-x-auto flex gap-3 snap-x snap-mandatory no-scrollbar pb-2 cursor-grab active:cursor-grabbing">
        {products.slice(0, 12).map((p) => (
          <div
            key={p.id}
            className="shrink-0 w-[160px] group rounded-xl border border-border bg-card overflow-hidden cursor-pointer snap-start flex flex-col"
            onMouseEnter={() => setHoveredId(p.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div className="relative overflow-hidden aspect-[3/4] flex-none">
              <img
                src={p.images[0]}
                alt={p.name}
                className={`w-full h-full object-cover transition-transform duration-500 ${hoveredId === p.id ? "scale-110" : "scale-100"}`}
              />
              <button
                className={`absolute top-2 right-2 w-7 h-7 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:bg-destructive hover:text-destructive-foreground ${hoveredId === p.id ? "opacity-100" : "opacity-0"}`}
              >
                <Heart size={12} />
              </button>
              {p.oldPrice && (
                <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded font-medium">
                  -{Math.round((1 - p.price / p.oldPrice) * 100)}%
                </span>
              )}
            </div>
            <div className="p-2">
              <p className="text-[10px] text-muted-foreground mb-1 truncate">{p.seller}</p>
              <h3 className="text-[11px] font-medium text-foreground line-clamp-2 mb-1">{p.name}</h3>
              <div className="flex items-center gap-1">
                <span className={`font-bold text-[11px] ${p.oldPrice ? "text-destructive" : "text-foreground"}`}>
                  {p.price.toLocaleString()} ₽
                </span>
                {p.oldPrice && (
                  <span className="text-[9px] text-muted-foreground line-through">{p.oldPrice.toLocaleString()} ₽</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TrendingGrid;

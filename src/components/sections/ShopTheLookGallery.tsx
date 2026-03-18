import { useState } from "react";
import { X, ShoppingCart } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import look1 from "@/assets/look-1.jpg";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";

interface Hotspot {
  x: number;
  y: number;
  product: { image: string; title: string; price: number };
}

const hotspots: Hotspot[] = [
  { x: 30, y: 25, product: { image: product1, title: "Куртка Oversize", price: 11990 } },
  { x: 55, y: 55, product: { image: product2, title: "Брюки Wide Leg", price: 6490 } },
  { x: 70, y: 35, product: { image: product3, title: "Сумка Mini", price: 4990 } },
];

const ShopTheLookGallery = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [active, setActive] = useState<number | null>(null);

  return (
    <section ref={ref} className={`py-4 md:py-6 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <h2 className="text-xl font-bold text-foreground mb-1">Собери образ</h2>
      <p className="text-sm text-muted-foreground mb-3">Нажми на точку, чтобы увидеть товар</p>
      <div className="relative rounded-xl overflow-hidden">
        <div className="h-[min(320px,42vh)] w-full">
          <img src={look1} alt="Look" className="w-full h-full object-cover block" loading="lazy" />
        </div>
        {hotspots.map((h, i) => (
          <button
            key={i}
            onClick={() => setActive(active === i ? null : i)}
            className="absolute w-7 h-7 -translate-x-1/2 -translate-y-1/2 z-10"
            style={{ left: `${h.x}%`, top: `${h.y}%` }}
          >
            <span className="absolute inset-0 rounded-full bg-primary/80 animate-ping opacity-40" />
            <span className="relative flex items-center justify-center w-full h-full rounded-full bg-primary border-2 border-primary-foreground shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
            </span>
          </button>
        ))}

        {active !== null && (
          <div
            className="absolute z-20 w-48 bg-card rounded-xl shadow-xl border border-border overflow-hidden animate-scale-in"
            style={{
              left: `${Math.min(hotspots[active].x, 65)}%`,
              top: `${Math.min(hotspots[active].y + 5, 70)}%`,
            }}
          >
            <button onClick={() => setActive(null)} className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-background/80 flex items-center justify-center">
              <X size={12} />
            </button>
            <div className="aspect-square overflow-hidden">
              <img src={hotspots[active].product.image} alt={hotspots[active].product.title} className="w-full h-full object-cover block" />
            </div>
            <div className="p-2.5">
              <p className="text-xs font-semibold text-foreground truncate">{hotspots[active].product.title}</p>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs font-bold text-primary">{hotspots[active].product.price.toLocaleString("ru-RU")} ₽</span>
                <button className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                  <ShoppingCart size={12} className="text-primary" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ShopTheLookGallery;

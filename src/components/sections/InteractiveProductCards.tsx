import { useState } from "react";
import { ShoppingCart, Eye, Heart } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import product5 from "@/assets/product-5.jpg";
import product6 from "@/assets/product-6.jpg";

const products = [
  { name: "Куртка зимняя", price: "7 990 ₽", old: "10 990 ₽", image: product1 },
  { name: "Кроссовки спорт", price: "5 490 ₽", old: null, image: product2 },
  { name: "Пальто классик", price: "11 990 ₽", old: "14 990 ₽", image: product3 },
  { name: "Сумка кожаная", price: "4 990 ₽", old: null, image: product4 },
  { name: "Часы наручные", price: "8 990 ₽", old: "12 990 ₽", image: product5 },
  { name: "Ботинки челси", price: "6 490 ₽", old: null, image: product6 },
];

const InteractiveProductCards = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section ref={ref} className={`py-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <h2 className="text-xl font-bold text-foreground mb-1">Интерактивная витрина</h2>
      <p className="text-sm text-muted-foreground mb-4">Наведите для быстрого просмотра</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {products.map((p, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-card overflow-hidden cursor-pointer group relative"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="aspect-square overflow-hidden relative">
              <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
              {/* Hover overlay */}
              <div className={`absolute inset-0 bg-foreground/40 flex items-center justify-center gap-2 transition-opacity duration-200 ${hovered === i ? "opacity-100" : "opacity-0"}`}>
                <button className="w-8 h-8 rounded-full bg-primary-foreground flex items-center justify-center hover:scale-110 transition-transform">
                  <ShoppingCart size={14} className="text-foreground" />
                </button>
                <button className="w-8 h-8 rounded-full bg-primary-foreground flex items-center justify-center hover:scale-110 transition-transform">
                  <Heart size={14} className="text-foreground" />
                </button>
                <button className="w-8 h-8 rounded-full bg-primary-foreground flex items-center justify-center hover:scale-110 transition-transform">
                  <Eye size={14} className="text-foreground" />
                </button>
              </div>
            </div>
            <div className="p-2.5">
              <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xs font-bold text-foreground">{p.price}</span>
                {p.old && <span className="text-[10px] text-muted-foreground line-through">{p.old}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default InteractiveProductCards;

import { useState } from "react";
import { Eye, ShoppingCart } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import product5 from "@/assets/product-5.jpg";
import product6 from "@/assets/product-6.jpg";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";

const products = [
  { name: "Куртка оверсайз", price: "7 990 ₽", image: product1, details: "Утеплённая, водоотталкивающая ткань" },
  { name: "Кроссовки Air", price: "5 490 ₽", image: product2, details: "Амортизация, дышащий материал" },
  { name: "Пальто шерсть", price: "12 990 ₽", image: product3, details: "100% шерсть, классический крой" },
  { name: "Сумка кожаная", price: "4 990 ₽", image: product4, details: "Натуральная кожа, ручная работа" },
  { name: "Часы классик", price: "8 990 ₽", image: product5, details: "Механизм Miyota, сапфировое стекло" },
  { name: "Ботинки челси", price: "6 490 ₽", image: product6, details: "Натуральная кожа, каучуковая подошва" },
  { name: "Худи премиум", price: "3 990 ₽", image: hero1, details: "Органический хлопок, oversize fit" },
  { name: "Брюки чинос", price: "4 490 ₽", image: hero2, details: "Стрейч, зауженный крой" },
];

const ProductHoverGrid = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [preview, setPreview] = useState<number | null>(null);

  return (
    <section ref={ref} className={`py-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <h2 className="text-xl font-bold text-foreground mb-1">Быстрый просмотр</h2>
      <p className="text-sm text-muted-foreground mb-4">Наведите для подробностей</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {products.map((p, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-card overflow-hidden cursor-pointer group relative"
            onMouseEnter={() => setPreview(i)}
            onMouseLeave={() => setPreview(null)}
          >
            <div className="aspect-[3/4] overflow-hidden relative">
              <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              {/* Hover preview panel */}
              <div className={`absolute inset-x-0 bottom-0 bg-card/95 backdrop-blur-sm p-3 transition-all duration-300 ${preview === i ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}`}>
                <p className="text-xs font-semibold text-foreground mb-1">{p.name}</p>
                <p className="text-[10px] text-muted-foreground mb-2">{p.details}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary">{p.price}</span>
                  <div className="flex gap-1">
                    <button className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                      <Eye size={12} className="text-primary" />
                    </button>
                    <button className="w-7 h-7 rounded-md gradient-primary flex items-center justify-center hover:opacity-90 transition-opacity">
                      <ShoppingCart size={12} className="text-primary-foreground" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProductHoverGrid;

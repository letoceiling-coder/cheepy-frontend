import { ShoppingCart } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import product1 from "@/assets/product-1.jpg";
import product3 from "@/assets/product-3.jpg";
import product5 from "@/assets/product-5.jpg";

const items = [
  { name: "Куртка Premium", price: "9 990 ₽", old: "12 990 ₽", image: product1 },
  { name: "Пальто Classic", price: "11 990 ₽", old: "15 990 ₽", image: product3 },
  { name: "Ботинки Urban", price: "6 990 ₽", old: "9 990 ₽", image: product5 },
];

const MultiProductBanner = () => {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <section ref={ref} className={`py-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="rounded-xl border border-border bg-card p-4 md:p-6">
        <div className="text-center mb-4">
          <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">Топ-подборка</span>
          <h2 className="text-xl font-bold text-foreground mt-1">Хиты продаж месяца</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {items.map((item, i) => (
            <div key={i} className="rounded-lg border border-border bg-background overflow-hidden group cursor-pointer">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.name}</p>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-sm font-bold text-primary">{item.price}</span>
                    <span className="text-xs text-muted-foreground line-through">{item.old}</span>
                  </div>
                </div>
                <button className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center hover:opacity-90 transition-opacity">
                  <ShoppingCart size={15} className="text-primary-foreground" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default MultiProductBanner;

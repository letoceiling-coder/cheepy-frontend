import { ShoppingCart, ArrowRight, Check } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";

const bundles = [
  {
    title: "Образ Smart Casual",
    items: [
      { name: "Пиджак", price: 8990, image: product1 },
      { name: "Футболка", price: 1490, image: product2 },
      { name: "Кроссовки", price: 6990, image: product3 },
    ],
    discount: 15,
  },
  {
    title: "Спортивный комплект",
    items: [
      { name: "Худи", price: 3990, image: product2 },
      { name: "Штаны", price: 2990, image: product1 },
      { name: "Кроссовки", price: 5990, image: product3 },
    ],
    discount: 20,
  },
];

const BundleDeals = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`py-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <h2 className="text-xl font-bold text-foreground mb-1">Выгодные комплекты</h2>
      <p className="text-sm text-muted-foreground mb-4">Покупайте вместе и экономьте</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {bundles.map((b, i) => {
          const total = b.items.reduce((s, item) => s + item.price, 0);
          const final_ = Math.round(total * (1 - b.discount / 100));
          return (
            <div key={i} className="rounded-xl border border-border bg-card p-4 group">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-foreground">{b.title}</h3>
                <span className="bg-destructive/10 text-destructive text-[11px] font-bold px-2 py-0.5 rounded">-{b.discount}%</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                {b.items.map((item, j) => (
                  <div key={j} className="flex-1 flex flex-col items-center">
                    <div className="w-full aspect-square rounded-lg overflow-hidden border border-border mb-1.5">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[10px] text-foreground truncate w-full text-center">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">{item.price.toLocaleString()} ₽</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-bold text-foreground">{final_.toLocaleString()} ₽</span>
                    <span className="text-xs text-muted-foreground line-through">{total.toLocaleString()} ₽</span>
                  </div>
                  <p className="text-[10px] text-primary font-medium flex items-center gap-1"><Check size={10} /> Экономия {(total - final_).toLocaleString()} ₽</p>
                </div>
                <button className="h-8 px-4 gradient-primary text-primary-foreground rounded-lg font-semibold text-xs flex items-center gap-1.5 hover:opacity-90 transition-opacity">
                  <ShoppingCart size={13} /> В корзину
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default BundleDeals;

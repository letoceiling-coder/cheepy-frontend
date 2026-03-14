import { useState } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { mockProducts, mockCategories } from "@/data/mock-data";

const CategoryTabs = () => {
  const { ref, isVisible } = useScrollAnimation();
  const tabs = mockCategories.slice(0, 6);
  const [active, setActive] = useState(tabs[0]);

  const filtered = mockProducts.filter((p) => p.category === active).slice(0, 4);
  const display = filtered.length ? filtered : mockProducts.slice(0, 4);

  return (
    <section ref={ref} className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <h2 className="text-2xl font-bold text-foreground mb-4">По категориям</h2>
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
        {tabs.map((t) => (
          <button key={t} onClick={() => setActive(t)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${active === t ? "gradient-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {display.map((p) => (
          <div key={p.id} className="group cursor-pointer">
            <div className="aspect-[3/4] rounded-xl overflow-hidden mb-2">
              <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
            <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-sm font-bold text-foreground">{p.price.toLocaleString()} ₽</span>
              {p.oldPrice && <span className="text-xs text-muted-foreground line-through">{p.oldPrice.toLocaleString()} ₽</span>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CategoryTabs;

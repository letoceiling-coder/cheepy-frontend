import { useState } from "react";
import { ShoppingCart, ChevronRight, Plus } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import look1 from "@/assets/look-1.jpg";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product5 from "@/assets/product-5.jpg";
import product4 from "@/assets/product-4.jpg";

const lookItems = [
  { name: "Пиджак тёмно-синий", price: 8990, image: product2, lookImage: look1 },
  { name: "Футболка чёрная", price: 1490, image: product1, lookImage: product1 },
  { name: "Джинсы голубые", price: 4990, image: product5, lookImage: product5 },
  { name: "Ботинки чёрные", price: 7990, image: product4, lookImage: product4 },
];

const LookOfTheDay = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [activeIndex, setActiveIndex] = useState(0);
  const totalPrice = lookItems.reduce((sum, item) => sum + item.price, 0);
  const discountPrice = Math.round(totalPrice * 0.85);

  return (
    <section
      ref={ref}
      className={`py-12 transition-opacity duration-700 ${isVisible ? "opacity-100" : "opacity-0"}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Лук дня</h2>
        <button className="hidden md:flex items-center gap-1 text-sm text-primary font-medium hover:opacity-80 transition-opacity">
          Все образы <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Main image — compact */}
        <div className="md:col-span-5 relative rounded-xl overflow-hidden h-[240px] md:h-[280px]">
          {lookItems.map((item, i) => (
            <img
              key={i}
              src={item.lookImage}
              alt="Look"
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-400 ${i === activeIndex ? "opacity-100" : "opacity-0"}`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 to-transparent" />
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="bg-primary-foreground/20 backdrop-blur-sm text-primary-foreground text-[11px] px-2.5 py-1 rounded-full font-medium">Smart Casual</span>
            <span className="bg-destructive/90 text-destructive-foreground text-[11px] px-2.5 py-1 rounded-full font-bold">-15%</span>
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            <p className="text-primary-foreground text-sm font-semibold">Образ на каждый день</p>
            <div className="flex gap-1.5">
              {lookItems.map((_, i) => (
                <button key={i} onClick={() => setActiveIndex(i)} className={`w-2 h-2 rounded-full transition-all ${i === activeIndex ? "bg-primary-foreground w-5" : "bg-primary-foreground/40"}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Right panel — compact */}
        <div className="md:col-span-7 flex flex-col gap-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {lookItems.map((item, i) => (
              <div
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`flex flex-col items-center p-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                  i === activeIndex ? "bg-primary/5 border border-primary/20" : "bg-card border border-border hover:border-primary/15"
                }`}
              >
                <div className="w-full aspect-square rounded-md overflow-hidden mb-2">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
                </div>
                <p className="text-xs font-medium text-foreground truncate w-full text-center">{item.name}</p>
                <p className="text-xs font-bold text-foreground">{item.price.toLocaleString()} ₽</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3 p-3.5 rounded-lg bg-secondary/50 border border-border mt-auto">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-foreground">{discountPrice.toLocaleString()} ₽</span>
                <span className="text-xs text-muted-foreground line-through">{totalPrice.toLocaleString()} ₽</span>
              </div>
              <p className="text-[11px] text-primary font-medium">Скидка при покупке комплекта</p>
            </div>
            <button className="h-10 px-5 gradient-primary text-primary-foreground rounded-lg font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0">
              <ShoppingCart size={15} /> Купить образ
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LookOfTheDay;

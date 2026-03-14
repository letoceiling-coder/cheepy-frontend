import { useState } from "react";
import { X, ShoppingCart } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import look1 from "@/assets/look-1.jpg";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product4 from "@/assets/product-4.jpg";

const hotspots = [
  { x: 30, y: 20, name: "Пиджак тёмно-синий", price: "8 990 ₽", image: product1 },
  { x: 50, y: 55, name: "Ремень кожаный", price: "2 490 ₽", image: product2 },
  { x: 45, y: 82, name: "Ботинки челси", price: "7 990 ₽", image: product4 },
];

const InteractiveLookbook = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [active, setActive] = useState<number | null>(null);

  return (
    <section ref={ref} className={`py-6 transition-all duration-700 ${isVisible ? "opacity-100" : "opacity-0"}`}>
      <h2 className="text-lg font-bold text-foreground mb-1">Интерактивный лукбук</h2>
      <p className="text-xs text-muted-foreground mb-3">Нажмите на точки, чтобы увидеть товар</p>

      <div className="relative rounded-xl overflow-hidden max-w-md mx-auto h-[320px]">
        <img src={look1} alt="Lookbook" className="w-full h-full object-cover" />

        {hotspots.map((h, i) => (
          <div key={i}>
            <button
              onClick={() => setActive(active === i ? null : i)}
              className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ left: `${h.x}%`, top: `${h.y}%` }}
            >
              <span className="absolute inset-0 rounded-full bg-primary-foreground/80 border-2 border-primary animate-pulse" />
              <span className="absolute inset-1 rounded-full bg-primary" />
            </button>

            {active === i && (
              <div
                className="absolute z-20 w-40 bg-card border border-border rounded-lg shadow-lg overflow-hidden animate-scale-in"
                style={{ left: `${Math.min(h.x + 4, 55)}%`, top: `${h.y - 2}%` }}
              >
                <button onClick={() => setActive(null)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-secondary flex items-center justify-center z-10">
                  <X size={10} className="text-foreground" />
                </button>
                <div className="h-[80px] overflow-hidden">
                  <img src={h.image} alt={h.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-2">
                  <p className="text-[11px] font-semibold text-foreground">{h.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[11px] font-bold text-primary">{h.price}</span>
                    <button className="w-5 h-5 rounded-md gradient-primary flex items-center justify-center">
                      <ShoppingCart size={10} className="text-primary-foreground" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default InteractiveLookbook;

import { useState } from "react";
import { Check } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import product1 from "@/assets/product-1.jpg";

const colors = [
  { name: "Чёрный", value: "#1a1a1a" },
  { name: "Бежевый", value: "#d4b896" },
  { name: "Синий", value: "#2c3e6b" },
  { name: "Зелёный", value: "#4a6741" },
];
const sizes = ["XS", "S", "M", "L", "XL"];

const ProductConfigurator = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [color, setColor] = useState(0);
  const [size, setSize] = useState(2);

  return (
    <section ref={ref} className={`py-6 transition-all duration-700 ${isVisible ? "opacity-100" : "opacity-0"}`}>
      <h2 className="text-lg font-bold text-foreground mb-1">Собери свой товар</h2>
      <p className="text-xs text-muted-foreground mb-3">Выберите цвет и размер</p>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 max-h-[280px]">
          <div className="h-[280px] overflow-hidden">
            <img src={product1} alt="Product" className="w-full h-full object-cover" />
          </div>
          <div className="p-4 flex flex-col justify-center gap-3">
            <div>
              <h3 className="text-base font-bold text-foreground">Куртка-парка Premium</h3>
              <p className="text-lg font-bold text-primary mt-0.5">9 990 ₽</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-foreground mb-1.5">Цвет: {colors[color].name}</p>
              <div className="flex gap-1.5">
                {colors.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setColor(i)}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${i === color ? "border-primary scale-110" : "border-border hover:border-primary/40"}`}
                    style={{ backgroundColor: c.value }}
                  >
                    {i === color && <Check size={12} className="text-primary-foreground mx-auto" />}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-foreground mb-1.5">Размер: {sizes[size]}</p>
              <div className="flex gap-1">
                {sizes.map((s, i) => (
                  <button
                    key={s}
                    onClick={() => setSize(i)}
                    className={`w-9 h-7 rounded-md text-[11px] font-medium transition-all ${i === size ? "bg-primary text-primary-foreground" : "border border-border text-foreground hover:border-primary/40"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <button className="h-9 w-full gradient-primary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
              Добавить в корзину
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductConfigurator;

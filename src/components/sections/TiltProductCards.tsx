import { useState, useRef, useCallback } from "react";
import { ShoppingCart, RotateCw } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";

const products = [
  { name: "Куртка Premium", price: "9 990 ₽", image: product1 },
  { name: "Кроссовки Air", price: "7 490 ₽", image: product2 },
  { name: "Пальто шерсть", price: "12 990 ₽", image: product3 },
  { name: "Сумка кожаная", price: "5 990 ₽", image: product4 },
];

const TiltCard = ({ product }: { product: (typeof products)[0] }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({ transform: "perspective(600px) rotateX(0deg) rotateY(0deg)" });

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setStyle({ transform: `perspective(600px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale(1.02)` });
  }, []);

  const handleLeave = () => setStyle({ transform: "perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)" });

  return (
    <div
      ref={cardRef}
      className="rounded-xl border border-border bg-card overflow-hidden cursor-pointer"
      style={{ ...style, transition: "transform 0.15s ease-out", transformStyle: "preserve-3d" }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <div className="aspect-square overflow-hidden relative">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-foreground/40 backdrop-blur-sm flex items-center justify-center">
          <RotateCw size={11} className="text-primary-foreground" />
        </div>
      </div>
      <div className="p-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-foreground">{product.name}</p>
          <p className="text-xs font-bold text-primary mt-0.5">{product.price}</p>
        </div>
        <button className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center hover:opacity-90 transition-opacity">
          <ShoppingCart size={14} className="text-primary-foreground" />
        </button>
      </div>
    </div>
  );
};

const TiltProductCards = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`py-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <h2 className="text-xl font-bold text-foreground mb-1">3D витрина</h2>
      <p className="text-sm text-muted-foreground mb-4">Двигайте мышкой по карточке</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {products.map((p, i) => <TiltCard key={i} product={p} />)}
      </div>
    </section>
  );
};

export default TiltProductCards;

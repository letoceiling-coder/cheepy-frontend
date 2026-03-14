import { useState } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";

const images = [product1, product2, product3];

const ProductRotationShowcase = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [angle, setAngle] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  const currentIndex = ((Math.round(angle / 120) % images.length) + images.length) % images.length;

  const handleDown = (e: React.MouseEvent | React.TouchEvent) => {
    setDragging(true);
    const x = "touches" in e ? e.touches[0].clientX : e.clientX;
    setStartX(x);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragging) return;
    const x = "touches" in e ? e.touches[0].clientX : e.clientX;
    setAngle((prev) => prev + (x - startX) * 0.5);
    setStartX(x);
  };

  const handleUp = () => setDragging(false);

  return (
    <section ref={ref} className={`py-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-xl font-bold text-foreground mb-1">Обзор 360°</h2>
        <p className="text-sm text-muted-foreground mb-4">Перетащите для поворота</p>

        <div
          className="relative rounded-xl overflow-hidden border border-border bg-card aspect-square cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleDown}
          onMouseMove={handleMove}
          onMouseUp={handleUp}
          onMouseLeave={handleUp}
          onTouchStart={handleDown}
          onTouchMove={handleMove}
          onTouchEnd={handleUp}
        >
          {images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`View ${i}`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${i === currentIndex ? "opacity-100" : "opacity-0"}`}
            />
          ))}

          {/* Rotation indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentIndex ? "bg-primary w-4" : "bg-muted-foreground/40"}`} />
            ))}
          </div>
        </div>

        <div className="mt-3">
          <p className="text-sm font-semibold text-foreground">Куртка Premium Edition</p>
          <p className="text-sm font-bold text-primary">9 990 ₽</p>
        </div>

        <button className="mt-3 h-9 px-5 gradient-primary text-primary-foreground rounded-lg font-semibold text-sm inline-flex items-center gap-2 hover:opacity-90 transition-opacity mx-auto">
          В корзину
        </button>
      </div>
    </section>
  );
};

export default ProductRotationShowcase;

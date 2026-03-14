import { useState } from "react";
import { Star, ShoppingCart, Heart } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { mockProducts } from "@/data/mock-data";

const ProductShowcase = () => {
  const { ref, isVisible } = useScrollAnimation();
  const product = mockProducts[0];
  const [activeImage, setActiveImage] = useState(0);
  const [liked, setLiked] = useState(false);

  return (
    <section ref={ref} className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100" : "opacity-0"}`}>
      <h2 className="text-xl font-bold text-foreground mb-6">Товар дня</h2>
      <div className="flex flex-col md:flex-row gap-6 bg-card rounded-2xl border border-border p-4 md:p-6">
        <div className="md:w-2/5 flex-shrink-0">
          <div className="rounded-xl overflow-hidden mb-3 h-[280px] bg-secondary">
            <img
              src={product.images[activeImage]}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-500"
              key={activeImage}
            />
          </div>
          <div className="flex gap-2">
            {product.images.slice(0, 4).map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 ${activeImage === i ? "border-primary scale-105" : "border-border opacity-60 hover:opacity-100"}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
        <div className="md:w-3/5 flex flex-col justify-center">
          <span className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{product.brand}</span>
          <h3 className="text-lg md:text-xl font-bold text-foreground mb-3">{product.name}</h3>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} className={i < Math.floor(product.rating) ? "text-amber-400 fill-amber-400" : "text-border"} />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{product.reviews} отзывов</span>
          </div>
          <p className="text-muted-foreground text-sm mb-4 leading-relaxed line-clamp-3">{product.description}</p>
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-2xl font-bold text-foreground">{product.price.toLocaleString()} ₽</span>
            {product.oldPrice && (
              <span className="text-sm text-muted-foreground line-through">{product.oldPrice.toLocaleString()} ₽</span>
            )}
          </div>
          <div className="flex gap-3">
            <button className="flex-1 h-10 rounded-xl gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity text-sm">
              <ShoppingCart size={16} /> В корзину
            </button>
            <button
              onClick={() => setLiked(!liked)}
              className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-300 ${liked ? "bg-destructive/10 border-destructive text-destructive" : "border-border hover:border-primary"}`}
            >
              <Heart size={16} className={liked ? "fill-destructive" : ""} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;

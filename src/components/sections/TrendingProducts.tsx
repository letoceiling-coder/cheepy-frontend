import { useState } from "react";
import { Heart, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { useDragScroll } from "@/hooks/useDragScroll";
import { Link } from "react-router-dom";
import { trendingProducts, type TrendProduct } from "@/data/marketplaceData";

const TrendCard = ({ product }: { product: TrendProduct }) => {
  const [isHovered, setIsHovered] = useState(false);
  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;

  return (
    <div
      className="group relative bg-card rounded-xl overflow-hidden border border-border flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/product/${product.id}`} className="block">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent" />

          {/* Badges */}
          <span className="absolute top-2 left-2 bg-foreground text-background text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Trend
          </span>

          {discount > 0 && (
            <span className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded">
              -{discount}%
            </span>
          )}

          {/* Favorite button */}
          <button 
            className={`absolute top-8 right-2 p-1.5 rounded-full bg-background/80 text-muted-foreground hover:text-primary transition-all duration-200 ${isHovered ? "opacity-100" : "opacity-0"}`}
            aria-label="В избранное"
          >
            <Heart className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-2.5">
          <p className="text-[11px] font-medium text-foreground line-clamp-2 mb-1">{product.name}</p>
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="text-sm font-bold text-foreground">{product.price.toLocaleString()} ₽</span>
            {product.oldPrice && (
              <span className="text-[10px] text-muted-foreground line-through">{product.oldPrice.toLocaleString()} ₽</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="text-accent">★</span>
            <span>{product.rating}</span>
            <span>·</span>
            <span>{product.reviews} отз.</span>
          </div>
          <button
            className={`mt-2 w-full gradient-primary text-primary-foreground text-[10px] py-1.5 rounded-full font-medium flex items-center justify-center gap-1 transition-all duration-200 hover:opacity-90 ${isHovered ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          >
            <ShoppingCart className="w-3 h-3" />
            В корзину
          </button>
        </div>
      </Link>
    </div>
  );
};

const TrendingProducts = () => {
  const scrollRef = useDragScroll<HTMLDivElement>();

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 180, behavior: "smooth" });
  };

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-foreground">ТРЕНДОВЫЕ ТОВАРЫ</h2>
        <div className="flex gap-1 md:hidden">
          <button onClick={() => scroll(-1)} className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors">
            <ChevronLeft size={14} />
          </button>
          <button onClick={() => scroll(1)} className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Desktop: 4 cards grid */}
      <div className="hidden md:grid grid-cols-4 gap-3">
        {trendingProducts.slice(0, 4).map((product) => (
          <TrendCard key={product.id} product={product} />
        ))}
      </div>

      {/* Tablet: 2 cards grid */}
      <div className="hidden sm:grid md:hidden grid-cols-2 gap-3">
        {trendingProducts.slice(0, 4).map((product) => (
          <TrendCard key={product.id} product={product} />
        ))}
      </div>

      {/* Mobile: horizontal carousel */}
      <div ref={scrollRef} className="sm:hidden overflow-x-auto flex gap-2.5 snap-x snap-mandatory no-scrollbar pb-2 cursor-grab active:cursor-grabbing">
        {trendingProducts.slice(0, 8).map((product) => (
          <div key={product.id} className="shrink-0 w-[150px] snap-start">
            <TrendCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default TrendingProducts;

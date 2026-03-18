import { useState, useEffect } from "react";
import { Heart, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { bestsellers, type BestsellProduct } from "@/data/marketplaceData";
import { cn } from "@/lib/utils";

const BestsellerCard = ({ product }: { product: BestsellProduct }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const third = rect.width / 3;
    setActiveImage(Math.min(Math.floor(x / third), product.images.length - 1));
  };

  return (
    <div
      className="group bg-card rounded-xl overflow-hidden border border-border flex flex-col hover:-translate-y-1 hover:shadow-lg transition-all duration-250 w-full max-w-[200px] mx-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setActiveImage(0); }}
    >
      <Link to={`/product/${product.id}`} className="block relative h-[140px] sm:h-[150px] md:h-[160px] overflow-hidden bg-secondary" onMouseMove={handleMouseMove}>
        {product.images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={product.name}
            loading="lazy"
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-all duration-300",
              i === activeImage ? "opacity-100" : "opacity-0",
              isHovered && i === activeImage ? "scale-110" : "scale-100"
            )}
          />
        ))}
        <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
          Хит
        </span>
        {discount > 0 && (
          <span className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
            -{discount}%
          </span>
        )}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-0.5">
          {product.images.length > 1 && product.images.map((_, i) => (
            <div key={i} className={cn("h-0.5 rounded-full transition-all duration-200", i === activeImage ? "w-3 bg-primary" : "w-1.5 bg-foreground/30")} />
          ))}
        </div>
        <div className={cn("absolute top-9 right-2 flex flex-col gap-1 transition-all duration-200", isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1")}>
          <button className="p-1.5 rounded-full bg-background/90 text-muted-foreground hover:text-primary transition-colors" aria-label="В избранное">
            <Heart className="w-3.5 h-3.5" />
          </button>
        </div>
      </Link>
      <div className="p-2.5">
        <p className="text-[11px] text-foreground line-clamp-1 mb-1">{product.name}</p>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
          <span className="text-accent">★</span>
          <span>{product.rating}</span>
          <span>·</span>
          <span>{product.reviews} отз.</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-foreground">{product.price.toLocaleString()} ₽</span>
            {product.oldPrice && (
              <span className="text-[10px] text-muted-foreground line-through">{product.oldPrice.toLocaleString()} ₽</span>
            )}
          </div>
          <button
            className={cn(
              "p-1.5 rounded-full gradient-primary text-primary-foreground transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0",
              isHovered ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"
            )}
            aria-label="В корзину"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const Bestsellers = () => {
  const sorted = [...bestsellers].sort((a, b) => b.sold - a.sold);
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  useEffect(() => {
    if (!api) return;
    const update = () => {
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    };
    update();
    api.on("select", update);
    api.on("reInit", update);
    return () => {
      api.off("select", update);
      api.off("reInit", update);
    };
  }, [api]);

  return (
    <section className="py-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base sm:text-lg font-bold text-foreground">ХИТЫ ПРОДАЖ</h2>
        <div className="flex gap-1">
          <button
            onClick={() => api?.scrollPrev()}
            disabled={!canScrollPrev}
            className="p-1.5 sm:p-2 rounded-full border border-border hover:bg-primary/5 active:bg-primary/10 transition-colors touch-manipulation disabled:opacity-50 disabled:pointer-events-none"
            aria-label="Назад"
          >
            <ChevronLeft size={14} className="text-muted-foreground sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={() => api?.scrollNext()}
            disabled={!canScrollNext}
            className="p-1.5 sm:p-2 rounded-full border border-border hover:bg-primary/5 active:bg-primary/10 transition-colors touch-manipulation disabled:opacity-50 disabled:pointer-events-none"
            aria-label="Вперёд"
          >
            <ChevronRight size={14} className="text-muted-foreground sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      <Carousel
        opts={{
          align: "start",
          loop: true,
          dragFree: false,
          containScroll: "trimSnaps",
        }}
        setApi={setApi}
        className="w-full -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        <CarouselContent className="-ml-3 sm:-ml-4">
          {sorted.map((product) => (
            <CarouselItem
              key={product.id}
              className="pl-3 sm:pl-4 basis-[85%] sm:basis-1/2 lg:basis-1/4"
            >
              <BestsellerCard product={product} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
};

export default Bestsellers;

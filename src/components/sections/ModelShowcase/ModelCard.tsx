import { useState, useRef, useMemo } from "react";
import { Heart, ShoppingCart } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import ModelPreviewVideo from "./ModelPreviewVideo";

interface ModelCardProps {
  image?: string;
  videoSrc: string;
  name: string;
  price: number;
  oldPrice?: number;
  id: number;
  delay?: number;
}

const ModelCard = ({ image, videoSrc, name, price, oldPrice, id, delay = 0 }: ModelCardProps) => {
  const [isFav, setIsFav] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { ref, isVisible } = useScrollAnimation();

  // Random rotation direction per card (stable across renders)
  const direction = useMemo(() => (Math.random() > 0.5 ? 1 : -1), []);

  // Animation duration between 8-10s
  const duration = useMemo(() => 8 + Math.random() * 2, []);

  const discount = oldPrice ? Math.round((1 - price / oldPrice) * 100) : 0;

  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div
        ref={cardRef}
        className="group relative bg-card rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-shadow duration-300"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image with 3D rotation */}
        <a href={`/product/${id}`} className="block relative aspect-[3/4] overflow-hidden" style={{ perspective: "800px" }}>
          <div
            className="w-full h-full transition-transform duration-300"
            style={{
              transformStyle: "preserve-3d",
              animation: isHovered ? "none" : `modelRotate${direction > 0 ? "Right" : "Left"} ${duration}s cubic-bezier(0.45,0.05,0.55,0.95) infinite`,
              transform: isHovered ? "rotateY(0deg) scale(1.05)" : undefined,
            }}
          >
            <ModelPreviewVideo src={videoSrc} alt={name} className="absolute inset-0 w-full h-full" />
          </div>

          {/* Discount badge */}
          {discount > 0 && (
            <span className="absolute top-2 left-2 gradient-hero text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-full z-10">
              -{discount}%
            </span>
          )}

          {/* Hover actions */}
          <div className={`absolute top-2 right-2 flex flex-col gap-1.5 transition-all duration-200 z-10 ${isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"}`}>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsFav(!isFav); }}
              className={`p-1.5 rounded-full bg-background/90 backdrop-blur-sm transition-all duration-200 active:scale-90 ${isFav ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
            >
              <Heart className={`w-4 h-4 transition-transform duration-200 ${isFav ? "fill-primary scale-110" : ""}`} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              className="p-1.5 rounded-full bg-background/90 backdrop-blur-sm text-muted-foreground hover:text-primary transition-all duration-200 active:scale-90"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>

          {/* Rotation indicator */}
          <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 text-xs text-background/80 bg-foreground/40 backdrop-blur-sm px-2 py-0.5 rounded-full transition-opacity duration-300 ${isHovered ? "opacity-0" : "opacity-100"}`}>
            <svg className="w-3 h-3 animate-spin" style={{ animationDuration: "3s" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            360°
          </div>
        </a>

        {/* Info */}
        <div className="p-3">
          <p className="text-sm text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">{name}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-foreground">{price.toLocaleString()} ₽</span>
            {oldPrice && (
              <span className="text-xs text-muted-foreground line-through">{oldPrice.toLocaleString()} ₽</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelCard;

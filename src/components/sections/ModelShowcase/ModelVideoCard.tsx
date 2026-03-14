import { useMemo, useState } from "react";
import { Heart, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import ModelPreviewVideo from "./ModelPreviewVideo";

interface ModelVideoCardProps {
  id: number;
  name: string;
  price: number;
  videoSrc: string;
  className?: string;
}

const ModelVideoCard = ({ id, name, price, videoSrc, className }: ModelVideoCardProps) => {
  const [isFav, setIsFav] = useState(false);

  const priceLabel = useMemo(() => `${price.toLocaleString()} ₽`, [price]);

  return (
    <article
      className={cn(
        "group flex h-[340px] max-h-[340px] flex-col overflow-hidden rounded-xl border border-border bg-card",
        className,
      )}
    >
      <a
        href={`/product/${id}`}
        className="relative block w-full overflow-hidden"
        aria-label={name}
      >
        {/* 4:5 video preview */}
        <div className="relative aspect-[4/5] w-full max-h-[260px] overflow-hidden bg-secondary">
          <ModelPreviewVideo src={videoSrc} alt={name} className="absolute inset-0" />
        </div>

        {/* Favorite */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsFav((v) => !v);
          }}
          className={cn(
            "absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/80 backdrop-blur-sm transition-colors",
            isFav ? "text-primary" : "text-muted-foreground hover:text-primary",
          )}
          aria-label={isFav ? "Убрать из избранного" : "Добавить в избранное"}
        >
          <Heart className={cn("h-4 w-4", isFav ? "fill-primary" : "")} />
        </button>
      </a>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <a href={`/product/${id}`} className="min-w-0">
          <p className="line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary transition-colors">
            {name}
          </p>
        </a>

        <div className="flex items-center justify-between gap-3">
          <p className="text-base font-bold text-foreground">{priceLabel}</p>
        </div>

        <div className="mt-auto">
          <button
            type="button"
            className="h-9 w-full rounded-lg gradient-primary text-primary-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            aria-label={`Добавить в корзину: ${name}`}
          >
            <ShoppingCart className="h-4 w-4" />
            В корзину
          </button>
        </div>
      </div>
    </article>
  );
};

export default ModelVideoCard;

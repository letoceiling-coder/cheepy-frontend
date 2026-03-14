import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, BarChart2 } from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  images: string[];
  rating: number;
  reviews: number;
  seller: string;
}

const ProductCard = ({ product, variant = "grid" }: { product: Product; variant?: "grid" | "list" }) => {
  const navigate = useNavigate();
  const [activeImage, setActiveImage] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const third = rect.width / 3;
    const idx = Math.min(Math.floor(x / third), product.images.length - 1);
    setActiveImage(idx);
  };

  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0;

  if (variant === "list") {
    return (
      <div
        className="group flex w-full bg-card rounded-xl border border-border overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setActiveImage(0); }}
      >
        <a href={`/product/${product.id}`} className="shrink-0 w-24 sm:w-28 aspect-square relative overflow-hidden bg-secondary">
          {product.images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={product.name}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
                i === activeImage ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
          {discount > 0 && (
            <span className="absolute top-1 left-1 gradient-hero text-primary-foreground text-xs font-semibold px-1.5 py-0.5 rounded">
              -{discount}%
            </span>
          )}
        </a>
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 p-3 sm:p-4">
          <div className="flex-1 min-w-0">
            <a href={`/product/${product.id}`} className="block">
              <p className="text-sm font-medium text-foreground line-clamp-2 hover:text-primary transition-colors">{product.name}</p>
            </a>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-base font-bold text-foreground">{product.price.toLocaleString()} ₽</span>
              {product.oldPrice && (
                <span className="text-xs text-muted-foreground line-through">{product.oldPrice.toLocaleString()} ₽</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <span className="text-yellow-500">★</span>
              <span>{product.rating}</span>
              <span>·</span>
              <span>{product.reviews} отзывов</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{product.seller}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={(e) => { e.preventDefault(); setIsFavorite(!isFavorite); }}
              className={`p-2 rounded-full border border-border transition-colors ${isFavorite ? "bg-primary/10 text-primary border-primary/30" : "bg-secondary text-muted-foreground hover:text-primary"}`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? "fill-primary" : ""}`} />
            </button>
            <a
              href={`/product/${product.id}`}
              className="gradient-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-full hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              В корзину
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative bg-card rounded-xl overflow-hidden border border-border flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setActiveImage(0);
      }}
    >
      {/* Image area with 3-zone hover */}
      <div
        className="relative aspect-[3/4] overflow-hidden cursor-pointer flex-none bg-secondary"
        onMouseMove={handleMouseMove}
      >
        {product.images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={product.name}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
              i === activeImage ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        {/* Image indicators */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {product.images.length > 1 &&
            product.images.map((_, i) => (
              <div
                key={i}
                className={`h-0.5 rounded-full transition-all duration-200 ${
                  i === activeImage ? "w-4 bg-primary" : "w-2 bg-foreground/30"
                }`}
              />
            ))}
        </div>

        {/* Discount badge */}
        {discount > 0 && (
          <span className="absolute top-2 left-2 gradient-hero text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
            -{discount}%
          </span>
        )}

        {/* Action icons - visible on hover */}
        <div
          className={`absolute top-2 right-2 flex flex-col gap-1.5 transition-opacity duration-200 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFavorite(!isFavorite);
            }}
            className={`p-1.5 rounded-full bg-background/90 transition-colors ${
              isFavorite ? "text-primary" : "text-muted-foreground hover:text-primary"
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? "fill-primary" : ""}`} />
          </button>
          <button className="p-1.5 rounded-full bg-background/90 text-muted-foreground hover:text-primary transition-colors">
            <BarChart2 className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-full bg-background/90 text-muted-foreground hover:text-primary transition-colors">
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Info - button in flow so it doesn't overlay content and stays clickable */}
      <div className="flex-1 min-h-0 p-3 flex flex-col">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-lg font-bold text-foreground">{product.price.toLocaleString()} ₽</span>
          {product.oldPrice && (
            <span className="text-sm text-muted-foreground line-through">{product.oldPrice.toLocaleString()} ₽</span>
          )}
        </div>
        <p className="text-sm text-foreground line-clamp-2 mb-1">{product.name}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="text-yellow-500">★</span>
          <span>{product.rating}</span>
          <span>·</span>
          <span>{product.reviews} отзывов</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{product.seller}</p>

        <div className="mt-auto pt-3 min-h-[32px] flex items-center">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/product/${product.id}`);
            }}
            className={`w-full gradient-primary text-primary-foreground text-xs py-1.5 rounded-full font-medium transition-opacity duration-200 hover:opacity-90 ${
              isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            В корзину
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

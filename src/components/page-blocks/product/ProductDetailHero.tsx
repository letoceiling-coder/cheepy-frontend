import { useState } from "react";
import { useParams } from "react-router-dom";
import { Heart, ShoppingCart, Share2, Star, Minus, Plus, Shield, Truck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockProducts } from "@/data/mock-data";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";

export default function ProductDetailHero() {
  const { id } = useParams();
  const product = mockProducts.find((p) => p.id === Number(id)) || mockProducts[0];
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [quantity, setQuantity] = useState(1);

  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 md:items-start">
      <div className="flex flex-col md:flex-row-reverse md:items-start md:gap-3">
        <div className="aspect-[3/4] max-h-[500px] rounded-2xl overflow-hidden bg-secondary mb-3 md:mb-0 md:flex-1 md:min-w-0">
          <img src={product.images[activeImage]} alt={product.name} className="w-full h-full object-contain" />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar md:flex-col md:overflow-x-hidden md:overflow-y-auto md:max-h-[500px] md:shrink-0 md:w-[68px] md:gap-2">
          {product.images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveImage(i)}
              className={`shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                i === activeImage ? "border-primary" : "border-transparent hover:border-border"
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">{product.name}</h1>
          <button
            type="button"
            onClick={() => navigator.share?.({ title: product.name, url: window.location.href }).catch(() => {})}
            className="shrink-0 p-2 rounded-lg border border-border text-muted-foreground hover:text-primary transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-4 h-4 ${s <= Math.round(product.rating) ? "fill-yellow-500 text-yellow-500" : "text-border"}`}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {product.rating} · {product.reviews} отзывов
          </span>
        </div>

        <div className="flex items-baseline gap-3 mb-6">
          <span className="text-3xl font-bold text-foreground">{(product.price * quantity).toLocaleString()} ₽</span>
          {product.oldPrice && (
            <>
              <span className="text-lg text-muted-foreground line-through">
                {(product.oldPrice * quantity).toLocaleString()} ₽
              </span>
              <span className="gradient-hero text-primary-foreground text-sm font-semibold px-2 py-0.5 rounded-full">
                -{discount}%
              </span>
            </>
          )}
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium text-foreground mb-2">
            Цвет: <span className="text-muted-foreground">{selectedColor}</span>
          </p>
          <div className="flex gap-2">
            {product.colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedColor(c)}
                className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                  selectedColor === c
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-foreground hover:border-primary/50"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-foreground">
              Размер: <span className="text-muted-foreground">{selectedSize}</span>
            </p>
            <button type="button" className="text-sm text-primary hover:underline">
              Таблица размеров
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedSize(s)}
                className={`w-12 h-10 rounded-lg text-sm font-medium border transition-colors ${
                  selectedSize === s
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-foreground hover:border-primary/50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm font-medium text-foreground mb-2">Количество</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-lg font-medium w-8 text-center">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <Button
            onClick={() => addToCart(product, selectedColor, selectedSize)}
            className="flex-1 gradient-primary text-primary-foreground rounded-xl py-3 h-auto text-sm font-semibold gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Добавить в корзину
          </Button>
          <button
            type="button"
            onClick={() => toggleFavorite(product)}
            className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-colors ${
              isFavorite(product.id)
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-primary hover:border-primary"
            }`}
          >
            <Heart className={`w-5 h-5 ${isFavorite(product.id) ? "fill-primary" : ""}`} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Shield, label: "Гарантия качества" },
            { icon: Truck, label: "Бесплатная доставка" },
            { icon: RotateCcw, label: "Возврат 14 дней" },
          ].map((g) => (
            <div key={g.label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary text-center">
              <g.icon className="w-5 h-5 text-primary" />
              <span className="text-xs text-muted-foreground">{g.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

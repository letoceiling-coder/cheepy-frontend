import { useState, useEffect } from "react";
import { Heart, ShoppingCart, ArrowUpDown, Trash2 } from "lucide-react";
import { mockProducts } from "@/data/mock-data";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";

type SortKey = "name" | "price-asc" | "price-desc" | "rating";

const PersonFavorites = () => {
  const { requireAuth } = useLoginPrompt();
  const { toast } = useToast();
  const { favorites } = useFavorites();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>("name");

  const products = mockProducts.slice(0, 8);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const sorted = [...products].sort((a, b) => {
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    if (sort === "rating") return b.rating - a.rating;
    return a.name.localeCompare(b.name);
  });

  const handleRemove = (id: number) => {
    if (!requireAuth("Удалить из избранного")) return;
    toast({ title: "Удалено из избранного" });
  };

  const handleAddToCart = (product: typeof products[0]) => {
    if (!requireAuth("Добавить в корзину")) return;
    addToCart(product, product.colors[0], product.sizes[0]);
    toast({ title: "Добавлено в корзину", description: product.name });
  };

  if (loading) return <FavoritesSkeleton />;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-foreground">Избранное</h2>
          <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-500 font-medium">{sorted.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
            className="text-xs bg-transparent border border-border rounded-lg px-2 py-1.5 text-foreground focus:outline-none focus:border-primary/30"
          >
            <option value="name">По названию</option>
            <option value="price-asc">Цена ↑</option>
            <option value="price-desc">Цена ↓</option>
            <option value="rating">По рейтингу</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {sorted.map((p, i) => (
          <div
            key={p.id}
            className="rounded-2xl border border-border bg-card overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/20 animate-fade-in"
            style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
          >
            <div
              className="aspect-square overflow-hidden relative cursor-pointer"
              onClick={() => navigate(`/product/${p.id}`)}
            >
              <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <button
                onClick={(e) => { e.stopPropagation(); handleRemove(p.id); }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-destructive/10"
              >
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </button>
              {p.oldPrice && (
                <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground">
                  -{Math.round((1 - p.price / p.oldPrice) * 100)}%
                </span>
              )}
            </div>
            <div className="p-3">
              <p className="text-xs text-foreground truncate mb-1">{p.name}</p>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold text-foreground">{p.price.toLocaleString()} ₽</span>
                {p.oldPrice && <span className="text-[10px] text-muted-foreground line-through">{p.oldPrice.toLocaleString()} ₽</span>}
              </div>
              <div className="flex items-center gap-1 mb-2">
                <span className="text-amber-400 text-[10px]">★</span>
                <span className="text-[10px] text-muted-foreground">{p.rating} ({p.reviews})</span>
              </div>
              <Button
                onClick={() => handleAddToCart(p)}
                size="sm"
                className="w-full gradient-primary text-primary-foreground rounded-xl text-xs h-8 shadow-md shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                <ShoppingCart className="w-3 h-3 mr-1" /> В корзину
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FavoritesSkeleton = () => (
  <div className="space-y-5">
    <div className="flex items-center gap-3">
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-6 w-8 rounded-full" />
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {[0,1,2,3,4,5].map(i => (
        <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
          <Skeleton className="aspect-square" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default PersonFavorites;

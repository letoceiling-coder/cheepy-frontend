import { useState, useEffect } from "react";
import { Clock, Heart } from "lucide-react";
import { mockProducts } from "@/data/mock-data";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

const PersonRecentlyViewed = () => {
  const { requireAuth } = useLoginPrompt();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const products = mockProducts.slice(0, 12);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const handleFavorite = (name: string) => {
    if (!requireAuth("Добавить в избранное")) return;
    toast({ title: "Добавлено в избранное", description: name });
  };

  if (loading) return <RecentSkeleton />;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-5">
        <Clock className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Недавно просмотренные</h2>
        <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">{products.length}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {products.map((p, i) => (
          <div
            key={p.id}
            className="rounded-xl border border-border bg-card overflow-hidden group cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/20 animate-fade-in"
            style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
            onClick={() => navigate(`/product/${p.id}`)}
          >
            <div className="aspect-square overflow-hidden relative">
              <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <button
                onClick={(e) => { e.stopPropagation(); handleFavorite(p.name); }}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-rose-500/10"
              >
                <Heart className="w-3 h-3 text-muted-foreground hover:text-rose-500 transition-colors" />
              </button>
            </div>
            <div className="p-2">
              <p className="text-[11px] text-foreground truncate">{p.name}</p>
              <p className="text-xs font-bold text-foreground">{p.price.toLocaleString()} ₽</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RecentSkeleton = () => (
  <div className="space-y-5">
    <Skeleton className="h-7 w-56" />
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border overflow-hidden">
          <Skeleton className="aspect-square" />
          <div className="p-2 space-y-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default PersonRecentlyViewed;

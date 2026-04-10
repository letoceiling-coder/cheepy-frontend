import { Link } from "react-router-dom";
import { Heart, LogIn } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoritesContext";

export default function FavoritesPageContent() {
  const { isAuthenticated } = useAuth();
  const { favorites } = useFavorites();

  return (
    <>
      <h1 className="text-2xl font-bold text-foreground mb-6">
        Избранное{" "}
        {isAuthenticated && favorites.length > 0 && (
          <span className="text-muted-foreground font-normal text-lg">({favorites.length})</span>
        )}
      </h1>

      {!isAuthenticated ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Heart className="w-16 h-16 text-border mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Войдите, чтобы увидеть избранное</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">Сохраняйте понравившиеся товары и следите за изменениями цен</p>
          <Link to="/auth">
            <Button className="gradient-primary text-primary-foreground rounded-lg gap-2">
              <LogIn className="w-4 h-4" />
              Войти
            </Button>
          </Link>
        </div>
      ) : favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Heart className="w-16 h-16 text-border mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">В избранном пусто</h2>
          <p className="text-sm text-muted-foreground mb-6">Добавляйте товары, нажимая ♡ на карточке</p>
          <Link to="/">
            <Button className="gradient-primary text-primary-foreground rounded-lg">На главную</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {favorites.map((p) => (
            <a key={p.id} href={`/product/${p.id}`}>
              <ProductCard product={p} />
            </a>
          ))}
        </div>
      )}
    </>
  );
}

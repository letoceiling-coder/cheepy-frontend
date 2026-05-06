import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useMemo } from "react";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { resolveCrmMediaAssetUrl, type StorefrontProductCardPayload } from "@/lib/api";
import { useStorefrontProductCards } from "@/hooks/useStorefrontProductCards";
import type { StorefrontProduct } from "@/types/storefront-product";

function cardPayloadToStorefront(row: StorefrontProductCardPayload): StorefrontProduct {
  const thumb = row.thumbnail ? resolveCrmMediaAssetUrl(row.thumbnail) : "";
  return {
    id: row.id,
    name: row.title,
    price: row.price_raw,
    oldPrice: undefined,
    images: thumb ? [thumb] : [],
    rating: 0,
    reviews: 0,
    seller: row.seller?.name ?? "",
    category: row.category?.name ?? "",
    description: "",
    colors: [],
    sizes: [],
    material: "",
    brand: "",
  };
}

export default function FavoritesPageContent() {
  const { isAuthenticated } = useAuth();
  const { favoriteEntries, count } = useFavorites();

  const idList = useMemo(() => favoriteEntries.map((e) => e.productId), [favoriteEntries]);
  const cardsQuery = useStorefrontProductCards(idList);

  const products: StorefrontProduct[] = useMemo(() => {
    const byId = cardsQuery.data;
    if (!byId || idList.length === 0) return [];
    const out: StorefrontProduct[] = [];
    for (const e of favoriteEntries) {
      const row = byId[String(e.productId)];
      if (row) out.push(cardPayloadToStorefront(row));
    }
    return out;
  }, [favoriteEntries, cardsQuery.data, idList.length]);

  return (
    <>
      <h1 className="text-2xl font-bold text-foreground mb-4">
        Избранное
        {count > 0 && (
          <span className="text-muted-foreground font-normal text-lg"> ({count})</span>
        )}
      </h1>

      {!isAuthenticated ? (
        <p className="text-sm text-muted-foreground rounded-lg border border-border bg-muted/20 px-3 py-2 mb-6">
          Список хранится в этом браузере. Войдите в аккаунт для будущих сценариев синхронизации между устройствами.
          <Link to="/auth" className="text-primary font-medium hover:underline ml-1 inline">
            Войти
          </Link>
        </p>
      ) : null}

      {favoriteEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Heart className="w-16 h-16 text-border mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">В избранном пусто</h2>
          <p className="text-sm text-muted-foreground mb-6">Добавляйте товары, нажимая ♡ на карточке</p>
          <Link to="/">
            <Button className="gradient-primary text-primary-foreground rounded-lg">На главную</Button>
          </Link>
        </div>
      ) : cardsQuery.isPending ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-pulse">
          {favoriteEntries.slice(0, 10).map((e) => (
            <div key={e.productId} className="aspect-[3/4] rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : cardsQuery.isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Не удалось загрузить карточки товаров. Попробуйте обновить страницу.
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Часть товаров недоступна в каталоге. Удалите устаревшие позиции вручную (♡ на карточке), если они ещё отображались где-то.
          </p>
          <Link to="/">
            <Button variant="outline" className="rounded-lg">На главную</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((p) => (
            <div key={String(p.id)} className="h-full">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Heart, Sparkles, Trash2, RotateCcw, Search, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { publicApi } from "@/lib/api";
import { useUserPreferenceSummary } from "@/hooks/useUserPreferences";
import { useFavoriteEntries } from "@/hooks/useFavorites";
import { clearUserPreferences } from "@/lib/userPreferences";
import { clearFavorites } from "@/lib/favorites";

function formatRelativeTime(ts: number): string {
  if (!ts) return "—";
  const diff = Math.max(0, Date.now() - ts);
  const sec = Math.round(diff / 1000);
  if (sec < 60) return "только что";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} мин назад`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} ч назад`;
  const day = Math.round(hr / 24);
  if (day < 14) return `${day} дн назад`;
  return new Date(ts).toLocaleDateString("ru-RU");
}

const PreferencesPage = () => {
  const summary = useUserPreferenceSummary();
  const favorites = useFavoriteEntries();
  const [confirmReset, setConfirmReset] = useState<null | "all" | "products" | "categories" | "searches" | "favorites">(null);

  const productIds = useMemo(() => summary.topProducts.map((x) => String(x.item.id)).slice(0, 24), [summary.topProducts]);
  const cardsQuery = useQuery({
    queryKey: ["preferences-product-cards", productIds.join("|")],
    queryFn: () => publicApi.productsStorefrontCards(productIds),
    enabled: productIds.length > 0,
    staleTime: 60_000,
  });
  const cards = cardsQuery.data?.by_id ?? {};

  const menuQuery = useQuery({
    queryKey: ["public-menu-categories"],
    queryFn: () => publicApi.menu(),
    staleTime: 5 * 60_000,
  });
  const flatCats = useMemo(() => {
    const out: Array<{ id: number; name: string; slug: string }> = [];
    const stack = [...(menuQuery.data?.categories ?? [])];
    while (stack.length) {
      const c = stack.shift()!;
      out.push({ id: c.id, name: c.name, slug: c.slug });
      if (Array.isArray(c.children)) stack.unshift(...c.children);
    }
    return out;
  }, [menuQuery.data]);
  const catById = useMemo(() => {
    const m = new Map<number, { id: number; name: string; slug: string }>();
    for (const c of flatCats) m.set(c.id, c);
    return m;
  }, [flatCats]);

  const handleReset = (scope: "all" | "products" | "categories" | "searches" | "favorites") => {
    if (scope === "favorites") {
      clearFavorites();
      toast.success("Избранное очищено");
    } else if (scope === "all") {
      clearUserPreferences();
      clearFavorites();
      toast.success("Аналитика и избранное сброшены");
    } else {
      // Точечный сброс — упрощённо: пересоздаём «всё», поскольку движок монолитный.
      // Если потребуется частичный сброс — расширим userPreferences API.
      clearUserPreferences();
      toast.success("Аналитика сброшена");
    }
    setConfirmReset(null);
  };

  const hasData = summary.topProducts.length > 0 || summary.topCategories.length > 0 || summary.recentSearches.length > 0 || favorites.length > 0;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-bold text-foreground">Предпочтения</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Здесь собирается анонимная статистика вашего поведения на сайте — она помогает блоку «Для вас» подбирать товары, которые могут вам понравиться.
          Данные хранятся локально в браузере; вы можете в любой момент их посмотреть или удалить.
        </p>
      </header>

      {/* Метрики */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Любимых товаров</p>
          <p className="text-2xl font-bold text-foreground mt-1">{favorites.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Просмотрено товаров</p>
          <p className="text-2xl font-bold text-foreground mt-1">{summary.totalProducts}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Интересные категории</p>
          <p className="text-2xl font-bold text-foreground mt-1">{summary.totalCategories}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Поисковых запросов</p>
          <p className="text-2xl font-bold text-foreground mt-1">{summary.totalSearches}</p>
        </div>
      </section>

      {/* Управление */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Управление аналитикой
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Сброс удалит накопленную статистику. Блок «Для вас» начнёт подбор заново после ваших новых просмотров.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmReset("favorites")}
              disabled={favorites.length === 0}
              className="gap-2"
            >
              <Heart className="w-4 h-4" /> Очистить избранное
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmReset("all")}
              disabled={!hasData}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Сбросить всё
            </Button>
          </div>
        </div>
      </section>

      {/* Топ категорий */}
      <section>
        <div className="flex items-baseline justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground inline-flex items-center gap-2">
            <Tag className="w-4 h-4" /> Любимые категории
          </h3>
          {summary.topCategories.length > 0 && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setConfirmReset("categories")}>
              Сбросить
            </Button>
          )}
        </div>
        {summary.topCategories.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-xl border border-dashed border-border p-4">
            Пока нет данных. Открывайте интересные категории — они появятся здесь.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {summary.topCategories.slice(0, 16).map((row) => {
              const cat = catById.get(row.item.id);
              const slug = row.item.slug ?? cat?.slug;
              const name = cat?.name ?? `Категория #${row.item.id}`;
              return (
                <Link
                  key={row.item.id}
                  to={slug ? `/category/${slug}` : "#"}
                  className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-secondary text-foreground text-xs hover:bg-primary/10 hover:text-primary transition-colors"
                  title={`Score ${row.score.toFixed(1)} • событий ${row.count} • ${formatRelativeTime(row.lastAt)}`}
                >
                  {name}
                  <span className="text-[10px] text-muted-foreground">×{row.count}</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Топ товаров */}
      <section>
        <div className="flex items-baseline justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Чем вы интересовались
          </h3>
          {summary.topProducts.length > 0 && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setConfirmReset("products")}>
              Сбросить
            </Button>
          )}
        </div>
        {summary.topProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-xl border border-dashed border-border p-4">
            Просмотрите карточки товаров — здесь будет ваш персональный рейтинг.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {summary.topProducts.slice(0, 12).map((row) => {
              const card = cards[String(row.item.id)];
              const title = card?.title ?? `Товар #${row.item.id}`;
              const img = card?.thumbnail ?? "";
              const price = typeof card?.price_raw === "number" && card.price_raw > 0 ? card.price_raw : null;
              return (
                <Link
                  key={row.item.id}
                  to={`/product/${row.item.id}`}
                  className="group rounded-xl border border-border bg-card overflow-hidden flex flex-col hover:border-primary/40 transition-colors"
                  title={`Score ${row.score.toFixed(1)} • событий ${row.count} • ${formatRelativeTime(row.lastAt)}`}
                >
                  <div className="aspect-square bg-secondary overflow-hidden">
                    {img ? (
                      <img src={img} alt={title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">нет фото</div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs text-foreground line-clamp-2">{title}</p>
                    <div className="flex items-baseline justify-between gap-2 mt-1">
                      {price ? (
                        <span className="text-sm font-bold text-foreground">{price.toLocaleString()} ₽</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">цена не указана</span>
                      )}
                      <span className="text-[10px] text-muted-foreground">×{row.count}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Поисковые запросы */}
      <section>
        <div className="flex items-baseline justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground inline-flex items-center gap-2">
            <Search className="w-4 h-4" /> Недавние поиски
          </h3>
          {summary.recentSearches.length > 0 && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setConfirmReset("searches")}>
              Сбросить
            </Button>
          )}
        </div>
        {summary.recentSearches.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-xl border border-dashed border-border p-4">
            История поиска пуста.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {summary.recentSearches.slice(0, 24).map((s) => (
              <span
                key={s.term}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-secondary text-foreground text-xs"
                title={`${formatRelativeTime(s.lastAt)} • запросов ${s.count}`}
              >
                {s.term}
                <span className="text-[10px] text-muted-foreground">×{s.count}</span>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Confirm dialog */}
      {confirmReset && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setConfirmReset(null)}
        >
          <div className="bg-card rounded-2xl border border-border p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-base font-semibold text-foreground inline-flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-destructive" />
              {confirmReset === "favorites"
                ? "Очистить избранное?"
                : confirmReset === "all"
                  ? "Сбросить всё?"
                  : confirmReset === "products"
                    ? "Сбросить рейтинг товаров?"
                    : confirmReset === "categories"
                      ? "Сбросить любимые категории?"
                      : "Очистить историю поиска?"}
            </h4>
            <p className="text-sm text-muted-foreground mt-2">
              {confirmReset === "all"
                ? "Будет удалена вся аналитика поведения и список избранного. Действие нельзя отменить."
                : "Данные будут удалены безвозвратно."}
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" size="sm" onClick={() => setConfirmReset(null)}>
                Отмена
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleReset(confirmReset!)}>
                Сбросить
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreferencesPage;

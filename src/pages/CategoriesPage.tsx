import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import CategoryIcon from "@/components/CategoryIcon";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api";
import type { PublicMenuCategory } from "@/hooks/usePublicMenuCategories";
import { PUBLIC_MENU_QUERY_KEY } from "@/hooks/usePublicMenuCategories";

const CategoriesPage = () => {
  const { data: categories = [], isPending, isError } = useQuery({
    queryKey: [...PUBLIC_MENU_QUERY_KEY, "tree"],
    queryFn: async () => {
      const res = await publicApi.menu();
      return Array.isArray(res.categories) ? (res.categories as PublicMenuCategory[]) : [];
    },
    staleTime: 60_000,
  });

  return (
    <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
      <Header />
      <main className="max-w-[1400px] mx-auto px-4 py-4">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-primary transition-colors">
            Главная
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">Категории</span>
        </div>

        <div className="gradient-primary rounded-2xl p-6 md:p-8 mb-6 text-primary-foreground">
          <h1 className="text-2xl md:text-3xl font-bold">Категории</h1>
          <p className="text-primary-foreground/85 mt-2 text-sm md:text-base">Выберите раздел каталога</p>
        </div>

        {isPending ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : null}

        {isError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            Не удалось загрузить категории. Попробуйте обновить страницу позже.
          </div>
        ) : null}

        {!isPending && !isError && categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">Категории пока не добавлены.</p>
        ) : null}

        {!isPending && categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <div key={cat.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <Link
                  to={`/category/${encodeURIComponent(cat.slug)}`}
                  className="flex items-center gap-3 px-4 py-4 hover:bg-secondary/50 transition-colors"
                >
                  <CategoryIcon icon={cat.icon || "grid"} className="w-5 h-5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-foreground truncate">{cat.name}</div>
                    {typeof cat.products_count === "number" ? (
                      <div className="text-xs text-muted-foreground mt-0.5">{cat.products_count} товаров</div>
                    ) : null}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </Link>
                {(cat.children ?? []).length > 0 ? (
                  <div className="border-t border-border px-2 py-2 flex flex-wrap gap-1">
                    {(cat.children ?? []).slice(0, 6).map((sub) => (
                      <Link
                        key={sub.id}
                        to={`/category/${encodeURIComponent(sub.slug)}`}
                        className="text-xs px-2.5 py-1 rounded-[10px] bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default CategoriesPage;

import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import ProductCard from "@/components/ProductCard";
import { publicApi } from "@/lib/api";
import { publicListProductToStorefront, storefrontSearchHitToProduct } from "@/lib/mapPublicProduct";
import { trackSearchTerm } from "@/lib/userPreferences";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const qRaw = searchParams.get("q")?.trim() ?? "";
  const q = qRaw.slice(0, 200);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [q]);

  useEffect(() => {
    if (q.length >= 2) trackSearchTerm(q);
  }, [q]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["search-products", q, page],
    queryFn: () => publicApi.searchProducts({ q, page, per_page: 20 }),
    enabled: q.length >= 2,
    staleTime: 30_000,
  });

  const products = useMemo(() => {
    const rows = data?.data ?? [];
    return rows.map((hit) => storefrontSearchHitToProduct(hit));
  }, [data?.data]);

  const meta = data?.meta;
  const totalPages = meta?.last_page ?? 1;

  return (
    <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
      <Header />
      <main className="max-w-[1400px] mx-auto px-4 py-6">
        <nav className="text-xs text-muted-foreground mb-2">
          <Link to="/" className="hover:text-primary">
            Главная
          </Link>
          <span className="mx-1.5 opacity-60">/</span>
          <span className="text-foreground font-medium">Поиск</span>
        </nav>
        <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1">Поиск</h1>

        {q.length < 2 ? (
          <p className="text-sm text-muted-foreground">
            Укажите запрос не короче 2 символов — введите текст в строку поиска в шапке сайта.
          </p>
        ) : isError ? (
          <p className="text-sm text-destructive mt-4">Не удалось выполнить поиск. Попробуйте позже.</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              По запросу «{q}»
              {isLoading ? " — загрузка…" : ` — найдено: ${meta?.total ?? products.length}`}
            </p>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8">
                По этому запросу пока нет товаров. Попробуйте другую формулировку или смотрите{" "}
                <Link to="/" className="text-primary underline">
                  главную
                </Link>
                .
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((p) => {
                  const card = publicListProductToStorefront(p);
                  return (
                    <Link key={p.id} to={`/product/${p.id}`}>
                      <ProductCard product={card} />
                    </Link>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && !isLoading ? (
              <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      page === p ? "cheepy-btn-primary cheepy-btn-primary-sm" : "bg-secondary text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            ) : null}
          </>
        )}
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default SearchPage;

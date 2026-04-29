import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import ProductCard from "@/components/ProductCard";
import { publicApi } from "@/lib/api";
import { publicListProductToStorefront } from "@/lib/mapPublicProduct";
import BrandLogo from "@/components/BrandLogo";

const BrandPage = () => {
  const { slug } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-brand", slug],
    queryFn: () => publicApi.brandDetail(String(slug), 1, 24),
    enabled: Boolean(slug),
    staleTime: 60_000,
  });

  const brand = data?.brand;
  const products = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
        <Header />
        <main className="max-w-[1400px] mx-auto px-4 py-4">
          <div className="h-48 bg-muted rounded-2xl animate-pulse mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    );
  }

  if (isError || !brand) {
    return (
      <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
        <Header />
        <main className="max-w-[1400px] mx-auto px-4 py-8">
          <p className="text-foreground">Бренд не найден или временно недоступен.</p>
          <Link to="/brand" className="text-primary mt-4 inline-block">
            К списку брендов
          </Link>
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
      <Header />
      <main className="max-w-[1400px] mx-auto px-4 py-4">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 flex-wrap">
          <Link to="/" className="hover:text-primary transition-colors">
            Главная
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/brand" className="hover:text-primary transition-colors">
            Бренды
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">{brand.name}</span>
        </div>

        <div className="gradient-primary rounded-2xl p-8 md:p-12 mb-8 text-primary-foreground">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-background/20 flex items-center justify-center text-4xl md:text-5xl font-extrabold overflow-hidden p-2">
              <BrandLogo brand={brand.slug || brand.name} logoUrl={brand.logo_url} className="max-w-full max-h-full" />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold mb-1">{brand.name}</h1>
              {brand.description ? <p className="text-sm opacity-90 mb-3 max-w-2xl">{brand.description}</p> : null}
              <p className="text-sm opacity-70">
                {brand.products_count != null ? `${brand.products_count.toLocaleString("ru-RU")} товаров` : `${products.length} товаров на странице`}
              </p>
            </div>
          </div>
        </div>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">Товары бренда</h2>
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">Пока нет товаров этого бренда в каталоге.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
        </section>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default BrandPage;

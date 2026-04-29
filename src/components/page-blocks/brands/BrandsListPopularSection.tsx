import { useQuery } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import BrandLogo from "@/components/BrandLogo";
import { publicApi } from "@/lib/api";

export default function BrandsListPopularSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["public-brands-popular"],
    queryFn: () => publicApi.brands({ page: 1, per_page: 80 }),
    staleTime: 120_000,
  });

  const raw = data?.data ?? [];
  const topBrands = [...raw]
    .sort((a, b) => (b.products_count ?? 0) - (a.products_count ?? 0))
    .slice(0, 8);

  if (isLoading) {
    return (
      <section className="mb-10">
        <div className="h-8 w-48 bg-muted rounded animate-pulse mb-5" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-36 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (topBrands.length === 0) {
    return null;
  }

  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-xl font-bold text-foreground">Популярные бренды</h2>
        <TrendingUp className="w-5 h-5 text-primary" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {topBrands.map((brand) => (
          <Link
            key={brand.id}
            to={`/brand/${brand.slug}`}
            className="group bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/50 transition-all"
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-20 h-20 rounded-xl bg-background flex items-center justify-center group-hover:scale-110 transition-transform p-3 overflow-hidden">
                <BrandLogo brand={brand.slug || brand.name} logoUrl={brand.logo_url} className="max-w-full max-h-full" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{brand.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {brand.products_count != null ? `${brand.products_count} товаров` : "В каталоге"}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

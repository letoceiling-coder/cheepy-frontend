import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import BrandLogo from "@/components/BrandLogo";
import { publicApi } from "@/lib/api";

export default function BrandsListAllSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["public-brands-all"],
    queryFn: () => publicApi.brands({ page: 1, per_page: 500 }),
    staleTime: 120_000,
  });

  const allBrands = [...(data?.data ?? [])].sort((a, b) => a.name.localeCompare(b.name, "ru"));

  if (isLoading) {
    return (
      <section className="mb-10">
        <div className="h-8 w-48 bg-muted rounded animate-pulse mb-5" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (allBrands.length === 0) {
    return (
      <section className="mb-10">
        <p className="text-sm text-muted-foreground">Список брендов временно недоступен.</p>
      </section>
    );
  }

  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-foreground mb-5">Все бренды А-Я</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {allBrands.map((brand) => (
          <Link
            key={brand.id}
            to={`/brand/${brand.slug}`}
            className="group flex items-center gap-4 bg-card border border-border rounded-xl p-4 hover:shadow-md hover:border-primary/50 transition-all"
          >
            <div className="w-16 h-16 rounded-lg bg-background flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform p-2 overflow-hidden">
              <BrandLogo brand={brand.slug || brand.name} logoUrl={brand.logo_url} className="max-w-full max-h-full" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">{brand.name}</h3>
              <p className="text-xs text-muted-foreground">
                {brand.products_count != null ? `${brand.products_count} товаров` : ""}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
}

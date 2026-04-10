import { Link } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { brandsData } from "@/data/marketplaceData";

export default function BrandsListPopularSection() {
  const topBrands = brandsData.slice(0, 8);

  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-xl font-bold text-foreground">Популярные бренды</h2>
        <TrendingUp className="w-5 h-5 text-primary" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {topBrands.map((brand) => (
          <Link
            key={brand.slug}
            to={`/brand/${brand.slug}`}
            className="group bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/50 transition-all"
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-20 h-20 rounded-xl bg-background flex items-center justify-center group-hover:scale-110 transition-transform p-3">
                <BrandLogo brand={brand.logo} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{brand.name}</h3>
                <p className="text-xs text-muted-foreground">{brand.productCount} товаров</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

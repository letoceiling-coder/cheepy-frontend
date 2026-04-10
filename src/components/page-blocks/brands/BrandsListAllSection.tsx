import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { brandsData } from "@/data/marketplaceData";

export default function BrandsListAllSection() {
  const allBrands = brandsData;

  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-foreground mb-5">Все бренды А-Я</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {allBrands.map((brand) => (
          <Link
            key={brand.slug}
            to={`/brand/${brand.slug}`}
            className="group flex items-center gap-4 bg-card border border-border rounded-xl p-4 hover:shadow-md hover:border-primary/50 transition-all"
          >
            <div className="w-16 h-16 rounded-lg bg-background flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform p-2">
              <BrandLogo brand={brand.logo} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">{brand.name}</h3>
              <p className="text-xs text-muted-foreground">{brand.productCount} товаров</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
}

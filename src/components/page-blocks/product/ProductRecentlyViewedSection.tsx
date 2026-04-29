import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import { publicApi } from "@/lib/api";
import { publicListProductToStorefront } from "@/lib/mapPublicProduct";

export default function ProductRecentlyViewedSection() {
  const { id } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["public-featured-sidebar", id],
    queryFn: () => publicApi.featured(24),
    staleTime: 120_000,
  });

  const items = (data?.data ?? []).filter((p) => String(p.id) !== String(id)).slice(0, 6);

  if (isLoading) {
    return <div className="mb-10 h-36 bg-muted animate-pulse rounded-xl" />;
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-foreground mb-4">Возможно, вам понравится</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map((p) => {
          const card = publicListProductToStorefront(p);
          return (
            <a key={p.id} href={`/product/${p.id}`}>
              <ProductCard product={card} />
            </a>
          );
        })}
      </div>
    </section>
  );
}

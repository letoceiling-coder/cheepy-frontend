import ProductCard from "@/components/ProductCard";
import { mockProducts } from "@/data/mock-data";

export default function ProductRecentlyViewedSection() {
  const recentlyViewed = mockProducts.slice(8, 14);

  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-foreground mb-4">Недавно просмотренные</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {recentlyViewed.map((p) => (
          <a key={p.id} href={`/product/${p.id}`}>
            <ProductCard product={p} />
          </a>
        ))}
      </div>
    </section>
  );
}

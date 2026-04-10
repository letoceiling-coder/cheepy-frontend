import ProductCard from "@/components/ProductCard";
import { mockProducts } from "@/data/mock-data";

export default function ProductBuyTogetherSection() {
  const buyTogether = mockProducts.slice(3, 7);

  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-foreground mb-4">Покупают вместе</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {buyTogether.map((p) => (
          <a key={p.id} href={`/product/${p.id}`}>
            <ProductCard product={p} />
          </a>
        ))}
      </div>
    </section>
  );
}

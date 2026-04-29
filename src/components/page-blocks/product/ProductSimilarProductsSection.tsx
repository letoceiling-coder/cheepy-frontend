import { useParams } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import { usePublicProduct } from "@/hooks/usePublicProduct";
import { publicListProductToStorefront } from "@/lib/mapPublicProduct";
import type { Product } from "@/lib/api";

export default function ProductSimilarProductsSection() {
  const { id } = useParams();
  const { data, isLoading } = usePublicProduct(id);
  const currentId = data?.product?.id;
  const raw: Product[] = data?.seller_products?.length ? data.seller_products : [];

  const similar = raw.filter((p) => p.id !== currentId).slice(0, 6);

  if (isLoading) {
    return <div className="mb-10 h-40 bg-muted animate-pulse rounded-xl" />;
  }

  if (similar.length === 0) {
    return null;
  }

  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-foreground mb-4">Товары этого продавца</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {similar.map((p) => {
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

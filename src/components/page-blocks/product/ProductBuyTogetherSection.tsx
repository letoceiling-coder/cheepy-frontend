import ProductCard from "@/components/ProductCard";
import { useParams } from "react-router-dom";
import { usePublicProduct } from "@/hooks/usePublicProduct";
import { publicListProductToStorefront } from "@/lib/mapPublicProduct";
import type { Product } from "@/lib/api";

export default function ProductBuyTogetherSection() {
  const { id } = useParams();
  const { data, isLoading } = usePublicProduct(id);
  const currentId = data?.product?.id;
  const pool: Product[] = data?.seller_products?.length ? data.seller_products : [];
  const buyTogether = pool.filter((p) => p.id !== currentId).slice(0, 4);

  if (isLoading) {
    return <div className="mb-10 h-32 bg-muted animate-pulse rounded-xl" />;
  }

  if (buyTogether.length === 0) {
    return null;
  }

  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-foreground mb-4">Ещё из этого магазина</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {buyTogether.map((p) => {
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

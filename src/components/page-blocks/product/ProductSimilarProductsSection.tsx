import { useParams } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import { mockProducts } from "@/data/mock-data";

export default function ProductSimilarProductsSection() {
  const { id } = useParams();
  const product = mockProducts.find((p) => p.id === Number(id)) || mockProducts[0];
  const similarProducts = mockProducts.filter((p) => p.id !== product.id).slice(0, 6);

  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-foreground mb-4">Похожие товары</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {similarProducts.map((p) => (
          <a key={p.id} href={`/product/${p.id}`}>
            <ProductCard product={p} />
          </a>
        ))}
      </div>
    </section>
  );
}

import { useState } from "react";
import ProductCard from "./ProductCard";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import product5 from "@/assets/product-5.jpg";
import product6 from "@/assets/product-6.jpg";

const allImages = [product1, product2, product3, product4, product5, product6];

const generateProducts = (startId: number, count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: startId + i,
    name: ["Футболка мужская базовая", "Худи оверсайз", "Свитшот с принтом", "Поло классическое", "Бомбер фиолетовый", "Комплект casual"][i % 6],
    price: [2490, 4990, 3790, 3290, 6990, 4590][i % 6],
    oldPrice: [3490, 6990, undefined, 4290, 9990, undefined][i % 6] as number | undefined,
    images: [allImages[i % 6], allImages[(i + 1) % 6], allImages[(i + 2) % 6]],
    rating: [4.8, 4.6, 4.9, 4.5, 4.7, 4.4][i % 6],
    reviews: [124, 89, 256, 67, 45, 178][i % 6],
    seller: ["BRAND Store", "Fashion Lab", "StreetWear", "Classic Shop", "Urban Style", "Casual Co"][i % 6],
  }));

interface ProductGridProps {
  title: string;
  subtitle?: string;
  initialCount?: number;
}

const ProductGrid = ({ title, subtitle, initialCount = 6 }: ProductGridProps) => {
  const [products, setProducts] = useState(() => generateProducts(1, initialCount));
  const [loading, setLoading] = useState(false);

  const loadMore = () => {
    setLoading(true);
    setTimeout(() => {
      setProducts(prev => [...prev, ...generateProducts(prev.length + 1, 6)]);
      setLoading(false);
    }, 300);
  };

  return (
    <section className="mb-6">
      <div className="flex items-baseline gap-3 mb-3">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {subtitle && <span className="text-sm text-muted-foreground">{subtitle}</span>}
      </div>

      {/* Desktop: 4 cards */}
      <div className="hidden md:grid grid-cols-4 gap-4 mb-4">
        {products.slice(0, 8).map((product, i) => (
          <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${(i % 4) * 50}ms` }}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Tablet: 2 cards */}
      <div className="hidden sm:grid md:hidden grid-cols-2 gap-4 mb-4">
        {products.slice(0, 4).map((product, i) => (
          <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${(i % 2) * 50}ms` }}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Mobile: horizontal carousel */}
      <div className="sm:hidden overflow-x-auto flex gap-3 snap-x snap-mandatory no-scrollbar pb-2">
        {products.slice(0, 12).map((product, i) => (
          <div key={product.id} className="shrink-0 w-[200px] snap-start">
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      <div className="text-center mt-4">
        <button
          onClick={loadMore}
          disabled={loading}
          className="px-6 py-2 border-2 border-primary text-primary rounded-full text-sm font-semibold hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
        >
          {loading ? "Загрузка..." : "Смотреть ещё"}
        </button>
      </div>
    </section>
  );
};

export default ProductGrid;

import { useParams } from "react-router-dom";
import { mockCategories, mockProducts } from "@/data/mock-data";

export default function CategoryHeroBanner() {
  const { slug } = useParams();
  const categoryName = slug ? decodeURIComponent(slug).replace(/-/g, " ") : mockCategories[0];
  const products = mockProducts;

  return (
    <div className="gradient-primary rounded-2xl p-6 md:p-10 mb-6 text-primary-foreground">
      <h1 className="text-2xl md:text-3xl font-bold mb-2 capitalize">{categoryName}</h1>
      <p className="text-sm opacity-80">Более {products.length * 10} товаров от проверенных продавцов</p>
    </div>
  );
}

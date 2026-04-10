import { Link, useParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { mockProducts } from "@/data/mock-data";

export default function ProductPageBreadcrumbs() {
  const { id } = useParams();
  const product = mockProducts.find((p) => p.id === Number(id)) || mockProducts[0];

  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 flex-wrap">
      <Link to="/" className="hover:text-primary transition-colors">
        Главная
      </Link>
      <ChevronRight className="w-3 h-3" />
      <Link to="/category/all" className="hover:text-primary transition-colors">
        {product.category}
      </Link>
      <ChevronRight className="w-3 h-3" />
      <span className="text-foreground line-clamp-1">{product.name}</span>
    </div>
  );
}

import { Link, useParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { usePublicProduct } from "@/hooks/usePublicProduct";

export default function ProductPageBreadcrumbs() {
  const { id } = useParams();
  const { data, isLoading } = usePublicProduct(id);
  const product = data?.product;
  const cat = product?.category;

  if (isLoading) {
    return <div className="h-5 w-2/3 max-w-md bg-muted rounded animate-pulse mb-4" />;
  }

  if (!product) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 flex-wrap">
      <Link to="/" className="hover:text-primary transition-colors">
        Главная
      </Link>
      <ChevronRight className="w-3 h-3" />
      {cat?.slug ? (
        <Link to={`/category/${cat.slug}`} className="hover:text-primary transition-colors">
          {cat.name}
        </Link>
      ) : (
        <span className="text-muted-foreground">Каталог</span>
      )}
      <ChevronRight className="w-3 h-3" />
      <span className="text-foreground line-clamp-1">{product.title}</span>
    </div>
  );
}

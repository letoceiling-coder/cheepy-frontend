import { Link, useParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { mockCategories } from "@/data/mock-data";

export default function CategoryPageBreadcrumbs() {
  const { slug } = useParams();
  const categoryName = slug ? decodeURIComponent(slug).replace(/-/g, " ") : mockCategories[0];

  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
      <Link to="/" className="hover:text-primary transition-colors">
        Главная
      </Link>
      <ChevronRight className="w-3 h-3" />
      <span className="text-foreground capitalize">{categoryName}</span>
    </div>
  );
}

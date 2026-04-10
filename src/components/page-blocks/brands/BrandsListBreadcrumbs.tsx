import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export default function BrandsListBreadcrumbs() {
  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 flex-wrap">
      <Link to="/" className="hover:text-primary transition-colors">
        Главная
      </Link>
      <ChevronRight className="w-3 h-3" />
      <span className="text-foreground">Бренды</span>
    </div>
  );
}

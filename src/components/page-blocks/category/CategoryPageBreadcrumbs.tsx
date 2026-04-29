import { Link, useParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api";

export default function CategoryPageBreadcrumbs() {
  const { slug } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["category-meta", slug],
    queryFn: () => publicApi.categoryProducts(String(slug), { page: 1, per_page: 1 }),
    enabled: Boolean(slug),
    staleTime: 60_000,
  });

  const name = data?.category?.name;

  if (isLoading) {
    return <div className="h-5 w-40 bg-muted rounded animate-pulse mb-4" />;
  }

  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
      <Link to="/" className="hover:text-primary transition-colors">
        Главная
      </Link>
      <ChevronRight className="w-3 h-3" />
      <span className="text-foreground">{name || slug || "Категория"}</span>
    </div>
  );
}

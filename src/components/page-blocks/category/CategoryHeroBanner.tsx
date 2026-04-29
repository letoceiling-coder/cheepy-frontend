import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api";

export default function CategoryHeroBanner() {
  const { slug } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["category-meta", slug],
    queryFn: () => publicApi.categoryProducts(String(slug), { page: 1, per_page: 1 }),
    enabled: Boolean(slug),
    staleTime: 60_000,
  });

  const name = data?.category?.name ?? (slug ? String(slug) : "Категория");
  const total = data?.meta?.total;

  if (isLoading) {
    return <div className="gradient-primary rounded-2xl p-6 md:p-10 mb-6 h-32 animate-pulse" />;
  }

  return (
    <div className="gradient-primary rounded-2xl p-6 md:p-10 mb-6 text-primary-foreground">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">{name}</h1>
      <p className="text-sm opacity-80">
        {typeof total === "number" ? `${total.toLocaleString("ru-RU")} товаров в каталоге` : "Товары от продавцов площадки"}
      </p>
    </div>
  );
}

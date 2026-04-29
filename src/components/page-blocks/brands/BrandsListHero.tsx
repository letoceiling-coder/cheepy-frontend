import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api";

export default function BrandsListHero() {
  const { data, isLoading } = useQuery({
    queryKey: ["public-brands-hero"],
    queryFn: () => publicApi.brands({ page: 1, per_page: 1 }),
    staleTime: 120_000,
  });

  const total = data?.meta?.total ?? data?.data?.length ?? 0;

  return (
    <div className="gradient-primary rounded-2xl p-8 md:p-12 mb-8 text-primary-foreground">
      <h1 className="text-2xl md:text-4xl font-bold mb-2">Все бренды</h1>
      <p className="text-sm md:text-base opacity-80">Выбирайте товары от продавцов на маркетплейсе Cheepy</p>
      <p className="text-sm opacity-60 mt-2">
        {isLoading ? "Загрузка…" : `${total.toLocaleString("ru-RU")} брендов в каталоге`}
      </p>
    </div>
  );
}

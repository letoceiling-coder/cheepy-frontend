import { Link, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ArrowLeft, Loader2, Clock } from "lucide-react";
import { sellersApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { SellerHeader } from "../components/SellerHeader";
import { SellerProductsTable } from "../components/SellerProductsTable";

export default function SellerDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: seller, isLoading, error } = useQuery({
    queryKey: ["admin-seller", id],
    queryFn: () => sellersApi.get(id!),
    enabled: !!id,
  });

  if (isLoading || !seller) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Link
          to="/admin/sellers"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />Назад
        </Link>
        {isLoading ? (
          <div className="flex gap-2 text-muted-foreground py-8">
            <Loader2 className="h-5 w-5 animate-spin" />Загрузка...
          </div>
        ) : (
          <p className="text-destructive">Продавец не найден</p>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Link
          to="/admin/sellers"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />Назад
        </Link>
        <p className="text-destructive">Ошибка загрузки продавца</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          to="/admin/sellers"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>

      <SellerHeader seller={seller} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Товаров</p>
              <p className="text-xl font-semibold">{seller.products_count ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Последний парсинг</p>
              <p className="text-sm font-medium">
                {seller.last_parsed_at
                  ? new Date(seller.last_parsed_at).toLocaleString("ru")
                  : "—"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <SellerProductsTable sellerId={id!} />
    </div>
  );
}

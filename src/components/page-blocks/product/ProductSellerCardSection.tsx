import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePublicProduct } from "@/hooks/usePublicProduct";

export default function ProductSellerCardSection() {
  const { id } = useParams();
  const { data, isLoading } = usePublicProduct(id);
  const seller = data?.product?.seller;

  if (isLoading) {
    return <div className="mb-10 h-24 rounded-2xl bg-muted animate-pulse" />;
  }

  if (!seller?.name) {
    return null;
  }

  return (
    <div className="mb-10">
      <div className="p-5 rounded-2xl border border-border">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
            {seller.name[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-foreground">{seller.name}</h4>
            <p className="text-sm text-muted-foreground">Продавец на маркетплейсе Cheepy</p>
          </div>
          {seller.slug ? (
            <Button variant="outline" className="rounded-lg text-sm ml-auto" asChild>
              <Link to={`/seller/${seller.slug}`}>Все товары продавца</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

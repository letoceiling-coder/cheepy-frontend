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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-4 sm:min-w-0 sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full gradient-primary text-lg font-bold text-primary-foreground">
              {seller.name[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-foreground">{seller.name}</h4>
              <p className="text-sm leading-snug text-muted-foreground">Продавец на маркетплейсе Cheepy</p>
            </div>
          </div>
          {seller.slug ? (
            <Button
              variant="outline"
              className="h-auto min-h-10 w-full shrink-0 whitespace-normal rounded-lg px-4 py-2.5 text-center text-sm sm:ml-auto sm:w-auto sm:whitespace-nowrap"
              asChild
            >
              <Link to={`/seller/${seller.slug}`}>Все товары продавца</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

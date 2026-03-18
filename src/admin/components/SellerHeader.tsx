import { Badge } from "@/components/ui/badge";
import { Store, ExternalLink } from "lucide-react";
import type { SellerFull } from "@/lib/api";

interface SellerHeaderProps {
  seller: SellerFull;
}

export function SellerHeader({ seller }: SellerHeaderProps) {
  const phone = seller.contacts?.phone ?? null;

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg border bg-card">
      <div className="shrink-0">
        <div className="h-20 w-20 rounded-full overflow-hidden bg-muted">
          {seller.avatar ? (
            <img src={seller.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Store className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <h1 className="text-xl font-bold truncate">{seller.name}</h1>
        {seller.pavilion && (
          <p className="text-muted-foreground text-sm">Корпус: {seller.pavilion}</p>
        )}
        {seller.source_url && (
          <a
            href={seller.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ссылка на донора
          </a>
        )}
        {phone && (
          <p className="text-sm text-muted-foreground">Телефон: {phone}</p>
        )}
        {seller.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{seller.description}</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2 shrink-0">
        {seller.is_verified && (
          <Badge variant="secondary">Верифицирован</Badge>
        )}
      </div>
    </div>
  );
}

import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { mockProducts } from "@/data/mock-data";

export default function ProductSellerCardSection() {
  const { id } = useParams();
  const product = mockProducts.find((p) => p.id === Number(id)) || mockProducts[0];

  return (
    <div className="mb-10">
      <div className="p-5 rounded-2xl border border-border">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
            {product.seller[0]}
          </div>
          <div>
            <h4 className="font-semibold text-foreground">{product.seller}</h4>
            <p className="text-sm text-muted-foreground">Рейтинг продавца: 4.8 · На площадке 2 года</p>
          </div>
          <Button variant="outline" className="ml-auto rounded-lg text-sm">
            Все товары
          </Button>
        </div>
      </div>
    </div>
  );
}

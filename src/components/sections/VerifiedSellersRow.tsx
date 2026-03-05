import { Package, MessageSquare } from "lucide-react";
import { useDragScroll } from "@/hooks/useDragScroll";
import seller1 from "@/assets/cheepy/seller-1.jpg";
import seller2 from "@/assets/cheepy/seller-2.jpg";
import seller3 from "@/assets/cheepy/seller-3.jpg";
import seller4 from "@/assets/cheepy/seller-4.jpg";

const sellerImages = [seller1, seller2, seller3, seller4];

interface Seller {
  name: string;
  location: string;
  category: string;
  products: number;
  reviews: number;
  imageIndex: number;
}

const sellers: Seller[] = [
  { name: "Алиев Рашид", location: "ТЦ А 15-75", category: "Мужская, женская одежда", products: 120, reviews: 120, imageIndex: 0 },
  { name: "Каримов Джамшид", location: "ТЦ А 15-75", category: "Мужская, женская одежда", products: 120, reviews: 120, imageIndex: 1 },
  { name: "Усманов Азиз", location: "ТЦ А 15-75", category: "Мужская, женская одежда", products: 120, reviews: 120, imageIndex: 2 },
  { name: "Маммадов Эльнар", location: "ТЦ А 15-75", category: "Мужская, женская одежда", products: 120, reviews: 120, imageIndex: 3 },
];

const infiniteSellers = [...sellers, ...sellers, ...sellers];

const VerifiedSellersRow = () => {
  const scrollRef = useDragScroll<HTMLDivElement>();

  return (
    <section className="container py-8" aria-label="Проверенные продавцы">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-foreground">Проверенные продавцы</h2>
      </div>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
        {infiniteSellers.map((seller, index) => (
          <div key={`verified-${index}`} className="bg-card border border-border rounded-xl p-4 min-w-[220px] flex-shrink-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={sellerImages[seller.imageIndex % sellerImages.length]}
                  alt={seller.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">{seller.name}</h4>
                <p className="text-xs text-muted-foreground">{seller.location}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{seller.category}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                {seller.products} товаров
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {seller.reviews} отзывов
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default VerifiedSellersRow;

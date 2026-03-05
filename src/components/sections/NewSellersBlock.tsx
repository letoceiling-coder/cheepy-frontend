import { Package, MessageSquare, TrendingUp } from "lucide-react";
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
  growth: string;
  imageIndex: number;
}

const sellers: Seller[] = [
  { name: "Алиев Рашид", location: "ТЦ А 15-75", category: "Мужская, женская одежда", products: 120, reviews: 120, growth: "+15%", imageIndex: 0 },
  { name: "Каримов Джамшид", location: "ТЦ А 15-75", category: "Мужская, женская одежда", products: 120, reviews: 120, growth: "+12%", imageIndex: 1 },
  { name: "Усманов Азиз", location: "ТЦ А 15-75", category: "Мужская, женская одежда", products: 120, reviews: 120, growth: "+10%", imageIndex: 2 },
  { name: "Маммадов Эльнар", location: "ТЦ А 15-75", category: "Мужская, женская одежда", products: 120, reviews: 120, growth: "+8%", imageIndex: 3 },
];

const infiniteSellers = [...sellers, ...sellers, ...sellers];

const NewSellersBlock = () => {
  const scrollRef = useDragScroll<HTMLDivElement>();

  return (
    <section className="container py-8" aria-label="Новые продавцы">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-foreground">Новые продавцы</h2>
        <span className="text-sm text-muted-foreground bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 px-3 py-1 rounded-full">
          БЫСТРЫЙ РОСТ
        </span>
      </div>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
        {infiniteSellers.map((seller, index) => (
          <div key={`new-${index}`} className="bg-card border border-border rounded-xl p-4 min-w-[220px] flex-shrink-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={sellerImages[seller.imageIndex % sellerImages.length]}
                  alt={seller.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  <TrendingUp className="w-3 h-3" />
                </div>
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
              <span className="flex items-center gap-1 text-green-600">
                <TrendingUp className="w-3 h-3" />
                {seller.growth}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default NewSellersBlock;

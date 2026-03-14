import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Star, Check } from "lucide-react";
import seller1 from "@/assets/cheepy/seller-1.jpg";
import seller2 from "@/assets/cheepy/seller-2.jpg";
import seller3 from "@/assets/cheepy/seller-3.jpg";
import seller4 from "@/assets/cheepy/seller-4.jpg";
import placeholderSellerImg from "@/assets/placeholder-seller.jpg";

const sellerImages = [seller1, seller2, seller3, seller4];

const CARD_WIDTH = 220;
const CARD_GAP = 16;
const SCROLL_STEP = CARD_WIDTH + CARD_GAP;

type Seller = {
  name: string;
  location: string;
  category: string;
  products: number;
  reviews: number;
  rating: number;
  verified: boolean;
  placeholder?: boolean;
  imageIndex?: number;
};

const allSellers: Seller[] = [
  { name: "Алиев Рашид", location: "ТЦ А 15-75", category: "Мужская, женская одежда", products: 120, reviews: 120, rating: 5.0, verified: true, imageIndex: 0 },
  { name: "Каримов Джамшид", location: "ТЦ А 15-75", category: "Мужская, женская одежда", products: 120, reviews: 120, rating: 4.9, verified: true, imageIndex: 1 },
  { name: "Усманов Азиз", location: "ТЦ А 15-75", category: "Мужская, женская одежда", products: 120, reviews: 120, rating: 4.8, verified: false, imageIndex: 2 },
  { name: "Маммадов Эльнар", location: "ТЦ А 15-75", category: "Мужская, женская одежда", products: 120, reviews: 120, rating: 4.7, verified: true, imageIndex: 3 },
  { name: "Продавец", location: "ТЦ А 15-75", category: "Мужская, женская одежда", products: 120, reviews: 120, rating: 4.5, verified: false, placeholder: true },
];

const extendTo = (list: Seller[], count: number): Seller[] =>
  Array.from({ length: count }, (_, i) => ({ ...list[i % list.length] }));

const bestSellersExtended = extendTo(allSellers, 12);
const verifiedSellersExtended = extendTo(allSellers.filter(s => s.verified), 12);

const SellerCard = ({
  seller,
  index,
  variant,
  placeholderImg,
}: {
  seller: Seller;
  index: number;
  variant: "rating" | "verified";
  placeholderImg: string;
}) => (
  <div
    className="shrink-0 bg-card rounded-xl border border-border overflow-hidden snap-start"
    style={{ width: CARD_WIDTH }}
  >
    <div className="relative aspect-square overflow-hidden bg-secondary">
      {seller.placeholder ? (
        <img
          src={placeholderImg}
          alt=""
          className="w-full h-full object-cover"
        />
      ) : (
        <img
          src={sellerImages[(seller.imageIndex ?? index) % sellerImages.length]}
          alt={seller.name}
          className="w-full h-full object-cover"
        />
      )}
      {variant === "rating" && (
        <span className="absolute top-2 left-2 gradient-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded flex items-center gap-0.5">
          <Star className="w-3 h-3 fill-current" /> {seller.rating.toFixed(1)}
        </span>
      )}
      {variant === "verified" && (
        <span className="absolute top-2 right-2 gradient-primary text-primary-foreground p-1 rounded">
          <Check className="w-3.5 h-3.5" />
        </span>
      )}
    </div>
    <div className="p-3 space-y-1">
      <p className="font-bold text-foreground text-sm">{seller.name}</p>
      <p className="text-xs text-muted-foreground">{seller.location}</p>
      <p className="text-xs text-muted-foreground">{seller.category}</p>
      <div className="flex flex-col gap-0.5 pt-1">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
          {seller.products} товаров
        </p>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0" />
          {seller.reviews} отзывов
        </p>
      </div>
    </div>
  </div>
);

const SliderRow = ({
  scrollRef,
  children,
}: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}) => (
  <div className="relative flex items-center gap-2">
    <button
      type="button"
      onClick={() => scrollRef.current?.scrollBy({ left: -SCROLL_STEP, behavior: "smooth" })}
      className="shrink-0 w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors"
      aria-label="Назад"
    >
      <ChevronLeft className="w-5 h-5" />
    </button>
    <div
      ref={scrollRef}
      className="flex-1 overflow-x-auto flex gap-4 py-2 scroll-smooth no-scrollbar overflow-y-hidden snap-x snap-mandatory"
    >
      {children}
    </div>
    <button
      type="button"
      onClick={() => scrollRef.current?.scrollBy({ left: SCROLL_STEP, behavior: "smooth" })}
      className="shrink-0 w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors"
      aria-label="Вперёд"
    >
      <ChevronRight className="w-5 h-5" />
    </button>
  </div>
);

const SellersSection = () => {
  const bestRef = useRef<HTMLDivElement>(null);
  const verifiedRef = useRef<HTMLDivElement>(null);
  const [sortType, setSortType] = useState<"rating" | "verified">("rating");

  const filteredBest =
    sortType === "rating"
      ? [...bestSellersExtended].sort((a, b) => b.rating - a.rating)
      : bestSellersExtended.filter(s => s.verified);

  return (
    <section className="mb-10">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-xl font-bold text-foreground">Лучшие продавцы</h2>
          <button
            type="button"
            onClick={() => setSortType(sortType === "rating" ? "verified" : "rating")}
            className={
              sortType === "rating"
                ? "gradient-primary text-primary-foreground text-xs font-semibold px-2.5 py-1 rounded transition-opacity hover:opacity-90"
                : "bg-secondary border border-border text-foreground text-xs font-semibold px-2.5 py-1 rounded transition-colors hover:bg-secondary/80"
            }
          >
            {sortType === "rating" ? "ПО РЕЙТИНГУ" : "ПРОВЕРЕННЫЕ"}
          </button>
        </div>
        <SliderRow scrollRef={bestRef}>
          {filteredBest.map((seller, i) => (
            <SellerCard
              key={`best-${sortType}-${i}`}
              seller={seller}
              index={i}
              variant="rating"
              placeholderImg={placeholderSellerImg}
            />
          ))}
        </SliderRow>
      </div>
      <div>
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-xl font-bold text-foreground">Проверенные продавцы</h2>
          <span className="gradient-primary text-primary-foreground p-1.5 rounded">
            <Check className="w-3.5 h-3.5" />
          </span>
        </div>
        <SliderRow scrollRef={verifiedRef}>
          {verifiedSellersExtended.map((seller, i) => (
            <SellerCard
              key={`verified-${i}`}
              seller={seller}
              index={i}
              variant="verified"
              placeholderImg={placeholderSellerImg}
            />
          ))}
        </SliderRow>
      </div>
    </section>
  );
};

export default SellersSection;

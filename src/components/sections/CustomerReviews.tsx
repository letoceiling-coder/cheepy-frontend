import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useDragScroll } from "@/hooks/useDragScroll";
import { Link } from "react-router-dom";
import { customerReviews } from "@/data/marketplaceData";

const CustomerReviews = () => {
  const scrollRef = useDragScroll<HTMLDivElement>();

  return (
    <section className="mb-10">
      <div className="flex items-baseline gap-3 mb-5">
        <h2 className="text-xl font-bold text-foreground">ОТЗЫВЫ ПОКУПАТЕЛЕЙ</h2>
      </div>

      <div className="relative flex items-center gap-2">
        <button
          onClick={() => scrollRef.current?.scrollBy({ left: -380, behavior: "smooth" })}
          className="shrink-0 w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors"
          aria-label="Назад"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div ref={scrollRef} className="flex-1 overflow-x-auto flex gap-4 py-2 no-scrollbar snap-x snap-mandatory cursor-grab active:cursor-grabbing">
          {customerReviews.map((review) => (
            <div
              key={review.id}
              className="shrink-0 w-[340px] bg-card rounded-xl border border-border p-5 snap-start flex flex-col"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {review.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{review.name}</p>
                  <p className="text-xs text-muted-foreground">{review.date}</p>
                </div>
              </div>
              <div className="flex gap-0.5 mb-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${s <= review.rating ? "fill-yellow-500 text-yellow-500" : "text-border"}`}
                  />
                ))}
              </div>
              <p className="text-sm text-foreground flex-1 mb-3 line-clamp-3">{review.text}</p>
              <Link
                to={`/product/${review.productId}`}
                className="text-xs text-primary hover:underline"
              >
                {review.productName}
              </Link>
            </div>
          ))}
        </div>

        <button
          onClick={() => scrollRef.current?.scrollBy({ left: 380, behavior: "smooth" })}
          className="shrink-0 w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors"
          aria-label="Вперёд"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
};

export default CustomerReviews;

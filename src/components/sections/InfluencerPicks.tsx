import { useRef } from "react";
import { ChevronLeft, ChevronRight, Verified } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";

const picks = [
  { influencer: "Анна М.", avatar: hero1, product: "Куртка оверсайз", price: "6 990 ₽", image: product1, followers: "120K" },
  { influencer: "Дмитрий К.", avatar: hero2, product: "Кроссовки спорт", price: "8 490 ₽", image: product2, followers: "85K" },
  { influencer: "Мария С.", avatar: hero1, product: "Сумка кожаная", price: "4 990 ₽", image: product3, followers: "200K" },
  { influencer: "Алексей В.", avatar: hero2, product: "Часы классик", price: "11 990 ₽", image: product4, followers: "65K" },
];

const InfluencerPicks = () => {
  const { ref, isVisible } = useScrollAnimation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => scrollRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });

  return (
    <section ref={ref} className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100" : "opacity-0"}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Выбор экспертов</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Рекомендации от экспертов</p>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => scroll(-1)} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"><ChevronLeft size={16} /></button>
          <button onClick={() => scroll(1)} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"><ChevronRight size={16} /></button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {picks.map((p, i) => (
          <div key={i} className="min-w-[280px] max-w-[300px] flex-shrink-0 rounded-xl border border-border bg-card overflow-hidden group cursor-pointer transition-all duration-150 hover:scale-[1.02] hover:shadow-lg flex flex-col">
            <div className="aspect-[4/5] overflow-hidden relative flex-none">
              <img src={p.image} alt={p.product} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            </div>
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full overflow-hidden border border-border">
                  <img src={p.avatar} alt={p.influencer} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-semibold text-foreground truncate">{p.influencer}</span>
                    <Verified size={11} className="text-primary flex-shrink-0" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{p.followers} подписчиков</span>
                </div>
              </div>
              <p className="text-xs font-medium text-foreground truncate">{p.product}</p>
              <p className="text-xs font-bold text-primary mt-0.5">{p.price}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default InfluencerPicks;

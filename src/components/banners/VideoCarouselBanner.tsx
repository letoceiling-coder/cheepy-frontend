import { useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";

const cards = [
  { name: "Куртка парка", poster: product1, video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
  { name: "Кроссовки спорт", poster: product2, video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" },
  { name: "Пальто классик", poster: product3, video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4" },
  { name: "Сумка кожаная", poster: product4, video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4" },
];

const Card = ({ card }: { card: (typeof cards)[0] }) => (
  <div className="min-w-[220px] sm:min-w-[240px] flex-shrink-0 rounded-xl overflow-hidden border border-border bg-card group cursor-pointer">
    <div className="aspect-[4/3] overflow-hidden relative">
      <video autoPlay muted loop playsInline preload="metadata" poster={card.poster} className="w-full h-full object-cover block transition-transform duration-500 group-hover:scale-105">
        <source src={card.video} type="video/mp4" />
      </video>
    </div>
    <div className="p-3 flex items-center justify-between">
      <span className="text-xs font-semibold text-foreground">{card.name}</span>
      <span className="text-xs text-primary font-medium flex items-center gap-1">Смотреть <ArrowRight size={11} /></span>
    </div>
  </div>
);

const VideoCarouselBanner = () => {
  const { ref, isVisible } = useScrollAnimation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (d: number) => scrollRef.current?.scrollBy({ left: d * 260, behavior: "smooth" });

  return (
    <section ref={ref} className={`py-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Видео каталог</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Автоматическое воспроизведение</p>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => scroll(-1)} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"><ChevronLeft size={16} /></button>
          <button onClick={() => scroll(1)} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"><ChevronRight size={16} /></button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {cards.map((c, i) => <Card key={i} card={c} />)}
      </div>
    </section>
  );
};
export default VideoCarouselBanner;

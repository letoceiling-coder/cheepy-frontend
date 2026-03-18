import { ArrowRight } from "lucide-react";
import { useDragScroll } from "@/hooks/useDragScroll";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import product1 from "@/assets/product-1.jpg";
import product3 from "@/assets/product-3.jpg";
import product5 from "@/assets/product-5.jpg";

const cards = [
  { title: "Лучшие скидки", cta: "Смотреть", poster: product1, video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
  { title: "Новые поступления", cta: "Открыть", poster: product3, video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" },
  { title: "Сейчас в тренде", cta: "Смотреть", poster: product5, video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4" },
];

const MiniVideoCard = ({ card }: { card: (typeof cards)[0] }) => (
  <div className="min-w-[220px] sm:min-w-0 flex-shrink-0 sm:flex-shrink rounded-xl overflow-hidden relative cursor-pointer group aspect-[16/9] max-h-[180px]">
    <video autoPlay muted loop playsInline preload="metadata" poster={card.poster} className="w-full h-full object-cover block transition-transform duration-500 group-hover:scale-105">
      <source src={card.video} type="video/mp4" />
    </video>
    <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent pointer-events-none" />
    <div className="absolute bottom-0 left-0 right-0 p-3">
      <h3 className="text-sm font-bold text-primary-foreground mb-1">{card.title}</h3>
      <span className="flex items-center gap-1 text-primary-foreground/80 text-xs font-medium">
        {card.cta} <ArrowRight size={12} />
      </span>
    </div>
  </div>
);

const MiniVideoGallery = () => {
  const { ref, isVisible } = useScrollAnimation();
  const scrollRef = useDragScroll<HTMLDivElement>();

  return (
    <section ref={ref} className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100" : "opacity-0"}`}>
      <h2 className="text-xl font-bold text-foreground mb-1">Видеоподборки</h2>
      <p className="text-muted-foreground text-sm mb-4">Автоматическое воспроизведение</p>
      <div ref={scrollRef} className="flex sm:grid sm:grid-cols-3 gap-3 overflow-x-auto sm:overflow-visible no-scrollbar pb-1 cursor-grab active:cursor-grabbing sm:cursor-default sm:active:cursor-default">
        {cards.map((card, i) => <MiniVideoCard key={i} card={card} />)}
      </div>
    </section>
  );
};

export default MiniVideoGallery;

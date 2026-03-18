import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDragScroll } from "@/hooks/useDragScroll";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import product5 from "@/assets/product-5.jpg";

const clips = [
  { title: "Городской стиль", poster: product1, video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
  { title: "На прогулку", poster: product2, video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" },
  { title: "Спортивный день", poster: product3, video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4" },
  { title: "Деловой образ", poster: product4, video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4" },
  { title: "Выходной look", poster: product5, video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
];

const Clip = ({ clip }: { clip: (typeof clips)[0] }) => (
  <div className="w-[140px] sm:w-[160px] flex-shrink-0 rounded-xl overflow-hidden relative cursor-pointer group">
    <div className="aspect-[9/16] w-full">
      <video autoPlay muted loop playsInline preload="metadata" poster={clip.poster} className="w-full h-full object-cover block transition-transform duration-500 group-hover:scale-105">
        <source src={clip.video} type="video/mp4" />
      </video>
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent pointer-events-none" />
    <div className="absolute bottom-2.5 left-2.5 right-2.5">
      <p className="text-xs font-bold text-primary-foreground">{clip.title}</p>
    </div>
  </div>
);

const LifestyleVideoStrip = () => {
  const { ref, isVisible } = useScrollAnimation();
  const scrollRef = useDragScroll<HTMLDivElement>();
  const scroll = (d: number) => scrollRef.current?.scrollBy({ left: d * 200, behavior: "smooth" });

  return (
    <section ref={ref} className={`py-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Лайфстайл</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Короткие видео для вдохновения</p>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => scroll(-1)} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"><ChevronLeft size={16} /></button>
          <button onClick={() => scroll(1)} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"><ChevronRight size={16} /></button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto no-scrollbar pb-1 cursor-grab active:cursor-grabbing">
        {clips.map((c, i) => <Clip key={i} clip={c} />)}
      </div>
    </section>
  );
};

export default LifestyleVideoStrip;

import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { useDragScroll } from "@/hooks/useDragScroll";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import product5 from "@/assets/product-5.jpg";

type SlideType = "product" | "photo" | "video";

interface Slide {
  type: SlideType;
  image?: string;
  title?: string;
  price?: number;
  video?: string;
  poster?: string;
}

const slides: Slide[] = [
  { type: "product", image: product1, title: "Кроссовки Sport", price: 7990 },
  { type: "video", poster: product2, video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
  { type: "product", image: product3, title: "Рюкзак City", price: 4990 },
  { type: "photo", image: product4 },
  { type: "product", image: product5, title: "Худи Premium", price: 6490 },
  { type: "video", poster: product1, video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" },
  { type: "product", image: product2, title: "Шапка Wool", price: 2490 },
];

const ProductSlide = ({ s }: { s: Slide }) => (
  <div className="min-w-[180px] sm:min-w-[200px] flex-shrink-0 rounded-xl overflow-hidden bg-card border border-border group cursor-pointer transition-shadow duration-300 hover:shadow-lg">
    <div className="aspect-square overflow-hidden">
      <img src={s.image} alt={s.title} className="w-full h-full object-cover block transition-transform duration-500 group-hover:scale-105" loading="lazy" />
    </div>
    <div className="p-2.5">
      <p className="text-xs font-semibold text-foreground truncate">{s.title}</p>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-xs font-bold text-primary">{s.price?.toLocaleString("ru-RU")} ₽</span>
        <button className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
          <ShoppingCart size={12} className="text-primary" />
        </button>
      </div>
    </div>
  </div>
);

const PhotoSlide = ({ s }: { s: Slide }) => (
  <div className="min-w-[180px] sm:min-w-[200px] flex-shrink-0 rounded-xl overflow-hidden relative group cursor-pointer">
    <div className="aspect-[3/4]">
      <img src={s.image} alt="" className="w-full h-full object-cover block transition-transform duration-500 group-hover:scale-105" loading="lazy" />
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 to-transparent pointer-events-none" />
    <div className="absolute bottom-2 left-2">
      <span className="text-[10px] font-semibold text-primary-foreground/90 uppercase tracking-wider">Вдохновение</span>
    </div>
  </div>
);

const VideoSlide = ({ s }: { s: Slide }) => (
  <div className="min-w-[180px] sm:min-w-[200px] flex-shrink-0 rounded-xl overflow-hidden relative group cursor-pointer">
    <div className="aspect-[3/4]">
      <video autoPlay muted loop playsInline preload="metadata" poster={s.poster} className="w-full h-full object-cover block transition-transform duration-500 group-hover:scale-105">
        <source src={s.video} type="video/mp4" />
      </video>
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent pointer-events-none" />
    <div className="absolute bottom-2 left-2">
      <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/80 text-primary-foreground px-2 py-0.5 rounded">Video</span>
    </div>
  </div>
);

const MediaProductSlider = () => {
  const { ref, isVisible } = useScrollAnimation();
  const scrollRef = useDragScroll<HTMLDivElement>();
  const scroll = (d: number) => scrollRef.current?.scrollBy({ left: d * 220, behavior: "smooth" });

  return (
    <section ref={ref} className={`py-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Медиа-подборка</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Товары, фото и видео в одном слайдере</p>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => scroll(-1)} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"><ChevronLeft size={16} /></button>
          <button onClick={() => scroll(1)} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"><ChevronRight size={16} /></button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto no-scrollbar pb-1 cursor-grab active:cursor-grabbing">
        {slides.map((s, i) => (
          <div key={i}>
            {s.type === "product" && <ProductSlide s={s} />}
            {s.type === "photo" && <PhotoSlide s={s} />}
            {s.type === "video" && <VideoSlide s={s} />}
          </div>
        ))}
      </div>
    </section>
  );
};

export default MediaProductSlider;

import { Play } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";

const videos = [
  { title: "Обзор коллекции SS'25", thumb: product1, duration: "2:34" },
  { title: "Как выбрать кроссовки", thumb: product2, duration: "5:12" },
  { title: "Тренды весна-лето", thumb: product3, duration: "3:45" },
  { title: "Стилист рекомендует", thumb: product4, duration: "4:08" },
];

const VideoGallery = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`py-6 transition-all duration-700 ${isVisible ? "opacity-100" : "opacity-0"}`}>
      <h2 className="text-lg font-bold text-foreground mb-1">Видеообзоры</h2>
      <p className="text-muted-foreground text-xs mb-4">Смотрите обзоры от экспертов</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {videos.map((v, i) => (
          <div key={i} className="rounded-xl overflow-hidden cursor-pointer group relative h-[180px]">
            <img src={v.thumb} alt={v.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 bg-foreground/30 group-hover:bg-foreground/50 transition-colors duration-300 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-primary-foreground/90 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg">
                <Play size={16} className="text-primary ml-0.5" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-foreground/80 to-transparent">
              <h3 className="text-primary-foreground text-xs font-medium">{v.title}</h3>
              <span className="text-primary-foreground/70 text-[10px]">{v.duration}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default VideoGallery;

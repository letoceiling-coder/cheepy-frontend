import { Play } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";

const videos = [
  { title: "Кампания SS'25", desc: "Новая коллекция в движении", thumb: hero1 },
  { title: "Behind the Scenes", desc: "Как создаётся коллекция", thumb: hero2 },
  { title: "Streetwear Edit", desc: "Образы для города", thumb: hero3 },
];

const VideoCampaign = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <h2 className="text-2xl font-bold text-foreground mb-2">Видео</h2>
      <p className="text-muted-foreground text-sm mb-6">Кампании и обзоры</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {videos.map((v, i) => (
          <div key={i} className="rounded-xl overflow-hidden relative cursor-pointer group aspect-video">
            <img src={v.thumb} alt={v.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-foreground/30 group-hover:bg-foreground/50 transition-colors duration-300 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-primary-foreground/90 flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110">
                <Play size={26} className="text-primary ml-1" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-foreground/80 to-transparent">
              <h3 className="text-primary-foreground font-semibold">{v.title}</h3>
              <p className="text-primary-foreground/70 text-sm">{v.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default VideoCampaign;

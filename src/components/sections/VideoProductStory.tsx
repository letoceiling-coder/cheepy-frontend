import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import hero3 from "@/assets/hero-3.jpg";

const VideoProductStory = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`py-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="max-w-2xl mx-auto text-center">
        <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">История продукта</span>
        <h2 className="text-xl font-bold text-foreground mt-1 mb-4">Как создаётся качество</h2>
        <div className="rounded-xl overflow-hidden mb-4 aspect-video">
          <video autoPlay muted loop playsInline preload="metadata" poster={hero3} className="w-full h-full object-cover block transition-transform duration-700 hover:scale-105">
            <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" type="video/mp4" />
          </video>
        </div>
        <p className="text-sm text-muted-foreground mb-3">От идеи до готового продукта — узнайте, как мы отбираем лучшие товары для вас</p>
        <button className="h-9 px-5 gradient-primary text-primary-foreground rounded-lg font-semibold text-sm inline-flex items-center gap-2 hover:opacity-90 transition-opacity">
          Узнать больше <ArrowRight size={14} />
        </button>
      </div>
    </section>
  );
};

export default VideoProductStory;

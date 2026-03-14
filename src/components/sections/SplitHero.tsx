import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import hero2 from "@/assets/hero-2.jpg";

const SplitHero = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center">
        <div className="rounded-2xl overflow-hidden aspect-[4/5] md:aspect-auto md:h-[480px]">
          <img src={hero2} alt="Collection" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
        </div>
        <div className="flex flex-col justify-center py-4">
          <span className="text-xs uppercase tracking-widest text-primary font-medium mb-3">Эксклюзивная коллекция</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-4">Авторская линейка Urban Heritage</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Вдохновлённая архитектурой современного города, коллекция объединяет минимализм и функциональность.
            Каждая вещь создана для тех, кто ценит стиль без компромиссов.
          </p>
          <div>
            <button className="h-12 px-8 rounded-xl gradient-primary text-primary-foreground font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity group">
              Смотреть коллекцию <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SplitHero;

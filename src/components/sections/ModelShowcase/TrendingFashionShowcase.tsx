import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import ModelCard from "./ModelCard";
import { allModels, shuffleArray } from "./modelData";

const TrendingFashionShowcase = () => {
  const { ref, isVisible } = useScrollAnimation();
  const models = useMemo(() => shuffleArray(allModels), []);

  return (
    <section ref={ref} className={`py-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">В тренде</h2>
            <p className="text-sm text-muted-foreground">Самые популярные модели сезона</p>
          </div>
        </div>
        <a href="/category/trending" className="text-sm text-primary font-medium hover:underline hidden sm:block">
          Смотреть все
        </a>
      </div>

      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map((m, i) => (
          <ModelCard key={m.id} {...m} delay={i * 80} />
        ))}
      </div>

      <div className="md:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 -mx-4 px-4 scrollbar-hide">
        {models.map((m, i) => (
          <div key={m.id} className="snap-start shrink-0 w-[70vw]">
            <ModelCard {...m} delay={i * 60} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default TrendingFashionShowcase;

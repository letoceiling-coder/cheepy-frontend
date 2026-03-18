import { useMemo } from "react";
import { useDragScroll } from "@/hooks/useDragScroll";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import ModelVideoCard from "./ModelVideoCard";
import { modelVideoProducts } from "./modelVideoData";

const RandomModelShowcase = () => {
  const { ref, isVisible } = useScrollAnimation();
  const scrollRef = useDragScroll<HTMLDivElement>();
  const products = useMemo(
    () => [...modelVideoProducts].sort(() => Math.random() - 0.5),
    [],
  );

  return (
    <section
      ref={ref}
      className={`py-4 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
    >
      <div className="flex items-end justify-between mb-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Случайный подбор</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Короткие видео-превью образов (loop)</p>
        </div>
      </div>

      {/* Desktop/Tablet grid */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map((p) => (
          <ModelVideoCard key={p.id} {...p} />
        ))}
      </div>

      {/* Mobile carousel */}
      <div ref={scrollRef} className="md:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 -mx-4 px-4 scrollbar-hide cursor-grab active:cursor-grabbing">
        {products.map((p) => (
          <div key={p.id} className="snap-start shrink-0 w-[72vw] max-w-[260px]">
            <ModelVideoCard {...p} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default RandomModelShowcase;


import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import hero1 from "@/assets/hero-1.jpg";
import product3 from "@/assets/product-3.jpg";

const FeaturedCollection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`py-5 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          { title: "Мужская коллекция", sub: "Весна-Лето 2025", image: hero1 },
          { title: "Женская коллекция", sub: "Новые поступления", image: product3 },
        ].map((c, i) => (
          <div key={i} className="rounded-xl overflow-hidden relative h-[180px] md:h-[200px] cursor-pointer group hover:-translate-y-0.5 hover:shadow-lg transition-all duration-250">
            <img src={c.image} alt={c.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 to-transparent" />
            <div className="absolute inset-0 flex items-center p-6">
              <div>
                <p className="text-primary-foreground/70 text-[10px] uppercase tracking-wider">{c.sub}</p>
                <h3 className="text-xl font-bold text-primary-foreground mt-1 mb-3">{c.title}</h3>
                <button className="flex items-center gap-1.5 text-primary-foreground text-xs font-medium group/b">
                  Смотреть <ArrowRight size={12} className="transition-transform group-hover/b:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturedCollection;

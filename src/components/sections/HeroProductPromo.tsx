import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import product1 from "@/assets/product-1.jpg";

const HeroProductPromo = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="rounded-2xl bg-secondary overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 items-center">
          <div className="p-8 md:p-12">
            <span className="text-xs uppercase tracking-widest text-primary font-medium">Товар недели</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3 leading-tight">Куртка демисезонная удлинённая</h2>
            <p className="text-muted-foreground mt-3 leading-relaxed">Стильная куртка из водоотталкивающей ткани с утеплителем. Идеальна для переходного сезона.</p>
            <div className="flex items-baseline gap-3 mt-5">
              <span className="text-3xl font-bold text-foreground">4 990 ₽</span>
              <span className="text-lg text-muted-foreground line-through">6 990 ₽</span>
              <span className="text-sm font-bold text-destructive">-28%</span>
            </div>
            <button className="mt-6 h-12 px-8 rounded-xl gradient-primary text-primary-foreground font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity group">
              Купить сейчас <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
          <div className="relative h-[300px] md:h-[400px]">
            <img src={product1} alt="Featured" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroProductPromo;

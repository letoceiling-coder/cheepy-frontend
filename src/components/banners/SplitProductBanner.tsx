import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import product1 from "@/assets/product-1.jpg";

const SplitProductBanner = () => {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <section ref={ref} className={`py-4 md:py-6 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 rounded-xl overflow-hidden border border-border bg-card md:max-h-[min(340px,50vh)]">
        <div className="aspect-[4/3] md:aspect-auto md:h-[min(340px,50vh)] overflow-hidden group">
          <img src={product1} alt="Product" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>
        <div className="p-5 md:p-6 flex flex-col justify-center gap-2">
          <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">Новинка сезона</span>
          <h2 className="text-2xl font-bold text-foreground leading-tight">Обновите свой стиль сегодня</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">Премиальные материалы и современный крой — коллекция, которая подчеркнёт вашу индивидуальность.</p>
          <button className="mt-2 self-start h-10 px-6 gradient-primary text-primary-foreground rounded-lg font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
            Купить сейчас <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
};
export default SplitProductBanner;

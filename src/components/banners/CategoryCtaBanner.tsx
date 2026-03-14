import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import hero3 from "@/assets/hero-3.jpg";

const CategoryCtaBanner = () => {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <section ref={ref} className={`py-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="relative rounded-xl overflow-hidden h-[180px] md:h-[220px] group cursor-pointer">
        <img src={hero3} alt="Category" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
        <div className="absolute bottom-5 left-5 right-5 md:bottom-8 md:left-8">
          <span className="bg-primary/90 text-primary-foreground text-[11px] font-bold px-2.5 py-1 rounded">НОВИНКИ</span>
          <h2 className="text-xl md:text-2xl font-bold text-primary-foreground mt-2">Откройте новые поступления</h2>
          <p className="text-sm text-primary-foreground/80 mt-1">Более 500 новых товаров каждую неделю</p>
          <button className="mt-3 h-9 px-5 bg-primary-foreground text-foreground rounded-lg font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
            Смотреть каталог <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
};
export default CategoryCtaBanner;

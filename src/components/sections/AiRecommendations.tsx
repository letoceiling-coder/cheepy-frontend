import { Sparkles } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { mockProducts } from "@/data/mock-data";

const AiRecommendations = () => {
  const { ref, isVisible } = useScrollAnimation();
  const products = mockProducts.slice(12, 18);

  return (
    <section ref={ref} className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="flex items-center gap-3 mb-2">
        <Sparkles size={20} className="text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Рекомендации для вас</h2>
      </div>
      <p className="text-muted-foreground text-sm mb-8">Подобрано на основе ваших интересов</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {products.map((p) => (
          <div key={p.id} className="group cursor-pointer">
            <div className="aspect-[3/4] rounded-xl overflow-hidden mb-2 relative">
              <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <Sparkles size={10} /> AI
              </div>
            </div>
            <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
            <p className="text-xs font-bold text-foreground">{p.price.toLocaleString()} ₽</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AiRecommendations;

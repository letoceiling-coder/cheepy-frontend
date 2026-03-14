import { Search, BarChart3, CreditCard, PackageCheck } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const steps = [
  { icon: Search, title: "Найдите", desc: "Ищите среди 120 000 товаров" },
  { icon: BarChart3, title: "Сравните", desc: "Сравните цены от разных продавцов" },
  { icon: CreditCard, title: "Купите", desc: "Безопасная оплата онлайн" },
  { icon: PackageCheck, title: "Получите", desc: "Быстрая доставка до двери" },
];

const FeatureTimeline = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Как это работает</h2>
      <p className="text-muted-foreground text-sm mb-12 text-center">4 простых шага до покупки</p>
      <div className="relative">
        {/* Connecting line */}
        <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-border">
          <div className={`h-full gradient-primary transition-all duration-1000 ease-out ${isVisible ? "w-full" : "w-0"}`} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="text-center relative"
                style={{ transitionDelay: `${i * 200}ms` }}
              >
                <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center relative z-10 transition-all duration-500 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"}`} style={{ transitionDelay: `${i * 200}ms` }}>
                  <Icon size={32} className="text-primary-foreground" />
                </div>
                <span className="text-xs text-primary font-bold">Шаг {i + 1}</span>
                <h3 className="font-semibold text-foreground mt-1">{s.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeatureTimeline;

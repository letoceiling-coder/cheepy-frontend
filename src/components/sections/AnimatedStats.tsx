import { useEffect, useState } from "react";
import { Package, Users, ShoppingBag, ThumbsUp } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const stats = [
  { icon: Package, value: 120000, label: "Товаров", suffix: "k", divisor: 1000 },
  { icon: Users, value: 45000, label: "Продавцов", suffix: "k", divisor: 1000 },
  { icon: ShoppingBag, value: 1200000, label: "Заказов", suffix: "M", divisor: 1000000 },
  { icon: ThumbsUp, value: 98, label: "Довольных клиентов", suffix: "%", divisor: 1 },
];

const AnimatedStats = () => {
  const { ref, isVisible } = useScrollAnimation(0.3);
  const [counts, setCounts] = useState(stats.map(() => 0));

  useEffect(() => {
    if (!isVisible) return;
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setCounts(stats.map((s) => {
        const target = s.value / s.divisor;
        return Math.min(Math.round((step / steps) * target * 10) / 10, target);
      }));
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [isVisible]);

  return (
    <section ref={ref} className={`py-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="rounded-2xl gradient-primary p-8 md:p-12">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground">Cheepy в цифрах</h2>
          <p className="text-primary-foreground/70 mt-2">Нам доверяют миллионы покупателей</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="text-center group">
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary-foreground/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <Icon size={28} className="text-primary-foreground" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-primary-foreground">
                  {counts[i]}{s.suffix}
                </div>
                <p className="text-primary-foreground/70 text-sm mt-1">{s.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AnimatedStats;

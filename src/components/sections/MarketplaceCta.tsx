import { ArrowRight, Store, TrendingUp, Shield } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const MarketplaceCta = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="rounded-2xl bg-foreground p-8 md:p-14 relative overflow-hidden">
        {/* Floating shapes */}
        <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-10 left-20 w-24 h-24 rounded-full bg-primary/15 blur-2xl" />
        <div className="absolute top-1/2 right-1/3 w-16 h-16 rounded-full bg-primary/10 blur-xl" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-xs uppercase tracking-widest text-primary font-medium">Для продавцов</span>
            <h2 className="text-3xl md:text-4xl font-bold text-background mt-3 leading-tight">Начните продавать на Cheepy</h2>
            <p className="text-background/60 mt-4 leading-relaxed">Присоединяйтесь к 45 000 продавцов. Миллионы покупателей ждут ваши товары.</p>
            <button className="mt-8 h-12 px-8 rounded-xl gradient-primary text-primary-foreground font-semibold flex items-center gap-2 hover:opacity-90 transition-all duration-300 group">
              Начать продавать <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {[
              { icon: Store, title: "Своя витрина", text: "Настройте магазин за 5 минут" },
              { icon: TrendingUp, title: "Аналитика продаж", text: "Отслеживайте всё в реальном времени" },
              { icon: Shield, title: "Безопасные выплаты", text: "Ежедневные выводы на карту" },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-background/5 hover:bg-background/10 transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-background text-sm">{item.title}</h3>
                    <p className="text-background/50 text-xs">{item.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketplaceCta;

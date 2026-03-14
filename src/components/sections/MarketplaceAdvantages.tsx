import { Shield, Truck, BadgeCheck, Headphones } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const advantages = [
  { icon: Shield, title: "Безопасные платежи", text: "Защита покупок и возврат средств" },
  { icon: Truck, title: "Быстрая доставка", text: "Доставка от 1 дня по всей России" },
  { icon: BadgeCheck, title: "Проверенные продавцы", text: "Только сертифицированные магазины" },
  { icon: Headphones, title: "Поддержка 24/7", text: "Всегда на связи для вас" },
];

const MarketplaceAdvantages = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {advantages.map((a, i) => {
          const Icon = a.icon;
          return (
            <div
              key={i}
              className="bg-card rounded-xl border border-border p-6 text-center cursor-pointer group transition-all duration-300 hover:border-primary hover:shadow-md hover:shadow-primary/5"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                <Icon size={24} className="text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">{a.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{a.text}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default MarketplaceAdvantages;

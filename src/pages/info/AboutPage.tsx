import { useEffect, useState } from "react";
import { InfoPageLayout, PageHero, SectionFadeIn } from "@/components/InfoPageShared";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Package, Users, ShoppingBag, Globe } from "lucide-react";

const stats = [
  { icon: Package, value: 120000, label: "Товаров", suffix: "k", div: 1000 },
  { icon: Users, value: 45000, label: "Продавцов", suffix: "k", div: 1000 },
  { icon: ShoppingBag, value: 1200000, label: "Заказов", suffix: "M", div: 1000000 },
  { icon: Globe, value: 85, label: "Регионов доставки", suffix: "", div: 1 },
];

const AboutPage = () => {
  const { ref: statsRef, isVisible: statsVisible } = useScrollAnimation(0.3);
  const [counts, setCounts] = useState(stats.map(() => 0));

  useEffect(() => {
    if (!statsVisible) return;
    const duration = 2000;
    const steps = 60;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setCounts(stats.map((s) => Math.min(Math.round((step / steps) * (s.value / s.div) * 10) / 10, s.value / s.div)));
      if (step >= steps) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [statsVisible]);

  return (
    <InfoPageLayout>
      <PageHero
        title="О компании"
        subtitle="Cheepy — маркетплейс модной одежды и аксессуаров"
        breadcrumb={[{ label: "Главная", to: "/" }, { label: "О нас" }]}
      />
      <SectionFadeIn className="pb-8">
        <div className="bg-card rounded-xl border border-border p-6 md:p-8">
          <h2 className="text-xl font-bold text-foreground mb-4">Наша миссия</h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>Cheepy — это современный маркетплейс, объединяющий тысячи продавцов и миллионы покупателей. Мы создаём экосистему, где каждый может найти стильную одежду и аксессуары по лучшим ценам.</p>
            <p>Наша цель — сделать моду доступной для всех. Мы тщательно отбираем продавцов, контролируем качество товаров и обеспечиваем безопасные покупки с гарантией возврата.</p>
            <p>С момента основания в 2022 году мы выросли от небольшой платформы до одного из крупнейших fashion-маркетплейсов в России, обслуживая покупателей в 85 регионах.</p>
          </div>
        </div>
      </SectionFadeIn>
      <div ref={statsRef} className={`rounded-2xl gradient-primary p-8 md:p-12 mb-12 transition-all duration-700 ${statsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
                  <Icon size={24} className="text-primary-foreground" />
                </div>
                <div className="text-3xl font-bold text-primary-foreground">{counts[i]}{s.suffix}</div>
                <p className="text-primary-foreground/70 text-sm mt-1">{s.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </InfoPageLayout>
  );
};

export default AboutPage;

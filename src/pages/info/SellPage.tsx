import { InfoPageLayout, PageHero, CtaBlock, SectionFadeIn } from "@/components/InfoPageShared";
import { UserPlus, Upload, Tag, ShoppingBag } from "lucide-react";

const steps = [
  { icon: UserPlus, title: "Создайте аккаунт продавца", desc: "Зарегистрируйтесь и заполните профиль магазина: название, описание, логотип." },
  { icon: Upload, title: "Загрузите товары", desc: "Добавьте фото, описания, размеры и цены. Используйте массовую загрузку для больших каталогов." },
  { icon: Tag, title: "Установите цены", desc: "Задайте конкурентные цены, настройте акции и скидки для привлечения покупателей." },
  { icon: ShoppingBag, title: "Начните продавать", desc: "После модерации ваши товары появятся в каталоге. Обрабатывайте заказы и развивайте бизнес." },
];

const SellPage = () => (
  <InfoPageLayout>
    <PageHero
      title="Начните продавать на Cheepy"
      subtitle="Присоединяйтесь к 45 000 продавцов и получите доступ к миллионам покупателей"
      breadcrumb={[{ label: "Главная", to: "/" }, { label: "Начать продавать" }]}
    />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pb-6">
      {steps.map((s, i) => {
        const Icon = s.icon;
        return (
          <SectionFadeIn key={i}>
            <div className="bg-card rounded-xl border border-border p-6 h-full hover:border-primary transition-all duration-300">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                <Icon size={22} className="text-primary-foreground" />
              </div>
              <span className="text-xs text-primary font-bold">Шаг {i + 1}</span>
              <h3 className="font-semibold text-foreground mt-1 mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          </SectionFadeIn>
        );
      })}
    </div>
    <CtaBlock title="Готовы начать?" text="Регистрация занимает всего 5 минут" buttonText="Стать продавцом" buttonTo="/auth" />
  </InfoPageLayout>
);

export default SellPage;

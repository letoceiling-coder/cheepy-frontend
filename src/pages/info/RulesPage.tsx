import { InfoPageLayout, PageHero, SectionFadeIn } from "@/components/InfoPageShared";
import { AlertTriangle, Shield, Users, Scale } from "lucide-react";

const sections = [
  {
    icon: Scale,
    title: "Общие правила",
    items: [
      "Все товары должны соответствовать описанию и фотографиям",
      "Запрещена продажа подделок и контрафактной продукции",
      "Продавцы обязаны отвечать на вопросы покупателей в течение 24 часов",
      "Все участники площадки обязаны соблюдать законодательство РФ",
    ],
  },
  {
    icon: AlertTriangle,
    title: "Запрещённые товары",
    items: [
      "Оружие и боеприпасы",
      "Наркотические и психотропные вещества",
      "Контрафактная продукция",
      "Товары, нарушающие авторские права",
      "Опасные химические вещества",
    ],
  },
  {
    icon: Users,
    title: "Обязанности продавцов",
    items: [
      "Обработка заказов в течение 24 часов",
      "Отправка товаров в указанные сроки",
      "Предоставление достоверной информации о товарах",
      "Соблюдение политики возвратов площадки",
    ],
  },
  {
    icon: Shield,
    title: "Защита покупателей",
    items: [
      "Гарантия возврата средств при получении товара, не соответствующего описанию",
      "Программа защиты покупателей покрывает все заказы",
      "Служба поддержки помогает решить любые споры",
      "Система рейтингов и отзывов для контроля качества",
    ],
  },
];

const RulesPage = () => (
  <InfoPageLayout>
    <PageHero
      title="Правила площадки"
      subtitle="Правила для продавцов и покупателей Cheepy"
      breadcrumb={[{ label: "Главная", to: "/" }, { label: "Правила площадки" }]}
    />
    <div className="space-y-8 pb-12">
      {sections.map((s, i) => {
        const Icon = s.icon;
        return (
          <SectionFadeIn key={i}>
            <div className="bg-card rounded-xl border border-border p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon size={20} className="text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">{s.title}</h2>
              </div>
              <ul className="space-y-3">
                {s.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </SectionFadeIn>
        );
      })}
    </div>
  </InfoPageLayout>
);

export default RulesPage;

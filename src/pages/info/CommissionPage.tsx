import { InfoPageLayout, PageHero, SectionFadeIn } from "@/components/InfoPageShared";

const rows = [
  { category: "Одежда", commission: "8%", note: "Включая верхнюю одежду" },
  { category: "Обувь", commission: "7%", note: "" },
  { category: "Аксессуары", commission: "6%", note: "Сумки, ремни, очки" },
  { category: "Электроника", commission: "5%", note: "Гаджеты и аксессуары" },
  { category: "Спорт", commission: "7%", note: "Спортивная одежда и инвентарь" },
  { category: "Украшения", commission: "10%", note: "Бижутерия и ювелирные изделия" },
  { category: "Дом и интерьер", commission: "6%", note: "" },
];

const CommissionPage = () => (
  <InfoPageLayout>
    <PageHero
      title="Комиссия"
      subtitle="Прозрачная система комиссий для продавцов"
      breadcrumb={[{ label: "Главная", to: "/" }, { label: "Комиссия" }]}
    />
    <SectionFadeIn className="pb-8">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[500px]">
          <thead><tr className="bg-secondary">
            <th className="text-left p-4 text-sm font-semibold text-foreground">Категория</th>
            <th className="text-left p-4 text-sm font-semibold text-foreground">Комиссия</th>
            <th className="text-left p-4 text-sm font-semibold text-foreground">Примечание</th>
          </tr></thead>
          <tbody>{rows.map((r, i) => (
            <tr key={i} className="border-t border-border hover:bg-secondary/50 transition-colors">
              <td className="p-4 text-sm font-medium text-foreground">{r.category}</td>
              <td className="p-4 text-sm font-bold text-primary">{r.commission}</td>
              <td className="p-4 text-sm text-muted-foreground">{r.note || "—"}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </SectionFadeIn>
    <SectionFadeIn className="pb-12">
      <div className="bg-card rounded-xl border border-border p-6 md:p-8">
        <h2 className="text-xl font-bold text-foreground mb-4">Как работает комиссия</h2>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>Комиссия взимается только с завершённых продаж. Пока товар не продан и не доставлен покупателю, вы ничего не платите.</p>
          <p>Комиссия включает обработку платежей, размещение товаров в каталоге и доступ к маркетинговым инструментам площадки.</p>
          <p>Для крупных продавцов (от 500 продаж в месяц) предусмотрены индивидуальные условия. Свяжитесь с нами для обсуждения.</p>
        </div>
      </div>
    </SectionFadeIn>
  </InfoPageLayout>
);

export default CommissionPage;

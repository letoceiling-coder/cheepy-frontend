import { InfoPageLayout, PageHero, SectionFadeIn } from "@/components/InfoPageShared";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Store, Package, ClipboardList, Settings } from "lucide-react";

const guides = [
  { icon: Store, title: "Управление магазином", desc: "Настройка профиля, логотипа, описания и контактов" },
  { icon: Package, title: "Размещение товаров", desc: "Загрузка фото, описаний, размеров и цен" },
  { icon: ClipboardList, title: "Обработка заказов", desc: "Приём, упаковка и отправка заказов" },
  { icon: Settings, title: "Настройки аккаунта", desc: "Выплаты, уведомления, безопасность" },
];

const faqs = [
  { q: "Как загрузить товары массово?", a: "Используйте импорт через CSV-файл в разделе 'Товары' личного кабинета продавца." },
  { q: "Как настроить акции и скидки?", a: "В разделе 'Маркетинг' создайте промо-акцию с указанием скидки и срока действия." },
  { q: "Как подключить автоматические выплаты?", a: "В настройках аккаунта укажите реквизиты карты или расчётного счёта для ежедневных выплат." },
  { q: "Что делать при споре с покупателем?", a: "Постарайтесь решить вопрос напрямую. Если не получается — обратитесь в службу поддержки." },
  { q: "Как повысить видимость товаров?", a: "Используйте качественные фото, подробные описания и участвуйте в промо-кампаниях площадки." },
];

const SellerHelpPage = () => (
  <InfoPageLayout>
    <PageHero
      title="Помощь продавцам"
      subtitle="Руководства и ответы на вопросы для продавцов"
      breadcrumb={[{ label: "Главная", to: "/" }, { label: "Помощь продавцам" }]}
    />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pb-8">
      {guides.map((g, i) => {
        const Icon = g.icon;
        return (
          <SectionFadeIn key={i}>
            <div className="bg-card rounded-xl border border-border p-6 h-full hover:border-primary transition-all duration-300 cursor-pointer group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Icon size={22} className="text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{g.title}</h3>
              <p className="text-sm text-muted-foreground">{g.desc}</p>
            </div>
          </SectionFadeIn>
        );
      })}
    </div>
    <SectionFadeIn className="pb-12">
      <h2 className="text-xl font-bold text-foreground mb-4">Частые вопросы продавцов</h2>
      <Accordion type="single" collapsible>
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`sh-${i}`}>
            <AccordionTrigger className="text-left text-foreground">{f.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </SectionFadeIn>
  </InfoPageLayout>
);

export default SellerHelpPage;

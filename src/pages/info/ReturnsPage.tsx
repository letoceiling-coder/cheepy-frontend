import { InfoPageLayout, PageHero, SectionFadeIn } from "@/components/InfoPageShared";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { RotateCcw, Clock, PackageCheck, CreditCard } from "lucide-react";

const steps = [
  { icon: RotateCcw, title: "Оформите заявку", desc: "Зайдите в раздел 'Заказы' в личном кабинете и нажмите 'Вернуть товар'." },
  { icon: PackageCheck, title: "Упакуйте товар", desc: "Сохраните оригинальную упаковку, бирки и чек. Упакуйте товар для отправки." },
  { icon: Clock, title: "Отправьте товар", desc: "Сдайте посылку в ближайший пункт выдачи или вызовите курьера." },
  { icon: CreditCard, title: "Получите возврат", desc: "Деньги вернутся на карту в течение 3-10 рабочих дней после проверки." },
];

const faqs = [
  { q: "В какой срок можно вернуть товар?", a: "Возврат возможен в течение 14 дней с момента получения заказа при условии сохранения товарного вида." },
  { q: "Какие товары нельзя вернуть?", a: "Нижнее бельё, купальники, ювелирные изделия, парфюмерия и товары личной гигиены возврату не подлежат." },
  { q: "Кто оплачивает доставку при возврате?", a: "Если товар оказался бракованным или не соответствует описанию — доставка за счёт площадки. В остальных случаях — за счёт покупателя." },
  { q: "Когда вернут деньги?", a: "После получения и проверки товара продавцом, средства возвращаются в течение 3-10 рабочих дней." },
];

const ReturnsPage = () => (
  <InfoPageLayout>
    <PageHero
      title="Возврат товара"
      subtitle="Простой и удобный процесс возврата"
      breadcrumb={[{ label: "Главная", to: "/" }, { label: "Возврат товара" }]}
    />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pb-8">
      {steps.map((s, i) => {
        const Icon = s.icon;
        return (
          <SectionFadeIn key={i}>
            <div className="bg-card rounded-xl border border-border p-6 h-full">
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center mb-3">
                <Icon size={18} className="text-primary-foreground" />
              </div>
              <span className="text-xs text-primary font-bold">Шаг {i + 1}</span>
              <h3 className="font-semibold text-foreground mt-1 mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          </SectionFadeIn>
        );
      })}
    </div>
    <SectionFadeIn className="pb-12">
      <h2 className="text-xl font-bold text-foreground mb-4">Частые вопросы о возврате</h2>
      <Accordion type="single" collapsible>
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`r-${i}`}>
            <AccordionTrigger className="text-left text-foreground">{f.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </SectionFadeIn>
  </InfoPageLayout>
);

export default ReturnsPage;

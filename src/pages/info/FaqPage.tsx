import { InfoPageLayout, PageHero } from "@/components/InfoPageShared";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const categories = [
  {
    title: "Заказы",
    items: [
      { q: "Как оформить заказ?", a: "Выберите товар, добавьте в корзину, укажите адрес доставки и оплатите удобным способом." },
      { q: "Как отследить заказ?", a: "Зайдите в раздел 'Заказы' в личном кабинете. Там отображается текущий статус и трек-номер." },
      { q: "Как отменить заказ?", a: "Отменить заказ можно до момента его отправки через раздел 'Заказы' в личном кабинете." },
    ],
  },
  {
    title: "Оплата",
    items: [
      { q: "Какие способы оплаты доступны?", a: "Банковские карты (Visa, Mastercard, МИР), Apple Pay, Google Pay, баланс Cheepy." },
      { q: "Безопасно ли платить на Cheepy?", a: "Да, все платежи защищены SSL-шифрованием. Мы не храним данные карт." },
    ],
  },
  {
    title: "Возврат и обмен",
    items: [
      { q: "Как вернуть товар?", a: "Оформите заявку на возврат в личном кабинете в течение 14 дней с момента получения." },
      { q: "Когда вернут деньги?", a: "В течение 3-10 рабочих дней после получения и проверки товара продавцом." },
    ],
  },
  {
    title: "Продавцы",
    items: [
      { q: "Как связаться с продавцом?", a: "На странице товара или продавца есть кнопка 'Написать продавцу'." },
      { q: "Как оставить отзыв?", a: "После получения заказа перейдите в раздел 'Заказы' и нажмите 'Оставить отзыв'." },
    ],
  },
];

const FaqPage = () => (
  <InfoPageLayout>
    <PageHero
      title="Вопросы и ответы"
      subtitle="Ответы на часто задаваемые вопросы"
      breadcrumb={[{ label: "Главная", to: "/" }, { label: "FAQ" }]}
    />
    <div className="space-y-8 pb-12">
      {categories.map((cat, ci) => (
        <div key={ci}>
          <h2 className="text-xl font-bold text-foreground mb-4">{cat.title}</h2>
          <Accordion type="single" collapsible>
            {cat.items.map((f, i) => (
              <AccordionItem key={i} value={`${ci}-${i}`}>
                <AccordionTrigger className="text-left text-foreground">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ))}
    </div>
  </InfoPageLayout>
);

export default FaqPage;

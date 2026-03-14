import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const faqs = [
  { q: "Как оформить заказ?", a: "Выберите товар, добавьте в корзину, укажите адрес доставки и оплатите удобным способом. Подтверждение придёт на email." },
  { q: "Какие способы оплаты доступны?", a: "Мы принимаем банковские карты, Apple Pay, Google Pay, а также оплату при получении." },
  { q: "Как вернуть товар?", a: "Возврат возможен в течение 14 дней. Оформите заявку в личном кабинете, и мы организуем бесплатный вывоз." },
  { q: "Сколько стоит доставка?", a: "Доставка бесплатна при заказе от 3 000 ₽. Для заказов меньшей суммы стоимость — от 199 ₽." },
  { q: "Как стать продавцом?", a: "Зарегистрируйтесь как продавец, заполните профиль и загрузите товары. Модерация занимает до 24 часов." },
  { q: "Есть ли программа лояльности?", a: "Да! За каждый заказ начисляется кэшбек до 5%, который можно использовать для оплаты следующих покупок." },
];

const FaqAccordion = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Частые вопросы</h2>
      <p className="text-muted-foreground text-sm mb-8 text-center">Ответы на популярные вопросы покупателей</p>
      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible>
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-foreground">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FaqAccordion;

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "Как оформить заказ?",
      answer:
        "Выберите товар, добавьте его в корзину, укажите данные доставки и способ оплаты. После подтверждения заказа вы получите уведомление на email.",
    },
    {
      question: "Какие способы оплаты доступны?",
      answer:
        "Мы принимаем оплату банковскими картами Visa, Mastercard, МИР, а также наличными при получении и через электронные кошельки.",
    },
    {
      question: "Сколько стоит доставка?",
      answer:
        "Доставка курьером по городу от 300₽, в пункт выдачи — бесплатно. При заказе от 3000₽ доставка бесплатная по всей России.",
    },
    {
      question: "Как вернуть товар?",
      answer:
        "Вы можете вернуть товар в течение 14 дней с момента получения. Товар должен быть в оригинальной упаковке, без следов использования. Обратитесь в службу поддержки для оформления возврата.",
    },
    {
      question: "Как стать продавцом?",
      answer:
        "Для регистрации в качестве продавца заполните форму заявки в разделе 'Для продавцов'. Наш менеджер свяжется с вами в течение 1-2 рабочих дней.",
    },
    {
      question: "Есть ли гарантия на товары?",
      answer:
        "Да, на все товары распространяется гарантия производителя. Срок гарантии указан в описании каждого товара. Также действует защита покупателя на 30 дней.",
    },
  ];

  return (
    <section className="container py-8" aria-label="Часто задаваемые вопросы">
      <h2 className="text-xl font-bold text-foreground mb-5 uppercase tracking-wide">
        Часто задаваемые вопросы
      </h2>
      <div className="max-w-3xl">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-sm font-medium text-foreground">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;

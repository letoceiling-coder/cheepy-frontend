const HowToOrder = () => {
  const steps = [
    {
      number: 1,
      title: "Выберите товар",
      description: "Найдите нужный товар через каталог или поиск",
    },
    {
      number: 2,
      title: "Добавьте в корзину",
      description: "Выберите размер, цвет и количество",
    },
    {
      number: 3,
      title: "Оформите заказ",
      description: "Укажите адрес доставки и способ оплаты",
    },
    {
      number: 4,
      title: "Получите заказ",
      description: "Заберите в пункте выдачи или ждите курьера",
    },
  ];

  return (
    <section className="container py-8" aria-label="Как сделать заказ">
      <h2 className="text-xl font-bold text-foreground mb-5 uppercase tracking-wide">
        Как сделать заказ
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {steps.map((step) => (
          <div
            key={step.number}
            className="flex flex-col items-center text-center gap-3 p-5 rounded-xl bg-card border border-border"
          >
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold">
              {step.number}
            </div>
            <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
            <p className="text-xs text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowToOrder;

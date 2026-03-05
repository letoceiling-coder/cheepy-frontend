const InformBlock = () => {
  return (
    <section className="w-full bg-secondary py-16 mb-10">
      <div className="max-w-[1400px] mx-auto px-4">
        <p className="text-center text-foreground text-base font-normal pt-2 pb-10">
          Зарегистрируйтесь прямо сейчас и получите скидку 10% на первый заказ!
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="flex items-center justify-center h-full min-h-[320px]">
            <span
              className="
                text-[220px] md:text-[300px]
                font-extrabold
                leading-none
                bg-gradient-to-br
                from-primary
                to-primary/80
                bg-clip-text
                text-transparent
              "
            >
              %
            </span>
          </div>
          <div className="flex flex-col gap-8 justify-center">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-foreground">Зарегистрируйтесь сейчас</h3>
              <p className="text-sm text-muted-foreground">
                Ознакомьтесь со всеми преимуществами нашей площадки, чтобы пользоваться всеми привилегиями
              </p>
              <button className="gradient-primary text-primary-foreground px-8 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity">
                Зарегистрироваться
              </button>
              <p className="text-sm">
                <a href="#" className="text-primary hover:underline">Узнать больше про преимущества</a>
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-foreground">Обращения</h3>
              <p className="text-sm text-muted-foreground">
                Если у вас возникли вопросы, пожалуйста свяжитесь с нами
              </p>
              <button className="gradient-primary text-primary-foreground px-8 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity">
                Связаться
              </button>
              <p className="text-sm text-muted-foreground">
                Вы можете найти ответ на свой вопрос на странице{" "}
                <a href="#" className="text-primary hover:underline">Частые вопросы</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InformBlock;

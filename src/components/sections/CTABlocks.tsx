import { Link } from "react-router-dom";

const CTABlocks = () => {
  return (
    <section className="container py-8" aria-label="Регистрация">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-primary rounded-2xl p-8 text-primary-foreground relative overflow-hidden">
          <div className="absolute top-4 right-4 text-6xl font-bold opacity-20">%</div>
          <p className="text-sm opacity-80 mb-2">
            Зарегистрируйтесь прямо сейчас и получите скидку 10% на первый заказ!
          </p>
          <h3 className="text-xl font-bold mb-3">Зарегистрируйтесь сейчас</h3>
          <p className="text-sm opacity-80 mb-5">
            Ознакомьтесь со всеми преимуществами нашей площадки, чтобы пользоваться всеми
            привилегиями
          </p>
          <Link
            to="/auth"
            className="inline-block bg-background text-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Зарегистрироваться
          </Link>
          <div className="mt-3">
            <Link
              to="/auth"
              className="text-sm underline opacity-80 hover:opacity-100"
            >
              Узнать больше про преимущества
            </Link>
          </div>
        </div>
        <div className="bg-muted rounded-2xl p-8">
          <h3 className="text-xl font-bold text-foreground mb-3">Обращения</h3>
          <p className="text-sm text-muted-foreground mb-5">
            Если у вас возникли вопросы, пожалуйста свяжитесь с нами
          </p>
          <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            Связаться
          </button>
          <div className="mt-3">
            <span className="text-sm text-muted-foreground">
              Вы можете найти ответ на свой вопрос на странице{" "}
            </span>
            <a href="#faq" className="text-sm text-primary hover:underline">
              Частые вопросы
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTABlocks;

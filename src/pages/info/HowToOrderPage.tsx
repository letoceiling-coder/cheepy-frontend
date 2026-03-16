import { InfoPageLayout, PageHero, CtaBlock, SectionFadeIn } from "@/components/InfoPageShared";
import { Search, ShoppingCart, CreditCard, CheckCircle, PackageCheck } from "lucide-react";

const steps = [
  { icon: Search, title: "Найдите товар", desc: "Используйте поиск или каталог для поиска нужных товаров среди более чем 120 000 позиций." },
  { icon: ShoppingCart, title: "Добавьте в корзину", desc: "Выберите размер, цвет и количество, затем нажмите кнопку 'В корзину'." },
  { icon: CreditCard, title: "Оформите заказ", desc: "Укажите адрес доставки и выберите удобный способ оплаты." },
  { icon: CheckCircle, title: "Подтвердите оплату", desc: "После подтверждения оплаты вы получите email с деталями заказа." },
  { icon: PackageCheck, title: "Получите заказ", desc: "Отслеживайте доставку в личном кабинете и заберите заказ в удобное время." },
];

const HowToOrderPage = () => (
  <InfoPageLayout>
    <PageHero
      title="Как сделать заказ"
      subtitle="Пошаговая инструкция по оформлению покупки на Cheepy"
      breadcrumb={[{ label: "Главная", to: "/" }, { label: "Как сделать заказ" }]}
    />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
      {steps.map((s, i) => {
        const Icon = s.icon;
        return (
          <SectionFadeIn key={i}>
            <div className="bg-card rounded-xl border border-border p-6 h-full hover:border-primary hover:shadow-md hover:shadow-primary/5 transition-all duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                  <Icon size={22} className="text-primary-foreground" />
                </div>
                <span className="text-3xl font-bold text-primary/20">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          </SectionFadeIn>
        );
      })}
    </div>
    <CtaBlock title="Готовы к покупкам?" text="Начните исследовать каталог прямо сейчас" buttonText="Перейти в каталог" buttonTo="/" />
  </InfoPageLayout>
);

export default HowToOrderPage;

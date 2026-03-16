import { InfoPageLayout, PageHero, SectionFadeIn } from "@/components/InfoPageShared";
import { CreditCard, Smartphone, Building2, Wallet, Shield } from "lucide-react";

const methods = [
  { icon: CreditCard, title: "Банковские карты", desc: "Visa, Mastercard, МИР — мгновенное списание" },
  { icon: Smartphone, title: "Онлайн-кошельки", desc: "Apple Pay, Google Pay, Samsung Pay" },
  { icon: Building2, title: "Банковский перевод", desc: "Оплата по реквизитам для юрлиц" },
  { icon: Wallet, title: "Баланс Cheepy", desc: "Оплата накопленным кэшбеком" },
];

const PaymentPage = () => (
  <InfoPageLayout>
    <PageHero
      title="Способы оплаты"
      subtitle="Выберите удобный способ оплаты для ваших покупок"
      breadcrumb={[{ label: "Главная", to: "/" }, { label: "Способы оплаты" }]}
    />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pb-6">
      {methods.map((m, i) => {
        const Icon = m.icon;
        return (
          <SectionFadeIn key={i}>
            <div className="bg-card rounded-xl border border-border p-6 text-center h-full hover:border-primary transition-all duration-300 group">
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon size={24} className="text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{m.title}</h3>
              <p className="text-sm text-muted-foreground">{m.desc}</p>
            </div>
          </SectionFadeIn>
        );
      })}
    </div>
    <SectionFadeIn className="pb-12">
      <div className="rounded-xl bg-secondary p-6 md:p-8 flex items-start gap-4">
        <Shield size={28} className="text-primary flex-shrink-0 mt-1" />
        <div>
          <h3 className="font-semibold text-foreground mb-2">Безопасность платежей</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Все платежи на Cheepy защищены протоколом SSL-шифрования. Мы не храним данные ваших карт.
            При возникновении проблем с оплатой средства автоматически возвращаются в течение 1-3 рабочих дней.
          </p>
        </div>
      </div>
    </SectionFadeIn>
  </InfoPageLayout>
);

export default PaymentPage;

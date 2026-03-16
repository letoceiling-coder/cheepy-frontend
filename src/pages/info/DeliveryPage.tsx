import { InfoPageLayout, PageHero, SectionFadeIn } from "@/components/InfoPageShared";
import { Truck, Zap, MapPin, Clock } from "lucide-react";

const options = [
  { icon: Truck, title: "Стандартная доставка", time: "3-7 дней", price: "от 199 ₽", desc: "Доставка курьером до двери или в пункт выдачи" },
  { icon: Zap, title: "Экспресс-доставка", time: "1-2 дня", price: "от 499 ₽", desc: "Ускоренная доставка для срочных заказов" },
  { icon: MapPin, title: "Пункты выдачи", time: "2-5 дней", price: "от 99 ₽", desc: "Более 15 000 пунктов по всей России" },
];

const regions = [
  { region: "Москва и МО", standard: "2-3 дня", express: "1 день" },
  { region: "Санкт-Петербург", standard: "3-4 дня", express: "1-2 дня" },
  { region: "Центральный ФО", standard: "3-5 дней", express: "2 дня" },
  { region: "Сибирский ФО", standard: "5-7 дней", express: "3-4 дня" },
  { region: "Дальний Восток", standard: "7-10 дней", express: "4-5 дней" },
];

const DeliveryPage = () => (
  <InfoPageLayout>
    <PageHero
      title="Доставка"
      subtitle="Быстрая и надёжная доставка по всей России"
      breadcrumb={[{ label: "Главная", to: "/" }, { label: "Доставка" }]}
    />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pb-8">
      {options.map((o, i) => {
        const Icon = o.icon;
        return (
          <SectionFadeIn key={i}>
            <div className="bg-card rounded-xl border border-border p-6 h-full hover:border-primary transition-all duration-300">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                <Icon size={22} className="text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{o.title}</h3>
              <div className="flex items-center gap-3 text-sm mb-3">
                <span className="flex items-center gap-1 text-muted-foreground"><Clock size={14} /> {o.time}</span>
                <span className="font-medium text-primary">{o.price}</span>
              </div>
              <p className="text-sm text-muted-foreground">{o.desc}</p>
            </div>
          </SectionFadeIn>
        );
      })}
    </div>
    <SectionFadeIn className="pb-8">
      <h2 className="text-xl font-bold text-foreground mb-4">Сроки доставки по регионам</h2>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[500px]">
          <thead><tr className="bg-secondary">
            <th className="text-left p-4 text-sm font-semibold text-foreground">Регион</th>
            <th className="text-left p-4 text-sm font-semibold text-foreground">Стандартная</th>
            <th className="text-left p-4 text-sm font-semibold text-foreground">Экспресс</th>
          </tr></thead>
          <tbody>{regions.map((r, i) => (
            <tr key={i} className="border-t border-border hover:bg-secondary/50 transition-colors">
              <td className="p-4 text-sm font-medium text-foreground">{r.region}</td>
              <td className="p-4 text-sm text-muted-foreground">{r.standard}</td>
              <td className="p-4 text-sm text-muted-foreground">{r.express}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </SectionFadeIn>
    <SectionFadeIn className="pb-12">
      <div className="rounded-xl bg-secondary h-[300px] flex items-center justify-center">
        <div className="text-center">
          <MapPin size={48} className="mx-auto text-primary mb-3" />
          <p className="text-muted-foreground">Карта пунктов выдачи</p>
          <p className="text-sm text-muted-foreground">15 000+ точек по всей России</p>
        </div>
      </div>
    </SectionFadeIn>
  </InfoPageLayout>
);

export default DeliveryPage;

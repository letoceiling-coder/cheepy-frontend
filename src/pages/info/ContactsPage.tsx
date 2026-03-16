import { useState } from "react";
import { InfoPageLayout, PageHero, SectionFadeIn } from "@/components/InfoPageShared";
import { MapPin, Phone, Mail, Send, Check } from "lucide-react";

const ContactsPage = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <InfoPageLayout>
      <PageHero
        title="Контакты"
        subtitle="Свяжитесь с нами любым удобным способом"
        breadcrumb={[{ label: "Главная", to: "/" }, { label: "Контакты" }]}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pb-8">
        {[
          { icon: Phone, title: "Телефон", text: "8 (800) 123-45-67", sub: "Ежедневно с 9:00 до 21:00" },
          { icon: Mail, title: "Email", text: "info@cheepy.ru", sub: "Ответим в течение 24 часов" },
          { icon: MapPin, title: "Адрес", text: "Москва, Россия", sub: "ул. Примерная, д. 1" },
        ].map((c, i) => {
          const Icon = c.icon;
          return (
            <SectionFadeIn key={i}>
              <div className="bg-card rounded-xl border border-border p-6 text-center h-full">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon size={22} className="text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{c.title}</h3>
                <p className="text-sm font-medium text-foreground">{c.text}</p>
                <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
              </div>
            </SectionFadeIn>
          );
        })}
      </div>
      <SectionFadeIn className="pb-8">
        <div className="bg-card rounded-xl border border-border p-6 md:p-8">
          <h2 className="text-xl font-bold text-foreground mb-6">Написать нам</h2>
          {!submitted ? (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="Имя" required className="h-12 px-4 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors" />
              <input type="email" placeholder="Email" required className="h-12 px-4 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors" />
              <textarea placeholder="Сообщение" required rows={4} className="md:col-span-2 px-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors resize-none" />
              <button type="submit" className="md:col-span-2 h-12 rounded-lg gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity w-full md:w-auto md:px-8 md:justify-self-start">
                <Send size={16} /> Отправить
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2 text-primary font-medium py-4">
              <Check size={20} /> Сообщение отправлено! Мы свяжемся с вами в ближайшее время.
            </div>
          )}
        </div>
      </SectionFadeIn>
      <SectionFadeIn className="pb-12">
        <div className="rounded-xl bg-secondary h-[300px] flex items-center justify-center">
          <div className="text-center">
            <MapPin size={48} className="mx-auto text-primary mb-3" />
            <p className="text-muted-foreground font-medium">Москва, Россия</p>
          </div>
        </div>
      </SectionFadeIn>
    </InfoPageLayout>
  );
};

export default ContactsPage;

import { MapPin, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const columns = [
    {
      title: "Покупателям",
      links: [
        { label: "Как сделать заказ", to: "/how-to-order" },
        { label: "Способы оплаты", to: "/payment" },
        { label: "Доставка", to: "/delivery" },
        { label: "Возврат товара", to: "/returns" },
        { label: "Вопросы и ответы", to: "/faq" },
      ],
    },
    {
      title: "Продавцам",
      links: [
        { label: "Как начать продавать", to: "/sell" },
        { label: "Правила площадки", to: "/rules" },
        { label: "Комиссия", to: "/commission" },
        { label: "Помощь продавцам", to: "/seller-help" },
      ],
    },
    {
      title: "Компания",
      links: [
        { label: "О нас", to: "/about" },
        { label: "Контакты", to: "/contacts" },
        { label: "Вакансии", to: "/careers" },
        { label: "Блог", to: "/blog" },
      ],
    },
  ];

  return (
    <footer className="bg-secondary border-t border-border">
      <div className="max-w-[1400px] mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-extrabold text-foreground mb-3">Cheepy</h3>
            <p className="text-sm text-muted-foreground mb-4">Маркетплейс модной одежды и аксессуаров</p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>Москва, Россия</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0" />
                <span>8 (800) 123-45-67</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" />
                <span>info@cheepy.ru</span>
              </div>
            </div>
          </div>

          {columns.map(col => (
            <div key={col.title}>
              <h4 className="font-semibold text-foreground mb-3">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map(link => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-muted-foreground hover:text-primary transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© 2025 Cheepy. Все права защищены.</p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Политика конфиденциальности</a>
            <a href="#" className="hover:text-primary transition-colors">Пользовательское соглашение</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

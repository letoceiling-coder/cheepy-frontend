import { Star } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const sellers = [
  { name: "Fashion Hub", price: "от 1 290 ₽", rating: 4.9, delivery: "1-2 дня", reviews: 1245 },
  { name: "SportStyle", price: "от 2 490 ₽", rating: 4.8, delivery: "2-3 дня", reviews: 890 },
  { name: "Glamour Shop", price: "от 1 990 ₽", rating: 4.7, delivery: "1-3 дня", reviews: 678 },
  { name: "UrbanBag", price: "от 990 ₽", rating: 4.6, delivery: "2-4 дня", reviews: 456 },
  { name: "DenimPro", price: "от 1 590 ₽", rating: 4.8, delivery: "1-2 дня", reviews: 567 },
];

const SellerComparison = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <h2 className="text-2xl font-bold text-foreground mb-2">Сравнение продавцов</h2>
      <p className="text-muted-foreground text-sm mb-8">Выберите лучшего продавца для вас</p>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="bg-secondary">
              <th className="text-left p-4 text-sm font-semibold text-foreground">Продавец</th>
              <th className="text-left p-4 text-sm font-semibold text-foreground">Цены</th>
              <th className="text-left p-4 text-sm font-semibold text-foreground">Рейтинг</th>
              <th className="text-left p-4 text-sm font-semibold text-foreground">Доставка</th>
              <th className="text-left p-4 text-sm font-semibold text-foreground">Отзывы</th>
            </tr>
          </thead>
          <tbody>
            {sellers.map((s, i) => (
              <tr key={i} className="border-t border-border hover:bg-secondary/50 transition-colors cursor-pointer">
                <td className="p-4 font-medium text-foreground text-sm">{s.name}</td>
                <td className="p-4 text-sm text-muted-foreground">{s.price}</td>
                <td className="p-4">
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                    <span className="text-sm font-medium text-foreground">{s.rating}</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-muted-foreground">{s.delivery}</td>
                <td className="p-4 text-sm text-muted-foreground">{s.reviews}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default SellerComparison;

import { useState } from "react";
import { Star, Check, X as XIcon } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { mockProducts } from "@/data/mock-data";

const ProductComparison = () => {
  const { ref, isVisible } = useScrollAnimation();
  const products = mockProducts.slice(0, 3);

  const features = [
    { label: "Материал", key: "material" as const },
    { label: "Бренд", key: "brand" as const },
  ];

  return (
    <section ref={ref} className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <h2 className="text-2xl font-bold text-foreground mb-2">Сравнение товаров</h2>
      <p className="text-muted-foreground text-sm mb-6">Выберите лучший вариант для вас</p>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="bg-secondary">
              <th className="p-4 text-left text-sm font-semibold text-foreground w-[140px]">Параметр</th>
              {products.map((p) => (
                <th key={p.id} className="p-4 text-center">
                  <img src={p.images[0]} alt={p.name} className="w-16 h-16 rounded-lg object-cover mx-auto mb-2" />
                  <p className="text-xs font-medium text-foreground truncate max-w-[140px] mx-auto">{p.name}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border">
              <td className="p-4 text-sm font-medium text-foreground">Цена</td>
              {products.map((p) => (
                <td key={p.id} className="p-4 text-center text-sm font-bold text-foreground">{p.price.toLocaleString()} ₽</td>
              ))}
            </tr>
            <tr className="border-t border-border hover:bg-secondary/50 transition-colors">
              <td className="p-4 text-sm font-medium text-foreground">Рейтинг</td>
              {products.map((p) => (
                <td key={p.id} className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                    <span className="text-sm font-medium text-foreground">{p.rating}</span>
                  </div>
                </td>
              ))}
            </tr>
            {features.map((f) => (
              <tr key={f.key} className="border-t border-border hover:bg-secondary/50 transition-colors">
                <td className="p-4 text-sm font-medium text-foreground">{f.label}</td>
                {products.map((p) => (
                  <td key={p.id} className="p-4 text-center text-sm text-muted-foreground">{p[f.key]}</td>
                ))}
              </tr>
            ))}
            <tr className="border-t border-border hover:bg-secondary/50 transition-colors">
              <td className="p-4 text-sm font-medium text-foreground">Скидка</td>
              {products.map((p) => (
                <td key={p.id} className="p-4 text-center">
                  {p.oldPrice ? (
                    <span className="inline-flex items-center gap-1 text-primary text-sm"><Check size={14} /> Да</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-muted-foreground text-sm"><XIcon size={14} /> Нет</span>
                  )}
                </td>
              ))}
            </tr>
            <tr className="border-t border-border">
              <td className="p-4" />
              {products.map((p) => (
                <td key={p.id} className="p-4 text-center">
                  <button className="h-9 px-5 rounded-lg gradient-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity">В корзину</button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ProductComparison;

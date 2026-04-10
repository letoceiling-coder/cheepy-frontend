import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReviewModal from "@/components/ReviewModal";
import { mockProducts } from "@/data/mock-data";
import { useAuth } from "@/contexts/AuthContext";

const mockReviews = [
  { id: 1, author: "Мария", date: "2024-12-10", rating: 5, text: "Отличная вещь! Соответствует описанию.", pros: "Качественная ткань, красивый цвет", cons: "Нет" },
  { id: 2, author: "Дмитрий", date: "2024-12-05", rating: 4, text: "Хорошее качество за свою цену.", pros: "Удобная, хорошо сидит", cons: "Немного отличается от фото" },
  { id: 3, author: "Анна", date: "2024-11-28", rating: 5, text: "Заказываю второй раз. Рекомендую!", pros: "Быстрая доставка, качество", cons: "Нет" },
];

export default function ProductDetailTabsSection() {
  const { id } = useParams();
  const product = mockProducts.find((p) => p.id === Number(id)) || mockProducts[0];
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"about" | "reviews" | "delivery">("about");
  const [showReviewModal, setShowReviewModal] = useState(false);

  return (
    <>
      <div>
        <div className="border-b border-border mb-6">
          <div className="flex gap-0">
            {[
              { key: "about" as const, label: "О товаре" },
              { key: "reviews" as const, label: `Отзывы (${mockReviews.length})` },
              { key: "delivery" as const, label: "Доставка" },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "about" && (
          <div className="max-w-3xl mb-10">
            <p className="text-foreground mb-4">{product.description}</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Бренд", value: product.brand },
                { label: "Материал", value: product.material },
                { label: "Категория", value: product.category },
                { label: "Артикул", value: `CP-${product.id.toString().padStart(6, "0")}` },
              ].map((r) => (
                <div key={r.label} className="flex justify-between py-2 border-b border-border text-sm">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className="text-foreground font-medium">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="max-w-3xl mb-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground">Отзывы покупателей</h3>
              {isAuthenticated ? (
                <Button onClick={() => setShowReviewModal(true)} variant="outline" className="rounded-lg text-sm">
                  Написать отзыв
                </Button>
              ) : (
                <Link to="/auth" className="text-sm text-primary hover:underline">
                  Войдите, чтобы оставить отзыв
                </Link>
              )}
            </div>
            <div className="space-y-4">
              {mockReviews.map((r) => (
                <div key={r.id} className="p-4 rounded-xl border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground text-sm">{r.author}</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-3 h-3 ${s <= r.rating ? "fill-yellow-500 text-yellow-500" : "text-border"}`} />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{r.date}</span>
                  </div>
                  <p className="text-sm text-foreground mb-2">{r.text}</p>
                  {r.pros && (
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600 font-medium">Достоинства:</span> {r.pros}
                    </p>
                  )}
                  {r.cons && r.cons !== "Нет" && (
                    <p className="text-xs text-muted-foreground">
                      <span className="text-destructive font-medium">Недостатки:</span> {r.cons}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "delivery" && (
          <div className="max-w-3xl mb-10 space-y-4">
            <div className="p-4 rounded-xl border border-border">
              <h4 className="font-semibold text-foreground mb-2">Доставка курьером</h4>
              <p className="text-sm text-muted-foreground">от 1-3 дней, бесплатно при заказе от 3000 ₽</p>
            </div>
            <div className="p-4 rounded-xl border border-border">
              <h4 className="font-semibold text-foreground mb-2">Самовывоз из ПВЗ</h4>
              <p className="text-sm text-muted-foreground">от 2-5 дней, бесплатно</p>
            </div>
            <div className="p-4 rounded-xl border border-border">
              <h4 className="font-semibold text-foreground mb-2">Возврат</h4>
              <p className="text-sm text-muted-foreground">В течение 14 дней после получения</p>
            </div>
          </div>
        )}
      </div>

      {showReviewModal && <ReviewModal onClose={() => setShowReviewModal(false)} productName={product.name} />}
    </>
  );
}

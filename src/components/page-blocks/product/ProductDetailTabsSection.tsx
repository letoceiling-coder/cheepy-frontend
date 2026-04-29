import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ReviewModal from "@/components/ReviewModal";
import { useAuth } from "@/contexts/AuthContext";
import { usePublicProduct } from "@/hooks/usePublicProduct";

export default function ProductDetailTabsSection() {
  const { id } = useParams();
  const { data, isLoading } = usePublicProduct(id);
  const product = data?.product;
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"about" | "reviews" | "delivery">("about");
  const [showReviewModal, setShowReviewModal] = useState(false);

  if (isLoading) {
    return <div className="mb-10 h-48 bg-muted animate-pulse rounded-xl" />;
  }

  if (!product) {
    return null;
  }

  const rows: { label: string; value: string }[] = [];
  if (product.brand?.name) rows.push({ label: "Бренд", value: product.brand.name });
  const mat = product.attributes?.find((a) => /материал/i.test(a.name));
  if (mat?.value) rows.push({ label: "Материал", value: mat.value });
  if (product.category?.name) rows.push({ label: "Категория", value: product.category.name });
  rows.push({ label: "Артикул", value: product.external_id ? String(product.external_id) : `ID-${product.id}` });
  if (product.characteristics) {
    Object.entries(product.characteristics).forEach(([k, v]) => {
      if (v && String(v).trim()) rows.push({ label: k, value: String(v) });
    });
  }

  return (
    <>
      <div>
        <div className="border-b border-border mb-6">
          <div className="flex gap-0 flex-wrap">
            {[
              { key: "about" as const, label: "О товаре" },
              { key: "reviews" as const, label: "Отзывы" },
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
            {product.description ? (
              <p className="text-foreground mb-4 whitespace-pre-wrap">{product.description}</p>
            ) : (
              <p className="text-muted-foreground text-sm mb-4">Описание уточняется у продавца.</p>
            )}
            {rows.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rows.map((r) => (
                  <div key={r.label + r.value} className="flex justify-between gap-4 py-2 border-b border-border text-sm">
                    <span className="text-muted-foreground shrink-0">{r.label}</span>
                    <span className="text-foreground font-medium text-right break-words">{r.value}</span>
                  </div>
                ))}
              </div>
            ) : null}
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
            <p className="text-sm text-muted-foreground">Отзывы появятся после накопления оценок на площадке.</p>
          </div>
        )}

        {activeTab === "delivery" && (
          <div className="max-w-3xl mb-10 space-y-4">
            <div className="p-4 rounded-xl border border-border">
              <h4 className="font-semibold text-foreground mb-2">Доставка</h4>
              <p className="text-sm text-muted-foreground">
                Условия и сроки доставки уточняются при оформлении заказа и зависят от продавца и региона.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-border">
              <h4 className="font-semibold text-foreground mb-2">Возврат</h4>
              <p className="text-sm text-muted-foreground">Возврат оформляется по правилам маркетплейса и договору с продавцом.</p>
            </div>
          </div>
        )}
      </div>

      {showReviewModal ? <ReviewModal onClose={() => setShowReviewModal(false)} productName={product.title} /> : null}
    </>
  );
}

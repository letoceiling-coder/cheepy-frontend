import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReviewModal from "@/components/ReviewModal";
import DeliveryQuoteEntry from "@/components/page-blocks/product/DeliveryQuoteEntry";
import { useAuth } from "@/contexts/AuthContext";
import { usePublicProduct } from "@/hooks/usePublicProduct";
import { useProductDeliveryQuote } from "@/hooks/useProductDeliveryQuote";

export default function ProductDetailTabsSection(props: { quantity?: number } = {}) {
  const quantity = props.quantity ?? 1;
  const { id } = useParams();
  const { data, isLoading } = usePublicProduct(id);
  const product = data?.product;
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"about" | "reviews" | "delivery">("about");
  const [showReviewModal, setShowReviewModal] = useState(false);

  const { deliveryQuoteEnabled, deliveryQuote, deliveryQuoteLoading } = useProductDeliveryQuote(
    id,
    product?.id,
    quantity,
  );

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
            <div className="p-4 rounded-xl border border-border space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Truck className="w-5 h-5 text-primary shrink-0" aria-hidden />
                <h4 className="font-semibold text-foreground">Доставка</h4>
              </div>

              {deliveryQuoteLoading && deliveryQuoteEnabled ? (
                <div className="flex items-start gap-2 rounded-lg bg-muted/60 p-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0 mt-0.5" aria-hidden />
                  <p className="text-sm text-muted-foreground leading-snug">
                    Считаем ориентировочную доставку до адреса из личного кабинета…
                  </p>
                </div>
              ) : null}

              {!deliveryQuoteLoading && deliveryQuoteEnabled && deliveryQuote?.quotes?.length ? (
                <div className="rounded-lg bg-muted/40 border border-border/60 p-4 space-y-4">
                  <p className="text-sm font-medium text-foreground">Ориентировочно по вашему адресу</p>
                  <div className="flex flex-col gap-4 min-w-0">
                    {deliveryQuote.quotes.map((q) => (
                      <DeliveryQuoteEntry
                        key={`tab-${q.integration}-${q.service_code}-${q.date_from}-${q.date_to}-${q.service_name}`}
                        q={q}
                        variant="comfortable"
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug text-balance border-t border-border/60 pt-3">
                    Цены для количества «{quantity} шт.», как в блоке покупки над вкладками. Итог при оформлении заказа может
                    отличаться.
                  </p>
                </div>
              ) : null}

              {!deliveryQuoteLoading && deliveryQuoteEnabled && deliveryQuote?.warnings?.length ? (
                <p className="text-sm text-amber-700 dark:text-amber-400 leading-snug text-balance">
                  {deliveryQuote.warnings.join(" ")}
                </p>
              ) : null}

              {!deliveryQuoteLoading && deliveryQuoteEnabled && deliveryQuote?.needs_address ? (
                <p className="text-sm text-muted-foreground leading-snug text-balance">
                  Чтобы увидеть ориентировочную стоимость доставки, задайте адрес в разделе{" "}
                  <Link to="/account#delivery-addresses" className="text-primary hover:underline font-medium">
                    «Адреса доставки»
                  </Link>{" "}
                  — для расчёта используется адрес по умолчанию.
                </p>
              ) : null}

              {!deliveryQuoteLoading && deliveryQuoteEnabled && !deliveryQuote?.quotes?.length && !deliveryQuote?.needs_address ? (
                <p className="text-sm text-muted-foreground leading-snug">
                  Точный расчёт доставки недоступен сейчас — уточняйте условия при оформлении или в чате с продавцом.
                </p>
              ) : null}

              {!deliveryQuoteEnabled ? (
                <p className="text-sm text-muted-foreground leading-snug">
                  Войдите в аккаунт магазина, чтобы при необходимости увидеть расчёт доставки по сохранённому адресу в
                  карточке товара сверху и здесь.
                </p>
              ) : null}

              <p className="text-sm text-muted-foreground leading-snug text-balance pt-1 border-t border-border">
                Условия и сроки доставки при оформлении заказа зависят от продавца, региона и выбранной службы.
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

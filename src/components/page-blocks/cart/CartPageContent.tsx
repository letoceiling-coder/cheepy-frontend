import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Trash2, Heart, Loader2, Minus, Plus, ShoppingCart, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { ApiError, storeCartDeliveryQuoteApi, storeCheckoutApi, type StorefrontCartDeliveryQuoteResponse } from "@/lib/api";

const FREE_DELIVERY_THRESHOLD_RUB = 3000;

const FALLBACK_DELIVERY_RUB = 299;

/** Стабильный ключ корзины для запроса расчёта доставки. */
function cartItemsRequestKey(lines: { product: { id: string | number }; quantity: number }[]): string {
  return [...lines]
    .map((l) => `${String(l.product.id)}:${l.quantity}`)
    .sort()
    .join("|");
}

export default function CartPageContent() {
  const { items, removeFromCart, updateQuantity, updateColor, updateSize, getLinePricing, totalPrice, totalDiscount } =
    useCart();
  const { isAuthenticated } = useAuth();
  const { toggleFavorite } = useFavorites();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [cartQuote, setCartQuote] = useState<StorefrontCartDeliveryQuoteResponse | null>(null);
  const [deliveryQuoteLoading, setDeliveryQuoteLoading] = useState(false);

  const cartKey = useMemo(() => cartItemsRequestKey(items), [items]);

  useEffect(() => {
    if (!isAuthenticated || items.length === 0) {
      setCartQuote(null);
      setDeliveryQuoteLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setDeliveryQuoteLoading(true);
      storeCartDeliveryQuoteApi
        .create({
          items: items.map((i) => ({
            product_id: String(i.product.id),
            quantity: i.quantity,
          })),
        })
        .then((res) => {
          if (!cancelled) setCartQuote(res);
        })
        .catch(() => {
          if (!cancelled) setCartQuote(null);
        })
        .finally(() => {
          if (!cancelled) setDeliveryQuoteLoading(false);
        });
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isAuthenticated, cartKey]);

  const grossGoods = totalPrice + totalDiscount;

  /** Бесплатно от порога только при сохранённом адресе (котировка пришла с needs_address: false). */
  const thresholdFreeActive =
    isAuthenticated &&
    cartQuote != null &&
    !deliveryQuoteLoading &&
    !cartQuote.needs_address &&
    totalPrice >= FREE_DELIVERY_THRESHOLD_RUB;

  let resolvedDeliveryRub: number | undefined;
  if (!isAuthenticated || deliveryQuoteLoading || cartQuote === null || cartQuote.needs_address) {
    resolvedDeliveryRub = undefined;
  } else if (thresholdFreeActive) {
    resolvedDeliveryRub = 0;
  } else if (cartQuote.cheapest_price_rub != null) {
    resolvedDeliveryRub = Math.max(0, Math.round(Number(cartQuote.cheapest_price_rub)));
  } else if (cartQuote.quotes.length === 0) {
    resolvedDeliveryRub = FALLBACK_DELIVERY_RUB;
  }

  const finalTotal =
    !isAuthenticated
      ? totalPrice
      : thresholdFreeActive
        ? totalPrice
        : typeof resolvedDeliveryRub === "number"
          ? totalPrice + resolvedDeliveryRub
          : totalPrice;

  const handleCheckout = useCallback(async () => {
    if (items.length === 0 || checkoutLoading) return;
    setCheckoutError(null);
    setCheckoutLoading(true);
    try {
      const res = await storeCheckoutApi.create({
        items: items.map((i) => ({
          product_id: String(i.product.id),
          quantity: i.quantity,
          color: i.color,
          size: i.size,
        })),
      });
      if (res.checkout_url) {
        window.location.href = res.checkout_url;
        return;
      }
      setCheckoutError("Не удалось получить ссылку на оплату.");
    } catch (err) {
      setCheckoutError(err instanceof ApiError ? err.message : "Не удалось оформить заказ.");
    } finally {
      setCheckoutLoading(false);
    }
  }, [checkoutLoading, items]);

  return (
    <>
      <h1 className="text-2xl font-bold text-foreground mb-6">
        Корзина{" "}
        {items.length > 0 && (
          <span className="text-muted-foreground font-normal text-lg">
            ({items.reduce((s, i) => s + i.quantity, 0)} товаров)
          </span>
        )}
      </h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingCart className="w-16 h-16 text-border mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Корзина пуста</h2>
          <p className="text-sm text-muted-foreground mb-6">Добавьте товары, чтобы оформить заказ</p>
          <Link to="/">
            <Button className="gradient-primary text-primary-foreground rounded-lg">На главную</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-4">
            {items.map((item) => {
              const pricing = getLinePricing(item);
              return (
                <div key={item.lineId} className="flex gap-4 p-4 rounded-2xl border border-border">
                  <Link to={`/product/${item.product.id}`} className="shrink-0">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-24 h-32 md:w-28 md:h-36 rounded-xl object-cover"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${item.product.id}`}
                      className="text-sm font-medium text-foreground line-clamp-2 hover:text-primary transition-colors mb-1 block"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-xs text-muted-foreground mb-2">{item.product.seller}</p>

                    {item.promotions.length > 0 ? (
                      <div className={`mb-2 inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${
                        pricing.promotionActive ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                      }`}>
                        {pricing.appliedPromotion
                          ? `${pricing.appliedPromotion.label ?? pricing.appliedPromotion.title}${pricing.appliedPromotion.discountPercent ? ` -${pricing.appliedPromotion.discountPercent}%` : ""}`
                          : "Промо истекло, цена пересчитана"}
                      </div>
                    ) : null}

                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-xs text-muted-foreground">Цвет:</span>
                      <div className="flex gap-1">
                        {item.product.colors.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => updateColor(item.lineId, c)}
                            className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                              item.color === c ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground"
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mb-3">
                      <span className="text-xs text-muted-foreground">Размер:</span>
                      <div className="flex gap-1">
                        {item.product.sizes.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => updateSize(item.lineId, s)}
                            className={`w-8 h-6 rounded text-xs border transition-colors ${
                              item.size === s ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {item.selectedAttributes.length > 0 ? (
                      <div className="mb-3 flex flex-wrap gap-1.5">
                        {item.selectedAttributes.slice(0, 6).map((attr) => (
                          <span key={`${attr.name}-${attr.value}`} className="rounded bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                            {attr.name}: <span className="text-foreground">{attr.value}</span>
                          </span>
                        ))}
                        {item.selectedAttributes.length > 6 ? (
                          <span className="rounded bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                            +{item.selectedAttributes.length - 6} атр.
                          </span>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-secondary"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-secondary"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-bold text-foreground">
                          {pricing.lineTotal.toLocaleString()} ₽
                        </span>
                        {pricing.discountTotal > 0 && (
                          <span className="text-xs text-muted-foreground line-through ml-2">
                            {pricing.lineOriginalTotal.toLocaleString()} ₽
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        toggleFavorite(item.product);
                      }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.lineId)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:w-[360px] shrink-0">
            <div className="sticky top-[180px] p-5 rounded-2xl border border-border space-y-4">
              <h3 className="text-lg font-bold text-foreground">Итого</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Товары ({items.reduce((s, i) => s + i.quantity, 0)})</span>
                  <span className="text-foreground">{grossGoods.toLocaleString()} ₽</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Скидка</span>
                    <span className="text-green-600">-{totalDiscount.toLocaleString()} ₽</span>
                  </div>
                )}
                {!isAuthenticated ? (
                  <p className="text-xs text-muted-foreground leading-snug pt-1">
                    <Link to="/auth" className="text-primary font-semibold hover:underline">
                      Укажите адрес доставки
                    </Link>
                    : войдите в аккаунт — рассчитаем доставку по вашему адресу и покажем сумму к оплате.
                  </p>
                ) : (
                  <div className="flex justify-between items-start gap-3 pt-0.5">
                    <span className="text-muted-foreground shrink-0">Доставка</span>
                    <span className="text-right text-foreground min-h-[1.25rem]">
                      {deliveryQuoteLoading ? (
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                          Считаем…
                        </span>
                      ) : cartQuote?.needs_address ? (
                        <span className="text-xs text-muted-foreground">
                          <Link to="/account#delivery-addresses" className="text-primary font-medium hover:underline">
                            Укажите адрес
                          </Link>
                        </span>
                      ) : thresholdFreeActive ? (
                        <span className="text-green-600">Бесплатно</span>
                      ) : typeof resolvedDeliveryRub === "number" ? (
                        resolvedDeliveryRub === 0 ? (
                          <span className="text-green-600">Бесплатно</span>
                        ) : (
                          `${resolvedDeliveryRub.toLocaleString()} ₽`
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {isAuthenticated &&
                !thresholdFreeActive &&
                cartQuote &&
                !cartQuote.needs_address &&
                typeof resolvedDeliveryRub === "number" &&
                resolvedDeliveryRub > 0 &&
                cartQuote.cheapest_quote?.summary_line_ru && (
                  <p className="text-[11px] text-muted-foreground leading-snug">{cartQuote.cheapest_quote.summary_line_ru}</p>
                )}

              {isAuthenticated && totalPrice < FREE_DELIVERY_THRESHOLD_RUB && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 text-sm">
                  <Truck className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">
                    До бесплатной доставки ещё{" "}
                    <span className="text-primary font-medium">
                      {(FREE_DELIVERY_THRESHOLD_RUB - totalPrice).toLocaleString()} ₽
                    </span>
                  </span>
                </div>
              )}

              {!isAuthenticated && (
                <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 px-3 py-2.5 text-center text-xs text-muted-foreground">
                  Стоимость доставки появится после входа и сохранённого адреса.
                </div>
              )}

              <div className="border-t border-border pt-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-bold text-foreground">К оплате</span>
                  <span className="text-xl font-bold text-foreground">{finalTotal.toLocaleString()} ₽</span>
                </div>
              </div>

              {isAuthenticated ? (
                <div className="space-y-2">
                  {checkoutError ? (
                    <p className="text-xs text-destructive text-center">{checkoutError}</p>
                  ) : null}
                  <Button
                    type="button"
                    className="w-full gradient-primary text-primary-foreground rounded-xl py-3 h-auto text-sm font-semibold inline-flex items-center justify-center gap-2"
                    disabled={
                      checkoutLoading ||
                      (Boolean(isAuthenticated && cartQuote?.needs_address))
                    }
                    onClick={handleCheckout}
                  >
                    {checkoutLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        Переход к оплате…
                      </>
                    ) : (
                      "Оформить заказ"
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground text-center">Для оформления заказа необходимо войти</p>
                  <Link to="/auth" className="block">
                    <Button className="w-full gradient-primary text-primary-foreground rounded-xl py-3 h-auto text-sm font-semibold">
                      Войти и оформить
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

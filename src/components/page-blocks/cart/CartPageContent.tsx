import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Ticket, Trash2, Heart, Loader2, Minus, Plus, ShoppingCart, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import {
  ApiError,
  publicApi,
  storeCartDeliveryQuoteApi,
  storeCheckoutApi,
  storeOrderPreviewApi,
  type StoreOrderPreviewResponse,
  type StorefrontCartDeliveryQuoteResponse,
} from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { filterRedundantVariantAttributes } from "@/lib/cartDisplayAttributes";

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
  const { data: publicMx } = useQuery({
    queryKey: ["public-marketplace-settings"],
    queryFn: () => publicApi.marketplaceSettings(),
    staleTime: 60_000,
  });
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [cartQuote, setCartQuote] = useState<StorefrontCartDeliveryQuoteResponse | null>(null);
  const [deliveryQuoteLoading, setDeliveryQuoteLoading] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [orderPreview, setOrderPreview] = useState<StoreOrderPreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const cartKey = useMemo(() => cartItemsRequestKey(items), [items]);

  const mapCheckoutItems = useCallback(
    () =>
      items.map((i) => ({
        product_id: String(i.product.id),
        quantity: i.quantity,
        ...(i.color ? { color: i.color } : {}),
        ...(i.size ? { size: i.size } : {}),
      })),
    [items],
  );

  useEffect(() => {
    if (!appliedCoupon) {
      setOrderPreview(null);
    }
  }, [appliedCoupon]);

  useEffect(() => {
    if (!isAuthenticated || items.length === 0) {
      setAppliedCoupon(null);
      setOrderPreview(null);
      setCouponInput("");
      setCouponError(null);
    }
  }, [isAuthenticated, items.length]);

  useEffect(() => {
    if (!isAuthenticated || !appliedCoupon || items.length === 0) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setPreviewLoading(true);
      storeOrderPreviewApi
        .create({ items: mapCheckoutItems(), coupon_code: appliedCoupon })
        .then((res) => {
          if (!cancelled) {
            setOrderPreview(res);
            setCouponError(null);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setOrderPreview(null);
            setAppliedCoupon(null);
            setCouponError(err instanceof ApiError ? err.message : "Промокод недоступен для этой корзины");
          }
        })
        .finally(() => {
          if (!cancelled) setPreviewLoading(false);
        });
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isAuthenticated, appliedCoupon, cartKey, mapCheckoutItems, items.length]);

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

  const freeDeliveryEnabled =
    cartQuote?.free_delivery_threshold_enabled ?? publicMx?.data?.free_delivery_threshold_enabled ?? false;
  const effectiveThresholdRubRaw =
    cartQuote?.free_delivery_threshold_rub ?? publicMx?.data?.free_delivery_threshold_rub ?? null;
  const effectiveThresholdRub =
    freeDeliveryEnabled && effectiveThresholdRubRaw != null && effectiveThresholdRubRaw >= 1
      ? effectiveThresholdRubRaw
      : null;

  const grossGoods = totalPrice + totalDiscount;

  const serverTotalsMode = Boolean(isAuthenticated && appliedCoupon && orderPreview);

  /** Бесплатно от порога только при включённой настройке CRM, сохранённом адресе и сумме ≥ порога. */
  const thresholdFreeActive =
    !serverTotalsMode &&
    isAuthenticated &&
    cartQuote != null &&
    !deliveryQuoteLoading &&
    !cartQuote.needs_address &&
    effectiveThresholdRub != null &&
    totalPrice >= effectiveThresholdRub;

  let resolvedDeliveryRub: number | undefined;
  if (serverTotalsMode && orderPreview) {
    resolvedDeliveryRub = orderPreview.delivery_amount;
  } else if (!isAuthenticated || deliveryQuoteLoading || cartQuote === null || cartQuote.needs_address) {
    resolvedDeliveryRub = undefined;
  } else if (thresholdFreeActive) {
    resolvedDeliveryRub = 0;
  } else if (cartQuote.cheapest_price_rub != null) {
    resolvedDeliveryRub = Math.max(0, Math.round(Number(cartQuote.cheapest_price_rub)));
  } else if (cartQuote.quotes.length === 0) {
    resolvedDeliveryRub = FALLBACK_DELIVERY_RUB;
  }

  const thresholdBannerGapRub =
    effectiveThresholdRub != null
      ? serverTotalsMode && orderPreview
        ? Math.max(0, effectiveThresholdRub - orderPreview.subtotal_after_coupon_rub)
        : Math.max(0, effectiveThresholdRub - totalPrice)
      : null;

  const finalTotal =
    !isAuthenticated
      ? totalPrice
      : serverTotalsMode && orderPreview
        ? orderPreview.total_amount
        : thresholdFreeActive
          ? totalPrice
          : typeof resolvedDeliveryRub === "number"
            ? totalPrice + resolvedDeliveryRub
            : totalPrice;

  const handleApplyCoupon = useCallback(async () => {
    if (!isAuthenticated || items.length === 0 || previewLoading) return;
    const raw = couponInput.trim().toUpperCase();
    if (!raw) {
      setCouponError(null);
      return;
    }
    setCouponError(null);
    setPreviewLoading(true);
    try {
      const res = await storeOrderPreviewApi.create({ items: mapCheckoutItems(), coupon_code: raw });
      if (!res.coupon_applied) {
        setAppliedCoupon(null);
        setOrderPreview(null);
        setCouponError("Промокод не применился");
        return;
      }
      setAppliedCoupon(res.coupon?.code ?? raw);
      setOrderPreview(res);
      setCouponInput(res.coupon?.code ?? raw);
    } catch (err) {
      setAppliedCoupon(null);
      setOrderPreview(null);
      setCouponError(err instanceof ApiError ? err.message : "Не удалось применить промокод");
    } finally {
      setPreviewLoading(false);
    }
  }, [couponInput, isAuthenticated, items.length, mapCheckoutItems, previewLoading]);

  const handleClearCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setOrderPreview(null);
    setCouponInput("");
    setCouponError(null);
  }, []);

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
        coupon_code: appliedCoupon ?? undefined,
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
  }, [appliedCoupon, checkoutLoading, items]);

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
              const displayAttrs = filterRedundantVariantAttributes(item.selectedAttributes);
              const linePrice = `${pricing.lineTotal.toLocaleString("ru-RU")}\u00A0₽`;
              const lineOriginal =
                pricing.discountTotal > 0
                  ? `${pricing.lineOriginalTotal.toLocaleString("ru-RU")}\u00A0₽`
                  : null;
              return (
                <div
                  key={item.lineId}
                  className="grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-3 p-4 rounded-2xl border border-border md:gap-x-4"
                >
                  <Link
                    to={`/product/${item.product.id}`}
                    className="row-start-1 col-start-1 shrink-0 self-start"
                  >
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-24 h-32 md:w-28 md:h-36 rounded-xl object-cover"
                    />
                  </Link>
                  <div className="row-start-1 col-start-2 min-w-0 self-start">
                    <Link
                      to={`/product/${item.product.id}`}
                      className="text-sm font-medium text-foreground line-clamp-2 hover:text-primary transition-colors mb-1 block"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-xs text-muted-foreground mb-2">{item.product.seller}</p>

                    {item.promotions.length > 0 ? (
                      <div className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${
                        pricing.promotionActive ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                      }`}>
                        {pricing.appliedPromotion
                          ? `${pricing.appliedPromotion.label ?? pricing.appliedPromotion.title}${pricing.appliedPromotion.discountPercent ? ` -${pricing.appliedPromotion.discountPercent}%` : ""}`
                          : "Промо истекло, цена пересчитана"}
                      </div>
                    ) : null}
                  </div>

                  <div className="row-start-1 col-start-3 flex flex-col gap-1 shrink-0 self-start">
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

                  <div className="row-start-2 col-span-3 min-w-0 space-y-2 md:col-span-1 md:col-start-2 md:row-start-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs text-muted-foreground shrink-0">Цвет:</span>
                        <div className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden no-scrollbar touch-pan-x pb-0.5 -mx-0.5 px-0.5">
                          <div className="flex gap-1 flex-nowrap w-max">
                            {item.product.colors.map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => updateColor(item.lineId, c)}
                                className={`shrink-0 px-2 py-0.5 rounded text-xs border transition-colors ${
                                  item.color === c
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border text-foreground"
                                }`}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs text-muted-foreground shrink-0">Размер:</span>
                        <div className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden no-scrollbar touch-pan-x pb-0.5 -mx-0.5 px-0.5">
                          <div className="flex gap-1 flex-nowrap w-max">
                            {item.product.sizes.map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => updateSize(item.lineId, s)}
                                className={`shrink-0 min-w-8 h-7 px-1 rounded text-xs border transition-colors ${
                                  item.size === s
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border text-foreground"
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {displayAttrs.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {displayAttrs.slice(0, 6).map((attr) => (
                          <span
                            key={`${attr.name}-${attr.value}`}
                            className="rounded bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground"
                          >
                            {attr.name}: <span className="text-foreground">{attr.value}</span>
                          </span>
                        ))}
                        {displayAttrs.length > 6 ? (
                          <span className="rounded bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                            +{displayAttrs.length - 6} атр.
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <div className="row-start-3 col-span-3 flex flex-col gap-2 pt-0.5 min-w-0 md:col-span-1 md:col-start-2 md:row-start-3 md:flex-row md:items-center md:justify-between md:gap-3 md:pt-0">
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-secondary"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium w-6 text-center tabular-nums">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-secondary"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="hidden min-w-0 text-right md:block">
                      <span className="inline-block text-base font-bold text-foreground tabular-nums whitespace-nowrap">
                        {linePrice}
                      </span>
                      {lineOriginal ? (
                        <span className="ml-2 inline-block text-xs text-muted-foreground line-through whitespace-nowrap">
                          {lineOriginal}
                        </span>
                      ) : null}
                    </div>

                    <div className="w-full rounded-xl bg-muted/35 px-3 py-2.5 text-right md:hidden">
                      <span className="inline-block text-lg font-bold text-foreground tabular-nums whitespace-nowrap">
                        {linePrice}
                      </span>
                      {lineOriginal ? (
                        <div className="mt-0.5 text-xs text-muted-foreground line-through whitespace-nowrap">
                          {lineOriginal}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:w-[360px] shrink-0">
            <div className="sticky top-[180px] p-5 rounded-2xl border border-border space-y-4">
              <h3 className="text-lg font-bold text-foreground">Итого</h3>

              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase());
                        setCouponError(null);
                      }}
                      placeholder="Промокод"
                      className="h-10 text-sm font-mono uppercase shrink min-w-0"
                      aria-label="Промокод"
                      disabled={previewLoading || checkoutLoading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 shrink-0 whitespace-nowrap"
                      disabled={previewLoading || checkoutLoading || items.length === 0 || !couponInput.trim()}
                      onClick={() => void handleApplyCoupon()}
                    >
                      Применить
                    </Button>
                  </div>
                  {couponError ? <p className="text-xs text-destructive leading-snug">{couponError}</p> : null}
                  {appliedCoupon ? (
                    <div className="flex items-start justify-between gap-2 rounded-xl bg-muted/50 px-3 py-2 text-xs">
                      <span className="text-muted-foreground inline-flex items-center gap-1.5 min-w-0">
                        <Ticket className="w-3.5 h-3.5 shrink-0 text-primary" />
                        <span className="truncate font-mono">{appliedCoupon}</span>
                      </span>
                      <button
                        type="button"
                        className="text-primary font-semibold whitespace-nowrap hover:underline"
                        onClick={handleClearCoupon}
                      >
                        Сбросить
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {serverTotalsMode && orderPreview ? (
                <p className="text-[11px] text-muted-foreground leading-snug -mt-1">
                  Итого и доставка по ценам каталога на сервере (витринные акции в строках товаров могут отличаться).
                </p>
              ) : null}

              <div className="space-y-2 text-sm">
                {!serverTotalsMode ? (
                  <>
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
                  </>
                ) : orderPreview ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Товары ({items.reduce((s, i) => s + i.quantity, 0)})</span>
                      <span className="text-foreground">{orderPreview.subtotal_catalog_rub.toLocaleString()} ₽</span>
                    </div>
                    {orderPreview.discount_rub > 0 ? (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground truncate pr-2" title={orderPreview.coupon?.name ?? appliedCoupon ?? ""}>
                          Промокод {orderPreview.coupon?.code ? `(${orderPreview.coupon.code})` : ""}
                        </span>
                        <span className="text-green-600 shrink-0">-{orderPreview.discount_rub.toLocaleString()} ₽</span>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Считаем…</span>
                    <Loader2 className="w-4 h-4 animate-spin" />
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
                      {(serverTotalsMode ? previewLoading : deliveryQuoteLoading) ? (
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                          Считаем…
                        </span>
                      ) : serverTotalsMode && orderPreview ? (
                        orderPreview.delivery_amount <= 0 ? (
                          <span className="text-green-600">Бесплатно</span>
                        ) : (
                          `${orderPreview.delivery_amount.toLocaleString()} ₽`
                        )
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
                !serverTotalsMode &&
                !thresholdFreeActive &&
                cartQuote &&
                !cartQuote.needs_address &&
                typeof resolvedDeliveryRub === "number" &&
                resolvedDeliveryRub > 0 &&
                cartQuote.cheapest_quote?.summary_line_ru && (
                  <p className="text-[11px] text-muted-foreground leading-snug">{cartQuote.cheapest_quote.summary_line_ru}</p>
                )}

              {isAuthenticated && effectiveThresholdRub != null && thresholdBannerGapRub !== null && thresholdBannerGapRub > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 text-sm">
                  <Truck className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">
                    До бесплатной доставки ещё{" "}
                    <span className="text-primary font-medium">{thresholdBannerGapRub.toLocaleString()} ₽</span>
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
                  <span className="text-xl font-bold text-foreground inline-flex items-center gap-2">
                    {(serverTotalsMode ? previewLoading : false) && (
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" aria-hidden />
                    )}
                    {finalTotal.toLocaleString()} ₽
                  </span>
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
                      (Boolean(isAuthenticated && cartQuote?.needs_address)) ||
                      (Boolean(appliedCoupon && (!orderPreview || previewLoading)))
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

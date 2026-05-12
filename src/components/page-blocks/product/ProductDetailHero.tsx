import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Clock, Heart, ShoppingCart, Share2, Star, Minus, Plus, Shield, Truck, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { publicApi, PUBLIC_STORE_HOME_PAGE_KEY } from "@/lib/api";
import { productFullToStorefront } from "@/lib/mapPublicProduct";
import { extractHotDealsSettingsFromPageLayout, getActiveHotDealForProduct } from "@/lib/hotDeals";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { usePublicProduct } from "@/hooks/usePublicProduct";
import { useProductDeliveryQuote } from "@/hooks/useProductDeliveryQuote";
import type { CartPromotionSnapshot } from "@/lib/cartPricing";
import { filterRedundantVariantAttributes } from "@/lib/cartDisplayAttributes";
import { useAuth } from "@/contexts/AuthContext";
import DeliveryQuoteEntry from "@/components/page-blocks/product/DeliveryQuoteEntry";

const RECENT_KEY = "cheepy_recent_product_ids";

function pushRecentProductId(id: number) {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const arr: number[] = raw ? JSON.parse(raw) : [];
    const next = [id, ...arr.filter((x) => x !== id)].slice(0, 24);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

function useCountdown(endsAt: number | undefined) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!endsAt) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [endsAt]);
  const left = Math.max(0, (endsAt ?? now) - now);
  return {
    expired: left <= 0,
    hours: Math.floor(left / 3600000),
    minutes: Math.floor((left % 3600000) / 60000),
    seconds: Math.floor((left % 60000) / 1000),
  };
}

export default function ProductDetailHero(
  props: {
    quantity?: number;
    onQuantityChange?: (n: number) => void;
  } = {},
) {
  const { quantity: quantityProp, onQuantityChange } = props;

  const [quantityLocal, setQuantityLocal] = useState(1);
  const controlled = typeof quantityProp === "number" && typeof onQuantityChange === "function";
  const quantity = controlled ? quantityProp : quantityLocal;
  const setQuantity = controlled ? onQuantityChange : setQuantityLocal;
  const { id } = useParams();
  const { data, isLoading, isError, error } = usePublicProduct(id);
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  const full = data?.product;
  const storefront = useMemo(() => (full ? productFullToStorefront(full) : null), [full]);
  const { data: homeLayout } = useQuery({
    queryKey: ["public-layout-page", PUBLIC_STORE_HOME_PAGE_KEY],
    queryFn: () => publicApi.pageLayout(PUBLIC_STORE_HOME_PAGE_KEY),
    retry: false,
    staleTime: 60_000,
  });
  const hotDealSettings = useMemo(() => extractHotDealsSettingsFromPageLayout(homeLayout), [homeLayout]);
  const routeNumericId = Number(id);
  const productNumericId = Number(full?.id);
  const activeDeal =
    getActiveHotDealForProduct(hotDealSettings ?? undefined, Number.isFinite(routeNumericId) ? routeNumericId : undefined) ??
    getActiveHotDealForProduct(hotDealSettings ?? undefined, Number.isFinite(productNumericId) ? productNumericId : undefined);
  const dealCountdown = useCountdown(activeDeal?.endsAt);

  const { isAuthenticated } = useAuth();

  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");

  const { deliveryQuoteEnabled, deliveryQuote, deliveryQuoteLoading } = useProductDeliveryQuote(
    id,
    full?.id,
    quantity,
  );

  useEffect(() => {
    if (!storefront) return;
    const fromVariant = storefront.colorVariants?.find((v) => v.is_current)?.color;
    setSelectedColor(fromVariant ?? storefront.colors[0] ?? "");
    setSelectedSize(storefront.sizes[0] ?? "");
    setActiveImage(0);
    setQuantity(1);
  }, [storefront?.id, setQuantity]);

  useEffect(() => {
    if (full?.id) pushRecentProductId(full.id);
  }, [full?.id]);

  useEffect(() => {
    if (!full?.id) return;
    void import("@/lib/userPreferences").then(({ trackProductEvent }) => {
      trackProductEvent("view", {
        productId: Number(full.id),
        categoryId: full.category?.id ?? null,
        categorySlug: full.category?.slug ?? null,
      });
    });
  }, [full?.id, full?.category?.id, full?.category?.slug]);

  if (isLoading || !id) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 animate-pulse">
        <div className="h-[400px] rounded-2xl bg-muted" />
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-12 bg-muted rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (isError || !full || !storefront) {
    return (
      <div className="mb-10 rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-foreground">
        {isError ? `Не удалось загрузить товар: ${error instanceof Error ? error.message : ""}` : "Товар не найден."}
      </div>
    );
  }

  const images = storefront.images.length > 0 ? storefront.images : [];
  const discount =
    storefront.oldPrice && storefront.oldPrice > storefront.price
      ? Math.round((1 - storefront.price / storefront.oldPrice) * 100)
      : 0;

  const cartColor = selectedColor || storefront.colors[0] || "—";
  const cartSize = selectedSize || storefront.sizes[0] || "—";
  const selectedAttributes = filterRedundantVariantAttributes(
    (storefront.attributes ?? [])
      .filter((attr) => attr.name && attr.value)
      .map((attr) => ({ name: attr.name, value: attr.value })),
  );
  const activeDealWithCommission = activeDeal && !dealCountdown.expired
    ? {
        ...activeDeal,
        originalPrice: storefront.price,
        salePrice: Math.max(1, Math.round(storefront.price * (1 - activeDeal.discountPercent / 100))),
      }
    : null;
  const cartPromotion: CartPromotionSnapshot | undefined = activeDealWithCommission
    ? {
        id: activeDealWithCommission.id,
        type: "hot_deal",
        title: "Горячее предложение",
        label: "Горячее предложение",
        source: {
          kind: "constructor_block",
          id: activeDealWithCommission.id,
          blockType: "HotDeals",
          windowId: activeDealWithCommission.windowId,
          itemId: String(activeDealWithCommission.productId),
        },
        discountPercent: activeDealWithCommission.discountPercent,
        originalUnitPrice: activeDealWithCommission.originalPrice,
        promotionalUnitPrice: activeDealWithCommission.salePrice,
        startsAt: activeDealWithCommission.startsAt,
        endsAt: activeDealWithCommission.endsAt,
        priority: 50,
        stackable: false,
        capturedAt: new Date().toISOString(),
      }
    : undefined;

  const seller = full.seller;
  const shownPrice = activeDealWithCommission ? activeDealWithCommission.salePrice : storefront.price;
  const shownOldPrice = activeDealWithCommission ? activeDealWithCommission.originalPrice : storefront.oldPrice;
  const shownDiscount = activeDealWithCommission ? activeDealWithCommission.discountPercent : discount;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 md:items-start">
      <div className="flex flex-col md:flex-row-reverse md:items-start md:gap-3">
        <div className="aspect-[3/4] max-h-[500px] rounded-2xl overflow-hidden bg-secondary mb-3 md:mb-0 md:flex-1 md:min-w-0 flex items-center justify-center">
          {images.length > 0 ? (
            <img src={images[activeImage] ?? images[0]} alt={storefront.name} className="w-full h-full object-contain" />
          ) : (
            <span className="text-muted-foreground text-sm">Нет фото</span>
          )}
        </div>
        {images.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto no-scrollbar md:flex-col md:overflow-x-hidden md:overflow-y-auto md:max-h-[500px] md:shrink-0 md:w-[68px] md:gap-2">
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveImage(i)}
                className={`shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                  i === activeImage ? "border-primary" : "border-transparent hover:border-border"
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div>
        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">{storefront.name}</h1>
          <button
            type="button"
            onClick={() => navigator.share?.({ title: storefront.name, url: window.location.href }).catch(() => {})}
            className="shrink-0 p-2 rounded-lg border border-border text-muted-foreground hover:text-primary transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {storefront.rating > 0 ? (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${s <= Math.round(storefront.rating) ? "fill-yellow-500 text-yellow-500" : "text-border"}`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {storefront.rating}
              {storefront.reviews > 0 ? ` · ${storefront.reviews} отзывов` : ""}
            </span>
          </div>
        ) : null}

        <div className="flex items-baseline gap-3 mb-6 flex-wrap">
          <span className="text-3xl font-bold text-foreground">{(shownPrice * quantity).toLocaleString("ru-RU")} ₽</span>
          {shownOldPrice != null && shownOldPrice > shownPrice ? (
            <>
              <span className="text-lg text-muted-foreground line-through">
                {(shownOldPrice * quantity).toLocaleString("ru-RU")} ₽
              </span>
              {shownDiscount > 0 ? (
                <span className="gradient-hero text-primary-foreground text-sm font-semibold px-2 py-0.5 rounded-full">-{shownDiscount}%</span>
              ) : null}
            </>
          ) : null}
        </div>

        {activeDeal && !dealCountdown.expired ? (
          <div className="mb-5 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
              <Clock className="h-4 w-4 text-destructive" />
              Товар участвует в горячем предложении
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Скидка отменится через:</span>
              <span className="rounded bg-foreground px-1.5 py-0.5 font-mono font-bold text-background">{String(dealCountdown.hours).padStart(2, "0")}</span>
              <span className="rounded bg-foreground px-1.5 py-0.5 font-mono font-bold text-background">{String(dealCountdown.minutes).padStart(2, "0")}</span>
              <span className="rounded bg-foreground px-1.5 py-0.5 font-mono font-bold text-background">{String(dealCountdown.seconds).padStart(2, "0")}</span>
            </div>
          </div>
        ) : null}

        {storefront.colorVariants && storefront.colorVariants.length > 0 ? (
          <div className="mb-4">
            <p className="text-sm font-medium text-foreground mb-2">
              Цвет:{" "}
              <span className="text-muted-foreground">
                {storefront.colorVariants.find((v) => v.is_current)?.color ||
                  selectedColor ||
                  storefront.colors[0] ||
                  "—"}
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {storefront.colorVariants.map((v) => {
                const tile = (
                  <span
                    className={`block h-16 w-12 overflow-hidden rounded-lg border-2 bg-secondary transition-colors ${
                      v.is_current ? "border-primary" : "border-border"
                    }`}
                  >
                    {v.thumbnail ? (
                      <img src={v.thumbnail} alt={v.color || v.title} className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center px-1 text-center text-[10px] text-muted-foreground leading-tight">
                        {v.color || "…"}
                      </span>
                    )}
                  </span>
                );
                if (v.is_current) {
                  return (
                    <span key={v.id} className="rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-background" title={v.title}>
                      {tile}
                    </span>
                  );
                }
                return (
                  <Link
                    key={v.id}
                    to={`/product/${v.id}`}
                    className="rounded-lg border-2 border-transparent hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    title={v.color || v.title}
                  >
                    {tile}
                  </Link>
                );
              })}
            </div>
          </div>
        ) : storefront.colors.length > 0 ? (
          <div className="mb-4">
            <p className="text-sm font-medium text-foreground mb-2">
              Цвет: <span className="text-muted-foreground">{selectedColor || storefront.colors[0]}</span>
            </p>
            <div className="flex gap-2 flex-wrap">
              {storefront.colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                    (selectedColor || storefront.colors[0]) === c
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-foreground hover:border-primary/50"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {storefront.sizes.length > 0 ? (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-foreground">
                Размер: <span className="text-muted-foreground">{selectedSize || storefront.sizes[0]}</span>
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {storefront.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedSize(s)}
                  className={`w-12 h-10 rounded-lg text-sm font-medium border transition-colors ${
                    (selectedSize || storefront.sizes[0]) === s
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-foreground hover:border-primary/50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mb-6">
          <p className="text-sm font-medium text-foreground mb-2">Количество</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-lg font-medium w-8 text-center">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <Button
            onClick={() => addToCart(storefront, cartColor, cartSize, {
              quantity,
              selectedAttributes,
              promotions: cartPromotion ? [cartPromotion] : [],
            })}
            className="flex-1 gradient-primary text-primary-foreground rounded-xl py-3 h-auto text-sm font-semibold gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Добавить в корзину
          </Button>
          <button
            type="button"
            onClick={() => toggleFavorite(storefront)}
            className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-colors ${
              isFavorite(storefront.id)
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-primary hover:border-primary"
            }`}
          >
            <Heart className={`w-5 h-5 ${isFavorite(storefront.id) ? "fill-primary" : ""}`} />
          </button>
        </div>

        {seller?.slug ? (
          <p className="text-sm text-muted-foreground mb-4">
            Продавец:{" "}
            <Link to={`/seller/${seller.slug}`} className="text-primary hover:underline font-medium">
              {seller.name}
            </Link>
          </p>
        ) : null}

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)_minmax(0,1fr)]">
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary text-center sm:items-center">
              <Shield className="w-5 h-5 text-primary shrink-0" />
              <span className="text-xs text-muted-foreground">Гарантия качества</span>
            </div>
            <div className="flex flex-col gap-2 p-3 sm:p-4 rounded-xl bg-secondary text-left min-w-0">
              {deliveryQuoteLoading && deliveryQuoteEnabled ? (
                <div className="flex items-start gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0 mt-0.5" aria-hidden />
                  <p className="text-xs text-muted-foreground leading-snug">
                    Считаем ориентировочную доставку до вашего адреса…
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-2">
                    <Truck className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden />
                    {deliveryQuote?.quotes?.length ? (
                      <span className="text-xs font-semibold text-foreground pt-0.5">Доставка до адреса</span>
                    ) : (
                      <span className="text-xs font-semibold text-foreground pt-0.5">Доставка</span>
                    )}
                  </div>
                  {deliveryQuote?.quotes?.length ? (
                    <div className="flex flex-col gap-4 w-full sm:pl-7 min-w-0">
                      {deliveryQuote.quotes.map((q) => (
                        <DeliveryQuoteEntry
                          key={`${q.integration}-${q.service_code}-${q.date_from}-${q.date_to}-${q.service_name}`}
                          q={q}
                          variant="compact"
                        />
                      ))}
                    </div>
                  ) : deliveryQuote?.needs_address && deliveryQuoteEnabled ? (
                    <p className="text-xs text-muted-foreground leading-snug sm:pl-7 text-balance">
                      Укажите адрес доставки в разделе{" "}
                      <Link to="/account#delivery-addresses" className="text-primary hover:underline font-medium">
                        «Адреса доставки»
                      </Link>{" "}
                      в личном кабинете. Для расчёта берётся адрес по умолчанию.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground sm:pl-7 leading-snug">Доставка по договорённости</p>
                  )}
                </>
              )}
            </div>
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary text-center sm:items-center">
              <RotateCcw className="w-5 h-5 text-primary shrink-0" />
              <span className="text-xs text-muted-foreground">Возврат по правилам площадки</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

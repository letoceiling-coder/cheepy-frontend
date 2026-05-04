import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Clock, Heart, ShoppingCart, Share2, Star, Minus, Plus, Shield, Truck, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { publicApi, getStorefrontAuthToken, storeDeliveryQuoteApi } from "@/lib/api";
import { productFullToStorefront } from "@/lib/mapPublicProduct";
import { extractHotDealsSettingsFromPageLayout, getActiveHotDealForProduct } from "@/lib/hotDeals";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { usePublicProduct } from "@/hooks/usePublicProduct";
import type { CartPromotionSnapshot } from "@/lib/cartPricing";
import { useAuth } from "@/contexts/AuthContext";

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

export default function ProductDetailHero() {
  const { id } = useParams();
  const { data, isLoading, isError, error } = usePublicProduct(id);
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  const full = data?.product;
  const storefront = useMemo(() => (full ? productFullToStorefront(full) : null), [full]);
  const { data: homeLayout } = useQuery({
    queryKey: ["public-layout-page", "home"],
    queryFn: () => publicApi.pageLayout("home"),
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
  const [tokenTick, setTokenTick] = useState(0);
  useEffect(() => {
    setTokenTick((t) => t + 1);
  }, [isAuthenticated, id]);

  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);

  const hasStoreToken = typeof window !== "undefined" && Boolean(getStorefrontAuthToken());
  const deliveryQuoteEnabled =
    Boolean(isAuthenticated && hasStoreToken && id && full?.id && /^\d+$/.test(String(id).trim()));

  const { data: deliveryQuote, isFetching: deliveryQuoteLoading } = useQuery({
    queryKey: ["store-delivery-quote", id, quantity, full?.id ?? 0, tokenTick],
    queryFn: () => storeDeliveryQuoteApi.get(String(id), quantity),
    enabled: deliveryQuoteEnabled,
    staleTime: 120_000,
    retry: false,
  });

  useEffect(() => {
    if (!storefront) return;
    setSelectedColor(storefront.colors[0] ?? "");
    setSelectedSize(storefront.sizes[0] ?? "");
    setActiveImage(0);
    setQuantity(1);
  }, [storefront?.id]);

  useEffect(() => {
    if (full?.id) pushRecentProductId(full.id);
  }, [full?.id]);

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
  const selectedAttributes = (storefront.attributes ?? [])
    .filter((attr) => attr.name && attr.value)
    .map((attr) => ({ name: attr.name, value: attr.value }));
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

        {storefront.colors.length > 0 ? (
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
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary text-center">
              <Shield className="w-5 h-5 text-primary shrink-0" />
              <span className="text-xs text-muted-foreground">Гарантия качества</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary text-center md:items-stretch md:text-left">
              <div className="flex justify-center md:justify-start">
                <Truck className="w-5 h-5 text-primary shrink-0" />
              </div>
              {deliveryQuoteLoading && deliveryQuoteEnabled ? (
                <span className="flex items-center justify-center md:justify-start gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" aria-hidden />
                  Доставка: расчёт…
                </span>
              ) : deliveryQuote?.quotes?.length ? (
                <div className="flex flex-col gap-3 w-full text-left pt-0.5">
                  {deliveryQuote.quotes.map((q) => (
                    <div key={`${q.integration}-${q.service_code}-${q.summary_line_ru}`} className="space-y-1">
                      <span className="block text-[11px] font-semibold text-foreground leading-tight">{q.provider_title}</span>
                      <span className="block text-[11px] text-muted-foreground leading-snug">{q.summary_line_ru}</span>
                    </div>
                  ))}
                </div>
              ) : deliveryQuote?.needs_address && deliveryQuoteEnabled ? (
                <span className="text-xs text-muted-foreground leading-snug">
                  Укажите адрес доставки в{" "}
                  <Link to="/account" className="text-primary hover:underline font-medium">
                    личном кабинете
                  </Link>
                  , чтобы увидеть ориентировочную стоимость.
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Доставка по договорённости</span>
              )}
            </div>
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary text-center">
              <RotateCcw className="w-5 h-5 text-primary shrink-0" />
              <span className="text-xs text-muted-foreground">Возврат по правилам площадки</span>
            </div>
          </div>
          {deliveryQuote?.warnings?.length ? (
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground leading-snug">
              {deliveryQuote.warnings.join(" · ")}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

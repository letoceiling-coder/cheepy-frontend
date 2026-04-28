import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { publicCrmMediaFileUrl, resolveCrmMediaAssetUrl } from "@/lib/api";
import product1 from "@/assets/product-1.jpg";

interface CtaProp {
  text?: string;
  url?: string;
  target?: "_self" | "_blank";
}

interface PhotoProp {
  mediaFileId?: number | null;
  url?: string;
}

interface ItemProp {
  id?: string;
  productId?: number | null;
  label?: string;
  productTitle?: string;
  productDescription?: string;
  mediaFileId?: number | null;
  imageUrl?: string;
  additionalPhotos?: PhotoProp[];
  priceText?: string;
  oldPriceText?: string;
  discountText?: string;
  cta?: CtaProp;
}

interface HeroProductPromoProps {
  items?: ItemProp[];
  autoplaySeconds?: number;
  // back-compat (старый формат — один товар плоско):
  productId?: number | null;
  label?: string;
  productTitle?: string;
  productDescription?: string;
  mediaFileId?: number | null;
  imageUrl?: string;
  priceText?: string;
  oldPriceText?: string;
  discountText?: string;
  cta?: CtaProp;
}

function resolvePhotoUrl(mediaFileId: number | null | undefined, url: string | undefined): string {
  if (typeof mediaFileId === "number" && mediaFileId > 0) return publicCrmMediaFileUrl(Number(mediaFileId));
  if (typeof url === "string" && url) return resolveCrmMediaAssetUrl(url);
  return "";
}

function HeroProductCard({ item, isActive }: { item: ItemProp; isActive: boolean }) {
  const finalLabel = (item.label && item.label.trim()) || "Товар недели";
  const finalTitle = (item.productTitle && item.productTitle.trim()) || "Куртка демисезонная удлинённая";
  const finalDescription =
    (item.productDescription && item.productDescription.trim()) ||
    "Стильная куртка из водоотталкивающей ткани с утеплителем. Идеальна для переходного сезона.";
  const finalPrice = (item.priceText && item.priceText.trim()) || "4 990 ₽";
  const finalOldPrice = (item.oldPriceText ?? "").trim();
  const finalDiscount = (item.discountText ?? "").trim();

  const mainPhoto = resolvePhotoUrl(item.mediaFileId, item.imageUrl);
  const extraPhotos = (Array.isArray(item.additionalPhotos) ? item.additionalPhotos : [])
    .map((ph) => resolvePhotoUrl(ph?.mediaFileId, ph?.url))
    .filter((u) => u);
  const allPhotos = [mainPhoto || product1, ...extraPhotos].filter(Boolean);

  const [photoIdx, setPhotoIdx] = useState(0);

  // Reset gallery position when card becomes inactive (slider).
  useEffect(() => {
    if (!isActive) setPhotoIdx(0);
  }, [isActive]);

  // Reset when items change (e.g. after settings update).
  useEffect(() => {
    setPhotoIdx(0);
  }, [allPhotos.length, mainPhoto]);

  const ctaText = (item.cta?.text && item.cta.text.trim()) || "Купить сейчас";
  const ctaUrl = (item.cta?.url && item.cta.url.trim()) || (item.productId ? `/product/${item.productId}` : "#");
  const ctaTarget: "_self" | "_blank" = item.cta?.target === "_blank" ? "_blank" : "_self";

  const currentPhoto = allPhotos[Math.min(photoIdx, allPhotos.length - 1)] ?? product1;

  return (
    <div className="rounded-2xl bg-secondary overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <span className="text-xs uppercase tracking-widest text-primary font-medium">{finalLabel}</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3 leading-tight">{finalTitle}</h2>
          <p className="text-muted-foreground mt-3 leading-relaxed line-clamp-4">{finalDescription}</p>
          <div className="flex items-baseline gap-3 mt-5 flex-wrap">
            <span className="text-3xl font-bold text-foreground">{finalPrice}</span>
            {finalOldPrice ? <span className="text-lg text-muted-foreground line-through">{finalOldPrice}</span> : null}
            {finalDiscount ? <span className="text-sm font-bold text-destructive">{finalDiscount}</span> : null}
          </div>
          <a
            href={ctaUrl}
            target={ctaTarget}
            rel={ctaTarget === "_blank" ? "noopener noreferrer" : undefined}
            className="mt-6 h-12 px-8 rounded-xl gradient-primary text-primary-foreground font-semibold inline-flex items-center gap-2 hover:opacity-90 transition-opacity group w-fit"
          >
            {ctaText}
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </a>
        </div>

        <div className="flex flex-col">
          <div className="relative bg-muted/30 h-[320px] md:h-[420px] flex items-center justify-center overflow-hidden">
            <img
              src={currentPhoto}
              alt={finalTitle}
              className="max-h-full max-w-full w-auto h-auto object-contain"
              loading="lazy"
            />
          </div>
          {allPhotos.length > 1 ? (
            <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto no-scrollbar bg-secondary/60">
              {allPhotos.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  onClick={() => setPhotoIdx(i)}
                  aria-label={`Фото ${i + 1}`}
                  className={`shrink-0 h-14 w-14 rounded-md overflow-hidden border-2 transition-colors ${
                    i === photoIdx ? "border-primary" : "border-transparent hover:border-border"
                  }`}
                >
                  <img src={src} alt={`thumb-${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const HeroProductPromo = (props: HeroProductPromoProps) => {
  const { ref, isVisible } = useScrollAnimation();

  // Поддержка обоих форматов: новый items[] и старый — один товар плоско.
  const normalizedItems: ItemProp[] = useMemo(() => {
    if (Array.isArray(props.items) && props.items.length > 0) return props.items;
    const legacy: ItemProp = {
      productId: props.productId ?? null,
      label: props.label ?? "",
      productTitle: props.productTitle ?? "",
      productDescription: props.productDescription ?? "",
      mediaFileId: props.mediaFileId ?? null,
      imageUrl: props.imageUrl ?? "",
      priceText: props.priceText ?? "",
      oldPriceText: props.oldPriceText ?? "",
      discountText: props.discountText ?? "",
      cta: props.cta,
      additionalPhotos: [],
    };
    return [legacy];
  }, [props]);

  const total = normalizedItems.length;
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (active >= total) setActive(0);
  }, [active, total]);

  const autoplayMs = (() => {
    const sec = Number(props.autoplaySeconds);
    if (!Number.isFinite(sec) || sec <= 0) return 0;
    return Math.min(60, Math.max(1, Math.round(sec))) * 1000;
  })();

  useEffect(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (autoplayMs <= 0 || total <= 1 || hovered) return;
    timerRef.current = window.setInterval(() => {
      setActive((v) => (v + 1) % total);
    }, autoplayMs);
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [autoplayMs, total, hovered]);

  const goPrev = () => setActive((v) => (v - 1 + total) % total);
  const goNext = () => setActive((v) => (v + 1) % total);

  return (
    <section
      ref={ref}
      className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative">
        <div className="overflow-hidden rounded-2xl">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${active * 100}%)` }}
          >
            {normalizedItems.map((item, idx) => (
              <div key={item.id ?? idx} className="w-full shrink-0">
                <HeroProductCard item={item} isActive={idx === active} />
              </div>
            ))}
          </div>
        </div>

        {total > 1 ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Предыдущий товар"
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/90 hover:bg-background border border-border shadow flex items-center justify-center transition-opacity"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Следующий товар"
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/90 hover:bg-background border border-border shadow flex items-center justify-center transition-opacity"
            >
              <ChevronRight size={20} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {normalizedItems.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Перейти к слайду ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    i === active ? "bg-primary w-6" : "bg-muted-foreground/40 w-2 hover:bg-muted-foreground/70"
                  }`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
};

export default HeroProductPromo;

import { useEffect, useMemo, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useDragScroll } from "@/hooks/useDragScroll";
import { useStorefrontProductCards } from "@/hooks/useStorefrontProductCards";
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
  const thumbStripRef = useDragScroll<HTMLDivElement>();

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
        <div className="order-2 md:order-1 p-4 pb-5 sm:p-6 md:p-12 flex flex-col justify-center min-w-0">
          <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary font-medium">{finalLabel}</span>
          <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-foreground mt-2 md:mt-3 leading-tight line-clamp-3 md:line-clamp-none">
            {finalTitle}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-2 md:mt-3 leading-snug md:leading-relaxed line-clamp-2 md:line-clamp-4">
            {finalDescription}
          </p>
          <div className="flex items-baseline gap-2 sm:gap-3 mt-3 md:mt-5 flex-wrap">
            <span className="text-2xl md:text-3xl font-bold text-foreground">{finalPrice}</span>
            {finalOldPrice ? <span className="text-sm md:text-lg text-muted-foreground line-through">{finalOldPrice}</span> : null}
            {finalDiscount ? <span className="text-xs md:text-sm font-bold text-destructive">{finalDiscount}</span> : null}
          </div>
          <a
            href={ctaUrl}
            target={ctaTarget}
            rel={ctaTarget === "_blank" ? "noopener noreferrer" : undefined}
            className="mt-4 md:mt-6 cheepy-btn-primary cheepy-btn-primary-lg inline-flex items-center justify-center gap-2 group w-full sm:w-auto md:w-fit shrink-0"
          >
            {ctaText}
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1 shrink-0" />
          </a>
        </div>

        <div className="order-1 md:order-2 flex flex-col min-h-0">
          <div
            className="relative bg-muted/30 flex items-center justify-center overflow-hidden
              h-[min(36svh,240px)] sm:h-[min(38svh,280px)] md:h-[420px]"
          >
            <img
              src={currentPhoto}
              alt={finalTitle}
              className="w-full h-full max-h-full object-contain object-center p-2 sm:p-3 md:p-4"
              loading="lazy"
            />
          </div>
          {allPhotos.length > 1 ? (
            <div
              ref={thumbStripRef}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 overflow-x-auto no-scrollbar bg-secondary/60 cursor-grab active:cursor-grabbing touch-pan-x"
            >
              {allPhotos.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  onClick={() => setPhotoIdx(i)}
                  aria-label={`Фото ${i + 1}`}
                  className={`shrink-0 h-11 w-11 sm:h-14 sm:w-14 rounded-md overflow-hidden border-2 transition-colors ${
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
  const promoProductIds = useMemo(() => normalizedItems.map((i) => i.productId), [normalizedItems]);
  const { data: storefrontById = {} } = useStorefrontProductCards(promoProductIds);
  const displayItems = useMemo(
    () =>
      normalizedItems.map((item) => {
        const key = String(item.productId ?? "");
        const row = key ? storefrontById[key] : undefined;
        if (!row) return item;
        return {
          ...item,
          priceText: row.price || item.priceText,
        };
      }),
    [normalizedItems, storefrontById],
  );

  const total = displayItems.length;
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: total > 1,
    align: "start",
    duration: 22,
    ...(total > 1 ? { containScroll: "trimSnaps" as const } : {}),
  });

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [hovered, setHovered] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIdx(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    emblaApi?.reInit();
  }, [emblaApi, total]);

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
    if (autoplayMs <= 0 || total <= 1 || hovered || !emblaApi) return;
    timerRef.current = window.setInterval(() => {
      if (!emblaApi.canScrollNext()) emblaApi.scrollTo(0);
      else emblaApi.scrollNext();
    }, autoplayMs);
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [autoplayMs, total, hovered, emblaApi]);

  const goPrev = () => emblaApi?.scrollPrev();
  const goNext = () => emblaApi?.scrollNext();
  const goTo = (i: number) => emblaApi?.scrollTo(i);

  return (
    <section
      ref={ref}
      className={`py-6 sm:py-8 md:py-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative">
        <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
          <div className="flex">
            {displayItems.map((item, idx) => (
              <div key={item.id ?? idx} className="min-w-0 shrink-0 grow-0 basis-[100%]">
                <HeroProductCard item={item} isActive={idx === selectedIdx} />
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
              className="absolute left-1.5 sm:left-2 md:left-4 top-[min(18svh,120px)] md:top-1/2 md:-translate-y-1/2 -translate-y-1/2 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-background/90 hover:bg-background border border-border shadow flex items-center justify-center transition-opacity z-10"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Следующий товар"
              className="absolute right-1.5 sm:right-2 md:right-4 top-[min(18svh,120px)] md:top-1/2 md:-translate-y-1/2 -translate-y-1/2 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-background/90 hover:bg-background border border-border shadow flex items-center justify-center transition-opacity z-10"
            >
              <ChevronRight size={20} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
              {displayItems.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Перейти к слайду ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    i === selectedIdx ? "bg-primary w-6" : "bg-muted-foreground/40 w-2 hover:bg-muted-foreground/70"
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

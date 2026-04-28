import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { publicCrmMediaFileUrl, resolveCrmMediaAssetUrl } from "@/lib/api";
import product1 from "@/assets/product-1.jpg";

interface CtaProp {
  text?: string;
  url?: string;
  target?: "_self" | "_blank";
}

interface HeroProductPromoProps {
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

const HeroProductPromo = ({
  productId,
  label,
  productTitle,
  productDescription,
  mediaFileId,
  imageUrl,
  priceText,
  oldPriceText,
  discountText,
  cta,
}: HeroProductPromoProps) => {
  const { ref, isVisible } = useScrollAnimation();

  const finalLabel = (label && label.trim()) || "Товар недели";
  const finalTitle = (productTitle && productTitle.trim()) || "Куртка демисезонная удлинённая";
  const finalDescription =
    (productDescription && productDescription.trim()) ||
    "Стильная куртка из водоотталкивающей ткани с утеплителем. Идеальна для переходного сезона.";
  const finalPrice = (priceText && priceText.trim()) || "4 990 ₽";
  const finalOldPrice = (oldPriceText ?? "").trim();
  const finalDiscount = (discountText ?? "").trim();

  const resolvedImage =
    typeof mediaFileId === "number" && mediaFileId > 0
      ? publicCrmMediaFileUrl(Number(mediaFileId))
      : typeof imageUrl === "string" && imageUrl
        ? resolveCrmMediaAssetUrl(imageUrl)
        : product1;

  const ctaText = (cta?.text && cta.text.trim()) || "Купить сейчас";
  const ctaUrl = (cta?.url && cta.url.trim()) || (productId ? `/product/${productId}` : "#");
  const ctaTarget: "_self" | "_blank" = cta?.target === "_blank" ? "_blank" : "_self";

  return (
    <section
      ref={ref}
      className={`py-12 transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
    >
      <div className="rounded-2xl bg-secondary overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 items-center">
          <div className="p-8 md:p-12">
            <span className="text-xs uppercase tracking-widest text-primary font-medium">{finalLabel}</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3 leading-tight">{finalTitle}</h2>
            <p className="text-muted-foreground mt-3 leading-relaxed">{finalDescription}</p>
            <div className="flex items-baseline gap-3 mt-5 flex-wrap">
              <span className="text-3xl font-bold text-foreground">{finalPrice}</span>
              {finalOldPrice ? (
                <span className="text-lg text-muted-foreground line-through">{finalOldPrice}</span>
              ) : null}
              {finalDiscount ? (
                <span className="text-sm font-bold text-destructive">{finalDiscount}</span>
              ) : null}
            </div>
            <a
              href={ctaUrl}
              target={ctaTarget}
              rel={ctaTarget === "_blank" ? "noopener noreferrer" : undefined}
              className="mt-6 h-12 px-8 rounded-xl gradient-primary text-primary-foreground font-semibold inline-flex items-center gap-2 hover:opacity-90 transition-opacity group"
            >
              {ctaText}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </a>
          </div>
          <div className="relative h-[300px] md:h-[400px]">
            <img src={resolvedImage} alt={finalTitle} className="w-full h-full object-cover" loading="lazy" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroProductPromo;

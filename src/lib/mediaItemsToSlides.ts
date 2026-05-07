import { publicCrmMediaFileUrl, resolveCrmMediaAssetUrl } from "@/lib/api";

export type MediaSlide = {
  imageUrl: string;
  /** Мелкий текст над заголовком (в т.ч. из настроек слайда `caption`). */
  caption: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaUrl: string;
  ctaTarget: "_self" | "_blank";
  alt: string;
};

type MediaLike = {
  mediaFileId?: number | null;
  url?: string;
  title?: string;
  subtitle?: string;
  caption?: string;
  alt?: string;
  cta?: { text: string; url: string; target?: "_self" | "_blank" };
};

/**
 * Из настроек конструктора (CRM file id / произвольный url) для слайдов баннеров/hero.
 */
export function mediaItemsToSlides(
  media: MediaLike[] | undefined,
  fallbackCta?: { text: string; url: string; target?: "_self" | "_blank" },
  /** Для промо-баннера нужна картинка; Hero допускает «только текст». */
  requireImage = true,
): MediaSlide[] {
  const items = Array.isArray(media) ? media : [];
  const rows = items.map((x) => {
    const imageUrl =
      typeof x?.mediaFileId === "number" && x.mediaFileId > 0
        ? publicCrmMediaFileUrl(Number(x.mediaFileId))
        : typeof x?.url === "string" && x.url.trim()
          ? resolveCrmMediaAssetUrl(x.url)
          : "";
    const title = typeof x?.title === "string" ? x.title : "";
    const subtitle = typeof x?.subtitle === "string" ? x.subtitle : "";
    const caption = typeof x?.caption === "string" ? x.caption : "";
    const perSlideCtaText = typeof x?.cta?.text === "string" ? x.cta.text : "";
    const ctaText = perSlideCtaText || (typeof fallbackCta?.text === "string" ? fallbackCta.text : "");
    const ctaUrl = typeof x?.cta?.url === "string" ? x.cta.url : typeof fallbackCta?.url === "string" ? fallbackCta.url : "";
    const ctaTarget = x?.cta?.target || fallbackCta?.target || "_self";
    const alt = (typeof x?.alt === "string" && x.alt.trim()) ? x.alt.trim() : title || subtitle || "Banner";
    return { imageUrl, caption, title, subtitle, ctaText, ctaUrl, ctaTarget, alt };
  });
  const filtered = requireImage ? rows.filter((r) => Boolean(r.imageUrl)) : rows.filter((r) => Boolean(r.imageUrl || r.title || r.subtitle || r.caption));
  return filtered as MediaSlide[];
}

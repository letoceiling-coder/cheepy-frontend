import { normalizeBlockProfileSettings, type BlockScheduleSetting, type HotDealProductSetting, type ProductFeedProfileSettings, type ScheduleWindowSetting } from '@/constructor/settingsProfiles';
import { resolveCrmMediaAssetUrl } from '@/lib/api';

export type ActiveHotDeal = {
  id: string;
  productId: number;
  name: string;
  image: string;
  salePrice: number;
  originalPrice: number;
  discountPercent: number;
  startsAt: number;
  endsAt: number;
  url: string;
  windowId?: string;
  windowTitle?: string;
};

export type HotDealsSettingsLike = {
  title?: string;
  subtitle?: string;
  dealItems?: HotDealProductSetting[];
  schedule?: BlockScheduleSetting;
};

/** True if the block has any saved schedule/products to evaluate (not empty template). */
export function isHotDealsLayoutConfigured(settings: HotDealsSettingsLike | undefined): boolean {
  if (!settings) return false;
  if ((settings.dealItems?.length ?? 0) > 0) return true;
  const sched = settings.schedule;
  if (sched?.enabled) return true;
  if ((sched?.windows?.length ?? 0) > 0) return true;
  return false;
}

function parsePriceText(text: string | null | undefined): number {
  const digits = String(text ?? '').replace(/[^\d]/g, '');
  return digits ? Number(digits) : 0;
}

function priceRaw(deal: HotDealProductSetting): number {
  return deal.priceRaw ?? parsePriceText(deal.priceText);
}

function toActiveDeal(
  deal: HotDealProductSetting,
  startsAt: number,
  endsAt: number,
  now: number,
  window?: ScheduleWindowSetting,
): ActiveHotDeal | null {
  if (deal.enabled === false || !deal.productId) return null;
  if (now < startsAt || now >= endsAt) return null;
  const originalPrice = priceRaw(deal);
  if (!originalPrice) return null;
  const discountPercent = Math.min(99, Math.max(1, deal.discountPercent || 1));
  const salePrice = Math.max(1, Math.round(originalPrice * (1 - discountPercent / 100)));
  return {
    id: `${window?.id ?? 'legacy'}-${deal.id || deal.productId}`,
    productId: deal.productId,
    name: deal.title || `Товар #${deal.productId}`,
    image: resolveCrmMediaAssetUrl(deal.imageUrl),
    salePrice,
    originalPrice,
    discountPercent,
    startsAt,
    endsAt,
    url: deal.productUrl || `/product/${deal.productId}`,
    windowId: window?.id,
    windowTitle: window?.title,
  };
}

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function windowRangeToday(window: ScheduleWindowSetting, nowDate: Date): { startsAt: number; endsAt: number } | null {
  if (!window.enabled) return null;
  if (Array.isArray(window.daysOfWeek) && window.daysOfWeek.length > 0 && !window.daysOfWeek.includes(nowDate.getDay())) return null;
  const today = dateKey(nowDate);
  if (window.startDate && today < window.startDate) return null;
  if (window.endDate && today > window.endDate) return null;

  const startTime = window.startTime || '00:00';
  const endTime = window.endTime || '23:59';
  const startsAt = new Date(`${today}T${startTime}`).getTime();
  let endsAt = new Date(`${today}T${endTime}`).getTime();
  if (endsAt <= startsAt) endsAt += 24 * 60 * 60 * 1000;
  return { startsAt, endsAt };
}

function legacyDeals(settings: HotDealsSettingsLike, now: number): ActiveHotDeal[] {
  return (settings.dealItems ?? [])
    .map((deal) => {
      const startsAt = deal.startsAt ? new Date(deal.startsAt).getTime() : 0;
      const endsAt = deal.endsAt ? new Date(deal.endsAt).getTime() : now + (deal.durationMinutes ?? 60) * 60_000;
      return toActiveDeal(deal, startsAt, endsAt, now);
    })
    .filter(Boolean) as ActiveHotDeal[];
}

export function getActiveHotDeals(settings: HotDealsSettingsLike | undefined, nowDate = new Date()): ActiveHotDeal[] {
  if (!settings) return [];
  const now = nowDate.getTime();
  const windows = settings.schedule?.windows ?? [];
  if (windows.length === 0) return legacyDeals(settings, now);

  if (!settings.schedule?.enabled) {
    return windows
      .flatMap((window) =>
        (window.dealItems ?? []).map((deal) => {
          const durationMs = Math.max(1, deal.durationMinutes ?? 60) * 60_000;
          return toActiveDeal(deal, now, now + durationMs, now, window);
        }),
      )
      .filter(Boolean) as ActiveHotDeal[];
  }

  return windows
    .flatMap((window) => {
      const range = windowRangeToday(window, nowDate);
      if (!range) return [];
      return (window.dealItems ?? []).map((deal) => {
        const durationMs = Math.max(1, deal.durationMinutes ?? 60) * 60_000;
        const productStartsAt = range.startsAt;
        const productEndsAt = Math.min(range.endsAt, productStartsAt + durationMs);
        return toActiveDeal(deal, productStartsAt, productEndsAt, now, window);
      });
    })
    .filter(Boolean) as ActiveHotDeal[];
}

export function getActiveHotDealForProduct(settings: HotDealsSettingsLike | undefined, productId: number | null | undefined, nowDate = new Date()): ActiveHotDeal | null {
  if (!productId) return null;
  return getActiveHotDeals(settings, nowDate).find((deal) => deal.productId === productId) ?? null;
}

export function extractHotDealsSettingsFromPageLayout(
  pageLayout: { blocks?: Array<{ block_type: string; settings: Record<string, unknown>; is_enabled?: boolean; is_visible?: boolean; sort_order?: number }> } | null | undefined,
): ProductFeedProfileSettings | null {
  const block = [...(pageLayout?.blocks ?? [])]
    .filter((b) => b.block_type === 'HotDeals' && b.is_enabled !== false && b.is_visible !== false)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0];
  if (!block) return null;
  const normalized = normalizeBlockProfileSettings('HotDeals', block.settings);
  return normalized.profile === 'P-PRODUCT-FEED' ? normalized : null;
}

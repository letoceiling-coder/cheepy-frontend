import type { StorefrontProduct } from "@/types/storefront-product";

export type CartPromotionType =
  | "hot_deal"
  | "promo_block"
  | "coupon"
  | "bundle"
  | "seller_discount"
  | "manual_discount"
  | (string & {});

export type CartPromotionSource = {
  kind: "constructor_block" | "coupon" | "seller" | "system" | (string & {});
  id: string;
  blockType?: string;
  blockId?: string;
  windowId?: string;
  itemId?: string;
};

export type CartPromotionSnapshot = {
  id: string;
  type: CartPromotionType;
  title: string;
  label?: string;
  source: CartPromotionSource;
  discountPercent?: number;
  originalUnitPrice: number;
  promotionalUnitPrice: number;
  startsAt: number;
  endsAt: number;
  priority?: number;
  stackable?: boolean;
  capturedAt: string;
  metadata?: Record<string, unknown>;
};

export type CartPricingInput = {
  product: Pick<StorefrontProduct, "price" | "oldPrice">;
  quantity: number;
  promotions?: CartPromotionSnapshot[];
};

export type CartLinePricing = {
  unitPrice: number;
  originalUnitPrice: number;
  lineTotal: number;
  lineOriginalTotal: number;
  discountTotal: number;
  appliedPromotion: CartPromotionSnapshot | null;
  activePromotions: CartPromotionSnapshot[];
  expiredPromotions: CartPromotionSnapshot[];
  promotionActive: boolean;
  promotionsExpired: boolean;
};

export function isPromotionActive(promotion: CartPromotionSnapshot | null | undefined, now = Date.now()): boolean {
  return Boolean(promotion && now >= promotion.startsAt && now < promotion.endsAt);
}

function comparePromotions(a: CartPromotionSnapshot, b: CartPromotionSnapshot): number {
  const byPrice = a.promotionalUnitPrice - b.promotionalUnitPrice;
  if (byPrice !== 0) return byPrice;

  const byPriority = (a.priority ?? 100) - (b.priority ?? 100);
  if (byPriority !== 0) return byPriority;

  return a.endsAt - b.endsAt;
}

export function selectAppliedPromotion(promotions: CartPromotionSnapshot[] | undefined, now = Date.now()): CartPromotionSnapshot | null {
  const active = (promotions ?? []).filter((promotion) => isPromotionActive(promotion, now));
  if (active.length === 0) return null;

  return [...active].sort(comparePromotions)[0] ?? null;
}

export function resolveCartLinePricing(item: CartPricingInput, now = Date.now()): CartLinePricing {
  const quantity = Math.max(0, item.quantity);
  const promotions = item.promotions ?? [];
  const appliedPromotion = selectAppliedPromotion(promotions, now);
  const activePromotions = promotions.filter((promotion) => isPromotionActive(promotion, now));
  const expiredPromotions = promotions.filter((promotion) => now >= promotion.endsAt);
  const baseUnitPrice = appliedPromotion?.originalUnitPrice ?? item.product.price;
  const productOldPrice = item.product.oldPrice && item.product.oldPrice > item.product.price ? item.product.oldPrice : baseUnitPrice;
  const unitPrice = appliedPromotion ? appliedPromotion.promotionalUnitPrice : item.product.price;
  const originalUnitPrice = appliedPromotion ? baseUnitPrice : productOldPrice;
  const lineTotal = unitPrice * quantity;
  const lineOriginalTotal = originalUnitPrice * quantity;

  return {
    unitPrice,
    originalUnitPrice,
    lineTotal,
    lineOriginalTotal,
    discountTotal: Math.max(0, lineOriginalTotal - lineTotal),
    appliedPromotion,
    activePromotions,
    expiredPromotions,
    promotionActive: appliedPromotion !== null,
    promotionsExpired: promotions.length > 0 && activePromotions.length === 0 && expiredPromotions.length > 0,
  };
}

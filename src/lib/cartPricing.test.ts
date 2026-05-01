import { describe, expect, it } from "vitest";
import { resolveCartLinePricing, type CartPromotionSnapshot } from "./cartPricing";

const hotDeal: CartPromotionSnapshot = {
  id: "hot-deal-window-product",
  type: "hot_deal",
  title: "Горячее предложение",
  label: "Горячее предложение",
  source: {
    kind: "constructor_block",
    id: "window-product",
    blockType: "HotDeals",
  },
  discountPercent: 20,
  originalUnitPrice: 400,
  promotionalUnitPrice: 320,
  startsAt: 1_000,
  endsAt: 10_000,
  priority: 50,
  stackable: false,
  capturedAt: "2026-05-01T00:00:00.000Z",
};

describe("cart promotion pricing", () => {
  it("uses active promotion price regardless of source block type", () => {
    const pricing = resolveCartLinePricing({ product: { price: 400 }, quantity: 8, promotions: [hotDeal] }, 5_000);

    expect(pricing.promotionActive).toBe(true);
    expect(pricing.appliedPromotion?.type).toBe("hot_deal");
    expect(pricing.unitPrice).toBe(320);
    expect(pricing.lineTotal).toBe(2560);
    expect(pricing.discountTotal).toBe(640);
  });

  it("reverts to base price after every promotion expires", () => {
    const pricing = resolveCartLinePricing({ product: { price: 400 }, quantity: 8, promotions: [hotDeal] }, 10_000);

    expect(pricing.promotionActive).toBe(false);
    expect(pricing.promotionsExpired).toBe(true);
    expect(pricing.unitPrice).toBe(400);
    expect(pricing.lineTotal).toBe(3200);
    expect(pricing.discountTotal).toBe(0);
  });

  it("selects the best active promotion when several future promo types are attached", () => {
    const coupon: CartPromotionSnapshot = {
      ...hotDeal,
      id: "coupon-10",
      type: "coupon",
      title: "Купон",
      label: "Купон",
      source: { kind: "coupon", id: "SALE10" },
      promotionalUnitPrice: 360,
      priority: 10,
    };

    const pricing = resolveCartLinePricing({ product: { price: 400 }, quantity: 1, promotions: [coupon, hotDeal] }, 5_000);

    expect(pricing.appliedPromotion?.id).toBe(hotDeal.id);
    expect(pricing.unitPrice).toBe(320);
  });
});

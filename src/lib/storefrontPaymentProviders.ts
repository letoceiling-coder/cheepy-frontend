/**
 * Способы оплаты для личного кабинета витрины: только активные провайдеры по флагу API
 * и без неиспользуемых в проекте шлюзов.
 */

import type { StoreAccountPaymentProvider } from "@/lib/api";

/** Ключ без учёта регистра. */
export function normalizePaymentProviderKey(raw: string): string {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

/** Не показываем в ЛК (интеграция отключена / не внедрена на витрине). */
const HIDDEN_ON_STOREFRONT = new Set([
  "stripe",
  "stripe_connect",
  "stripe_checkout",
  "paypal",
]);

const DISPLAY_LABELS: Record<string, string> = {
  tinkoff: "Т-Банк",
  tbank: "Т-Банк",
  t_bank: "Т-Банк",
  sber: "Сбер",
  sberbank: "Сбер",
  sbp: "СБП",
  yookassa: "ЮKassa",
  yoo_kassa: "ЮKassa",
  robokassa: "Robokassa",
  cloudpayments: "CloudPayments",
  atol: "АТОЛ (чеки)",
};

export function paymentProviderDisplayName(p: StoreAccountPaymentProvider): string {
  const t = p.title?.trim();
  if (t) return t;
  const key = normalizePaymentProviderKey(p.name);
  return DISPLAY_LABELS[key] ?? p.name.trim() || key;
}

/** Провайдеры, которые действительно подключены к магазину и нужны клиенту. */
export function filterVisibleStorefrontProviders(providers: StoreAccountPaymentProvider[]): StoreAccountPaymentProvider[] {
  return providers.filter((p) => {
    if (!p || p.is_active !== true) return false;
    const key = normalizePaymentProviderKey(p.name);
    if (!key || HIDDEN_ON_STOREFRONT.has(key)) return false;
    return true;
  });
}

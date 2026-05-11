/** Реферальный код из ?ref=CHEEPY-XXXX для регистрации и POST /referral/track. */

const LS_KEY = "cheepy_referrer_code";
const SESS_TRACK = "cheepy_ref_tracked_session";

export function persistReferralFromUrl(): void {
  if (typeof window === "undefined") return;
  try {
    const u = new URL(window.location.href);
    const ref = u.searchParams.get("ref")?.trim();
    if (!ref) return;
    const upper = ref.toUpperCase();
    if (/^CHEEPY-[A-Z0-9]{4,16}$/.test(upper)) {
      localStorage.setItem(LS_KEY, upper);
    }
  } catch {
    /* ignore */
  }
}

/** Валидный код из localStorage или null. */
export function peekReferralCode(): string | null {
  if (typeof localStorage === "undefined") return null;
  const v = localStorage.getItem(LS_KEY)?.trim().toUpperCase();
  return v && /^CHEEPY-[A-Z0-9]{4,16}$/.test(v) ? v : null;
}

export function clearReferralCode(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(LS_KEY);
}

/** Один ping на браузерную сессию для текущего кода в LS. */
export async function trackReferralClickIfNeeded(): Promise<void> {
  const code = peekReferralCode();
  if (!code || typeof sessionStorage === "undefined") return;
  if (sessionStorage.getItem(SESS_TRACK) === code) return;

  try {
    const { storefrontReferralTrackingApi } = await import("./api");
    await storefrontReferralTrackingApi.track({ code });
    sessionStorage.setItem(SESS_TRACK, code);
  } catch {
    /* не блокируем витрину */
  }
}

/** После OAuth / нового аккаунта: привязать реф (JWT). */
export async function tryAttachStoredReferral(): Promise<boolean> {
  const code = peekReferralCode();
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("customer_token") : null;
  if (!code || !token) return false;

  try {
    const { storeAccountApi } = await import("./api");
    await storeAccountApi.attachReferral({ code });
    clearReferralCode();
    return true;
  } catch {
    return false;
  }
}

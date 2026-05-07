import { useMemo, useSyncExternalStore } from "react";

const LS_KEY = "crm-activity-feed-read-ids";

let revision = 0;
const subscribers = new Set<() => void>();

export function subscribeActivityFeedRead(cb: () => void): () => void {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

function bumpRevision(): void {
  revision += 1;
  subscribers.forEach((cb) => cb());
}

/** Текущая ревизия хранилища (для useSyncExternalStore). */
export function getActivityFeedReadRevision(): number {
  return revision;
}

export function loadActivityFeedReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x) => typeof x === "string"));
  } catch {
    return new Set();
  }
}

export function persistActivityFeedReadIds(ids: Set<string>): void {
  localStorage.setItem(LS_KEY, JSON.stringify(Array.from(ids)));
  bumpRevision();
}

export function markActivityFeedItemsRead(ids: string[]): void {
  if (ids.length === 0) return;
  const next = loadActivityFeedReadIds();
  ids.forEach((id) => next.add(id));
  persistActivityFeedReadIds(next);
}

/** Количество непрочитанных в переданном списке по тому же localStorage, что и на странице уведомлений. */
export function useActivityFeedUnreadCount(items: readonly { id: string }[]): number {
  const rev = useSyncExternalStore(
    subscribeActivityFeedRead,
    getActivityFeedReadRevision,
    () => 0
  );

  return useMemo(() => {
    const read = loadActivityFeedReadIds();
    let n = 0;
    for (const item of items) {
      if (!read.has(item.id)) n++;
    }
    return n;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rev пробрасывает обновление из persist
  }, [items, rev]);
}

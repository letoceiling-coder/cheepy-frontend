import { useMemo, useCallback, useSyncExternalStore } from "react";
import { PageHeader } from "../components/PageHeader";
import { Bell, ShoppingCart, Shield, CreditCard, Settings, Store, MessageSquare, Check, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { crmStoreInsightsApi, type CrmActivityFeedItem } from "@/lib/api";
import {
  loadActivityFeedReadIds,
  markActivityFeedItemsRead,
  useActivityFeedUnreadCount,
  subscribeActivityFeedRead,
  getActivityFeedReadRevision,
} from "@/crm/lib/activityFeedRead";
import { navigateFromActivityFeed } from "@/crm/lib/activityFeedNavigate";

const typeIcons: Record<CrmActivityFeedItem["type"], React.ElementType> = {
  order: ShoppingCart,
  moderation: Shield,
  payment: CreditCard,
  system: Settings,
  seller: Store,
  review: MessageSquare,
};

function formatWhen(iso?: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return `${d.toLocaleDateString("ru-RU")} ${d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    return iso.slice(0, 16);
  }
}

export default function CrmNotificationsPage() {
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["crm-activity-feed"],
    queryFn: () => crmStoreInsightsApi.activityFeed(),
  });

  const items = data?.data ?? [];
  const unreadCount = useActivityFeedUnreadCount(items);

  const readLsRev = useSyncExternalStore(subscribeActivityFeedRead, getActivityFeedReadRevision, () => 0);
  const readSet = useMemo(() => loadActivityFeedReadIds(), [readLsRev]);

  const markAllRead = useCallback(() => {
    markActivityFeedItemsRead(items.map((i) => i.id));
  }, [items]);

  const handleRowActivate = useCallback(
    (item: CrmActivityFeedItem) => {
      markActivityFeedItemsRead([item.id]);
      navigateFromActivityFeed(navigate, item);
    },
    [navigate]
  );

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm">
        Не удалось загрузить ленту событий.
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Уведомления"
        description={`События из заказов и платёжных webhooks.${unreadCount > 0 ? ` ${unreadCount} непрочитанных.` : ""} Прочитанность хранится в браузере (как для колокольчика в шапке).`}
        actions={
          unreadCount > 0 ? (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <Check className="h-3 w-3" /> Прочитать все
            </button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16 gap-2 text-muted-foreground text-sm items-center">
          <Loader2 className="h-5 w-5 animate-spin" /> Загрузка…
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground border border-border rounded-lg p-8 text-center">
          Нет событий для отображения
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const read = readSet.has(n.id);
            const Icon = typeIcons[n.type] ?? Bell;

            return (
              <button
                type="button"
                key={n.id}
                title="Открыть связанную страницу"
                className={`group flex w-full text-left items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer hover:border-primary/30 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  read ? "border-border bg-card" : "border-primary/20 bg-primary/5"
                }`}
                onClick={() => handleRowActivate(n)}
              >
                <div className={`p-2 rounded-full shrink-0 ${read ? "bg-muted" : "bg-primary/10"}`}>
                  <Icon className={`h-4 w-4 ${read ? "text-muted-foreground" : "text-primary"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-sm ${read ? "text-foreground" : "font-semibold text-foreground"} group-hover:underline underline-offset-2`}
                    >
                      {n.title}
                    </p>
                    <span className="text-xs text-muted-foreground shrink-0">{formatWhen(n.created_at)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 break-words">{n.message}</p>
                </div>
                {!read ? <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" aria-hidden /> : null}
              </button>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Для полноценного inbox в БД потребуется отдельная таблица; сейчас показаны реальные события из API.
      </p>
    </div>
  );
}

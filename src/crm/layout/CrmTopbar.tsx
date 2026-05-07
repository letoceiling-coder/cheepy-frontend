import { useMemo, useSyncExternalStore } from "react";
import { Search, Bell, User, Shield, Building2, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useRbac } from "../rbac/RbacContext";
import { useTenant } from "../tenant/TenantContext";
import { crmStoreInsightsApi, type CrmActivityFeedItem } from "@/lib/api";
import {
  getActivityFeedReadRevision,
  loadActivityFeedReadIds,
  markActivityFeedItemsRead,
  subscribeActivityFeedRead,
  useActivityFeedUnreadCount,
} from "@/crm/lib/activityFeedRead";
import { navigateFromActivityFeed } from "@/crm/lib/activityFeedNavigate";

function formatRelative(iso?: string | null): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return iso.slice(0, 16);
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "только что";
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days} дн. назад`;
  try {
    return new Date(iso).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

const PREVIEW_LIMIT = 8;

export function CrmTopbar() {
  const navigate = useNavigate();
  const { currentRole, setRole, allRoles, currentUser } = useRbac();
  const { currentTenant, setTenantById, allTenants } = useTenant();

  const feedQuery = useQuery({
    queryKey: ["crm-activity-feed"],
    queryFn: () => crmStoreInsightsApi.activityFeed(),
    staleTime: 30_000,
  });

  const items = feedQuery.data?.data ?? [];
  const unreadCount = useActivityFeedUnreadCount(items);
  const readLsRev = useSyncExternalStore(subscribeActivityFeedRead, getActivityFeedReadRevision, () => 0);
  const readSet = useMemo(() => loadActivityFeedReadIds(), [readLsRev]);
  const preview = items.slice(0, PREVIEW_LIMIT);

  const badgeText = unreadCount > 99 ? "99+" : String(unreadCount);

  const onOpenItem = (item: CrmActivityFeedItem) => {
    markActivityFeedItemsRead([item.id]);
    navigateFromActivityFeed(navigate, item);
  };

  const markAllInFeed = () => {
    markActivityFeedItemsRead(items.map((i) => i.id));
  };

  return (
    <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card shrink-0">
      <div className="flex items-center gap-3">
        <SidebarTrigger />

        {/* Tenant Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 h-8 text-sm">
              <span className="text-base">{currentTenant.logo}</span>
              <span className="hidden sm:inline">{currentTenant.name}</span>
              <Building2 className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Маркетплейс</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {allTenants.map((t) => (
              <DropdownMenuItem
                key={t.id}
                onClick={() => setTenantById(t.id)}
                className={t.id === currentTenant.id ? "bg-accent/15" : ""}
              >
                <span className="mr-2">{t.logo}</span>
                <span className="flex-1">{t.name}</span>
                {t.id === currentTenant.id && <span className="text-primary text-xs">✓</span>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="relative w-64 hidden md:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Поиск..." className="pl-8 h-8 text-sm bg-muted/50 border-0" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Role Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs">
              <Shield className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{currentRole}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Симуляция роли</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {allRoles.map((r) => (
              <DropdownMenuItem
                key={r}
                onClick={() => setRole(r)}
                className={r === currentRole ? "bg-accent/15" : ""}
              >
                <span className="flex-1 text-sm">{r}</span>
                {r === currentRole && <span className="text-primary text-xs">✓</span>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications — тот же API и счётчик «прочитано», что на /crm/notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8 shrink-0" aria-label={`Уведомления${unreadCount > 0 ? `, непрочитанных ${unreadCount}` : ""}`}>
              <Bell className="h-4 w-4" />
              {unreadCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 min-h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-medium leading-none tabular-nums">
                  {badgeText}
                </span>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between gap-2 px-2 pt-2 pb-1">
              <span className="text-sm font-medium">Уведомления</span>
              <div className="flex items-center gap-2">
                {feedQuery.isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" /> : null}
                {unreadCount > 0 ? (
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline whitespace-nowrap"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAllInFeed();
                    }}
                  >
                    Прочитать все
                  </button>
                ) : null}
              </div>
            </div>
            <DropdownMenuSeparator />
            {feedQuery.isError ? (
              <div className="px-3 py-2 text-xs text-destructive">Не удалось загрузить события</div>
            ) : feedQuery.isLoading && items.length === 0 ? (
              <div className="px-3 py-6 text-xs text-muted-foreground text-center">Загрузка…</div>
            ) : preview.length === 0 ? (
              <div className="px-3 py-6 text-xs text-muted-foreground text-center">Нет событий</div>
            ) : (
              <>
                {preview.map((item) => {
                  const read = readSet.has(item.id);

                  return (
                    <DropdownMenuItem
                      key={item.id}
                      className={`flex flex-col items-start gap-0.5 py-2.5 cursor-pointer whitespace-normal min-h-0 max-w-full [&>span]:w-full ${!read ? "bg-primary/5" : ""}`}
                      onClick={() => onOpenItem(item)}
                    >
                      <span className={`text-sm ${read ? "text-foreground" : "font-semibold text-foreground"}`}>{item.title}</span>
                      <span className="text-xs text-muted-foreground line-clamp-2">{item.message}</span>
                      <span className="text-[10px] text-muted-foreground">{formatRelative(item.created_at)}</span>
                    </DropdownMenuItem>
                  );
                })}
                {items.length > PREVIEW_LIMIT ? (
                  <div className="px-3 py-2 text-[10px] text-muted-foreground text-center">
                    Показаны последние {PREVIEW_LIMIT} из {items.length}
                  </div>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="text-primary cursor-pointer">
                  <Link to="/crm/notifications">Все уведомления</Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 h-8">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm hidden sm:inline">{currentUser.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground">{currentUser.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Профиль</DropdownMenuItem>
            <DropdownMenuItem>Настройки</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Выйти</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

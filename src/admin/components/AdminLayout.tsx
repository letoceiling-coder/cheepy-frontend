import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { healthApi, parserApi } from "@/lib/api";
import { useAdminAuth } from "../contexts/AdminAuthContext";
import { useQuery } from "@tanstack/react-query";
import { useParserChannel } from "@/hooks/useParserChannel";
import { summarizeParserActivity } from "@/admin/parserActivity";
import { LogOut, Circle, Loader2 } from "lucide-react";

export function AdminLayout() {
  const { user, logout } = useAdminAuth();
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);

  useParserChannel(); // Real-time parser status via WebSocket

  const { data: parserStatus } = useQuery({
    queryKey: ["parser-status-header"],
    queryFn: () => parserApi.status(),
    refetchInterval: 30000, // Fallback; WebSocket invalidates on events
  });

  useEffect(() => {
    healthApi.check()
      .then((r) => setApiHealthy(r.ok))
      .catch(() => setApiHealthy(false));
    const id = setInterval(() => {
      healthApi.check()
        .then((r) => setApiHealthy(r.ok))
        .catch(() => setApiHealthy(false));
    }, 60000);
    return () => clearInterval(id);
  }, []);

  const lastFailed = parserStatus?.last_completed?.status === "failed";
  const act = summarizeParserActivity({
    parserState: parserStatus?.parser_state,
    daemonEnabled: parserStatus?.daemon_enabled,
    jobInDbActive: !!parserStatus?.is_running,
    queueParser: parserStatus?.queue_parser_size,
    queuePhotos: parserStatus?.queue_photos_size,
    queueWorkersStalled: parserStatus?.queue_workers_stalled,
    photoQueueWorkersStalled: parserStatus?.photo_queue_workers_stalled,
    lastJobFailed: lastFailed,
  });
  const parserLabel =
    act.tone === "active"
      ? "Парсер работает"
      : act.tone === "error"
        ? `Парсер: ${act.shortLabel}`
        : act.tone === "paused"
          ? `Парсер: ${act.shortLabel}`
          : act.tone === "queue"
            ? "Парсер: очередь"
            : act.tone === "idle"
              ? "Парсер: ожидание"
              : "Парсер: остановлен";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card shrink-0">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="mr-4" />
              <h1 className="text-lg font-semibold text-foreground">Админ-панель</h1>
              <span
                className="flex items-center gap-1 text-xs"
                title={apiHealthy === true ? "API доступен" : apiHealthy === false ? "API недоступен" : "Проверка..."}
              >
                {apiHealthy === null ? (
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                ) : (
                  <Circle
                    className={`h-2.5 w-2.5 ${apiHealthy ? "fill-green-500 text-green-500" : "fill-destructive text-destructive"}`}
                  />
                )}
              </span>
              <span
                className="flex items-center gap-1 text-xs text-muted-foreground"
                title={act.detail}
              >
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${
                    act.tone === "active" || act.tone === "queue"
                      ? "bg-emerald-500 animate-pulse"
                      : act.tone === "error"
                        ? "bg-destructive"
                        : act.tone === "paused"
                          ? "bg-amber-500"
                          : act.tone === "idle"
                            ? "bg-sky-500/80"
                            : "bg-muted-foreground/50"
                  }`}
                />
                <span className="hidden sm:inline">{parserLabel}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              {user && <span className="text-sm text-muted-foreground">{user.email}</span>}
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-1" />Выход
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

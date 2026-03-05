import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { healthApi, parserApi } from "@/lib/api";
import { useAdminAuth } from "../contexts/AdminAuthContext";
import { useQuery } from "@tanstack/react-query";
import { useParserChannel } from "@/hooks/useParserChannel";
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
  const parserLabel = parserStatus?.is_running ? "Парсер работает" : lastFailed ? "Парсер: ошибка" : "Парсер: ожидание";

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
                title={parserLabel}
              >
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${
                    parserStatus?.is_running
                      ? "bg-emerald-500 animate-pulse"
                      : lastFailed
                        ? "bg-destructive"
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

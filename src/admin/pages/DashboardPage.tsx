import { useState, useEffect } from "react";
import { Package, PlusCircle, AlertTriangle, Clock, Brain, Bug, Layers, Activity, Cpu, Database, RotateCcw, Trash2, RefreshCw } from "lucide-react";
import { StatCard } from "../components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dashboardApi, parserApi, systemApi, logsApi } from "@/lib/api";
import { summarizeParserActivity } from "@/admin/parserActivity";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  inactive: "bg-muted text-muted-foreground",
  error: "bg-destructive/10 text-destructive",
  running: "bg-emerald-100 text-emerald-800",
  stopped: "bg-muted text-muted-foreground",
  paused: "bg-amber-100 text-amber-800",
  idle: "bg-sky-100 text-sky-900",
  queue: "bg-emerald-100 text-emerald-800",
};

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [sysAction, setSysAction] = useState<string | null>(null);

  const { data: d, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardApi.get(),
  });

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ["parser-stats"],
    queryFn: () => parserApi.stats(),
    refetchInterval: 30000, // Fallback; WebSocket invalidates on events
  });

  const { data: systemStatus, refetch: refetchSystem } = useQuery({
    queryKey: ["system-status"],
    queryFn: () => systemApi.status(),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: diagnostics } = useQuery({
    queryKey: ["parser-diagnostics"],
    queryFn: () => parserApi.diagnostics(),
    refetchInterval: 10000,
  });

  /** Dev-only: trace which API feeds the “Ошибки сегодня” card (not parser_logs-only — includes products with status=error). */
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const p = d?.products;
    if (!p) return;
    const merged =
      diagnostics?.errors_today ??
      systemStatus?.errors_today ??
      stats?.errors_today ??
      p.errors;
    console.log("[admin dashboard] ERROR SOURCE", {
      displayed_errors_today: merged,
      diagnostics_errors_today: diagnostics?.errors_today,
      diagnostics_breakdown: diagnostics?.errors_today_breakdown,
      system_errors_today: systemStatus?.errors_today,
      system_error_metrics: systemStatus?.error_metrics,
      stats_errors_today: stats?.errors_today,
      stats_breakdown: stats?.errors_today_breakdown,
      dashboard_products_errors_field: p.errors,
      errors_all_time_products: p.errors_all_time_products,
      last_errors_preview: diagnostics?.last_errors?.slice(0, 3),
    });
  }, [d, diagnostics, systemStatus, stats]);

  const refetchAll = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["parser-diagnostics"] });
    refetchStats();
    refetchSystem();
  };

  const handleQueueFlush = async () => {
    setSysAction("flush");
    try {
      await parserApi.queueFlush();
      refetchAll();
      toast.success("Очереди сброшены");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err ? String((err as { message: string }).message) : "Ошибка";
      toast.error(msg);
    } finally {
      setSysAction(null);
    }
  };
  const handleLogsClear = async () => {
    setSysAction("logs");
    try {
      await logsApi.clear();
      refetchAll();
      toast.success("Логи и ошибки очищены");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err ? String((err as { message: string }).message) : "Ошибка";
      toast.error(msg);
    } finally {
      setSysAction(null);
    }
  };
  const handleQueueRestart = async () => {
    setSysAction("restart");
    try {
      await parserApi.queueRestart();
      refetchAll();
      toast.success("Воркеры очередей перезапущены");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err ? String((err as { message: string }).message) : "Ошибка";
      toast.error(msg);
    } finally {
      setSysAction(null);
    }
  };
  const handleReleaseLock = async () => {
    setSysAction("lock");
    try {
      await parserApi.releaseLock();
      refetchAll();
      toast.success("Блокировка снята");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err ? String((err as { message: string }).message) : "Ошибка";
      toast.error(msg);
    } finally {
      setSysAction(null);
    }
  };

  if (isLoading || !d) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="text-destructive">Ошибка загрузки</div>
      </div>
    );
  }

  const p = d.products;
  const parser = d.parser;
  const s = systemStatus ?? stats ?? null;
  const isRunning = !!(diagnostics?.parser_running ?? s?.parser_running ?? parser.is_running);
  const parserAct = summarizeParserActivity({
    parserState: diagnostics?.parser_state,
    daemonEnabled: diagnostics?.daemon_enabled,
    jobInDbActive: isRunning,
    queueParser: diagnostics?.parser_queue_size,
    queuePhotos: diagnostics?.photos_queue_size,
    queueWorkersStalled: diagnostics?.queue_workers_stalled,
    photoQueueWorkersStalled: diagnostics?.photo_queue_workers_stalled,
    lastJobFailed: false,
  });
  const parserCardClass =
    parserAct.tone === "active" || parserAct.tone === "queue"
      ? statusColors.queue
      : parserAct.tone === "idle"
        ? statusColors.idle
        : parserAct.tone === "paused"
          ? statusColors.paused
          : parserAct.tone === "error"
            ? statusColors.error
            : statusColors.stopped;
  const parserCardText =
    parserAct.tone === "active"
      ? "Работает"
      : parserAct.tone === "queue"
        ? "Очередь"
        : parserAct.tone === "idle"
          ? "Демон: ожидание"
          : parserAct.tone === "paused"
            ? parserAct.shortLabel
            : parserAct.tone === "error"
              ? parserAct.shortLabel
              : "Остановлен";
  const lastRun = s?.last_parser_run ?? parser.last_run_at;
  const productsTotal = s?.products_total ?? p.total;
  const productsToday = s?.products_today ?? p.new_today;
  /** Always take the latest snapshot from polling — never merge or fall back to stale dashboard.products.errors when live endpoints omit the field. */
  const errorsToday =
    diagnostics?.errors_today ??
    systemStatus?.errors_today ??
    stats?.errors_today ??
    p.errors;
  const sys = systemStatus ?? null;

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Всего объявлений" value={productsTotal.toLocaleString()} icon={Package} />
        <StatCard title="Новые сегодня" value={productsToday.toLocaleString()} icon={PlusCircle} variant="success" />
        <StatCard title="Скрыто" value={p.hidden.toLocaleString()} icon={AlertTriangle} variant="warning" />
        <StatCard title="Ошибки сегодня" value={errorsToday.toLocaleString()} icon={AlertTriangle} variant="error" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Bug className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Парсер</p>
              <Badge className={parserCardClass} title={parserAct.detail}>
                {parserCardText}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Layers className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Очередь</p>
              <p className="font-medium">{sys?.queue_size ?? s?.queue_size ?? "—"} (воркеров: {sys?.queue_workers ?? "—"})</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Database className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Redis</p>
              <Badge className={sys?.redis_status === "connected" ? statusColors.active : statusColors.error}>
                {sys?.redis_status ?? "—"}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Activity className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">WebSocket</p>
              <Badge className={sys?.websocket === "running" ? statusColors.active : statusColors.stopped}>
                {sys?.websocket ?? "—"}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Cpu className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">CPU / Memory / Disk</p>
              <p className="font-medium text-xs">
                {sys?.cpu_load ?? "—"} / {sys?.memory_usage ?? "—"}
                {sys?.disk != null && sys.disk.total > 0
                  ? ` / ${sys.disk.used}GB / ${sys.disk.total}GB`
                  : sys?.disk != null
                    ? " / —"
                    : ""}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Последний парсинг</p>
              <p className="font-medium text-sm">{lastRun ? new Date(lastRun).toLocaleString("ru") : "—"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Управление системой</CardTitle></CardHeader>
        <CardContent>
          {diagnostics?.proxy_blocked && (
            <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
              <p className="font-medium text-destructive">Прокси заблокирован донором</p>
              <p className="text-muted-foreground">
                Кулдаун активен до {diagnostics.proxy_blocked_until ? new Date(diagnostics.proxy_blocked_until).toLocaleString("ru") : "неизвестно"}.
                Лишние запросы через прокси временно остановлены.
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleQueueFlush} disabled={!!sysAction || isRunning} title="Очистить все очереди">
              <RotateCcw className="h-4 w-4 mr-1" />Сброс очередей
            </Button>
            <Button variant="outline" onClick={handleLogsClear} disabled={!!sysAction} title="Очистить логи и записи об ошибках">
              <Trash2 className="h-4 w-4 mr-1" />Очистка ошибок
            </Button>
            <Button variant="outline" onClick={handleQueueRestart} disabled={!!sysAction} title="Перезапустить воркеры очередей">
              <RefreshCw className="h-4 w-4 mr-1" />Восстановить воркеры
            </Button>
            <Button variant="outline" onClick={handleReleaseLock} disabled={!!sysAction || isRunning} title="Снять блокировку парсера">
              Освободить блокировку
            </Button>
          </div>
        </CardContent>
      </Card>

      {diagnostics && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Диагностика очередей</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Очередь парсера</p>
                <p className="font-medium">{diagnostics.parser_queue_size ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Очередь фото</p>
                <p className="font-medium">{diagnostics.photos_queue_size ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Failed jobs</p>
                <p className={`font-medium ${(diagnostics.failed_jobs_count ?? 0) > 0 ? "text-destructive" : ""}`}>
                  {diagnostics.failed_jobs_count ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Блокировка</p>
                <Badge variant={diagnostics.parser_lock_status === "held" ? "destructive" : "secondary"}>
                  {diagnostics.parser_lock_status === "held" ? "Удерживается" : "Свободна"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Brain className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Категории</p>
              <p className="font-medium">{d.categories.total} (включено: {d.categories.enabled})</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Обновлено: {sys?.timestamp ? new Date(sys.timestamp).toLocaleTimeString("ru") : "—"}</span>
            {(sys?.requests_per_minute !== undefined || sys?.blocked_requests !== undefined || sys?.retry_count !== undefined) && (
              <span className="text-xs text-muted-foreground">
                RPM: {sys?.requests_per_minute ?? "—"} | Блоки: {sys?.blocked_requests ?? "—"} | Повторы: {sys?.retry_count ?? "—"}
              </span>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Последние события</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(d.recent_logs ?? []).slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-start gap-3 text-sm">
                <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                  log.level === "error" ? "bg-destructive" : log.level === "warn" ? "bg-amber-500" : "bg-emerald-500"
                }`} />
                <span className="text-muted-foreground shrink-0 w-14">
                  {new Date(log.logged_at).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <Badge variant="outline" className="shrink-0 text-xs">{log.module}</Badge>
                <span className="text-foreground">{log.message}</span>
              </div>
            ))}
            {(!d.recent_logs || d.recent_logs.length === 0) && (
              <p className="text-muted-foreground text-sm">Нет событий</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

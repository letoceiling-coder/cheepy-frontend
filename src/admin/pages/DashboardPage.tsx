import { Package, PlusCircle, AlertTriangle, Clock, Brain, Bug, Layers, Activity, Cpu, Database, HardDrive } from "lucide-react";
import { StatCard } from "../components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { dashboardApi, parserApi, systemApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  inactive: "bg-muted text-muted-foreground",
  error: "bg-destructive/10 text-destructive",
  running: "bg-emerald-100 text-emerald-800",
  stopped: "bg-muted text-muted-foreground",
  paused: "bg-amber-100 text-amber-800",
};

export default function DashboardPage() {
  const { data: d, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardApi.get(),
  });

  const { data: stats } = useQuery({
    queryKey: ["parser-stats"],
    queryFn: () => parserApi.stats(),
    refetchInterval: 30000, // Fallback; WebSocket invalidates on events
  });

  const { data: systemStatus } = useQuery({
    queryKey: ["system-status"],
    queryFn: () => systemApi.status(),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

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
  const isRunning = s?.parser_running ?? parser.is_running;
  const lastRun = s?.last_parser_run ?? parser.last_run_at;
  const productsTotal = s?.products_total ?? p.total;
  const productsToday = s?.products_today ?? p.new_today;
  const errorsToday = s?.errors_today ?? p.errors;
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
              <Badge className={isRunning ? statusColors.running : statusColors.stopped}>
                {isRunning ? "Работает" : "Остановлен"}
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
              <p className="text-sm text-muted-foreground">CPU / Память</p>
              <p className="font-medium text-xs">{sys?.cpu_load ?? "—"} / {sys?.memory_usage ?? "—"}</p>
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
        {((sys?.disk_total ?? 0) > 0) && (
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <HardDrive className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Диск</p>
                <p className="font-medium text-sm">{sys?.disk_used ?? "—"} / {sys?.disk_total ?? "—"} GB (свободно: {sys?.disk_free ?? "—"} GB)</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
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

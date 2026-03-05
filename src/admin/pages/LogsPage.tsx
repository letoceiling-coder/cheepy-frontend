import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Loader2 } from "lucide-react";
import { logsApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const levelColors: Record<string, string> = {
  info: "bg-emerald-100 text-emerald-800",
  warn: "bg-amber-100 text-amber-800",
  error: "bg-destructive/10 text-destructive",
  debug: "bg-muted text-muted-foreground",
};

export default function LogsPage() {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [jobId, setJobId] = useState<string>("");

  const { data, isLoading } = useQuery({
    queryKey: ["logs", levelFilter, moduleFilter, jobId, search],
    queryFn: () =>
      logsApi.list({
        level: levelFilter === "all" ? undefined : levelFilter,
        module: moduleFilter === "all" ? undefined : moduleFilter,
        job_id: jobId ? Number(jobId) : undefined,
        search: search.trim() || undefined,
        per_page: 100,
      }),
  });

  const items = data?.data ?? [];
  const modules = [...new Set(items.map((l) => l.module))];
  const filtered =
    search.trim() && !data
      ? []
      : items.filter((l) => !search.trim() || l.message.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Логи</h2>
        <Button variant="outline" size="sm" disabled><Download className="h-4 w-4 mr-1" />Экспорт</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Input placeholder="job_id" value={jobId} onChange={(e) => setJobId(e.target.value)} className="w-24" />
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все модули</SelectItem>
                {modules.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8"><Loader2 className="h-5 w-5 animate-spin" />Загрузка...</div>
          ) : (
            <>
              <div className="space-y-2">
                {filtered.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-sm border">
                    <span className="text-muted-foreground shrink-0 w-16 font-mono text-xs mt-0.5">
                      {new Date(log.logged_at).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                    <Badge className={`shrink-0 ${levelColors[log.level] ?? ""}`}>{log.level}</Badge>
                    <Badge variant="outline" className="shrink-0">{log.module}</Badge>
                    {log.job_id != null && <Badge variant="secondary" className="shrink-0">job {log.job_id}</Badge>}
                    <div className="flex-1">
                      <p>{log.message}</p>
                      {log.context && Object.keys(log.context).length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">{JSON.stringify(log.context)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">Показано {filtered.length} записей</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

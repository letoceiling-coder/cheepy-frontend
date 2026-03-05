import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ban, Plus, Trash2, Loader2 } from "lucide-react";
import { excludedApi, type ExcludedRule } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const typeLabels: Record<string, string> = { word: "Слово", phrase: "Фраза", regex: "Regex" };
const actionLabels: Record<string, string> = { delete: "Удалить", replace: "Заменить", hide: "Скрыть", flag: "Пометить" };
const scopeLabels: Record<string, string> = { global: "Глобально", category: "Категория", product_type: "Тип товара", temporary: "Временное" };
const actionColors: Record<string, string> = {
  delete: "bg-destructive/10 text-destructive",
  replace: "bg-amber-100 text-amber-800",
  hide: "bg-muted text-muted-foreground",
  flag: "bg-blue-100 text-blue-800",
};
const scopeColors: Record<string, string> = {
  global: "bg-primary/10 text-primary",
  category: "bg-emerald-100 text-emerald-800",
  product_type: "bg-violet-100 text-violet-800",
  temporary: "bg-orange-100 text-orange-800",
};

export default function ExcludedPage() {
  const [newPattern, setNewPattern] = useState("");
  const [newType, setNewType] = useState<ExcludedRule["type"]>("word");
  const [newAction, setNewAction] = useState<ExcludedRule["action"]>("delete");
  const [newScope, setNewScope] = useState<ExcludedRule["scope"]>("global");
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["excluded", scopeFilter],
    queryFn: () => excludedApi.list(scopeFilter === "all" ? undefined : { scope: scopeFilter }),
  });

  const rules = (data?.data ?? []) as ExcludedRule[];
  const filtered = scopeFilter === "all" ? rules : rules.filter((r) => r.scope === scopeFilter);

  const createMutation = useMutation({
    mutationFn: (d: Partial<ExcludedRule>) => excludedApi.create(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["excluded"] });
      toast.success("Правило добавлено");
      setNewPattern("");
    },
    onError: () => toast.error("Ошибка создания"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => excludedApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["excluded"] });
      toast.success("Правило удалено");
    },
    onError: () => toast.error("Ошибка"),
  });

  const handleAdd = () => {
    if (!newPattern.trim()) return;
    createMutation.mutate({ pattern: newPattern.trim(), type: newType, action: newAction, scope: newScope, is_active: true, priority: 0 });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold">Исключающие слова</h2>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <Input placeholder="Слово или фраза..." value={newPattern} onChange={(e) => setNewPattern(e.target.value)} className="flex-1 min-w-[200px]" />
            <Select value={newType} onValueChange={(v: ExcludedRule["type"]) => setNewType(v)}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="word">Слово</SelectItem>
                <SelectItem value="phrase">Фраза</SelectItem>
                <SelectItem value="regex">Regex</SelectItem>
              </SelectContent>
            </Select>
            <Select value={newAction} onValueChange={(v: ExcludedRule["action"]) => setNewAction(v)}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="delete">Удалить</SelectItem>
                <SelectItem value="replace">Заменить</SelectItem>
                <SelectItem value="hide">Скрыть</SelectItem>
                <SelectItem value="flag">Пометить</SelectItem>
              </SelectContent>
            </Select>
            <Select value={newScope} onValueChange={(v: ExcludedRule["scope"]) => setNewScope(v)}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Глобально</SelectItem>
                <SelectItem value="category">Категория</SelectItem>
                <SelectItem value="product_type">Тип товара</SelectItem>
                <SelectItem value="temporary">Временное</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAdd} disabled={!newPattern.trim() || createMutation.isPending}><Plus className="h-4 w-4 mr-1" />Добавить</Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={scopeFilter} onValueChange={setScopeFilter}>
        <TabsList>
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="global">Глобальные</TabsTrigger>
          <TabsTrigger value="category">По категории</TabsTrigger>
          <TabsTrigger value="product_type">По типу</TabsTrigger>
          <TabsTrigger value="temporary">Временные</TabsTrigger>
        </TabsList>

        <Card className="mt-4">
          <CardContent className="p-4">
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground py-8"><Loader2 className="h-5 w-5 animate-spin" />Загрузка...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Выражение</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Действие</TableHead>
                    <TableHead>Область</TableHead>
                    <TableHead>Замена</TableHead>
                    <TableHead>Вкл.</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-sm">{r.pattern}</TableCell>
                      <TableCell><Badge variant="outline">{typeLabels[r.type]}</Badge></TableCell>
                      <TableCell><Badge className={actionColors[r.action]}>{actionLabels[r.action]}</Badge></TableCell>
                      <TableCell><Badge className={scopeColors[r.scope]}>{scopeLabels[r.scope]}{r.category_id ? ` (${r.category_id})` : ""}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{r.replacement ?? "—"}</TableCell>
                      <TableCell><Badge variant={r.is_active ? "default" : "secondary"}>{r.is_active ? "Да" : "Нет"}</Badge></TableCell>
                      <TableCell><Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(r.id)} disabled={deleteMutation.isPending}><Trash2 className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Нет правил</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}

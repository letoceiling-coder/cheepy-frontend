import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, SlidersHorizontal, Loader2 } from "lucide-react";
import { filtersApi, categoriesApi, type FilterConfig, type Category } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const displayTypeLabels: Record<string, string> = {
  checkbox: "Чекбоксы",
  select: "Выпадающий список",
  radio: "Радио",
  range: "Диапазон",
};

function flatCategories(cats: Category[], prefix = ""): { id: number; name: string }[] {
  const result: { id: number; name: string }[] = [];
  for (const c of cats) {
    result.push({ id: c.id, name: prefix + c.name });
    if (c.children?.length) result.push(...flatCategories(c.children, prefix + c.name + " / "));
  }
  return result;
}

export default function FiltersPage() {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: catsData } = useQuery({
    queryKey: ["categories", "tree"],
    queryFn: () => categoriesApi.list({ tree: true }),
  });

  const { data: filtersData, isLoading } = useQuery({
    queryKey: ["filters", categoryFilter],
    queryFn: () => filtersApi.list(categoryFilter === "all" ? undefined : Number(categoryFilter)),
  });

  const filters = filtersData?.data ?? [];
  const categories = useMemo(() => flatCategories(catsData?.data ?? []), [catsData?.data]);
  const filtered = categoryFilter === "all" ? filters : filters.filter((f) => f.category_id === Number(categoryFilter));

  const updateMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) => filtersApi.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["filters"] });
      toast.success("Фильтр обновлён");
    },
    onError: () => toast.error("Ошибка"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => filtersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["filters"] });
      toast.success("Фильтр удалён");
    },
    onError: () => toast.error("Ошибка"),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<FilterConfig>) => filtersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["filters"] });
      toast.success("Фильтр создан");
    },
    onError: () => toast.error("Ошибка создания"),
  });

  const handleAdd = () => {
    const catId = categoryFilter !== "all" ? Number(categoryFilter) : categories[0]?.id;
    if (!catId) {
      toast.error("Выберите категорию");
      return;
    }
    createMutation.mutate({
      category_id: catId,
      attr_name: "price",
      display_name: "Цена",
      display_type: "range",
      sort_order: 0,
      is_active: true,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold flex items-center gap-2"><SlidersHorizontal className="h-6 w-6" />Настройка фильтров</h2>
        <Button onClick={handleAdd} disabled={createMutation.isPending}><Plus className="h-4 w-4 mr-1" />Добавить фильтр</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="mb-4">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Категория" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8"><Loader2 className="h-5 w-5 animate-spin" />Загрузка...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Атрибут</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Тип отображения</TableHead>
                  <TableHead>Порядок</TableHead>
                  <TableHead>Вкл.</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((f) => {
                  const cat = categories.find((c) => c.id === f.category_id);
                  return (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.attr_name}</TableCell>
                      <TableCell><Badge variant="outline">{cat?.name ?? f.category_id}</Badge></TableCell>
                      <TableCell>{displayTypeLabels[f.display_type] ?? f.display_type}</TableCell>
                      <TableCell className="text-muted-foreground">{f.sort_order}</TableCell>
                      <TableCell>
                        <Switch
                          checked={f.is_active}
                          onCheckedChange={(v) => updateMutation.mutate({ id: f.id, is_active: v })}
                          disabled={updateMutation.isPending}
                        />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(f.id)} disabled={deleteMutation.isPending}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Нет фильтров</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

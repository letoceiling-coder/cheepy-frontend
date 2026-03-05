import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Eye, Sparkles, Search, ExternalLink, Loader2 } from "lucide-react";
import { productsApi, categoriesApi, sellersApi, type Product } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const statusBadge = (s: string) => {
  const m: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-800",
    hidden: "bg-muted text-muted-foreground",
    excluded: "bg-amber-100 text-amber-800",
    error: "bg-destructive/10 text-destructive",
    pending: "bg-secondary text-secondary-foreground",
  };
  return <Badge className={m[s] ?? "bg-muted"}>{s}</Badge>;
};

export default function ProductsPage() {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sellerFilter, setSellerFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { data: categoriesData } = useQuery({
    queryKey: ["categories-flat"],
    queryFn: () => categoriesApi.list({ tree: false, per_page: 500 }),
  });
  const { data: sellersData } = useQuery({
    queryKey: ["sellers-list"],
    queryFn: () => sellersApi.list({ per_page: 500 }),
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["products", search, statusFilter, categoryFilter, sellerFilter, page],
    queryFn: () =>
      productsApi.list({
        search: search || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        category_id: categoryFilter === "all" ? undefined : Number(categoryFilter),
        seller_id: sellerFilter === "all" ? undefined : Number(sellerFilter),
        page,
        per_page: 20,
      }),
  });

  const categories = categoriesData?.data ?? [];
  const sellers = sellersData?.data ?? [];

  const products = data?.data ?? [];
  const meta = data?.meta;
  const filtered = products;

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((p) => p.id)));
  };

  const toggle = (id: number) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    try {
      await productsApi.bulk(Array.from(selected), "delete");
      setSelected(new Set());
      refetch();
      toast.success("Удалено");
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold">Объявления</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={!selected.size} onClick={handleBulkDelete}>
            <Trash2 className="h-4 w-4 mr-1" />Удалить ({selected.size})
          </Button>
          <Button variant="outline" size="sm" disabled={!selected.size}>
            <Eye className="h-4 w-4 mr-1" />Опубликовать
          </Button>
          <Button variant="outline" size="sm" disabled><Sparkles className="h-4 w-4 mr-1" />AI</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="active">Активные</SelectItem>
                <SelectItem value="hidden">Скрытые</SelectItem>
                <SelectItem value="excluded">Исключены</SelectItem>
                <SelectItem value="error">Ошибки</SelectItem>
                <SelectItem value="pending">Ожидание</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Категория" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sellerFilter} onValueChange={(v) => { setSellerFilter(v); setPage(1); }}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Продавец" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все продавцы</SelectItem>
                {sellers.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"><Checkbox checked={selected.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} /></TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead className="text-right">Цена</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Фото</TableHead>
                  <TableHead>Парсинг</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                )}
                {error && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-destructive">Ошибка загрузки</TableCell></TableRow>
                )}
                {!isLoading && !error && filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell><Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggle(p.id)} /></TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">{p.title}</TableCell>
                    <TableCell className="text-muted-foreground">{p.category?.name ?? "—"}</TableCell>
                    <TableCell className="text-right">{p.price ?? (p.price_raw ? `${p.price_raw} ₽` : "—")}</TableCell>
                    <TableCell>{statusBadge(p.status)}</TableCell>
                    <TableCell>{p.photos_count}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{p.parsed_at ? new Date(p.parsed_at).toLocaleDateString("ru") : "—"}</TableCell>
                    <TableCell>
                      <Link to={`/admin/products/${p.id}`}><Button variant="ghost" size="icon"><ExternalLink className="h-4 w-4" /></Button></Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-sm text-muted-foreground">
              Показано {filtered.length} из {meta?.total ?? 0} (стр. {page} из {meta?.last_page ?? 1})
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                ← Назад
              </Button>
              <Button variant="outline" size="sm" disabled={!meta || page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>
                Далее →
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

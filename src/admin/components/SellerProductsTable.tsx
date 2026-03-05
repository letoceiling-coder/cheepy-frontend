import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ExternalLink, Loader2 } from "lucide-react";
import { sellersApi, categoriesApi, type Product } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const PRODUCTS_PER_PAGE = 30;

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

interface SellerProductsTableProps {
  sellerId: string | number;
}

export function SellerProductsTable({ sellerId }: SellerProductsTableProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { data: categoriesData } = useQuery({
    queryKey: ["categories-flat"],
    queryFn: () => categoriesApi.list({ tree: false, per_page: 500 }),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-seller-products", sellerId, search, categoryFilter, statusFilter, page],
    queryFn: () =>
      productsApi.list({
        seller_id: Number(sellerId),
        search: search || undefined,
        category_id: categoryFilter === "all" ? undefined : Number(categoryFilter),
        status: statusFilter === "all" ? undefined : statusFilter,
        page,
        per_page: PRODUCTS_PER_PAGE,
      }),
    enabled: !!sellerId,
  });

  const products = data?.data ?? [];
  const meta = data?.meta;
  const categories = categoriesData?.data ?? [];

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-4">Товары продавца</h3>
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Select
            value={categoryFilter}
            onValueChange={(v) => {
              setCategoryFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Категория" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все категории</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="active">Активные</SelectItem>
              <SelectItem value="hidden">Скрытые</SelectItem>
              <SelectItem value="excluded">Исключены</SelectItem>
              <SelectItem value="error">Ошибки</SelectItem>
              <SelectItem value="pending">Ожидание</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Товар</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead className="text-right">Цена</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Создан</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              )}
              {error && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-destructive">
                    Ошибка загрузки
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && !error && products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">{p.title}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {p.category?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {p.price ?? (p.price_raw ? `${p.price_raw} ₽` : "—")}
                  </TableCell>
                  <TableCell>{statusBadge(p.status)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {p.parsed_at ? new Date(p.parsed_at).toLocaleDateString("ru") : "—"}
                  </TableCell>
                  <TableCell>
                    <Link to={`/admin/products/${p.id}`}>
                      <Button variant="ghost" size="icon" title="Открыть">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && !error && products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Товары не найдены
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between mt-3">
          <p className="text-sm text-muted-foreground">
            Показано {products.length} из {meta?.total ?? 0} (стр. {page} из {meta?.last_page ?? 1})
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Назад
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!meta || page >= meta.last_page}
              onClick={() => setPage((p) => p + 1)}
            >
              Далее →
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

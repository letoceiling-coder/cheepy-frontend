import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ExternalLink, Loader2, Store } from "lucide-react";
import { sellersApi, type Seller } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const DEFAULT_PER_PAGE = 20;

export default function SellersPage() {
  const [search, setSearch] = useState("");
  const [pavilionFilter, setPavilionFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-sellers", search, pavilionFilter, page],
    queryFn: () =>
      sellersApi.list({
        search: search || undefined,
        pavilion: pavilionFilter === "all" ? undefined : pavilionFilter,
        page,
        per_page: DEFAULT_PER_PAGE,
      }),
  });

  const sellers = data?.data ?? [];
  const meta = data?.meta;

  // Collect unique pavilions for filter (from current data - could be from a separate endpoint)
  const pavilions = Array.from(new Set(sellers.map((s) => s.pavilion).filter(Boolean))) as string[];
  const hasPavilionFilter = pavilionFilter !== "all";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold">Продавцы</h2>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск продавца..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Input
              placeholder="Фильтр по корпусу..."
              value={pavilionFilter === "all" ? "" : pavilionFilter}
              onChange={(e) => {
                const v = e.target.value.trim();
                setPavilionFilter(v || "all");
                setPage(1);
              }}
              className="w-48"
            />
          </div>

          <div className="rounded-lg border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">Аватар</TableHead>
                  <TableHead>Продавец</TableHead>
                  <TableHead>Корпус</TableHead>
                  <TableHead className="text-right">Товаров</TableHead>
                  <TableHead>Создан</TableHead>
                  <TableHead className="w-20"></TableHead>
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
                {!isLoading && !error && sellers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="h-10 w-10 rounded-full overflow-hidden bg-muted shrink-0">
                        {s.avatar ? (
                          <img src={s.avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Store className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground">{s.pavilion ?? "—"}</TableCell>
                    <TableCell className="text-right">{s.products_count ?? 0}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {s.created_at ? new Date(s.created_at).toLocaleDateString("ru") : "—"}
                    </TableCell>
                    <TableCell>
                      <Link to={`/admin/sellers/${s.id}`}>
                        <Button variant="ghost" size="icon" title="Просмотр">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && !error && sellers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Продавцы не найдены
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-3">
            <p className="text-sm text-muted-foreground">
              Показано {sellers.length} из {meta?.total ?? 0} (стр. {page} из {meta?.last_page ?? 1})
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
    </div>
  );
}

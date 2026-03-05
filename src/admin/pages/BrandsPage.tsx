import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Edit2, Loader2 } from "lucide-react";
import { brandsApi, categoriesApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function flatCategories(cats: { id: number; name: string; children?: { id: number; name: string }[] }[], prefix = ""): Map<number, string> {
  const m = new Map<number, string>();
  for (const c of cats) {
    m.set(c.id, prefix + c.name);
    if (c.children?.length) {
      for (const [id, name] of flatCategories(c.children, prefix + c.name + " / ")) {
        m.set(id, name);
      }
    }
  }
  return m;
}

export default function BrandsPage() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: brandsData, isLoading } = useQuery({
    queryKey: ["brands", search],
    queryFn: () => brandsApi.list({ search: search || undefined }),
  });

  const { data: catsData } = useQuery({
    queryKey: ["categories", "tree"],
    queryFn: () => categoriesApi.list({ tree: true }),
  });

  const brands = brandsData?.data ?? [];
  const catMap = flatCategories(catsData?.data ?? []);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => brandsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast.success("Бренд удалён");
    },
    onError: () => toast.error("Ошибка"),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold">Бренды</h2>
        <Button><Plus className="h-4 w-4 mr-1" />Добавить бренд</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="mb-4">
            <Input placeholder="Поиск по названию..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8"><Loader2 className="h-5 w-5 animate-spin" />Загрузка...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Логотип</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Категории</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>SEO Title</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      {b.logo_url ? (
                        <img src={b.logo_url} alt={b.name} className="h-8 w-8 rounded object-cover bg-muted" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{b.slug}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(b.category_ids ?? []).map((cid) => (
                          <Badge key={cid} variant="outline">{catMap.get(cid) ?? cid}</Badge>
                        ))}
                        {(b.category_ids?.length ?? 0) === 0 && <span className="text-muted-foreground">—</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={b.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}>
                        {b.status === "active" ? "Активен" : "Отключен"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{b.seo_title ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon"><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(b.id)} disabled={deleteMutation.isPending}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {brands.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Бренды не найдены</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

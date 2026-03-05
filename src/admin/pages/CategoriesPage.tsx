import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, GripVertical, Link2, FolderTree, Loader2 } from "lucide-react";
import { categoriesApi, type Category } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface CategoryNodeProps {
  cat: Category;
  depth?: number;
  onToggle: (id: number, enabled: boolean) => void;
  onUpdateParser: (id: number, data: { parser_depth_limit?: number; parser_max_pages?: number; parser_products_limit?: number }) => void;
}

function CategoryNode({ cat, depth = 0, onToggle, onUpdateParser }: CategoryNodeProps) {
  const [open, setOpen] = useState(depth < 1);
  const [expanded, setExpanded] = useState(false);
  const hasChildren = (cat.children?.length ?? 0) > 0;
  const [busy, setBusy] = useState(false);

  const handleSwitch = async (checked: boolean) => {
    setBusy(true);
    try {
      await onToggle(cat.id, checked);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div
        className="flex flex-wrap items-center gap-2 py-2 px-3 hover:bg-muted/50 rounded-lg transition-colors group"
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab shrink-0" />
        {hasChildren ? (
          <button onClick={() => setOpen(!open)} className="shrink-0">
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : <span className="w-4" />}
        <span className="font-medium flex-1 min-w-0">{cat.name}</span>
        <Badge variant="outline" className="text-xs shrink-0">{cat.slug ?? cat.external_slug ?? cat.id}</Badge>
        {cat.linked_to_parser && <Link2 className="h-3.5 w-3.5 text-primary shrink-0" title="Привязана к парсеру" />}
        <span className="text-xs text-muted-foreground shrink-0 w-8" title="Глубина">{cat.parser_depth_limit ?? "—"}</span>
        <span className="text-xs text-muted-foreground shrink-0 w-8" title="Макс. страниц">{cat.parser_max_pages ?? "—"}</span>
        <span className="text-xs text-muted-foreground shrink-0 w-10" title="Лимит товаров">{cat.parser_products_limit ?? "—"}</span>
        {busy ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <Switch checked={cat.enabled} onCheckedChange={handleSwitch} />}
        <Button variant="ghost" size="sm" className="h-7 px-2 shrink-0" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Свернуть" : "Парсер"}
        </Button>
      </div>
      {expanded && (
        <div className="flex flex-wrap items-center gap-3 py-2 px-3 ml-6 border-l-2 border-muted" style={{ marginLeft: `${depth * 24 + 36}px` }}>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground w-24">Глубина:</span>
            <Input
              type="number"
              min={0}
              className="w-20 h-8"
              defaultValue={cat.parser_depth_limit ?? ""}
              placeholder="—"
              onBlur={(e) => {
                const v = e.target.value ? Number(e.target.value) : undefined;
                if (v !== undefined && v !== cat.parser_depth_limit) onUpdateParser(cat.id, { parser_depth_limit: v });
              }}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground w-24">Макс. страниц:</span>
            <Input
              type="number"
              min={0}
              className="w-20 h-8"
              defaultValue={cat.parser_max_pages ?? ""}
              placeholder="—"
              onBlur={(e) => {
                const v = e.target.value ? Number(e.target.value) : undefined;
                if (v !== undefined && v !== cat.parser_max_pages) onUpdateParser(cat.id, { parser_max_pages: v });
              }}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground w-24">Лимит товаров:</span>
            <Input
              type="number"
              min={0}
              className="w-20 h-8"
              defaultValue={cat.parser_products_limit ?? ""}
              placeholder="—"
              onBlur={(e) => {
                const v = e.target.value ? Number(e.target.value) : undefined;
                if (v !== undefined && v !== cat.parser_products_limit) onUpdateParser(cat.id, { parser_products_limit: v });
              }}
            />
          </label>
        </div>
      )}
      {open && hasChildren && (cat.children ?? []).map((c) => (
        <CategoryNode key={c.id} cat={c} depth={depth + 1} onToggle={onToggle} onUpdateParser={onUpdateParser} />
      ))}
    </div>
  );
}

function filterTree(cats: Category[], search: string): Category[] {
  const q = search.trim().toLowerCase();
  if (!q) return cats;
  const res: Category[] = [];
  for (const c of cats) {
    const match = c.name.toLowerCase().includes(q) || (c.slug?.toLowerCase().includes(q)) || (c.external_slug?.toLowerCase().includes(q));
    const filteredChildren = (c.children && c.children.length > 0) ? filterTree(c.children, search) : [];
    if (match || filteredChildren.length > 0) {
      res.push({ ...c, children: filteredChildren.length ? filteredChildren : c.children });
    }
  }
  return res;
}

export default function CategoriesPage() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["categories", "tree"],
    queryFn: () => categoriesApi.list({ tree: true }),
  });

  const updateMutation = useMutation({
    mutationFn: (params: { id: number; enabled?: boolean; parser_depth_limit?: number; parser_max_pages?: number; parser_products_limit?: number }) =>
      categoriesApi.update(params.id, {
        enabled: params.enabled,
        parser_depth_limit: params.parser_depth_limit,
        parser_max_pages: params.parser_max_pages,
        parser_products_limit: params.parser_products_limit,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Категория обновлена");
    },
    onError: () => toast.error("Ошибка обновления"),
  });

  const categories = data?.data ?? [];
  const filtered = useMemo(() => filterTree(categories, search), [categories, search]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold">Категории</h2>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FolderTree className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Дерево категорий</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Input placeholder="Поиск категории..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-4 max-w-sm" />
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8"><Loader2 className="h-5 w-5 animate-spin" />Загрузка...</div>
          ) : (
            <>
              <div className="border rounded-lg divide-y">
                <div className="flex items-center gap-2 py-2 px-3 bg-muted/50 text-sm text-muted-foreground font-medium">
                  <span className="w-8" />
                  <span className="flex-1">Название</span>
                  <span className="w-8 shrink-0">Гл.</span>
                  <span className="w-8 shrink-0">Стр.</span>
                  <span className="w-10 shrink-0">Тов.</span>
                </div>
                {filtered.map((cat) => (
                  <CategoryNode
                    key={cat.id}
                    cat={cat}
                    onToggle={(id, enabled) => updateMutation.mutateAsync({ id, enabled })}
                    onUpdateParser={(id, data) => updateMutation.mutateAsync({ id, ...data })}
                  />
                ))}
                {filtered.length === 0 && <div className="py-8 text-center text-muted-foreground">Нет категорий</div>}
              </div>
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                <Link2 className="h-3 w-3" /> — привязана к парсеру
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

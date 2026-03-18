import { useCallback, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "../components/PageHeader";
import { Button } from "@/components/ui/button";
import { adminCatalogApi, type CatalogCategoryItem } from "@/lib/api";
import { Plus, ChevronRight, GripVertical, FolderTree, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const QK = ["admin-catalog-categories-crm"];

async function fetchAllCatalogCategories(): Promise<CatalogCategoryItem[]> {
  const first = await adminCatalogApi.catalogCategoriesList({ per_page: 100, page: 1 });
  const total = first.meta?.total ?? first.data.length;
  const perPage = first.meta?.per_page ?? 100;
  if (total <= perPage) return first.data;
  const pages = Math.ceil(total / perPage);
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, i) =>
      adminCatalogApi.catalogCategoriesList({ per_page: perPage, page: i + 2 })
    )
  );
  return [...first.data, ...rest.flatMap((r) => r.data)];
}

type TreeNode = CatalogCategoryItem & { children: TreeNode[] };

function buildTree(flat: CatalogCategoryItem[]): TreeNode[] {
  const byParent = new Map<string, CatalogCategoryItem[]>();
  for (const c of flat) {
    const key = c.parent_id == null ? "root" : String(c.parent_id);
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(c);
  }
  for (const arr of byParent.values()) {
    arr.sort(
      (a, b) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, "ru")
    );
  }
  function node(c: CatalogCategoryItem): TreeNode {
    const ch = byParent.get(String(c.id))?.map(node) ?? [];
    return { ...c, children: ch };
  }
  return (byParent.get("root") ?? []).map(node);
}

function countTree(nodes: TreeNode[]): number {
  return nodes.reduce((n, x) => n + 1 + countTree(x.children), 0);
}

export default function CrmCategoriesPage() {
  const queryClient = useQueryClient();
  const dragRef = useRef<{ parentId: number | null; fromIndex: number } | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const { data: flat = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: QK,
    queryFn: fetchAllCatalogCategories,
  });

  const tree = useMemo(() => buildTree(flat), [flat]);
  const totalCount = useMemo(() => countTree(tree), [tree]);

  const reorderMutation = useMutation({
    mutationFn: (items: Array<{ id: number; sort_order: number }>) =>
      adminCatalogApi.catalogCategoriesReorder(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK });
      toast.success("Сохранено");
    },
    onError: (e: Error & { message?: string }) => {
      toast.error(e.message || "Не удалось сохранить порядок");
    },
  });

  const getSiblings = useCallback(
    (parentId: number | null) =>
      flat
        .filter((c) => (c.parent_id ?? null) === (parentId ?? null))
        .sort(
          (a, b) =>
            (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, "ru")
        ),
    [flat]
  );

  const applyReorder = useCallback(
    (parentId: number | null, fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex || reorderMutation.isPending) return;
      const siblings = getSiblings(parentId);
      if (!siblings.length) return;
      const ids = siblings.map((s) => s.id);
      const [moved] = ids.splice(fromIndex, 1);
      ids.splice(toIndex, 0, moved);
      const payload = ids.map((id, i) => ({ id, sort_order: i + 1 }));
      reorderMutation.mutate(payload);
    },
    [getSiblings, reorderMutation]
  );

  const toggle = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const busy = reorderMutation.isPending;

  const renderLevel = (parentId: number | null, nodes: TreeNode[], depth: number) =>
    nodes.map((node, index) => {
      const rowKey = `${parentId ?? "root"}-${node.id}`;
      const isOver = dragOverKey === rowKey;
      const hasChildren = node.children.length > 0;
      const isExpanded = expanded.has(node.id);

      return (
        <div key={node.id} className="select-none">
          <div
            role="row"
            draggable={!busy}
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", String(node.id));
              dragRef.current = { parentId, fromIndex: index };
            }}
            onDragEnd={() => {
              dragRef.current = null;
              setDragOverKey(null);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setDragOverKey(rowKey);
            }}
            onDragLeave={() => {
              setDragOverKey((k) => (k === rowKey ? null : k));
            }}
            onDrop={(e) => {
              e.preventDefault();
              const src = dragRef.current;
              dragRef.current = null;
              setDragOverKey(null);
              if (!src || src.parentId !== parentId) {
                toast.message("Перетаскивайте только внутри одного уровня");
                return;
              }
              applyReorder(parentId, src.fromIndex, index);
            }}
            className={cn(
              "flex items-center gap-2 px-3 py-2 border-b border-border transition-all duration-200",
              "hover:bg-muted/40",
              isOver && "bg-primary/10 border-l-4 border-l-primary pl-2 shadow-sm",
              busy && "opacity-70 pointer-events-none"
            )}
            style={{ paddingLeft: `${12 + depth * 20}px` }}
          >
            <span
              className="cursor-grab active:cursor-grabbing text-muted-foreground shrink-0 touch-none p-0.5 rounded hover:bg-muted"
              title="Перетащить"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4" />
            </span>
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggle(node.id)}
                className="p-0.5 rounded hover:bg-muted shrink-0"
                aria-expanded={isExpanded}
              >
                <ChevronRight
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform duration-200",
                    isExpanded && "rotate-90"
                  )}
                />
              </button>
            ) : (
              <span className="w-5 shrink-0 inline-block" />
            )}
            <FolderTree className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium flex-1 min-w-0 truncate">{node.name}</span>
            <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
              #{node.sort_order ?? 0}
            </span>
            <span
              className={cn(
                "text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded w-14 text-center",
                node.is_active === false ? "bg-muted text-muted-foreground" : "bg-emerald-500/15 text-emerald-700"
              )}
            >
              {node.is_active === false ? "off" : "on"}
            </span>
          </div>
          {hasChildren && isExpanded && (
            <div className="animate-in fade-in duration-200">
              {renderLevel(node.id, node.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Категории каталога"
        description={
          isLoading
            ? "Загрузка…"
            : isError
              ? "Ошибка загрузки"
              : `${totalCount} категорий · API /admin/catalog/categories`
        }
        actions={
          <Button size="sm" variant="outline" className="gap-1.5" disabled>
            <Plus className="h-3.5 w-3.5" />
            Добавить
          </Button>
        }
      />

      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p className="font-medium text-destructive">Не удалось загрузить категории</p>
          <p className="text-muted-foreground mt-1">{(error as Error)?.message}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Повторить
          </Button>
        </div>
      )}

      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <div className="flex items-center gap-3 px-3 py-2 bg-muted/30 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <span className="w-8" />
          <span className="w-6" />
          <span className="flex-1 pl-2">Название</span>
          <span className="w-10 text-right">Пор.</span>
          <span className="w-14 text-center">Активн.</span>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Загрузка категорий…
          </div>
        ) : tree.length === 0 && !isError ? (
          <div className="py-16 text-center text-muted-foreground text-sm">
            Нет категорий в каталоге. Создайте их через API или админку бэкенда.
          </div>
        ) : (
          <div>{renderLevel(null, tree, 0)}</div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Перетаскивайте строку за область с иконкой ⋮⋮ в пределах одного уровня (родитель → дети). После отпускания
        порядок сохраняется через{" "}
        <code className="text-[10px] bg-muted px-1 rounded">PATCH …/categories/reorder</code>.
      </p>
    </div>
  );
}

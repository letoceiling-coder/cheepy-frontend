import { useCallback, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "../components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminCatalogApi, type CatalogCategoryItem } from "@/lib/api";
import { Plus, ChevronRight, GripVertical, FolderTree, Loader2, Pencil } from "lucide-react";
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
  const [patchingIds, setPatchingIds] = useState<Set<number>>(() => new Set());
  const [editTarget, setEditTarget] = useState<CatalogCategoryItem | null>(null);
  const [editName, setEditName] = useState("");

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
    onError: () => {
      toast.error("Ошибка");
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: { name?: string; is_active?: boolean } }) =>
      adminCatalogApi.catalogCategoryPatch(id, body),
    onMutate: ({ id }) => {
      setPatchingIds((p) => new Set(p).add(id));
    },
    onSettled: (_d, _e, v) => {
      setPatchingIds((p) => {
        const n = new Set(p);
        n.delete(v.id);
        return n;
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK });
      toast.success("Сохранено");
    },
    onError: () => {
      toast.error("Ошибка");
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

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openEdit = (node: CatalogCategoryItem) => {
    setEditTarget(node);
    setEditName(node.name);
  };

  const saveEditName = () => {
    if (!editTarget) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      toast.error("Ошибка");
      return;
    }
    if (trimmed === editTarget.name) {
      setEditTarget(null);
      return;
    }
    updateCategoryMutation.mutate(
      { id: editTarget.id, body: { name: trimmed } },
      { onSuccess: () => setEditTarget(null) }
    );
  };

  const reorderBusy = reorderMutation.isPending;

  const renderLevel = (parentId: number | null, nodes: TreeNode[], depth: number) =>
    nodes.map((node, index) => {
      const rowKey = `${parentId ?? "root"}-${node.id}`;
      const isOver = dragOverKey === rowKey;
      const hasChildren = node.children.length > 0;
      const isExpanded = expanded.has(node.id);
      const rowPatching = patchingIds.has(node.id);
      const gripDraggable = !reorderBusy && !rowPatching;

      return (
        <div key={node.id} className="select-none">
          <div
            role="row"
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
              reorderBusy && "opacity-80"
            )}
            style={{ paddingLeft: `${12 + depth * 20}px` }}
          >
            <span
              draggable={gripDraggable}
              onDragStart={(e) => {
                e.stopPropagation();
                if (!gripDraggable) {
                  e.preventDefault();
                  return;
                }
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", String(node.id));
                dragRef.current = { parentId, fromIndex: index };
              }}
              onDragEnd={() => {
                dragRef.current = null;
                setDragOverKey(null);
              }}
              className={cn(
                "text-muted-foreground shrink-0 touch-none p-0.5 rounded hover:bg-muted",
                gripDraggable ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed opacity-50"
              )}
              title="Перетащить"
            >
              <GripVertical className="h-4 w-4" />
            </span>
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpand(node.id)}
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
            <span className="text-xs text-muted-foreground tabular-nums w-10 text-right shrink-0">
              #{node.sort_order ?? 0}
            </span>
            <div
              className="shrink-0 flex items-center justify-center w-9"
              onPointerDown={(e) => e.stopPropagation()}
              onDragStart={(e) => e.preventDefault()}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={rowPatching}
                onClick={() => openEdit(node)}
                aria-label="Редактировать название"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            <div
              className="shrink-0 flex items-center gap-1.5 w-[56px] justify-end"
              onPointerDown={(e) => e.stopPropagation()}
              onDragStart={(e) => e.preventDefault()}
            >
              {rowPatching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" aria-hidden />
              ) : null}
              <Switch
                checked={node.is_active !== false}
                disabled={rowPatching}
                className="scale-90"
                onCheckedChange={(checked) => {
                  updateCategoryMutation.mutate({ id: node.id, body: { is_active: checked } });
                }}
              />
            </div>
          </div>
          {hasChildren && isExpanded && (
            <div className="animate-in fade-in duration-200">
              {renderLevel(node.id, node.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });

  const editSaving = editTarget ? patchingIds.has(editTarget.id) : false;

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Категории каталога"
        description={
          isLoading
            ? "Загрузка…"
            : isError
              ? "Ошибка загрузки"
              : `${totalCount} категорий · PATCH /admin/catalog/categories/{id}`
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
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <span className="w-8" />
          <span className="w-6" />
          <span className="flex-1 pl-2 min-w-0">Название</span>
          <span className="w-10 text-right shrink-0">Пор.</span>
          <span className="w-9 text-center shrink-0" />
          <span className="w-[52px] text-right shrink-0">Активн.</span>
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

      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open && !editSaving) setEditTarget(null);
        }}
      >
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => {
            if (editSaving) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (editSaving) e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Редактировать категорию</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-sm font-medium">Название</label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              disabled={editSaving}
              placeholder="Название категории"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !editSaving) saveEditName();
              }}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditTarget(null)} disabled={editSaving}>
              Отмена
            </Button>
            <Button type="button" onClick={saveEditName} disabled={editSaving}>
              {editSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Сохранение…
                </>
              ) : (
                "Сохранить"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="text-xs text-muted-foreground">
        Порядок: только с ручки ⋮⋮. Переключатель и кнопка ✏️ не запускают перетаскивание.
      </p>
    </div>
  );
}

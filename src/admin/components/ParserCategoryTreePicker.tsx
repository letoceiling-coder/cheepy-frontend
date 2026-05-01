import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { ChevronRight, ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/api";

export type ParserCategoryTreePickerProps = {
  roots: Category[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
  className?: string;
};

/** Все id узла и потомков (порядок: корень, потом обход). */
export function collectSubtreeIds(cat: Category): number[] {
  const out = [cat.id];
  for (const ch of cat.children ?? []) {
    out.push(...collectSubtreeIds(ch));
  }
  return out;
}

/** Все id в лесу (плоский список). */
export function flattenCategoryIds(roots: Category[]): number[] {
  const out: number[] = [];
  const walk = (nodes: Category[]) => {
    for (const n of nodes) {
      out.push(n.id);
      if (n.children?.length) walk(n.children);
    }
  };
  walk(roots);
  return out;
}

function filterCategoryTree(nodes: Category[], query: string): Category[] {
  const q = query.trim().toLowerCase();
  if (!q) return nodes;

  const filterNode = (cat: Category): Category | null => {
    const slug = (cat.slug ?? cat.external_slug ?? "").toLowerCase();
    const selfMatch = cat.name.toLowerCase().includes(q) || slug.includes(q);
    const rawChildren = cat.children ?? [];
    const nextChildren = rawChildren.map(filterNode).filter(Boolean) as Category[];
    if (selfMatch || nextChildren.length > 0) {
      return { ...cat, children: nextChildren };
    }
    return null;
  };

  return nodes.map(filterNode).filter(Boolean) as Category[];
}

function collectIdsWithChildren(nodes: Category[]): number[] {
  const out: number[] = [];
  const walk = (arr: Category[]) => {
    for (const c of arr) {
      if ((c.children?.length ?? 0) > 0) {
        out.push(c.id);
        walk(c.children ?? []);
      }
    }
  };
  walk(nodes);
  return out;
}

type SelectionState = "none" | "some" | "all";

function subtreeSelectionState(cat: Category, selected: Set<number>): SelectionState {
  const subtree = collectSubtreeIds(cat);
  let hit = 0;
  for (const id of subtree) {
    if (selected.has(id)) hit++;
  }
  if (hit === 0) return "none";
  if (hit === subtree.length) return "all";
  return "some";
}

type RowProps = {
  cat: Category;
  depth: number;
  expandedIds: Set<number>;
  onToggleExpand: (id: number) => void;
  selected: Set<number>;
  onToggleSubtree: (cat: Category, checked: boolean) => void;
  disabled?: boolean;
};

function CategoryTreeRow({ cat, depth, expandedIds, onToggleExpand, selected, onToggleSubtree, disabled }: RowProps) {
  const children = cat.children ?? [];
  const hasChildren = children.length > 0;
  const expanded = expandedIds.has(cat.id);
  const state = subtreeSelectionState(cat, selected);
  const checkState = state === "all" ? true : state === "some" ? "indeterminate" : false;

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-start gap-2 py-1.5 pr-2 rounded-md hover:bg-muted/60 transition-colors",
          disabled && "opacity-60 pointer-events-none",
        )}
        style={{ paddingLeft: Math.min(depth * 14 + 8, 120) }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="mt-0.5 shrink-0 p-0.5 rounded hover:bg-muted text-muted-foreground"
            onClick={() => onToggleExpand(cat.id)}
            aria-expanded={expanded}
            aria-label={expanded ? "Свернуть" : "Развернуть"}
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}
        <Checkbox
          id={`parser-cat-${cat.id}`}
          checked={checkState}
          onCheckedChange={(v) => onToggleSubtree(cat, v === true)}
          className="mt-0.5"
          disabled={disabled}
        />
        <label htmlFor={`parser-cat-${cat.id}`} className="flex-1 min-w-0 cursor-pointer leading-snug pt-0.5">
          <span className="font-medium text-sm">{cat.name}</span>
          <span className="block text-[11px] text-muted-foreground font-mono truncate" title={cat.slug ?? cat.external_slug ?? ""}>
            {cat.slug ?? cat.external_slug ?? ""}
          </span>
        </label>
      </div>
      {hasChildren && expanded && (
        <div className="border-l border-border/60 ml-3">
          {children.map((ch) => (
            <CategoryTreeRow
              key={ch.id}
              cat={ch}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              selected={selected}
              onToggleSubtree={onToggleSubtree}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ParserCategoryTreePicker({
  roots,
  selectedIds,
  onChange,
  disabled,
  className,
}: ParserCategoryTreePickerProps) {
  const [search, setSearch] = useState("");
  const filteredRoots = useMemo(() => filterCategoryTree(roots, search), [roots, search]);

  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);

  const idsWithChildren = useMemo(() => collectIdsWithChildren(roots), [roots]);

  const rootIdsWithChildren = useMemo(() => (roots ?? []).filter((r) => (r.children?.length ?? 0) > 0).map((r) => r.id), [roots]);

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const expandedInitRef = useRef(false);

  useEffect(() => {
    if (roots.length === 0 || expandedInitRef.current) return;
    expandedInitRef.current = true;
    setExpandedIds(new Set(rootIdsWithChildren));
  }, [roots.length, rootIdsWithChildren]);

  useEffect(() => {
    if (!search.trim()) return;
    setExpandedIds(new Set(idsWithChildren));
  }, [search, idsWithChildren]);

  const toggleExpand = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => setExpandedIds(new Set(idsWithChildren)), [idsWithChildren]);

  const collapseAll = useCallback(() => setExpandedIds(new Set()), []);

  const onToggleSubtree = useCallback(
    (cat: Category, checked: boolean) => {
      const subtree = collectSubtreeIds(cat);
      const next = new Set(selectedIds);
      if (checked) {
        subtree.forEach((id) => next.add(id));
      } else {
        subtree.forEach((id) => next.delete(id));
      }
      onChange([...next].sort((a, b) => a - b));
    },
    [selectedIds, onChange],
  );

  const selectAllInTree = useCallback(() => {
    onChange(flattenCategoryIds(roots).sort((a, b) => a - b));
  }, [roots, onChange]);

  const clearSelection = useCallback(() => onChange([]), [onChange]);

  const selectedCount = selectedIds.length;
  const totalCount = useMemo(() => flattenCategoryIds(roots).length, [roots]);

  return (
    <div className={cn("rounded-lg border bg-card", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between p-3 border-b bg-muted/30 gap-y-2">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию или slug…"
            className="pl-8 h-9"
            disabled={disabled}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={expandAll} disabled={disabled || idsWithChildren.length === 0}>
            Развернуть всё
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={collapseAll} disabled={disabled}>
            Свернуть всё
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={selectAllInTree} disabled={disabled || totalCount === 0}>
            Выбрать всё
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={clearSelection} disabled={disabled}>
            Очистить
          </Button>
        </div>
      </div>

      <div className="px-2 py-2 text-xs text-muted-foreground border-b flex flex-wrap gap-x-4 gap-y-1">
        <span>
          Отмечено: <strong className="text-foreground">{selectedCount}</strong>
          {totalCount > 0 ? (
            <>
              {" "}
              из <strong className="text-foreground">{totalCount}</strong>
            </>
          ) : null}
        </span>
        <span>Пустой список сохранённых id = парсер берёт все включённые категории (см. подсказку ниже).</span>
      </div>

      <div className="max-h-[min(420px,55vh)] overflow-auto p-2">
        {filteredRoots.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">Нет категорий по запросу</div>
        ) : (
          filteredRoots.map((cat) => (
            <CategoryTreeRow
              key={cat.id}
              cat={cat}
              depth={0}
              expandedIds={expandedIds}
              onToggleExpand={toggleExpand}
              selected={selected}
              onToggleSubtree={onToggleSubtree}
              disabled={disabled}
            />
          ))
        )}
      </div>
    </div>
  );
}

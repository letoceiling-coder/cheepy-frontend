import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { CatalogCategoryTreeNode } from "@/lib/api";

type Props = {
  roots: CatalogCategoryTreeNode[];
  value: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
  className?: string;
};

function collectSubtreeIds(cat: CatalogCategoryTreeNode): number[] {
  const out = [cat.id];
  for (const ch of cat.children ?? []) {
    out.push(...collectSubtreeIds(ch));
  }
  return out;
}

function flattenCategoryIds(roots: CatalogCategoryTreeNode[]): number[] {
  const out: number[] = [];
  const walk = (nodes: CatalogCategoryTreeNode[]) => {
    for (const n of nodes) {
      out.push(n.id);
      if (n.children?.length) walk(n.children);
    }
  };
  walk(roots);
  return out;
}

function filterCategoryTree(nodes: CatalogCategoryTreeNode[], query: string): CatalogCategoryTreeNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return nodes;
  const filterNode = (cat: CatalogCategoryTreeNode): CatalogCategoryTreeNode | null => {
    const slug = (cat.slug ?? "").toLowerCase();
    const selfMatch = cat.name.toLowerCase().includes(q) || slug.includes(q);
    const rawChildren = cat.children ?? [];
    const nextChildren = rawChildren.map(filterNode).filter(Boolean) as CatalogCategoryTreeNode[];
    if (selfMatch || nextChildren.length > 0) {
      return { ...cat, children: nextChildren };
    }
    return null;
  };
  return nodes.map(filterNode).filter(Boolean) as CatalogCategoryTreeNode[];
}

function collectIdsWithChildren(nodes: CatalogCategoryTreeNode[]): number[] {
  const out: number[] = [];
  const walk = (arr: CatalogCategoryTreeNode[]) => {
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

function subtreeSelectionState(cat: CatalogCategoryTreeNode, selected: Set<number>): SelectionState {
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
  cat: CatalogCategoryTreeNode;
  depth: number;
  expandedIds: Set<number>;
  onToggleExpand: (id: number) => void;
  selected: Set<number>;
  onToggleSubtree: (cat: CatalogCategoryTreeNode, checked: boolean) => void;
  disabled?: boolean;
};

function CategoryTreeRow({
  cat,
  depth,
  expandedIds,
  onToggleExpand,
  selected,
  onToggleSubtree,
  disabled,
}: RowProps) {
  const children = cat.children ?? [];
  const hasChildren = children.length > 0;
  const expanded = expandedIds.has(cat.id);
  const state = subtreeSelectionState(cat, selected);
  const checkState = state === "all" ? true : state === "some" ? "indeterminate" : false;

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-start gap-1.5 py-1 pr-1.5 rounded-md hover:bg-muted/60 transition-colors",
          disabled && "opacity-60 pointer-events-none",
        )}
        style={{ paddingLeft: Math.min(depth * 12 + 4, 104) }}
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
          id={`crm-cat-${cat.id}`}
          checked={checkState}
          onCheckedChange={(v) => onToggleSubtree(cat, v === true)}
          className="mt-0.5"
          disabled={disabled}
        />
        <label htmlFor={`crm-cat-${cat.id}`} className="flex-1 min-w-0 cursor-pointer leading-snug pt-0.5">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0">
            <span className="font-medium text-sm">{cat.name}</span>
            <span className="inline-flex flex-wrap gap-1 shrink-0">
              <span className="rounded bg-muted/80 text-foreground/80 px-1 py-px text-[10px] tabular-nums leading-none">
                Всего {cat.counts.total}
              </span>
              <span className="rounded bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 px-1 py-px text-[10px] tabular-nums leading-none">
                Одобр. {cat.counts.approved}
              </span>
              <span className="rounded bg-amber-500/15 text-amber-950 dark:text-amber-200 px-1 py-px text-[10px] tabular-nums leading-none">
                Модер. {cat.counts.review}
              </span>
            </span>
          </div>
          <span className="block text-[11px] text-muted-foreground font-mono truncate" title={cat.slug}>
            {cat.slug}
          </span>
        </label>
      </div>
      {hasChildren && expanded && (
        <div>
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

export function CrmCategoryMultiSelect({ roots, value, onChange, disabled, className }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filteredRoots = useMemo(() => filterCategoryTree(roots, search), [roots, search]);
  const selected = useMemo(() => new Set(value), [value]);
  const idsWithChildren = useMemo(() => collectIdsWithChildren(roots), [roots]);
  const rootIdsWithChildren = useMemo(
    () => (roots ?? []).filter((r) => (r.children?.length ?? 0) > 0).map((r) => r.id),
    [roots],
  );
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const expandedInitRef = useRef(false);

  const idToName = useMemo(() => {
    const m = new Map<number, string>();
    const walk = (nodes: CatalogCategoryTreeNode[]) => {
      for (const n of nodes) {
        m.set(n.id, n.name);
        if (n.children?.length) walk(n.children);
      }
    };
    walk(roots);
    return m;
  }, [roots]);

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

  const onToggleSubtree = useCallback(
    (cat: CatalogCategoryTreeNode, checked: boolean) => {
      const subtree = collectSubtreeIds(cat);
      const next = new Set(value);
      if (checked) {
        subtree.forEach((id) => next.add(id));
      } else {
        subtree.forEach((id) => next.delete(id));
      }
      onChange([...next].sort((a, b) => a - b));
    },
    [value, onChange],
  );

  const selectAllInTree = useCallback(() => {
    onChange(flattenCategoryIds(roots).sort((a, b) => a - b));
  }, [roots, onChange]);

  const clearSelection = useCallback(() => onChange([]), [onChange]);

  const summary = useMemo(() => {
    if (value.length === 0) return "Все категории";
    if (value.length === 1) {
      return idToName.get(value[0]) ?? `ID ${value[0]}`;
    }
    return `${value.length} категорий`;
  }, [value, idToName]);

  const titleForMany =
    value.length > 1 ? value.map((id) => idToName.get(id) ?? id).join(", ") : undefined;

  const totalSelectable = flattenCategoryIds(roots).length;

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-8 min-w-[160px] max-w-[260px] justify-between gap-2 px-3 font-normal text-sm",
            className,
          )}
          title={titleForMany}
        >
          <span className="truncate">{summary}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(100vw-2rem,400px)] p-0">
        <div className="border-b p-2 space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Поиск по названию или slug…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>
          <div className="flex justify-between gap-2 text-xs">
            <button
              type="button"
              className="text-primary hover:underline disabled:opacity-50"
              disabled={totalSelectable === 0}
              onClick={selectAllInTree}
            >
              Выбрать все
            </button>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground hover:underline disabled:opacity-50"
              disabled={value.length === 0}
              onClick={clearSelection}
            >
              Сбросить
            </button>
          </div>
        </div>
        <ScrollArea className="h-[min(340px,48vh)]">
          <div className="p-2">
            {filteredRoots.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center px-2">Ничего не найдено</p>
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
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

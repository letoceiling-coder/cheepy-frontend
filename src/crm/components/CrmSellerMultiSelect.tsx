import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Seller } from "@/lib/api";

type Props = {
  sellers: Seller[];
  value: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
  className?: string;
};

export function CrmSellerMultiSelect({ sellers, value, onChange, disabled, className }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const selectedSet = useMemo(() => new Set(value), [value]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return sellers;
    return sellers.filter((s) => {
      const slug = (s.slug ?? "").toLowerCase();
      return s.name.toLowerCase().includes(ql) || slug.includes(ql);
    });
  }, [sellers, q]);

  const toggle = (id: number, checked: boolean) => {
    const next = new Set(selectedSet);
    if (checked) next.add(id);
    else next.delete(id);
    onChange([...next].sort((a, b) => a - b));
  };

  const summary = useMemo(() => {
    if (value.length === 0) return "Все продавцы";
    if (value.length === 1) {
      const s = sellers.find((x) => x.id === value[0]);
      return s?.name ?? `ID ${value[0]}`;
    }
    return `${value.length} продавцов`;
  }, [value, sellers]);

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setQ("");
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
          title={value.length > 1 ? value.map((id) => sellers.find((s) => s.id === id)?.name ?? id).join(", ") : undefined}
        >
          <span className="truncate">{summary}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(100vw-2rem,360px)] p-0">
        <div className="border-b p-2 space-y-2">
          <Input
            placeholder="Поиск по имени или slug…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-8 text-sm"
          />
          <div className="flex justify-between gap-2 text-xs">
            <button
              type="button"
              className="text-primary hover:underline disabled:opacity-50"
              disabled={sellers.length === 0}
              onClick={() => onChange(sellers.map((s) => s.id).sort((a, b) => a - b))}
            >
              Выбрать всех
            </button>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground hover:underline disabled:opacity-50"
              disabled={value.length === 0}
              onClick={() => onChange([])}
            >
              Сбросить
            </button>
          </div>
        </div>
        <ScrollArea className="h-[min(320px,45vh)]">
          <div className="p-2 space-y-0.5">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center px-2">Ничего не найдено</p>
            ) : (
              filtered.map((s) => {
                const checked = selectedSet.has(s.id);
                return (
                  <div
                    key={s.id}
                    role="option"
                    aria-selected={checked}
                    className={cn(
                      "flex items-start gap-2 rounded-md px-2 py-1.5 cursor-pointer hover:bg-muted/70",
                      checked && "bg-muted/40",
                    )}
                    onClick={() => toggle(s.id, !checked)}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => toggle(s.id, v === true)}
                      className="mt-0.5"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium leading-snug">{s.name}</div>
                      <div className="text-[11px] text-muted-foreground font-mono truncate">{s.slug}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

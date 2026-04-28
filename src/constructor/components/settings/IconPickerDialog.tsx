import React, { useMemo, useState } from "react";
import * as LucideIcons from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type IconName = string;

function isLucideComponent(x: unknown): x is React.ComponentType<any> {
  return typeof x === "function";
}

function getAllLucideIconNames(): IconName[] {
  const blacklist = new Set([
    "default",
    "icons",
    "createLucideIcon",
    "LucideIcon",
    "LucideProps",
    "DynamicIcon",
    "DynamicIconProps",
  ]);
  return Object.keys(LucideIcons)
    .filter((k) => !blacklist.has(k))
    .filter((k) => k[0] === k[0]?.toUpperCase())
    .filter((k) => isLucideComponent((LucideIcons as any)[k]))
    .sort((a, b) => a.localeCompare(b));
}

export function IconPickerDialog({
  open,
  onOpenChange,
  value,
  onPick,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value?: string | null;
  onPick: (iconName: string) => void;
  title?: string;
}) {
  const [q, setQ] = useState("");
  const all = useMemo(() => getAllLucideIconNames(), []);
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return all;
    return all.filter((n) => n.toLowerCase().includes(query));
  }, [all, q]);

  const Current = value ? (LucideIcons as any)[value] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title ?? "Выбор иконки"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск иконки (например: Shield, Truck, Star...)"
              className="h-9"
            />
            <div className="shrink-0 flex items-center gap-2 text-xs text-muted-foreground">
              {Current ? (
                <>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted">
                    <Current className="h-5 w-5" />
                  </span>
                  <span className="max-w-[180px] truncate">{String(value)}</span>
                </>
              ) : (
                <span>Не выбрано</span>
              )}
            </div>
          </div>

          <ScrollArea className="h-[420px] rounded-md border border-border">
            <div className="p-3 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {filtered.map((name) => {
                const Icon = (LucideIcons as any)[name] as React.ComponentType<any>;
                const active = value === name;
                return (
                  <Button
                    key={name}
                    type="button"
                    variant={active ? "default" : "outline"}
                    className="h-10 px-0"
                    title={name}
                    onClick={() => {
                      onPick(name);
                      onOpenChange(false);
                    }}
                  >
                    <Icon className="h-5 w-5" />
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
          <p className="text-[11px] text-muted-foreground">
            Иконки: {filtered.length} из {all.length}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}


import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Check, HelpCircle, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { adminSystemProductsApi, resolveCrmMediaAssetUrl, type SystemProductItem } from '@/lib/api';
import type { BlockScheduleSetting, HotDealProductSetting, ScheduleWindowSetting } from '@/constructor/settingsProfiles';

const DAYS = [
  { id: 1, label: 'Пн' },
  { id: 2, label: 'Вт' },
  { id: 3, label: 'Ср' },
  { id: 4, label: 'Чт' },
  { id: 5, label: 'Пт' },
  { id: 6, label: 'Сб' },
  { id: 0, label: 'Вс' },
];

function uid(): string {
  return `schedule-${Math.random().toString(36).slice(2, 9)}`;
}

function isoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateFromIso(value: string): Date | undefined {
  if (!value) return undefined;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

function createWindow(index: number): ScheduleWindowSetting {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  return {
    id: uid(),
    title: `Окно ${index + 1}`,
    enabled: true,
    startDate: isoDate(now),
    endDate: isoDate(tomorrow),
    startTime: '09:00',
    endTime: '21:00',
    daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
    dealItems: [],
  };
}

function humanWindow(w: ScheduleWindowSetting): string {
  const days = DAYS.filter((d) => w.daysOfWeek.includes(d.id)).map((d) => d.label).join(', ');
  const count = w.dealItems?.filter((x) => x.enabled !== false).length ?? 0;
  return `${w.startDate || 'дата'} — ${w.endDate || 'дата'}, ${w.startTime || '--:--'}–${w.endTime || '--:--'} · ${days || 'дни не выбраны'} · ${count} тов.`;
}

function parsePriceText(text: string | null | undefined): number | null {
  const digits = String(text ?? '').replace(/[^\d]/g, '');
  return digits ? Number(digits) : null;
}

function formatMoneyText(raw: number | null | undefined, fallback?: string | null): string {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return `${raw.toLocaleString('ru-RU')} ₽`;
  return fallback || '';
}

function createDealFromProduct(p: SystemProductItem): HotDealProductSetting {
  const priceRaw = typeof p.price_raw === 'number' ? p.price_raw : parsePriceText(p.price);
  return {
    id: `deal-${Math.random().toString(36).slice(2, 9)}`,
    productId: p.id,
    title: p.name ?? '',
    imageUrl: p.thumbnail_url ?? '',
    productUrl: `/product/${p.id}`,
    priceRaw,
    priceText: formatMoneyText(priceRaw, p.price),
    discountPercent: 20,
    durationMinutes: 60,
    startsAt: '',
    endsAt: '',
    enabled: true,
  };
}

function salePrice(deal: HotDealProductSetting): string {
  const raw = deal.priceRaw ?? parsePriceText(deal.priceText);
  if (!raw) return '—';
  const price = Math.round(raw * (1 - Math.min(99, Math.max(1, deal.discountPercent || 1)) / 100));
  return `${price.toLocaleString('ru-RU')} ₽`;
}

function normalizeSearch(value: string | null | undefined): string {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function productMatchesSearch(product: SystemProductItem, query: string): boolean {
  const q = normalizeSearch(query);
  if (!q) return true;
  if (/^\d+$/.test(q) && String(product.id) === q) return true;
  const fields = [
    product.name,
    product.category?.name,
    product.category?.slug,
    product.seller?.name,
    product.seller?.slug,
    product.brand?.name,
    product.brand?.slug,
  ];
  return fields.some((field) => normalizeSearch(field).includes(q));
}

function ProductSearchBox({
  selectedIds,
  onPick,
}: {
  selectedIds: number[];
  onPick: (product: SystemProductItem) => void;
}) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [items, setItems] = useState<SystemProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedId, setAddedId] = useState<number | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const numericId = Number(debounced);
        if (/^\d+$/.test(debounced) && Number.isFinite(numericId) && numericId > 0) {
          try {
            const single = await adminSystemProductsApi.get(numericId);
            if (!cancelled) {
              setItems(single ? [single] : []);
              setLoading(false);
              return;
            }
          } catch {
            // If exact ID lookup fails, fall back to list search below.
          }
        }
        const res = await adminSystemProductsApi.list({
          search: debounced || undefined,
          page: 1,
          per_page: 30,
          sort_by: 'updated_at',
          sort_dir: 'desc',
        });
        const rows = Array.isArray(res.data) ? res.data : [];
        const filtered = debounced ? rows.filter((p) => productMatchesSearch(p, debounced)) : rows;
        if (!cancelled) setItems(filtered.slice(0, 12));
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  return (
    <div className="rounded-lg border bg-background p-3 space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск товара по названию или ID"
          className="h-9 pl-8 text-sm"
        />
      </div>
      <div className="max-h-52 overflow-auto space-y-1">
        {loading ? <p className="text-xs text-muted-foreground">Загрузка товаров...</p> : null}
        {!loading && items.length === 0 ? <p className="text-xs text-muted-foreground">Ничего не найдено.</p> : null}
        {items.map((p) => {
          const alreadyAdded = selectedIds.includes(p.id);
          const justAdded = addedId === p.id;
          return (
          <button
            key={p.id}
            type="button"
            className={cn(
              'w-full flex items-center gap-2 rounded-md p-1.5 text-left hover:bg-accent',
              (alreadyAdded || justAdded) && 'bg-primary/10 text-primary',
            )}
            disabled={alreadyAdded}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (alreadyAdded) return;
              onPick(p);
              setAddedId(p.id);
              setQuery('');
              setDebounced('');
              window.setTimeout(() => setAddedId((current) => (current === p.id ? null : current)), 1400);
            }}
          >
            <div className="h-10 w-10 rounded bg-muted overflow-hidden shrink-0">
              {p.thumbnail_url ? (
                <img src={resolveCrmMediaAssetUrl(p.thumbnail_url)} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground">—</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{p.name || `Товар #${p.id}`}</p>
              <p className="text-[10px] text-muted-foreground truncate">ID {p.id}{p.price ? ` · ${p.price}` : ''}</p>
            </div>
            {alreadyAdded || justAdded ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-[10px] text-primary-foreground">
                <Check className="h-3 w-3" /> {alreadyAdded ? 'Добавлен' : 'Готово'}
              </span>
            ) : (
              <span className="rounded-full border px-2 py-1 text-[10px] text-muted-foreground">Добавить</span>
            )}
          </button>
        );
        })}
      </div>
    </div>
  );
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: BlockScheduleSetting;
  onChange: (next: BlockScheduleSetting) => void;
  title?: string;
  description?: string;
};

export function SchedulePlannerDialog({
  open,
  onOpenChange,
  value,
  onChange,
  title = 'Планирование показа блока',
  description = 'Настройте, когда блок включается на витрине. Компонент можно использовать для любых блоков с расписанием.',
}: Props) {
  const schedule = useMemo<BlockScheduleSetting>(
    () => ({
      enabled: Boolean(value?.enabled),
      timezone: value?.timezone || 'Europe/Moscow',
      windows: Array.isArray(value?.windows) ? value.windows : [],
    }),
    [value],
  );
  const [activeId, setActiveId] = useState<string | null>(schedule.windows[0]?.id ?? null);

  const active = schedule.windows.find((w) => w.id === activeId) ?? schedule.windows[0] ?? null;

  const patchSchedule = (patch: Partial<BlockScheduleSetting>) => onChange({ ...schedule, ...patch });
  const patchWindow = (id: string, patch: Partial<ScheduleWindowSetting>) => {
    onChange({
      ...schedule,
      windows: schedule.windows.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    });
  };

  const addWindow = () => {
    const next = createWindow(schedule.windows.length);
    onChange({ ...schedule, windows: [...schedule.windows, next] });
    setActiveId(next.id);
  };

  const removeWindow = (id: string) => {
    const next = schedule.windows.filter((w) => w.id !== id);
    onChange({ ...schedule, windows: next });
    setActiveId(next[0]?.id ?? null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(1280px,96vw)] max-w-none h-[94vh] max-h-[94vh] overflow-hidden p-0 grid grid-rows-[auto_1fr]">
        <DialogHeader className="p-5 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 grid-cols-1 md:grid-cols-[300px_1fr]">
          <aside className="min-h-0 overflow-y-auto border-r bg-muted/20 p-4 space-y-4">
            <div className="rounded-lg border bg-background p-3 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Включить расписание</p>
                  <p className="text-xs text-muted-foreground">Если выключено, блок виден всегда.</p>
                </div>
                <Switch checked={schedule.enabled} onCheckedChange={(enabled) => patchSchedule({ enabled })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Часовой пояс</Label>
                <Input
                  value={schedule.timezone}
                  onChange={(e) => patchSchedule({ timezone: e.target.value })}
                  className="h-8 text-xs"
                  placeholder="Europe/Moscow"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Окна показа</p>
              <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={addWindow}>
                <Plus className="h-3.5 w-3.5" /> Добавить
              </Button>
            </div>

            <div className="space-y-2 max-h-[340px] overflow-auto pr-1">
              {schedule.windows.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-xs text-muted-foreground">
                  Добавьте первое окно, например «будни 9:00–21:00» или «выходные акции».
                </p>
              ) : (
                schedule.windows.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setActiveId(w.id)}
                    className={cn(
                      'w-full rounded-lg border bg-background p-3 text-left transition-colors hover:bg-accent',
                      active?.id === w.id && 'border-primary ring-1 ring-primary/30',
                      !w.enabled && 'opacity-60',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{w.title || 'Окно показа'}</p>
                      <span className={cn('h-2 w-2 rounded-full', w.enabled ? 'bg-emerald-500' : 'bg-muted-foreground')} />
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground leading-snug">{humanWindow(w)}</p>
                  </button>
                ))
              )}
            </div>
          </aside>

          <main className="min-h-0 overflow-y-auto p-5">
            {!active ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
                Добавьте окно показа, чтобы настроить календарь и время.
              </div>
            ) : (
              <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">Календарь периода</p>
                      <p className="text-xs text-muted-foreground">Выберите дату начала и окончания.</p>
                    </div>
                    <Switch checked={active.enabled} onCheckedChange={(enabled) => patchWindow(active.id, { enabled })} />
                  </div>
                  <div className="rounded-lg border">
                    <Calendar
                      mode="range"
                      numberOfMonths={1}
                      selected={{ from: dateFromIso(active.startDate), to: dateFromIso(active.endDate) }}
                      onSelect={(range: any) =>
                        patchWindow(active.id, {
                          startDate: range?.from ? isoDate(range.from) : active.startDate,
                          endDate: range?.to ? isoDate(range.to) : (range?.from ? isoDate(range.from) : active.endDate),
                        })
                      }
                    />
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="rounded-lg border bg-background p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Название окна</Label>
                        <Input value={active.title} onChange={(e) => patchWindow(active.id, { title: e.target.value })} className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Даты</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input type="date" value={active.startDate} onChange={(e) => patchWindow(active.id, { startDate: e.target.value })} className="h-9 text-sm" />
                          <Input type="date" value={active.endDate} onChange={(e) => patchWindow(active.id, { endDate: e.target.value })} className="h-9 text-sm" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Время показа</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input type="time" value={active.startTime} onChange={(e) => patchWindow(active.id, { startTime: e.target.value })} className="h-9 text-sm" />
                          <Input type="time" value={active.endTime} onChange={(e) => patchWindow(active.id, { endTime: e.target.value })} className="h-9 text-sm" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Повторять по дням</Label>
                        <div className="flex flex-wrap gap-1.5">
                          {DAYS.map((day) => {
                            const checked = active.daysOfWeek.includes(day.id);
                            return (
                              <Button
                                key={day.id}
                                type="button"
                                size="sm"
                                variant={checked ? 'default' : 'outline'}
                                className="h-8 px-2 text-xs"
                                onClick={() => {
                                  const days = checked
                                    ? active.daysOfWeek.filter((d) => d !== day.id)
                                    : [...active.daysOfWeek, day.id];
                                  patchWindow(active.id, { daysOfWeek: days });
                                }}
                              >
                                {day.label}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-background p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">Товары этого окна</p>
                        <p className="text-xs text-muted-foreground">
                          Отсчёт каждого товара начинается в момент появления окна. Когда время товара истекает, он исчезает с витрины.
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                        <HelpCircle className="h-3 w-3" /> товары не общие
                      </span>
                    </div>

                    <div className="space-y-2">
                      {(active.dealItems ?? []).length === 0 ? (
                        <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                          Добавьте товары для выбранного окна. У каждого товара можно настроить скидку и длительность показа.
                        </p>
                      ) : null}
                      {(active.dealItems ?? []).map((deal, idx) => (
                        <div key={deal.id || idx} className="rounded-lg border p-3 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded bg-muted overflow-hidden shrink-0">
                              {deal.imageUrl ? (
                                <img src={resolveCrmMediaAssetUrl(deal.imageUrl)} alt={deal.title} className="h-full w-full object-cover" loading="lazy" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground">—</div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <Input
                                value={deal.title}
                                onChange={(e) =>
                                  patchWindow(active.id, {
                                    dealItems: (active.dealItems ?? []).map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)),
                                  })
                                }
                                className="h-8 text-xs"
                              />
                              <p className="mt-1 text-[10px] text-muted-foreground truncate">ID {deal.productId ?? '—'} · цена со скидкой: {salePrice(deal)}</p>
                            </div>
                            <Switch
                              checked={deal.enabled !== false}
                              onCheckedChange={(enabled) =>
                                patchWindow(active.id, {
                                  dealItems: (active.dealItems ?? []).map((x, i) => (i === idx ? { ...x, enabled } : x)),
                                })
                              }
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Скидка, %</Label>
                              <Input
                                type="number"
                                min={1}
                                max={99}
                                value={deal.discountPercent}
                                className="h-8 text-xs"
                                onChange={(e) =>
                                  patchWindow(active.id, {
                                    dealItems: (active.dealItems ?? []).map((x, i) =>
                                      i === idx ? { ...x, discountPercent: Math.min(99, Math.max(1, Number(e.target.value) || 1)) } : x,
                                    ),
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Базовая цена</Label>
                              <Input
                                value={deal.priceText}
                                className="h-8 text-xs"
                                onChange={(e) =>
                                  patchWindow(active.id, {
                                    dealItems: (active.dealItems ?? []).map((x, i) =>
                                      i === idx ? { ...x, priceText: e.target.value, priceRaw: parsePriceText(e.target.value) } : x,
                                    ),
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Длительность, мин</Label>
                              <Input
                                type="number"
                                min={1}
                                max={10080}
                                value={deal.durationMinutes ?? 60}
                                className="h-8 text-xs"
                                title="Время считается от старта окна показа."
                                onChange={(e) =>
                                  patchWindow(active.id, {
                                    dealItems: (active.dealItems ?? []).map((x, i) =>
                                      i === idx ? { ...x, durationMinutes: Math.min(10080, Math.max(1, Number(e.target.value) || 60)) } : x,
                                    ),
                                  })
                                }
                              />
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs text-destructive"
                              onClick={() => patchWindow(active.id, { dealItems: (active.dealItems ?? []).filter((_, i) => i !== idx) })}
                            >
                              Удалить товар
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <ProductSearchBox
                      selectedIds={(active.dealItems ?? []).map((x) => x.productId).filter((id): id is number => typeof id === 'number')}
                      onPick={(product) =>
                        patchWindow(active.id, {
                          dealItems: [...(active.dealItems ?? []), createDealFromProduct(product)],
                        })
                      }
                    />
                  </div>

                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-sm font-medium">Как это будет работать</p>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Блок отображается, если есть активное окно и хотя бы один товар, срок которого ещё не истёк.
                      Скидка товара действует только до окончания его таймера; после этого товар исчезает с витрины.
                    </p>
                  </div>

                  <div className="flex justify-between gap-2">
                    <Button type="button" variant="outline" className="gap-1 text-destructive" onClick={() => removeWindow(active.id)}>
                      <Trash2 className="h-4 w-4" /> Удалить окно
                    </Button>
                    <Button type="button" onClick={() => onOpenChange(false)}>Готово</Button>
                  </div>
                </section>
              </div>
            )}
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}

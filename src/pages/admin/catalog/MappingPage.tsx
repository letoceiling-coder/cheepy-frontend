import { useMemo, useState, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  adminCatalogApi,
  type MappingSuggestion,
  type CategoryMappingItem,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Loader2, Link2, RefreshCw, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewFilter = "all" | "unmapped" | "mapped";
type MinConfidence = 0 | 50 | 80;

async function fetchAllCategoryMappings(filters?: {
  status?: "mapped" | "unmapped";
  min_confidence?: number;
}): Promise<CategoryMappingItem[]> {
  const first = await adminCatalogApi.categoryMappingList({
    per_page: 100,
    page: 1,
    ...filters,
  });
  const total = first.meta?.total ?? first.data.length;
  const perPage = first.meta?.per_page ?? 100;
  if (total <= perPage) return first.data;
  const pages = Math.ceil(total / perPage);
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, i) =>
      adminCatalogApi.categoryMappingList({
        per_page: perPage,
        page: i + 2,
        ...filters,
      })
    )
  );
  return [...first.data, ...rest.flatMap((r) => r.data)];
}

function scoreBadgeVariant(score: number): "default" | "secondary" | "destructive" | "outline" {
  if (score >= 95) return "default";
  if (score >= 80) return "secondary";
  return "destructive";
}

function scoreBadgeClass(score: number): string {
  if (score >= 95) return "bg-emerald-600 hover:bg-emerald-600 text-white border-0";
  if (score >= 80) return "bg-amber-500 hover:bg-amber-500 text-white border-0";
  return "bg-red-600 hover:bg-red-600 text-white border-0";
}

function passesMinConfidence(score: number, min: MinConfidence): boolean {
  if (min === 0) return true;
  return score >= min;
}

export default function MappingPage() {
  const queryClient = useQueryClient();
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");
  const [minConfidence, setMinConfidence] = useState<MinConfidence>(0);
  const [selectedCatalogId, setSelectedCatalogIdState] = useState<Record<number, number>>({});
  const setSelectedCatalogId = (donorId: number, catalogId: number) => {
    setSelectedCatalogIdState((prev) => ({ ...prev, [donorId]: catalogId }));
  };
  const [applyingDonorId, setApplyingDonorId] = useState<number | null>(null);
  const [bulkApplying, setBulkApplying] = useState(false);
  type RemapPending =
    | { kind: "mapped"; mapping: CategoryMappingItem }
    | { kind: "suggestion"; suggestion: MappingSuggestion };
  const [remapPending, setRemapPending] = useState<RemapPending | null>(null);

  const { data: suggestionsData, isLoading: loadingSuggestions, isFetching: fetchingSuggestions } = useQuery({
    queryKey: ["admin-catalog-mapping-suggestions", 500],
    queryFn: () => adminCatalogApi.mappingSuggestions({ limit: 500 }),
  });

  /** Full list (always loaded): donor ids for «все» / «без маппинга» — avoids stale Set when tab was «с маппингом». */
  const { data: mappingsFull = [], isLoading: loadingMappingsFull } = useQuery({
    queryKey: ["admin-catalog-category-mapping", "full"],
    queryFn: () => fetchAllCategoryMappings(),
  });

  /** Mapped tab only: rows from category-mapping API with filters. */
  const { data: mappingsFiltered = [], isLoading: loadingMappingsFiltered } = useQuery({
    queryKey: ["admin-catalog-category-mapping", "filtered", minConfidence],
    queryFn: () =>
      fetchAllCategoryMappings({
        status: "mapped",
        min_confidence: minConfidence > 0 ? minConfidence : undefined,
      }),
    enabled: viewFilter === "mapped",
  });

  const { data: categoriesData, isLoading: loadingCategories } = useQuery({
    queryKey: ["admin-catalog-categories"],
    queryFn: () => adminCatalogApi.catalogCategoriesList({ per_page: 500 }),
  });

  const createMapping = useMutation({
    mutationFn: (body: {
      donor_category_id: number;
      catalog_category_id: number;
      confidence?: number;
      is_manual?: boolean;
    }) => adminCatalogApi.createMapping(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-catalog-category-mapping"] });
      queryClient.invalidateQueries({ queryKey: ["admin-catalog-mapping-suggestions"] });
    },
    onError: (err: Error & { status?: number }) => {
      toast.error(err.message || "Request failed");
    },
  });

  const suggestions = suggestionsData?.data ?? [];
  const catalogCategories = categoriesData?.data ?? [];

  const mappedDonorIds = useMemo(
    () => new Set(mappingsFull.map((m) => m.donor_category_id)),
    [mappingsFull]
  );

  const suggestionRows = useMemo(() => {
    return suggestions.filter((s) => passesMinConfidence(s.score, minConfidence));
  }, [suggestions, minConfidence]);

  const rowsForAllOrUnmapped = useMemo(() => {
    if (viewFilter === "mapped") return [];
    let list = suggestionRows;
    if (viewFilter === "unmapped") {
      list = list.filter((s) => !mappedDonorIds.has(s.donor_id));
    }
    return list.map((s) => ({
      kind: "suggestion" as const,
      donorId: s.donor_id,
      suggestion: s,
      isMapped: mappedDonorIds.has(s.donor_id),
    }));
  }, [viewFilter, suggestionRows, mappedDonorIds]);

  const rowsMappedOnly = useMemo(() => {
    return mappingsFiltered.map((m) => ({
      kind: "mapped" as const,
      donorId: m.donor_category_id,
      mapping: m,
    }));
  }, [mappingsFiltered]);

  const displayRows = viewFilter === "mapped" ? rowsMappedOnly : rowsForAllOrUnmapped;

  const applyableHigh = useMemo(
    () =>
      rowsForAllOrUnmapped.filter(
        (r) => r.kind === "suggestion" && !r.isMapped && r.suggestion.score >= 95
      ),
    [rowsForAllOrUnmapped]
  );

  const isLoading =
    loadingCategories ||
    (viewFilter === "mapped" ? loadingMappingsFiltered : loadingSuggestions || loadingMappingsFull);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-catalog-mapping-suggestions"] });
    queryClient.invalidateQueries({ queryKey: ["admin-catalog-category-mapping"] });
  };

  const submitMapping = (
    donor_category_id: number,
    catalog_category_id: number,
    confidence: number,
    isRemap: boolean
  ) => {
    setApplyingDonorId(donor_category_id);
    createMapping.mutate(
      {
        donor_category_id,
        catalog_category_id,
        confidence,
        is_manual: true,
      },
      {
        onSuccess: () => {
          toast.success(isRemap ? "Mapping updated" : "Mapping created");
        },
        onError: (err: Error) => {
          toast.error(err.message || "Request failed");
        },
        onSettled: () => setApplyingDonorId(null),
      }
    );
  };

  const executeConfirmedRemap = () => {
    const pending = remapPending;
    if (!pending) return;
    setRemapPending(null);
    if (pending.kind === "mapped") {
      const m = pending.mapping;
      const catalog_category_id =
        selectedCatalogId[m.donor_category_id] ?? m.catalog_category_id;
      const conf = m.confidence ?? 100;
      submitMapping(m.donor_category_id, catalog_category_id, conf, true);
    } else {
      const s = pending.suggestion;
      const catalog_category_id = selectedCatalogId[s.donor_id] ?? s.catalog_id;
      submitMapping(s.donor_id, catalog_category_id, s.score, true);
    }
  };

  const handleApplySuggestion = (s: MappingSuggestion) => {
    const catalog_category_id = selectedCatalogId[s.donor_id] ?? s.catalog_id;
    submitMapping(s.donor_id, catalog_category_id, s.score, false);
  };

  const requestRemapMapped = (m: CategoryMappingItem) => {
    setRemapPending({ kind: "mapped", mapping: m });
  };

  const handleBulkApply = () => {
    const list = applyableHigh;
    if (list.length === 0) {
      toast.info("Нет строк (score ≥ 95, без маппинга)");
      return;
    }
    setBulkApplying(true);
    let done = 0;
    const run = (index: number) => {
      if (index >= list.length) {
        setBulkApplying(false);
        toast.success(`Applied: ${done}`);
        return;
      }
      const r = list[index];
      const s = r.suggestion;
      createMapping.mutate(
        {
          donor_category_id: s.donor_id,
          catalog_category_id: s.catalog_id,
          confidence: s.score,
          is_manual: false,
        },
        {
          onSuccess: () => {
            done++;
            queryClient.invalidateQueries({ queryKey: ["admin-catalog-category-mapping"] });
            queryClient.invalidateQueries({ queryKey: ["admin-catalog-mapping-suggestions"] });
          },
          onError: (err: Error) => {
            toast.error(err.message || "Bulk apply failed");
            setBulkApplying(false);
          },
          onSettled: (_data, error) => {
            if (error) return;
            run(index + 1);
          },
        }
      );
    };
    run(0);
  };

  const subtitle =
    viewFilter === "mapped"
      ? `Источник: category-mapping — ${displayRows.length} строк`
      : viewFilter === "unmapped"
        ? `Источник: suggestions (только без маппинга) — ${displayRows.length} · Всего привязано: ${mappedDonorIds.size}`
        : `Источник: suggestions — ${displayRows.length} · Привязано: ${mappedDonorIds.size}`;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Маппинг категорий</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{subtitle}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex flex-wrap gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewFilter("all")}
              className={viewFilter === "all" ? "bg-muted" : ""}
            >
              Все
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewFilter("unmapped")}
              className={viewFilter === "unmapped" ? "bg-muted" : ""}
            >
              Без маппинга
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewFilter("mapped")}
              className={viewFilter === "mapped" ? "bg-muted" : ""}
            >
              С маппингом
            </Button>
          </div>
          <Select
            value={String(minConfidence)}
            onValueChange={(v) => setMinConfidence(Number(v) as MinConfidence)}
          >
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue placeholder="Confidence" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Score 0+</SelectItem>
              <SelectItem value="50">Score 50+</SelectItem>
              <SelectItem value="80">Score 80+</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-1" onClick={handleRefresh}>
            <RefreshCw className={cn("h-3.5 w-3.5", fetchingSuggestions && "animate-spin")} />
            Обновить
          </Button>
          {viewFilter !== "mapped" && applyableHigh.length > 0 && (
            <Button size="sm" className="gap-1.5" onClick={handleBulkApply} disabled={bulkApplying}>
              {bulkApplying ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Zap className="h-3.5 w-3.5" />
              )}
              Применить все (≥95)
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            {viewFilter === "mapped" ? "Таблица сопоставлений" : "Предложения и действия"}
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow className="sticky top-0 z-10 bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/80">
                  <TableHead className="w-[200px]">Донор</TableHead>
                  <TableHead className="w-[200px]">
                    {viewFilter === "mapped" ? "Каталог (текущая)" : "Каталог (предложение)"}
                  </TableHead>
                  <TableHead className="w-[80px]">Score</TableHead>
                  <TableHead className="w-[200px]">Выбор каталога</TableHead>
                  <TableHead className="w-[130px]">Статус</TableHead>
                  <TableHead className="w-[150px] text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Загрузка…
                    </TableCell>
                  </TableRow>
                ) : displayRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Нет данных для отображения
                    </TableCell>
                  </TableRow>
                ) : (
                  displayRows.map((row) => {
                    if (row.kind === "mapped") {
                      const m = row.mapping;
                      const donorName = m.donor_category?.name ?? `Donor #${m.donor_category_id}`;
                      const catName = m.catalog_category?.name ?? `Catalog #${m.catalog_category_id}`;
                      const score = m.confidence ?? 0;
                      const rowCatalogId =
                        selectedCatalogId[m.donor_category_id] ?? m.catalog_category_id;
                      const rowBusy = applyingDonorId === m.donor_category_id;

                      return (
                        <TableRow key={`m-${m.id}`}>
                          <TableCell className="font-medium">{donorName}</TableCell>
                          <TableCell className="text-muted-foreground">{catName}</TableCell>
                          <TableCell>
                            <Badge className={scoreBadgeClass(score)} variant={scoreBadgeVariant(score)}>
                              {score}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={String(rowCatalogId)}
                              onValueChange={(v) =>
                                setSelectedCatalogId(m.donor_category_id, Number(v))
                              }
                              disabled={rowBusy}
                            >
                              <SelectTrigger className="h-8 text-xs min-w-[160px]">
                                <SelectValue placeholder="Выберите категорию" />
                              </SelectTrigger>
                              <SelectContent>
                                {catalogCategories.map((c) => (
                                  <SelectItem key={c.id} value={String(c.id)}>
                                    {c.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white border-0 gap-1">
                              Сопоставлено
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 shrink-0"
                                title="Обновить данные"
                                onClick={handleRefresh}
                                disabled={rowBusy}
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="gap-1"
                                onClick={() => requestRemapMapped(m)}
                                disabled={rowBusy}
                              >
                                {rowBusy ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Link2 className="h-3.5 w-3.5" />
                                )}
                                Update
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    }

                    const s = row.suggestion;
                    const rowCatalogId = selectedCatalogId[s.donor_id] ?? s.catalog_id;
                    const rowBusy = applyingDonorId === s.donor_id;
                    const isMapped = row.isMapped;

                    let statusBadge: ReactNode;
                    if (isMapped) {
                      statusBadge = (
                        <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white border-0">
                          Сопоставлено
                        </Badge>
                      );
                    } else if (s.score >= 80) {
                      statusBadge = (
                        <Badge
                          variant="secondary"
                          className="bg-amber-500/20 text-amber-900 dark:text-amber-100 border-amber-500/30"
                        >
                          Предложено
                        </Badge>
                      );
                    } else {
                      statusBadge = (
                        <Badge variant="destructive" className="border-0">
                          Не сопоставлено
                        </Badge>
                      );
                    }

                    return (
                      <TableRow key={`s-${s.donor_id}`}>
                        <TableCell className="font-medium">{s.donor_name}</TableCell>
                        <TableCell className="text-muted-foreground">{s.catalog_name}</TableCell>
                        <TableCell>
                          <Badge className={scoreBadgeClass(s.score)} variant={scoreBadgeVariant(s.score)}>
                            {s.score}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={String(rowCatalogId)}
                            onValueChange={(v) => setSelectedCatalogId(s.donor_id, Number(v))}
                            disabled={rowBusy}
                          >
                            <SelectTrigger className="h-8 text-xs min-w-[160px]">
                              <SelectValue placeholder="Выберите категорию" />
                            </SelectTrigger>
                            <SelectContent>
                              {catalogCategories.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{statusBadge}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 shrink-0"
                              title="Обновить данные"
                              onClick={handleRefresh}
                              disabled={rowBusy}
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                            {isMapped ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="gap-1"
                                onClick={() => setRemapPending({ kind: "suggestion", suggestion: s })}
                                disabled={rowBusy}
                              >
                                {rowBusy ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Link2 className="h-3.5 w-3.5" />
                                )}
                                Update
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="default"
                                className="gap-1"
                                onClick={() => handleApplySuggestion(s)}
                                disabled={rowBusy}
                              >
                                {rowBusy ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Link2 className="h-3.5 w-3.5" />
                                )}
                                Apply
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>

      <AlertDialog open={remapPending !== null} onOpenChange={(open) => !open && setRemapPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Изменить категорию?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите изменить категорию?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => executeConfirmedRemap()}>Подтвердить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

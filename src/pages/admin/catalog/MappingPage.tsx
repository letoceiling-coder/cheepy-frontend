import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  adminCatalogApi,
  type MappingSuggestion,
  type CatalogCategoryItem,
  type CategoryMappingItem,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Loader2, Link2, CheckCircle2, Zap } from "lucide-react";

type ConfidenceFilter = "all" | "high" | "medium" | "low";

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

function filterByConfidence(
  list: MappingSuggestion[],
  filter: ConfidenceFilter
): MappingSuggestion[] {
  if (filter === "all") return list;
  if (filter === "high") return list.filter((s) => s.score >= 90);
  if (filter === "medium") return list.filter((s) => s.score >= 70 && s.score < 90);
  return list.filter((s) => s.score < 70);
}

export default function MappingPage() {
  const queryClient = useQueryClient();
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>("all");
  /** Per-row catalog choice: selectedCatalogId[donor_id] → catalog_category_id */
  const [selectedCatalogId, setSelectedCatalogIdState] = useState<Record<number, number>>({});
  const setSelectedCatalogId = (donorId: number, catalogId: number) => {
    setSelectedCatalogIdState((prev) => ({ ...prev, [donorId]: catalogId }));
  };
  const [applyingDonorId, setApplyingDonorId] = useState<number | null>(null);
  const [bulkApplying, setBulkApplying] = useState(false);

  const { data: suggestionsData, isLoading: loadingSuggestions } = useQuery({
    queryKey: ["admin-catalog-mapping-suggestions", 500],
    queryFn: () => adminCatalogApi.mappingSuggestions({ limit: 500 }),
  });

  const { data: mappingsData, isLoading: loadingMappings } = useQuery({
    queryKey: ["admin-catalog-category-mapping"],
    queryFn: async () => {
      const first = await adminCatalogApi.categoryMappingList({ per_page: 100, page: 1 });
      const total = first.meta?.total ?? first.data.length;
      if (total <= 100) return first;
      const pages = Math.ceil(total / 100);
      const rest = await Promise.all(
        Array.from({ length: pages - 1 }, (_, i) =>
          adminCatalogApi.categoryMappingList({ per_page: 100, page: i + 2 })
        )
      );
      return {
        data: [...first.data, ...rest.flatMap((r) => r.data)],
        meta: first.meta,
      };
    },
  });

  const { data: categoriesData, isLoading: loadingCategories } = useQuery({
    queryKey: ["admin-catalog-categories"],
    queryFn: () => adminCatalogApi.catalogCategoriesList({ per_page: 500 }),
  });

  const createMapping = useMutation({
    mutationFn: (body: { donor_category_id: number; catalog_category_id: number }) =>
      adminCatalogApi.createMapping(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-catalog-category-mapping"] });
      toast.success("Маппинг создан");
    },
    onError: (err: Error & { status?: number }) => {
      toast.error(err.message || "Ошибка создания маппинга");
    },
  });

  const suggestions = suggestionsData?.data ?? [];
  const mappings = mappingsData?.data ?? [];
  const catalogCategories = categoriesData?.data ?? [];
  const mappedDonorIds = useMemo(
    () => new Set(mappings.map((m) => m.donor_category_id)),
    [mappings]
  );

  const filteredSuggestions = useMemo(
    () => filterByConfidence(suggestions, confidenceFilter),
    [suggestions, confidenceFilter]
  );

  const applyableHigh = useMemo(
    () => filteredSuggestions.filter((s) => s.score >= 95 && !mappedDonorIds.has(s.donor_id)),
    [filteredSuggestions, mappedDonorIds]
  );

  const handleApply = (suggestion: MappingSuggestion) => {
    const catalog_category_id =
      selectedCatalogId[suggestion.donor_id] ?? suggestion.catalog_id;
    setApplyingDonorId(suggestion.donor_id);
    createMapping.mutate(
      {
        donor_category_id: suggestion.donor_id,
        catalog_category_id,
        confidence: suggestion.score,
        is_manual: true,
      },
      {
        onSettled: () => setApplyingDonorId(null),
      }
    );
  };

  const handleBulkApply = () => {
    if (applyableHigh.length === 0) {
      toast.info("Нет подходящих записей (score ≥ 95 и без маппинга)");
      return;
    }
    setBulkApplying(true);
    let done = 0;
    const run = (index: number) => {
      if (index >= applyableHigh.length) {
        setBulkApplying(false);
        toast.success(`Применено маппингов: ${done}`);
        return;
      }
      const s = applyableHigh[index];
      createMapping.mutate(
        { donor_category_id: s.donor_id, catalog_category_id: s.catalog_id },
        {
          onSuccess: () => {
            done++;
            queryClient.invalidateQueries({ queryKey: ["admin-catalog-category-mapping"] });
          },
          onSettled: () => run(index + 1),
        }
      );
    };
    run(0);
  };

  const isLoading = loadingSuggestions || loadingMappings || loadingCategories;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Маппинг категорий</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Связь донорских категорий с каталогом (suggestions + ручное применение)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfidenceFilter("all")}
            className={confidenceFilter === "all" ? "bg-muted" : ""}
          >
            Все
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfidenceFilter("high")}
            className={confidenceFilter === "high" ? "bg-muted" : ""}
          >
            Высокая (≥90)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfidenceFilter("medium")}
            className={confidenceFilter === "medium" ? "bg-muted" : ""}
          >
            Средняя (70–89)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfidenceFilter("low")}
            className={confidenceFilter === "low" ? "bg-muted" : ""}
          >
            Низкая (&lt;70)
          </Button>
          {applyableHigh.length > 0 && (
            <Button
              size="sm"
              className="gap-1.5"
              onClick={handleBulkApply}
              disabled={bulkApplying}
            >
              {bulkApplying ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Zap className="h-3.5 w-3.5" />
              )}
              Применить все (score ≥ 95)
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            Предложения маппинга
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Показано: {filteredSuggestions.length} из {suggestions.length} · Уже сопоставлено:{" "}
            {mappedDonorIds.size}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow className="sticky top-0 z-10 bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/80">
                  <TableHead className="w-[220px]">Донорская категория</TableHead>
                  <TableHead className="w-[220px]">Каталог (предложение)</TableHead>
                  <TableHead className="w-[90px]">Score</TableHead>
                  <TableHead className="w-[200px]">Ручной выбор</TableHead>
                  <TableHead className="w-[120px]">Статус</TableHead>
                  <TableHead className="w-[140px] text-right">Действие</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Загрузка…
                    </TableCell>
                  </TableRow>
                ) : filteredSuggestions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Нет данных по выбранному фильтру
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSuggestions.map((s) => {
                    const isMapped = mappedDonorIds.has(s.donor_id);
                    const rowCatalogId = selectedCatalogId[s.donor_id] ?? s.catalog_id;
                    const rowBusy = applyingDonorId === s.donor_id;

                    return (
                      <TableRow key={s.donor_id}>
                        <TableCell className="font-medium">{s.donor_name}</TableCell>
                        <TableCell className="text-muted-foreground">{s.catalog_name}</TableCell>
                        <TableCell>
                          <Badge className={scoreBadgeClass(s.score)} variant={scoreBadgeVariant(s.score)}>
                            {s.score}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={String(selectedCatalogId)}
                            onValueChange={(v) =>
                              setSelectedCatalogByDonor((prev) => ({
                                ...prev,
                                [s.donor_id]: Number(v),
                              }))
                            }
                            disabled={isMapped}
                          >
                            <SelectTrigger className="h-8 text-xs min-w-[160px]">
                              <SelectValue placeholder="Выбор категории" />
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
                          {isMapped ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 text-sm">
                              <CheckCircle2 className="h-4 w-4" />
                              Mapped
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isMapped ? (
                            <span className="text-muted-foreground text-sm">Уже сопоставлено</span>
                          ) : (
                            <Button
                              size="sm"
                              variant="default"
                              className="gap-1"
                              onClick={() => handleApply(s)}
                              disabled={rowBusy}
                            >
                              {rowBusy ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Link2 className="h-3.5 w-3.5" />
                              )}
                              Применить
                            </Button>
                          )}
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
    </div>
  );
}

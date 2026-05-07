import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { DataTable, Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CrmSellerReviewRow } from "@/lib/api";
import { crmStoreInsightsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function CrmReviewsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [page] = useState(1);

  const q = useQuery({
    queryKey: ["crm-seller-reviews", page, statusFilter],
    queryFn: () =>
      crmStoreInsightsApi.sellerReviews({
        page,
        per_page: 100,
        status: statusFilter,
      }),
  });

  const mut = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      await crmStoreInsightsApi.updateSellerReview(Number(id), { is_published: published });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-seller-reviews"] }),
  });

  let rows = q.data?.data ?? [];
  if (ratingFilter !== "all") {
    rows = rows.filter((r) => String(r.rating) === ratingFilter);
  }

  const columns: Column<CrmSellerReviewRow>[] = [
    { key: "seller_title", title: "Продавец", render: (r) => <span className="font-medium text-sm">{r.seller_title}</span> },
    { key: "user_name", title: "Автор" },
    {
      key: "rating",
      title: "Оценка",
      render: (r) => (
        <span className="flex items-center gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} className={`h-3 w-3 ${i < r.rating ? 'text-amber-500 fill-amber-500' : 'text-border'}`} />
          ))}
        </span>
      ),
    },
    { key: "text", title: "Текст", render: (r) => <span className="text-sm truncate max-w-[240px] block">{r.text}</span>, className: "hidden md:table-cell" },
    { key: "status", title: "Статус", render: (r) => <StatusBadge status={r.status === "moderation" ? "moderation" : "published"} /> },
    {
      key: "id",
      title: "",
      className: "w-[140px]",
      render: (r) => (
        <div className="flex gap-1">
          {r.status === "moderation" ? (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px] px-2"
              disabled={mut.isPending}
              onClick={(e) => {
                e.stopPropagation();
                mut.mutate({ id: r.id, published: true });
              }}
            >
              Одобрить
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[10px] px-2"
              disabled={mut.isPending}
              onClick={(e) => {
                e.stopPropagation();
                mut.mutate({ id: r.id, published: false });
              }}
            >
              Скрыть
            </Button>
          )}
        </div>
      ),
    },
    { key: "created_at", title: "Дата", render: (r) => (r.created_at ? r.created_at.slice(0, 16).replace("T", " ") : "") },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title="Отзывы" description={q.data?.meta ? `${q.data.meta.total} отзывов на продавцов (SellerReview)` : "Загрузка…"} />

      {q.error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
          Не удалось загрузить отзывы.
        </div>
      ) : null}

      <div className="flex items-center gap-3 flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-40 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            <SelectItem value="published">Опубликованные</SelectItem>
            <SelectItem value="moderation">На модерации</SelectItem>
            <SelectItem value="rejected">Отклонённые</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="h-8 w-32 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все оценки</SelectItem>
            <SelectItem value="5">5 звёзд</SelectItem>
            <SelectItem value="4">4 звезды</SelectItem>
            <SelectItem value="3">3 звезды</SelectItem>
            <SelectItem value="2">2 звезды</SelectItem>
            <SelectItem value="1">1 звезда</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {statusFilter === "rejected" && (
        <p className="text-xs text-muted-foreground">
          Отдельный статус «отклонён» в базе пока не хранится; отображаются только опубликованные и скрытые (moderation).
        </p>
      )}

      {q.isLoading ? (
        <div className="flex justify-center py-16 gap-2 text-muted-foreground text-sm items-center">
          <Loader2 className="h-5 w-5 animate-spin" /> Загрузка…
        </div>
      ) : (
        <DataTable data={rows} columns={columns} />
      )}
    </div>
  );
}

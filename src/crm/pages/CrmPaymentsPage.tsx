import { useMemo, useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { DataTable, Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { crmCommerceApi, crmPaymentProvidersApi, ApiError, type CrmStorePaymentRow } from "@/lib/api";
import type { PaymentProviderItem } from "@/lib/api";
import { CheckCircle, XCircle, RotateCcw, Search, DollarSign, Settings, Loader2 } from "lucide-react";
import { toast } from "sonner";

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU").format(Number.isFinite(n) ? Math.round(n) : 0);

export default function CrmPaymentsPage() {
  const qc = useQueryClient();
  const [draftSearch, setDraftSearch] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const [refundDialog, setRefundDialog] = useState<CrmStorePaymentRow | null>(null);
  const [refundDraftAmount, setRefundDraftAmount] = useState("");

  const refundMut = useMutation({
    mutationFn: ({ id, amount }: { id: number; amount?: number }) =>
      amount !== undefined
        ? crmCommerceApi.refundPayment(id, { amount })
        : crmCommerceApi.refundPayment(id),
    onSuccess: () => {
      toast.success("Возврат проведён");
      void qc.invalidateQueries({ queryKey: ["crm", "store-payments"] });
      setRefundDialog(null);
      setRefundDraftAmount("");
    },
    onError: (e) => {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Не удалось выполнить возврат";
      toast.error(msg);
    },
  });

  const summaryQ = useQuery({
    queryKey: ["crm", "store-payments", "summary"],
    queryFn: () => crmCommerceApi.storePaymentsSummary(),
    staleTime: 30_000,
  });

  const paymentsQ = useQuery({
    queryKey: ["crm", "store-payments", { page, status: statusFilter, search }],
    queryFn: () =>
      crmCommerceApi.storePayments({
        page,
        per_page: 40,
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search.trim() || undefined,
      }),
    staleTime: 30_000,
  });

  const providersQ = useQuery({
    queryKey: ["crm", "payment-providers"],
    queryFn: () => crmPaymentProvidersApi.list(),
    staleTime: 60_000,
  });

  const counts = summaryQ.data?.data.counts_by_status ?? {};

  const stats = useMemo(
    () => ({
      successful: Number(counts.succeeded ?? 0),
      failed: Number(counts.failed ?? 0) + Number(counts.expired ?? 0),
      refunded: Number(counts.refunded ?? 0) + Number(counts.partially_refunded ?? 0),
      pending:
        Number(counts.pending ?? 0) +
        Number(counts.processing ?? 0),
      volume: summaryQ.data?.data.succeeded_volume_rub ?? 0,
    }),
    [counts, summaryQ.data?.data.succeeded_volume_rub]
  );

  const refundableRub = (t: CrmStorePaymentRow) => {
    const paid = Number(t.amount);
    const already = Number(t.refunded_amount || 0);
    return Math.round((paid - already) * 100) / 100;
  };

  const canRefundInCrm = (t: CrmStorePaymentRow) => {
    const p = String(t.provider || "").toLowerCase();
    if (p !== "tinkoff" && p !== "stripe") return false;
    return t.status === "succeeded" || t.status === "partially_refunded";
  };

  const columns: Column<CrmStorePaymentRow>[] = [
    { key: "id", title: "ID", className: "w-28", render: (t) => <span className="font-mono text-xs">{t.id}</span> },
    {
      key: "user_email",
      title: "Покупатель / email",
      render: (t) => (
        <span className="text-sm">
          {[t.user_name, t.user_email].filter(Boolean).join(" · ") || "—"}
        </span>
      ),
    },
    {
      key: "amount",
      title: "Сумма",
      render: (t) => {
        const done = Number(t.refunded_amount || 0);
        return (
          <span className="text-sm leading-tight block">
            {fmt(Number(t.amount))} ₽
            {done > 0 ? <span className="block text-xs text-muted-foreground">возвращено {fmt(done)} ₽</span> : null}
          </span>
        );
      },
    },
    { key: "status", title: "Статус", render: (t) => <StatusBadge status={t.status} /> },
    {
      key: "kind",
      title: "Контекст",
      className: "hidden md:table-cell",
      render: (t) =>
        t.kind === "storefront"
          ? "Витрина"
          : t.kind === "saas_topup"
            ? "Пополнение API"
            : t.kind,
    },
    {
      key: "provider",
      title: "Провайдер",
      className: "hidden lg:table-cell uppercase text-xs",
      render: (t) => t.provider,
    },
    {
      key: "order_number",
      title: "Заказ",
      className: "hidden lg:table-cell",
      render: (t) =>
        t.order_id && t.order_number ? (
          <Link className="font-mono text-xs text-primary hover:underline" to={`/crm/orders/${t.order_id}`}>
            {t.order_number}
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "created_at",
      title: "Дата",
      className: "hidden xl:table-cell text-xs text-muted-foreground",
      render: (t) => (t.created_at ? new Date(t.created_at).toLocaleString("ru-RU") : "—"),
    },
    {
      key: "actions",
      title: "",
      className: "w-[1%] whitespace-nowrap text-right",
      render: (t) =>
        canRefundInCrm(t) ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            disabled={refundableRub(t) <= 0}
            onClick={() => {
              setRefundDraftAmount("");
              setRefundDialog(t);
            }}
          >
            <RotateCcw className="h-3 w-3" />
            Возврат
          </Button>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
    },
  ];

  const providerCols: Column<PaymentProviderItem>[] = [
    { key: "title", title: "Платёжный метод", render: (p) => <span className="font-medium text-sm">{p.title}</span> },
    {
      key: "status",
      title: "Статус CRM",
      render: (p) => <StatusBadge status={p.is_active ? "active" : "inactive"} />,
    },
    {
      key: "integration",
      title: "Подключение",
      render: (p) => <StatusBadge status={p.status === "connected" ? "connected" : "disconnected"} />,
    },
    {
      key: "configure",
      title: "",
      className: "w-32 text-right",
      render: (p) => (
        <Button variant="outline" size="sm" className="h-8 gap-1" asChild>
          <Link to={`/crm/integrations/payments/${p.name}`}>
            <Settings className="h-3 w-3" /> Настроить
          </Link>
        </Button>
      ),
    },
  ];

  const filteredRows = paymentsQ.data?.data ?? [];
  const meta = paymentsQ.data?.meta;
  const err = paymentsQ.error as Error | undefined;

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title="Платежи" description="Реальные платежи из таблицы payments и провайдеры из CRM" />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard title="Успешных" value={stats.successful} icon={CheckCircle} />
        <StatCard title="Ошибок / истекло" value={stats.failed} icon={XCircle} />
        <StatCard title="Возвраты полн./част." value={stats.refunded} icon={RotateCcw} />
        <StatCard title="В ожидании" value={stats.pending} icon={RotateCcw} />
        <StatCard title="Оборот успешных" value={`${fmt(stats.volume)} ₽`} icon={DollarSign} />
      </div>

      {summaryQ.error ? (
        <p className="text-xs text-destructive">Не удалось загрузить сводку: {(summaryQ.error as Error).message}</p>
      ) : null}

      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Транзакции</TabsTrigger>
          <TabsTrigger value="methods">Эквайринг CRM</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="mt-4 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={draftSearch}
                onChange={(e) => setDraftSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setPage(1);
                    setSearch(draftSearch.trim());
                  }
                }}
                placeholder="ID, номер заказа, email, провайдер…"
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="h-8"
              onClick={() => {
                setPage(1);
                setSearch(draftSearch.trim());
              }}
            >
              Найти
            </Button>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setPage(1);
                setStatusFilter(v);
              }}
            >
              <SelectTrigger className="h-8 w-44 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="pending">pending</SelectItem>
                <SelectItem value="processing">processing</SelectItem>
                <SelectItem value="succeeded">succeeded</SelectItem>
                <SelectItem value="failed">failed</SelectItem>
                <SelectItem value="expired">expired</SelectItem>
                <SelectItem value="partially_refunded">partially_refunded</SelectItem>
                <SelectItem value="refunded">refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {paymentsQ.isLoading ? (
            <p className="text-sm text-muted-foreground">Загрузка…</p>
          ) : err ? (
            <p className="text-sm text-destructive">{err.message}</p>
          ) : (
            <>
              <DataTable data={filteredRows} columns={columns} />
              {meta && meta.last_page > 1 ? (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    disabled={meta.current_page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Назад
                  </Button>
                  <span>
                    Страница {meta.current_page} из {meta.last_page} · всего {meta.total}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    disabled={meta.current_page >= meta.last_page}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Вперёд
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Показано {filteredRows.length}
                  {meta ? ` из ${meta.total}` : ""}
                </p>
              )}
            </>
          )}
        </TabsContent>

        <AlertDialog open={refundDialog !== null} onOpenChange={(open) => !open && setRefundDialog(null)}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Возврат платежа</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3 text-left text-sm text-muted-foreground">
                  <p>
                    Платёж #{refundDialog?.id}, {refundDialog ? fmt(Number(refundDialog.amount)) : "—"} ₽ ({refundDialog?.provider}). Остаток к
                    возврату:{refundDialog ? ` ${fmt(refundableRub(refundDialog))}` : ""} ₽ — укажете ниже сумму или подтвердите полный остаток.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="refund_partial">Частичный возврат (₽)</Label>
                    <Input
                      id="refund_partial"
                      value={refundDraftAmount}
                      autoComplete="off"
                      placeholder={refundDialog ? `не больше ${fmt(refundableRub(refundDialog))}` : ""}
                      onChange={(e) => setRefundDraftAmount(e.target.value.replace(",", ".").replace(/[^\d.]/g, ""))}
                      className="h-9"
                    />
                  </div>
                  <p className="text-xs">Сбер и неэквайринг доступны только через поддержку эквайринга.</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
              <AlertDialogCancel className="mt-0" disabled={refundMut.isPending}>
                Отмена
              </AlertDialogCancel>
              <div className="flex flex-wrap gap-2 justify-end flex-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={refundMut.isPending || !refundDialog}
                  onClick={() => {
                    if (!refundDialog) return;
                    refundMut.mutate({ id: refundDialog.id });
                  }}
                >
                  {refundMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Полный остаток
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={
                    refundMut.isPending ||
                    !refundDialog ||
                    !refundDraftAmount.trim() ||
                    Number(refundDraftAmount) <= 0 ||
                    Number(refundDraftAmount) > refundableRub(refundDialog) + 1e-6
                  }
                  onClick={() => {
                    if (!refundDialog) return;
                    refundMut.mutate({ id: refundDialog.id, amount: Number(refundDraftAmount) });
                  }}
                >
                  {refundMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Вернуть введённую сумму
                </Button>
              </div>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <TabsContent value="methods" className="mt-4 space-y-3">
          {providersQ.isLoading ? (
            <p className="text-sm text-muted-foreground">Загрузка провайдеров…</p>
          ) : providersQ.error ? (
            <p className="text-sm text-destructive">{(providersQ.error as Error).message}</p>
          ) : (
            <DataTable data={providersQ.data ?? []} columns={providerCols} />
          )}
          <p className="text-xs text-muted-foreground">
            Изменить ключи терминала/пароля — только через экран интеграций; включение/выключение провайдера тоже там.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

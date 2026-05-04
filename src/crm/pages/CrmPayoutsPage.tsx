import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "../components/PageHeader";
import { DataTable, Column } from "../components/DataTable";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { crmCommerceApi } from "@/lib/api";
import { Plus, AlertTriangle } from "lucide-react";
import { useState } from "react";

interface EmptyRow {
  id: string;
  note: string;
}

export default function CrmPayoutsPage() {
  const [createOpen, setCreateOpen] = useState(false);

  const q = useQuery({
    queryKey: ["crm", "store-payouts"],
    queryFn: () => crmCommerceApi.storePayouts(),
    staleTime: 60_000,
  });

  const emptyRows: EmptyRow[] = [
    {
      id: "—",
      note: q.data?.message ?? "Ответ API без таблицы выплат в базе данных.",
    },
  ];

  const sellerCols: Column<EmptyRow>[] = [
    { key: "id", title: "Продавец / ID", render: () => <span className="text-muted-foreground">нет данных</span> },
    {
      key: "note",
      title: "Состояние",
      render: (r) => <span className="text-xs text-muted-foreground leading-relaxed">{r.note}</span>,
    },
  ];

  const historyCols: Column<EmptyRow>[] = sellerCols;

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Выплаты продавцам"
        description="Раздел без моков: бэкенд не отдаёт фиктивные строки, пока нет модели выплат."
        actions={
          <Button size="sm" className="gap-1.5" variant="secondary" disabled onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Создать выплату (недоступно)
          </Button>
        }
      />

      {q.isLoading ? (
        <p className="text-sm text-muted-foreground">Проверка API…</p>
      ) : q.error ? (
        <p className="text-sm text-destructive">{(q.error as Error).message}</p>
      ) : (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Реализовано: <strong>{q.data?.implemented ? "да" : "нет"}</strong>.
            {" "}
            {q.data?.message}
          </span>
        </div>
      )}

      <Tabs defaultValue="balances">
        <TabsList>
          <TabsTrigger value="balances">Балансы продавцов</TabsTrigger>
          <TabsTrigger value="history">История выплат</TabsTrigger>
        </TabsList>
        <TabsContent value="balances" className="mt-4">
          <DataTable data={(q.data?.data.seller_balances as EmptyRow[] | undefined)?.length ? (q.data?.data.seller_balances as EmptyRow[]) : emptyRows} columns={sellerCols} />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <DataTable data={(q.data?.data.payout_history as EmptyRow[] | undefined)?.length ? (q.data?.data.payout_history as EmptyRow[]) : emptyRows} columns={historyCols} />
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Создание выплат недоступно</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Нужны миграции и API списания/проведения выплат продавцам. После добавления модели данные автоматически появятся здесь без моков.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
